'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { Card, EmptyState, Notice, PageHeader, Spinner, btnDark, fieldClass } from '@/components/admin/ui';
import { message, opsRequest } from '@/lib/admin-ops-api';

type Img = { id: string; url: string; position: number; isPrimary: boolean; aiGenerated: boolean };
type Row = { id: string; slug: string; name: string; collection: string; images: Img[] };
type Data = { canGenerate: boolean; shots: string[]; products: Row[] };

const SHOT_LABEL: Record<string, string> = { front: 'Front', back: 'Back', detail: 'Detail', model: 'On model' };

/** Every product with its images. Each AI-generated image can be regenerated in one click, with an optional prompt. */
export default function AdminImagesPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [prompts, setPrompts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await opsRequest<Data>('/api/admin/images'));
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const regenerate = async (productId: string, shot: string) => {
    const key = `${productId}:${shot}`;
    setBusy(key);
    setError('');
    setNotice('');
    try {
      const res = await opsRequest<{ flagged: string[] }>(`/api/admin/images/${productId}/regenerate`, {
        method: 'POST',
        body: JSON.stringify({ shot, prompt: prompts[productId] || undefined }),
      });
      setNotice(res.flagged?.length ? `Regenerated, but flagged: ${res.flagged.join('; ')}` : 'Image regenerated.');
      await load();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product images"
        subtitle="AI-generated images can be regenerated here. Real photos are never replaced."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}
      {data && !data.canGenerate && (
        <Notice tone="warning">Image generation is off: add HF_TOKEN, GEMINI_API_KEY or OPENAI_API_KEY to the backend environment to enable Regenerate.</Notice>
      )}

      {loading && !data ? (
        <Spinner />
      ) : !data || data.products.length === 0 ? (
        <EmptyState title="No products yet" />
      ) : (
        data.products.map((p) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[16px] font-bold text-[#11162B]">{p.name}</h2>
              <span className="text-[14px] text-[#5A6075]">{p.collection}</span>
            </div>

            <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {data.shots.map((shot, i) => {
                const img = p.images.find((x) => x.position === i) || (p.images[i] as Img | undefined);
                const key = `${p.id}:${shot}`;
                return (
                  <li key={shot}>
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#F5F6FA]">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.url} alt={`${p.name}: ${SHOT_LABEL[shot]}`} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[14px] text-[#5A6075]">No image</span>
                      )}
                      {img?.aiGenerated && (
                        <span className="absolute left-0 top-2 bg-[#11162B] px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-white">AI</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[14px] font-semibold">{SHOT_LABEL[shot]}</p>
                    {(!img || img.aiGenerated) && (
                      <button
                        type="button"
                        onClick={() => regenerate(p.id, shot)}
                        disabled={!data.canGenerate || busy !== ''}
                        className="mt-1 inline-flex min-h-[40px] items-center gap-1.5 text-[14px] font-semibold text-[#11162B] underline underline-offset-4 disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${busy === key ? 'animate-spin' : ''}`} aria-hidden="true" />
                        {busy === key ? 'Generating…' : img ? 'Regenerate' : 'Generate'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            <label className="mt-4 block text-[14px] font-semibold text-[#11162B]" htmlFor={`prompt-${p.id}`}>
              Custom direction (optional, applied to the next regenerate)
            </label>
            <input
              id={`prompt-${p.id}`}
              value={prompts[p.id] || ''}
              onChange={(e) => setPrompts((s) => ({ ...s, [p.id]: e.target.value }))}
              placeholder="e.g. warmer light, show the print larger"
              maxLength={500}
              className={fieldClass}
            />
          </Card>
        ))
      )}
      <button type="button" onClick={load} className={btnDark}>
        Refresh
      </button>
    </div>
  );
}
