'use client';

import { useCallback, useEffect, useState } from 'react';

import { fetchPublicBanners, type PublicBanner } from '@/lib/banner-api';

// A banner can reach its end date while the page stays open, so the list is
// refreshed now and then. The server decides which banners are currently live.
const REFRESH_MS = 5 * 60_000;

interface BannersState {
  banners: PublicBanner[];
  loading: boolean;
  error: boolean;
}

/** Banners for the homepage hero slider, straight from the public banner API. */
export function useBanners() {
  const [state, setState] = useState<BannersState>({ banners: [], loading: true, error: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async (initial: boolean) => {
      try {
        const banners = await fetchPublicBanners(controller.signal);
        if (active) setState({ banners, loading: false, error: false });
      } catch (error) {
        if (!active || (error as { name?: string })?.name === 'AbortError') return;
        // A failed background refresh keeps whatever is already showing.
        setState((prev) => (initial ? { banners: [], loading: false, error: true } : prev));
      }
    };

    setState((prev) => (prev.error ? { banners: [], loading: true, error: false } : prev));
    void load(true);
    const timer = window.setInterval(() => void load(false), REFRESH_MS);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}
