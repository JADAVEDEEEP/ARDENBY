import { apiUrl } from '@/lib/api-url';

/** A banner exactly as the public API returns it (live banners only). */
export interface PublicBanner {
  id: string;
  name: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  sortOrder: number;
  /**
   * Optional hero fields. The API does not send them yet; when it does, a banner with a `modelImageUrl`
   * (transparent cut-out, same size as `imageUrl`) gets the layered hero: giant KOVENIK word behind the model plus real text.
   */
  modelImageUrl?: string | null;
  mobileModelImageUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  buttonText?: string | null;
}

export type BannerStatus = 'live' | 'scheduled' | 'expired' | 'inactive';

/** A banner as the admin API returns it (includes schedule and status). */
export interface AdminBanner extends PublicBanner {
  active: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string | null;
  status: BannerStatus;
}

export const BANNER_MAX_BYTES = 5 * 1024 * 1024;
export const BANNER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/** Fetches the banners customers should see right now. Throws when the server cannot be reached. */
export async function fetchPublicBanners(signal?: AbortSignal): Promise<PublicBanner[]> {
  const response = await fetch(apiUrl('/api/banners'), { signal });
  if (!response.ok) throw new Error(`Banners API failed with status ${response.status}`);

  const data: unknown = await response.json();
  const list = (data as { banners?: unknown })?.banners;
  if (!Array.isArray(list)) return [];

  return list.filter(
    (b): b is PublicBanner =>
      Boolean(b) && typeof b.id === 'string' && typeof b.name === 'string' && typeof b.imageUrl === 'string'
  );
}

/** Only absolute http(s) URLs and site paths are followed from a banner. */
export function isSafeBannerLink(link: string | null | undefined): link is string {
  if (!link) return false;
  if (link.startsWith('/')) return !link.startsWith('//');
  try {
    const url = new URL(link);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
