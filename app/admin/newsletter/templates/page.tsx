'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { FileText, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/admin/newsletter/confirm-dialog';
import { Card, EmptyState, Notice, PageHeader, Spinner, btnDanger, btnOutline, btnPrimary } from '@/components/admin/ui';
import { message, when } from '@/lib/admin-ops-api';
import { newsletterApi } from '@/lib/newsletter-campaign-api';
import type { Template } from '@/lib/newsletter-campaign-api';

/** Reusable email designs. Admin and Super Admin can create, edit and delete templates; a template never sends anything. */
export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [target, setTarget] = useState<Template | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTemplates(await newsletterApi.listTemplates());
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Email templates"
        subtitle="Save a design once and start new campaigns from it. Templates hold the layout, subject and preview text only."
        actions={
          <>
            <button type="button" className={btnOutline} onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <Link href="/admin/newsletter/templates/new" className={btnPrimary}>
              <Plus className="h-4 w-4" /> New template
            </Link>
          </>
        }
      />

      {error && <Notice tone="error" className="mb-4">{error}</Notice>}
      {notice && <Notice tone="success" className="mb-4">{notice}</Notice>}

      <Card bodyClassName="p-0">
        {loading && templates.length === 0 ? (
          <Spinner label="Loading templates" />
        ) : templates.length === 0 ? (
          <EmptyState icon={FileText} title="No templates yet">
            Open a campaign and choose &ldquo;Save as template&rdquo;, or create one here.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-[#E4E7EC]" aria-busy={loading}>
            {templates.map((t) => (
              <li key={t.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[#111111]">{t.name}</p>
                  <p className="truncate text-[13px] text-[#626875]">{t.subject || 'No subject saved'} · Updated {when(t.updatedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/newsletter/campaigns/new?template=${t.id}`} className={`${btnPrimary} !min-h-0 !px-3 !py-1.5 !text-[13px]`}>
                    Use for a campaign
                  </Link>
                  <Link href={`/admin/newsletter/templates/${t.id}`} className={`${btnOutline} !min-h-0 !px-3 !py-1.5 !text-[13px]`}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Link>
                  <button type="button" className={`${btnDanger} !min-h-0 !px-3 !py-1.5 !text-[13px]`} onClick={() => { setNotice(''); setTarget(t); }} aria-label={`Delete ${t.name}`}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {target && (
        <ConfirmDialog
          danger
          title="Delete this template?"
          confirmLabel="Delete template"
          description={<><strong>{target.name}</strong> will be removed. Campaigns already made from it are not affected.</>}
          onConfirm={async () => {
            await newsletterApi.deleteTemplate(target.id);
            setNotice('Template deleted.');
            setTarget(null);
            await load();
          }}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}
