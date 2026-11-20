// Global next/image loader. Product photos are 1-2 MB PNGs on Cloudinary; this asks Cloudinary
// for an auto-format (WebP/AVIF), auto-quality copy sized to the slot instead. Free, no Vercel
// image-optimisation quota used. Anything that is not Cloudinary (local /public files) is untouched.
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const marker = '/image/upload/';
  if (typeof src === 'string' && src.includes('res.cloudinary.com') && src.includes(marker)) {
    const [head, tail] = src.split(marker);
    // Skip if a transformation is already present.
    if (/^(?:[a-z]{1,3}_[^/]+,?)+\//.test(tail)) return src;
    return `${head}${marker}f_auto,q_${quality || 'auto'},w_${width},c_limit/${tail}`;
  }
  return src;
}
