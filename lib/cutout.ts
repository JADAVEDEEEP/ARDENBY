/* Client-side background removal for flat-background product photos.
 *
 * Product photos come from remote hosts (CMS / API), so they cannot be
 * pre-processed. We flood-fill the border-connected background on a canvas and
 * return a transparent PNG object URL. Anything that does not look like a clean
 * studio shot (busy background, tainted canvas, garment eaten by the fill)
 * resolves to `null` and the caller falls back to the original photo.
 */

const MAX_SIDE = 640;
const TOLERANCE = 72; // max RGB distance from the border colour (soft studio gradients)
const ROUGHNESS_MAX = 5; // clean silhouettes measure ~3.5-4.8, leaked fills 5.4+
const SHADOW_TOLERANCE = 115;
const SHADOW_STEP = 42;
const STEP = 9; // max RGB change between neighbouring pixels (stops at garment edges)
const cache = new Map<string, Promise<string | null>>();

/** Ask known hosts for a smaller rendition so processing stays cheap. */
function sized(src: string): string {
  try {
    const url = new URL(src, window.location.href);
    if (url.hostname === 'images.pexels.com') {
      url.search = '?auto=compress&cs=tinysrgb&w=800';
    } else if (url.hostname === 'images.unsplash.com') {
      url.searchParams.set('w', '800');
      url.searchParams.set('q', '80');
    }
    return url.toString();
  } catch {
    return src;
  }
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed'));
    img.src = src;
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

async function process(src: string): Promise<string | null> {
  const img = await load(sized(src));
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);

  const data = ctx.getImageData(0, 0, w, h); // throws when the canvas is tainted
  const px = data.data;

  // Background colour = median of the border pixels.
  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) border.push(y * w, y * w + (w - 1));
  const bg = [0, 1, 2].map((c) => median(border.map((i) => px[i * 4 + c])));

  const step = (a: number, b: number) =>
    Math.abs(px[a * 4] - px[b * 4]) +
    Math.abs(px[a * 4 + 1] - px[b * 4 + 1]) +
    Math.abs(px[a * 4 + 2] - px[b * 4 + 2]);

  const dist = (i: number) => {
    const dr = px[i * 4] - bg[0];
    const dg = px[i * 4 + 1] - bg[1];
    const db = px[i * 4 + 2] - bg[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  // The border must be (mostly) one flat colour, otherwise it is a lifestyle shot.
  const flat = border.filter((i) => dist(i) <= TOLERANCE).length / border.length;
  if (flat < 0.8) return null;

  const removed = new Uint8Array(w * h);
  const bgChroma = Math.max(...bg) - Math.min(...bg);
  const chroma = (i: number) =>
    Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) -
    Math.min(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);

  /** Flood from the removed border region into pixels that `accept` allows. */
  const flood = (seeds: number[], accept: (from: number, to: number) => boolean) => {
    const stack = [...seeds];
    while (stack.length) {
      const i = stack.pop() as number;
      const x = i % w;
      const neighbours = [
        x > 0 ? i - 1 : -1,
        x < w - 1 ? i + 1 : -1,
        i - w >= 0 ? i - w : -1,
        i + w < w * h ? i + w : -1,
      ];
      for (const n of neighbours) {
        if (n >= 0 && !removed[n] && accept(i, n)) {
          removed[n] = 1;
          stack.push(n);
        }
      }
    }
  };

  const seeds = border.filter((i) => dist(i) <= TOLERANCE);
  for (const i of seeds) removed[i] = 1;

  // Pass 1: the studio backdrop, following soft gradients but stopping at edges.
  flood(seeds, (from, to) => dist(to) <= TOLERANCE && step(from, to) <= STEP);

  // Pass 2: grey cast shadows beside the garment (same neutral hue as the
  // backdrop, no colour of their own). Coloured fabric is left alone.
  const shadowSeeds: number[] = [];
  for (let i = 0; i < removed.length; i++) if (removed[i]) shadowSeeds.push(i);
  flood(
    shadowSeeds,
    (from, to) =>
      dist(to) <= SHADOW_TOLERANCE && chroma(to) <= bgChroma + 14 && step(from, to) <= SHADOW_STEP
  );

  let removedCount = 0;
  for (let i = 0; i < removed.length; i++) removedCount += removed[i];
  const fraction = removedCount / removed.length;
  if (fraction < 0.12 || fraction > 0.88) return null;

  // The middle of the frame must still be garment.
  let centreRemoved = 0;
  let centreTotal = 0;
  for (let y = Math.floor(h * 0.35); y < Math.floor(h * 0.65); y++) {
    for (let x = Math.floor(w * 0.35); x < Math.floor(w * 0.65); x++) {
      centreTotal++;
      centreRemoved += removed[y * w + x];
    }
  }
  if (centreRemoved / centreTotal > 0.15) return null;

  // Keep only the largest connected garment; drop leftover background islands.
  const label = new Int32Array(w * h);
  let best = 0;
  let bestSize = 0;
  let next = 0;
  for (let start = 0; start < label.length; start++) {
    if (removed[start] || label[start]) continue;
    next++;
    let size = 0;
    const q = [start];
    label[start] = next;
    while (q.length) {
      const i = q.pop() as number;
      size++;
      const x = i % w;
      const ns = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
      for (const n of ns) {
        if (n >= 0 && n < label.length && !removed[n] && !label[n]) {
          label[n] = next;
          q.push(n);
        }
      }
    }
    if (size > bestSize) {
      bestSize = size;
      best = next;
    }
  }
  for (let i = 0; i < label.length; i++) if (label[i] !== best) removed[i] = 1;

  // A clean garment silhouette is compact; ragged cuts mean the fill leaked.
  let perimeter = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!removed[i] && (removed[i - 1] || removed[i + 1] || removed[i - w] || removed[i + w])) {
        perimeter++;
      }
    }
  }
  const roughness = perimeter / Math.sqrt(bestSize);
  if (roughness > ROUGHNESS_MAX) return null;

  // Apply alpha, softening the 1px rim next to removed pixels.
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (removed[i]) {
        px[i * 4 + 3] = 0;
        continue;
      }
      const rim =
        (x > 0 && removed[i - 1]) ||
        (x < w - 1 && removed[i + 1]) ||
        (y > 0 && removed[i - w]) ||
        (y < h - 1 && removed[i + w]);
      if (rim) px[i * 4 + 3] = 140;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  ctx.putImageData(data, 0, 0);

  // Crop to the garment so every card frames it consistently.
  const pad = 6;
  const cx = Math.max(0, minX - pad);
  const cy = Math.max(0, minY - pad);
  const cw = Math.min(w - cx, maxX - minX + pad * 2);
  const ch = Math.min(h - cy, maxY - minY + pad * 2);
  if (cw < w * 0.2 || ch < h * 0.2) return null;

  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d')?.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);

  return new Promise((resolve) => {
    out.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : null), 'image/png');
  });
}

/** Transparent PNG object URL for `src`, or `null` if it cannot be cut out. */
export function cutoutImage(src: string): Promise<string | null> {
  let job = cache.get(src);
  if (!job) {
    job = process(src).catch(() => null);
    cache.set(src, job);
  }
  return job;
}
