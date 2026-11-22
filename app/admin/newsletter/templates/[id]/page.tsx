'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

import { EmailBuilder } from '@/components/admin/newsletter/email-builder';
import { EmailPreview } from '@/components/admin/newsletter/email-preview';
import { Card, Notice, PageHeader, Spinner, btnPrimary, fieldClass, labelClass } from '@/components/admin/ui';
import { message } from '@/lib/admin-ops-api';
import { newsletterApi, starterDesign } from '@/lib/newsletter-campaign-api';
import type { Design } from '@/lib/newsletter-campaign-api';

/** Create or edit a reusable email template (same builder and live preview as a campaign). */
export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const router = useRouter();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [design, setDesign] = useState<Design>(starterDesign());

  useEffect(() => {
    if (isNew) return;
    let alive = true;
    newsletterApi
      .getTemplate(id)
      .then((t) => {
        if (!alive) return;
        setName(t.name);
        setSubject(t.subject);
        setPreheader(t.preheader);
        if (t.design) setDesign(t.design);
      })
      .catch((e) => alive && setError(message(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, isNew]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const save = async () => {
    if (!name.trim()) {
      setError('Give the template a name.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const body = { name: name.trim(), subject, preheader, design };
      if (isNew) {
        const created = await newsletterApi.createTemplate(body);
        setDirty(false);
        router.replace(`/admin/newsletter/templates/${created.id}`);
      } else {
        await newsletterApi.updateTemplate(id, body);
        setDirty(false);
        setNotice('Template saved.');
      }
    } catch (e) {
      setError(message(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading the template" />;

  return (
    <div>
      <Link href="/admin/newsletter/templates" className="mb-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#5A6075] hover:text-[#11162B]">
        <ArrowLeft className="h-4 w-4" /> Email templates
      </Link>
      <PageHeader
        title={isNew ? 'New template' : name || 'Template'}
        actions={
          <button type="button" className={btnPrimary} onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save template
          </button>
        }
      />
      {error && <Notice tone="error" className="mb-4">{error}</Notice>}
      {notice && <Notice tone="success" className="mb-4">{notice}</Notice>}
      {dirty && <p className="mb-3 text-[14px] font-semibold text-[#7A4F00]">You have unsaved changes.</p>}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <Card title="Details">
            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="t-name">Template name <span className="text-[#9A2C1F]">*</span></label>
                <input id="t-name" className={fieldClass} maxLength={120} value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} />
              </div>
              <div>
                <label className={labelClass} htmlFor="t-subject">Default subject (optional)</label>
                <input id="t-subject" className={fieldClass} maxLength={200} value={subject} onChange={(e) => { setSubject(e.target.value); setDirty(true); }} />
              </div>
              <div>
                <label className={labelClass} htmlFor="t-pre">Default preview text (optional)</label>
                <input id="t-pre" className={fieldClass} maxLength={200} value={preheader} onChange={(e) => { setPreheader(e.target.value); setDirty(true); }} />
              </div>
            </div>
          </Card>
          <Card title="Email content">
            <EmailBuilder design={design} onChange={(d) => { setDesign(d); setDirty(true); }} />
          </Card>
        </div>
        <div className="xl:sticky xl:top-4 xl:self-start">
          <Card title="Preview">
            <EmailPreview design={design} subject={subject} preheader={preheader} />
          </Card>
        </div>
      </div>
    </div>
  );
}
