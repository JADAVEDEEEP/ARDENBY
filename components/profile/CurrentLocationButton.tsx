'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, LocateFixed, Loader2, MapPin, Search } from 'lucide-react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type PickedAddress = {
  /** Building / apartment / society / bungalow name. Only set when the customer picked a specific place. */
  building?: string;
  flat: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

type Point = { lat: number; lng: number };
type NearbyPlace = { id: string; name: string; kind: string; distance: number; lat: number; lng: number; subtitle: string };
type Suggestion = { id: string; name: string; subtitle: string; lat: number; lng: number };

class LocationLookupError extends Error {
  constructor(readonly kind: 'none' | 'denied' | 'quota' | 'unavailable' | 'missing-key') {
    super(kind);
  }
}

type ApiBody<T> = ({ success?: boolean; error?: string } & T) | null;

/** Calls one of our own /api routes (which hold the LocationIQ token) and maps failures onto lookup errors. */
async function callApi<T extends object>(path: string, params: Record<string, string | number>, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  let res: Response;
  try {
    res = await fetch(`${path}?${query}`, { cache: 'no-store', signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new LocationLookupError('unavailable');
  }
  const body = (await res.json().catch(() => null)) as ApiBody<T>;
  if (res.ok && body?.success) return body as T;
  if (body?.error === 'none') throw new LocationLookupError('none');
  if (body?.error === 'rate-limited') throw new LocationLookupError('quota');
  if (body?.error === 'not-configured') throw new LocationLookupError('missing-key');
  if (body?.error === 'denied') throw new LocationLookupError('denied');
  throw new LocationLookupError('unavailable');
}

const reverseGeocode = async (p: Point) =>
  (await callApi<{ address: PickedAddress }>('/api/reverse-geocode', { lat: p.lat, lng: p.lng })).address;

const lookupMessage = (err: unknown) => {
  const kind = err instanceof LocationLookupError ? err.kind : 'unavailable';
  return kind === 'none'
    ? 'We could not find an address at your location. Please type it in below.'
    : kind === 'missing-key'
      ? 'Current-location lookup is not set up yet. Please type your address below.'
      : kind === 'denied'
        ? 'Address lookup is not available right now (the location service rejected the request). Please type your address below.'
        : kind === 'quota'
          ? 'Too many lookups right now. Please wait a moment and try again, or type your address below.'
          : 'Could not fetch your address. Check your connection, or type it in below.';
};

const formatDistance = (m: number) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`);

type Props = {
  /** Called with the address found at the user's current position or at the place they picked. */
  onPick: (address: PickedAddress) => void;
  /** Class for the search input, so it matches whichever form hosts this. */
  inputClassName?: string;
};

export function CurrentLocationButton({ onPick, inputClassName = 'kv-input' }: Props) {
  const [busy, setBusy] = useState<'locating' | 'fetching' | null>(null);
  const [notice, setNotice] = useState('');
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<Point | null>(null);
  const [nearby, setNearby] = useState<NearbyPlace[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [picking, setPicking] = useState('');

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState('');

  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const positionRef = useRef<Point | null>(null);
  positionRef.current = position;

  // ---- Nearby buildings -------------------------------------------------------------------------
  const nearbyCache = useRef(new Map<string, NearbyPlace[]>());
  const nearbySeq = useRef(0);

  const loadNearby = useCallback(async (p: Point) => {
    const key = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    const seq = ++nearbySeq.current;
    setSelectedId('');
    const hit = nearbyCache.current.get(key);
    if (hit) {
      setNearby(hit);
      setNearbyLoading(false);
      return;
    }
    setNearbyLoading(true);
    try {
      const { places } = await callApi<{ places: NearbyPlace[] }>('/api/places/nearby', { lat: p.lat, lng: p.lng });
      nearbyCache.current.set(key, places);
      if (seq === nearbySeq.current) setNearby(places);
    } catch {
      if (seq === nearbySeq.current) setNearby([]);
    } finally {
      if (seq === nearbySeq.current) setNearbyLoading(false);
    }
  }, []);

  // ---- Map --------------------------------------------------------------------------------------
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const dragSeq = useRef(0);

  // Moving the pin re-reads the address and the buildings around the new spot.
  const onPinMoved = useCallback(
    async (p: Point) => {
      setPosition(p);
      setNotice('');
      const seq = ++dragSeq.current;
      void loadNearby(p);
      try {
        const address = await reverseGeocode(p);
        if (seq === dragSeq.current) {
          onPickRef.current(address);
          setSuccess(true);
        }
      } catch (err) {
        if (seq === dragSeq.current) setNotice(lookupMessage(err));
      }
    },
    [loadNearby],
  );
  const onPinMovedRef = useRef(onPinMoved);
  onPinMovedRef.current = onPinMoved;

  useEffect(() => {
    if (!position || !mapEl.current) return;
    if (mapRef.current) {
      mapRef.current.setView([position.lat, position.lng], Math.max(mapRef.current.getZoom(), 17));
      markerRef.current?.setLatLng([position.lat, position.lng]);
      return;
    }
    let cancelled = false;
    void import('leaflet')
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        const map = L.map(mapEl.current, { center: [position.lat, position.lng], zoom: 17, zoomControl: true, attributionControl: true });
        // Tiles come through our own route so the LocationIQ token stays on the server.
        L.tileLayer('/api/map-tiles/{z}/{x}/{y}', {
          maxZoom: 19,
          attribution: '© <a href="https://locationiq.com">LocationIQ</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        const icon = L.divIcon({
          className: '',
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          html:
            '<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<path d="M16 0C7.2 0 0 7 0 15.6 0 27 16 40 16 40s16-13 16-24.4C32 7 24.8 0 16 0z" fill="#1B7F3B"/>' +
            '<circle cx="16" cy="15.5" r="6" fill="#fff"/></svg>',
        });
        const marker = L.marker([position.lat, position.lng], { icon, draggable: true, keyboard: true, title: 'Drag to adjust your location' }).addTo(map);
        marker.on('dragend', () => {
          const ll = marker.getLatLng();
          void onPinMovedRef.current({ lat: ll.lat, lng: ll.lng });
        });
        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          void onPinMovedRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
        mapRef.current = map;
        markerRef.current = marker;
        setTimeout(() => map.invalidateSize(), 0);
      })
      .catch(() => setMapFailed(true));
    return () => {
      cancelled = true;
    };
  }, [position]);

  useEffect(
    () => () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    },
    [],
  );

  // ---- Current location -------------------------------------------------------------------------
  const fetchAddress = async (p: Point) => {
    setBusy('fetching');
    setPosition(p);
    void loadNearby(p);
    try {
      const address = await reverseGeocode(p);
      if (address.country && !/^india$/i.test(address.country)) {
        setNotice(`We only deliver within India, but your location is in ${address.country}. Please type your address below.`);
        return;
      }
      onPickRef.current(address);
      setSuccess(true);
    } catch (err) {
      setNotice(lookupMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const detect = () => {
    setNotice('');
    setSuccess(false);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setNotice('Your browser does not support location access. Please type your address below.');
      return;
    }
    if (!window.isSecureContext) {
      setNotice('Location access needs a secure (HTTPS) connection. Please type your address below.');
      return;
    }
    setBusy('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => void fetchAddress({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        setBusy(null);
        if (err.code === err.PERMISSION_DENIED) {
          // Chrome can report "granted" while the call is still denied (page policy or
          // Windows location privacy), so check the real state before blaming the user.
          const blocked =
            'Location permission is blocked. Allow location access for this site in your browser settings, or type your address below.';
          const denied =
            'Your browser allows location for this site, but the device refused it. Turn on Location in your system privacy settings, or type your address below.';
          if (navigator.permissions?.query) {
            navigator.permissions
              .query({ name: 'geolocation' as PermissionName })
              .then((s) => setNotice(s.state === 'granted' ? denied : blocked))
              .catch(() => setNotice(blocked));
          } else {
            setNotice(blocked);
          }
          return;
        }
        setNotice(
          err.code === err.TIMEOUT
            ? 'Finding your location took too long. Please try again or type your address below.'
            : 'We could not detect your location. Please type your address below.',
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  // ---- Choosing a specific place (nearby list or search suggestion) -----------------------------
  const detailsCache = useRef(new Map<string, { address: PickedAddress; lat: number; lng: number }>());

  const choosePlace = async (place: { id: string; name: string; lat: number; lng: number }, from: 'nearby' | 'search') => {
    setNotice('');
    setSearchNote('');
    setPicking(place.id);
    try {
      let details = detailsCache.current.get(place.id);
      if (!details) {
        details = await callApi<{ address: PickedAddress; lat: number; lng: number }>('/api/places/details', {
          id: place.id,
          name: place.name,
          lat: place.lat,
          lng: place.lng,
        });
        detailsCache.current.set(place.id, details);
      }
      const { address } = details;
      if (address.country && !/^india$/i.test(address.country)) {
        setNotice(`We only deliver within India, but that place is in ${address.country}.`);
        return;
      }
      onPickRef.current(address);
      setSuccess(true);
      setSelectedId(place.id);
      if (from === 'search') {
        // Show the picked place on the map and list what is around it, without choosing anything else for them.
        const p = { lat: details.lat || place.lat, lng: details.lng || place.lng };
        setPosition(p);
        setQuery('');
        setSuggestions([]);
        void loadNearby(p).then(() => setSelectedId(place.id));
      }
    } catch (err) {
      setNotice(lookupMessage(err));
    } finally {
      setPicking('');
    }
  };

  // ---- Search / autocomplete --------------------------------------------------------------------
  const searchCache = useRef(new Map<string, Suggestion[]>());

  useEffect(() => {
    const q = query.trim().replace(/\s+/g, ' ');
    if (q.length < 3) {
      setSuggestions([]);
      setSearching(false);
      setSearchNote('');
      return;
    }
    const near = positionRef.current;
    const key = `${q.toLowerCase()}|${near ? `${near.lat.toFixed(1)},${near.lng.toFixed(1)}` : ''}`;
    const hit = searchCache.current.get(key);
    if (hit) {
      setSuggestions(hit);
      setSearchNote(hit.length ? '' : 'No matching places found. You can type the address below.');
      return;
    }
    // Debounced: only the query the customer paused on is sent, and a stale request is aborted.
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const params: Record<string, string | number> = { q };
        if (near) {
          params.lat = near.lat;
          params.lng = near.lng;
        }
        const { suggestions: list } = await callApi<{ suggestions: Suggestion[] }>('/api/places/autocomplete', params, controller.signal);
        searchCache.current.set(key, list);
        setSuggestions(list);
        setSearchNote(list.length ? '' : 'No matching places found. You can type the address below.');
        setSearching(false);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setSuggestions([]);
        setSearchNote(
          err instanceof LocationLookupError && err.kind === 'quota'
            ? 'Too many searches. Please wait a moment.'
            : 'Search is not available right now. You can type the address below.',
        );
        setSearching(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const showList = suggestions.length > 0;

  return (
    <div className="sm:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={detect} disabled={busy !== null} className="kv-btn-ghost kv-btn-sm gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LocateFixed className="h-4 w-4" aria-hidden />}
          {busy ? 'Detecting your location…' : 'Use my current location'}
        </button>
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" aria-hidden />
        <input
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls="loc-suggestions"
          aria-label="Search for your building, apartment, society or area"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search building, apartment, society or area"
          className={inputClassName}
          style={{ paddingLeft: 40, paddingRight: 40 }}
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#666666]" aria-hidden />}
        {showList && (
          <ul
            id="loc-suggestions"
            role="listbox"
            className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-auto border border-[#BDBDBD] bg-white shadow-lg"
          >
            {suggestions.map((s) => (
              <li key={s.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  disabled={picking !== ''}
                  onClick={() => void choosePlace(s, 'search')}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[#F5F5F5] disabled:opacity-60"
                >
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#666666]" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium">{s.name}</span>
                    <span className="block truncate text-[13px] text-[#666666]">{s.subtitle}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {searchNote && !showList && <p className="mt-2 text-[14px] text-[#666666]">{searchNote}</p>}

      {position && (
        <div className="mt-3">
          {mapFailed ? (
            <p className="text-[14px] text-[#666666]">The map could not load, but you can still pick a building below.</p>
          ) : (
            <>
              <div
                ref={mapEl}
                role="application"
                aria-label="Map showing your detected location. Drag the pin to adjust it."
                className="h-[220px] w-full border border-[#BDBDBD]"
                style={{ zIndex: 0, isolation: 'isolate' }}
              />
              <p className="mt-1 text-[13px] text-[#666666]">Drag the pin or tap the map to adjust your location.</p>
            </>
          )}

          <div className="mt-3">
            <p className="text-[15px] font-medium">Select your building</p>
            {nearbyLoading && (
              <p className="mt-2 flex items-center gap-2 text-[14px] text-[#666666]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Looking for buildings nearby…
              </p>
            )}
            {!nearbyLoading && nearby && nearby.length === 0 && (
              <p className="mt-2 text-[14px] text-[#666666]">
                We could not find named buildings here. Search above, or enter your building name below.
              </p>
            )}
            {nearby && nearby.length > 0 && (
              <ul className="mt-2 max-h-64 divide-y divide-[#E5E5E5] overflow-auto border border-[#BDBDBD]">
                {nearby.map((p) => {
                  const active = selectedId === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        disabled={picking !== ''}
                        aria-pressed={active}
                        onClick={() => void choosePlace(p, 'nearby')}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[#F5F5F5] disabled:opacity-60 ${active ? 'bg-[#F0F7F2]' : ''}`}
                      >
                        {picking === p.id ? (
                          <Loader2 className="mt-1 h-4 w-4 shrink-0 animate-spin" aria-hidden />
                        ) : active ? (
                          <Check className="mt-1 h-4 w-4 shrink-0 text-[#1B7F3B]" aria-hidden />
                        ) : (
                          <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#666666]" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-medium">{p.name}</span>
                          <span className="block truncate text-[13px] text-[#666666]">
                            {[p.kind, p.subtitle].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <span className="shrink-0 text-[13px] text-[#666666]">{formatDistance(p.distance)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {success && !notice && (
        <p role="status" className="mt-3 flex items-center gap-2 text-[15px] font-medium text-[#1B7F3B]">
          <Check className="h-4 w-4 shrink-0" aria-hidden /> Location detected and address fields populated. Please review before saving.
        </p>
      )}
      {notice && (
        <p role="alert" className="kv-error mt-3">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {notice}
        </p>
      )}
    </div>
  );
}
