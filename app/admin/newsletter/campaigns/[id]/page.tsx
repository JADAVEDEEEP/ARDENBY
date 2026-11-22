'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CalendarClock, Copy, Download, FileText, Loader2, Save, Send, XCircle } from 'lucide-react';

import { getCurrentAdmin } from '@/components/admin/admin-auth';
import { ConfirmDialog } from '@/components/admin/newsletter/confirm-dialog';
import { EmailBuilder } from '@/components/admin/newsletter/email-builder';
import { EmailPreview } from '@/components/admin/newsletter/email-preview';
import { CampaignStatusBadge } from '@/components/admin/newsletter/status-badge';
import { Pager } from '@/components/admin/pager';
import { Card, EmptyState, Notice, PageHeader, Spinner, StatusPill, btnDark, btnDanger, btnOutline, btnPrimary, fieldClass, labelClass } from '@/components/admin/ui';
import { Pagination, downloadCsv, message, when } from '@/lib/admin-ops-api';
import { PLACEHOLDER_TEXTS, formatDuration, newsletterApi, num, pct, starterDesign } from '@/lib/newsletter-campaign-api';
import type { Campaign, Design, RecipientRow, Template } from '@/lib/newsletter-campaign-api';
import { cn } from '@/lib/utils';

type Tab = 'content' | 'send' | 'results';
type Dialog = 'test' | 'schedule' | 'send' | 'cancel' | 'template' | null;
type AudienceType = 'all_active' | 'selected' | 'source';

const CONTENT_TYPES = new Set(['hero', 'heading', 'paragraph', 'product_image', 'product_details', 'button', 'banner']);

const fmtLocalInput = (date: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
};

export default function CampaignEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const router = useRouter();
  const templateParam = useSearchParams().get('template');

  const [isOwner, setIsOwner] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [tab, setTab] = useState<Tab>('content');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [design, setDesign] = useState<Design>(starterDesign());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [audienceType, setAudienceType] = useState<AudienceType>('all_active');
  const [audienceSource, setAudienceSource] = useState('');
  const [audienceIds, setAudienceIds] = useState<number[]>([]);
  const [pickedEmails, setPickedEmails] = useState<Record<number, string>>({});
  const [sources, setSources] = useState<{ source: string; active: number }[]>([]);
  const [recipients, setRecipients] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);

  const [dialog, setDialog] = useState<Dialog>(null);
  const [scheduleAt, setScheduleAt] = useState(fmtLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [testTo, setTestTo] = useState('');
  const [templateName, setTemplateName] = useState('');

  const editable = isNew || campaign?.status === 'draft';

  const applyCampaign = useCallback((c: Campaign) => {
    setCampaign(c);
    setName(c.name);
    setSubject(c.subject);
    setPreheader(c.preheader);
    if (c.design) setDesign(c.design);
    setAudienceType(c.audience.type);
    setAudienceSource(c.audience.source || '');
    setAudienceIds((c.audience.ids || []) as number[]);
    setDirty(false);
  }, []);

  // ---- initial load ----
  useEffect(() => {
    getCurrentAdmin()
      .then((u) => setIsOwner(u.role === 'superadmin'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (isNew) {
          setTemplates(await newsletterApi.listTemplates().catch(() => []));
          if (templateParam) {
            const t = await newsletterApi.getTemplate(templateParam);
            if (!alive) return;
            if (t.design) setDesign(t.design);
            setSubject(t.subject);
            setPreheader(t.preheader);
            setName(`${t.name} campaign`);
            setDirty(true);
          }
        } else {
          const c = await newsletterApi.getCampaign(id);
          if (alive) applyCampaign(c);
        }
      } catch (e) {
        if (alive) setError(message(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isNew, templateParam, applyCampaign]);

  useEffect(() => {
    if (isOwner) newsletterApi.sources().then(setSources).catch(() => {});
  }, [isOwner]);

  // warn before losing unsaved work
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const touch = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  // ---- saving ----
  const payload = () => ({
    name,
    subject,
    preheader,
    design,
    ...(isOwner
      ? {
          audienceType,
          audienceSource: audienceType === 'source' ? audienceSource || null : null,
          audienceIds: audienceType === 'selected' ? audienceIds : [],
        }
      : {}),
  });

  const refreshCount = useCallback(
    async (campaignId: string) => {
      if (!isOwner) return;
      setCounting(true);
      try {
        setRecipients(await newsletterApi.audienceCount(campaignId));
      } catch {
        setRecipients(null);
      } finally {
        setCounting(false);
      }
    },
    [isOwner]
  );

  /** Saves the draft. Returns the saved campaign id (the new id after the first save). */
  const save = async (): Promise<string | null> => {
    if (!name.trim()) {
      setError('Give the campaign a name first.');
      return null;
    }
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const created = await newsletterApi.createCampaign(payload());
        setDirty(false);
        router.replace(`/admin/newsletter/campaigns/${created.id}`);
        return created.id;
      }
      const updated = await newsletterApi.updateCampaign(id, payload());
      applyCampaign(updated);
      setNotice('Draft saved.');
      void refreshCount(id);
      return id;
    } catch (e) {
      setError(message(e));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const ensureSaved = async () => {
    if (isNew) return save();
    if (dirty) return save();
    return id;
  };

  useEffect(() => {
    if (!isNew && campaign?.status === 'draft' && isOwner) void refreshCount(id);
  }, [isNew, campaign?.status, isOwner, id, refreshCount]);

  // ---- results (polling while a campaign is in flight) ----
  const live = campaign && (campaign.status === 'sending' || campaign.status === 'scheduled');
  const reload = useCallback(async () => {
    try {
      applyCampaign(await newsletterApi.getCampaign(id));
    } catch {
      /* keep what is on screen */
    }
  }, [id, applyCampaign]);

  useEffect(() => {
    if (!live || isNew) return;
    const timer = setInterval(() => void reload(), 8000);
    return () => clearInterval(timer);
  }, [live, isNew, reload]);

  // ---- readiness ----
  const checks = useMemo(() => {
    const hasContent = design.blocks.some((b) => CONTENT_TYPES.has(b.type));
    const placeholder = design.blocks.some((b) => (b.type === 'heading' || b.type === 'paragraph') && PLACEHOLDER_TEXTS.includes(String(b.text)));
    const pin = warnings.some((w) => /PIN code/i.test(w));
    const missingProduct = warnings.some((w) => /not found in the catalogue/i.test(w));
    return [
      { ok: Boolean(name.trim()), label: 'The campaign has a name' },
      { ok: Boolean(subject.trim()), label: 'The email has a subject' },
      { ok: hasContent, label: 'The email has content (heading, text, image or button)' },
      { ok: !placeholder, label: 'Placeholder text has been replaced' },
      { ok: !missingProduct, label: 'Every product block points to a real product' },
      { ok: !pin, label: 'The postal address in the footer is complete (PIN code set on the server)' },
      { ok: (recipients ?? 0) > 0, label: recipients === null ? 'Recipients: save to count them' : `${num(recipients)} active subscriber${recipients === 1 ? '' : 's'} will receive it` },
    ];
  }, [design, name, subject, warnings, recipients]);
  const ready = checks.every((c) => c.ok);

  // ---- actions ----
  const run = async (work: () => Promise<void>) => {
    setError('');
    setNotice('');
    try {
      await work();
    } catch (e) {
      setError(message(e));
    }
  };

  const doTest = async () => {
    const cid = await ensureSaved();
    if (!cid || cid === 'new') return;
    const extra = testTo.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
    const result = await newsletterApi.sendTest(cid, extra.length ? extra : undefined);
    setNotice(result.message);
    setDialog(null);
  };

  const doSend = async () => {
    const cid = await ensureSaved();
    if (!cid) throw new Error('Save the campaign first.');
    const count = await newsletterApi.audienceCount(cid);
    const sent = await newsletterApi.send(cid, { confirm: true, expectedRecipients: recipients ?? count });
    applyCampaign(sent);
    setDialog(null);
    setTab('results');
    setNotice('Sending has started. It goes out gradually, a few emails at a time.');
  };

  const doSchedule = async () => {
    const cid = await ensureSaved();
    if (!cid) throw new Error('Save the campaign first.');
    const count = await newsletterApi.audienceCount(cid);
    const when_ = new Date(scheduleAt);
    if (Number.isNaN(when_.getTime())) throw new Error('Choose a valid date and time.');
    const scheduled = await newsletterApi.schedule(cid, { scheduledAt: when_.toISOString(), confirm: true, expectedRecipients: recipients ?? count });
    applyCampaign(scheduled);
    setDialog(null);
    setTab('results');
    setNotice('Campaign scheduled.');
  };

  const doCancel = async () => {
    applyCampaign(await newsletterApi.cancel(id));
    setDialog(null);
    setNotice('Campaign cancelled. Emails already handed to the mail server cannot be recalled.');
  };

  const doSaveTemplate = async () => {
    if (!templateName.trim()) throw new Error('Give the template a name.');
    await newsletterApi.createTemplate({ name: templateName.trim(), subject, preheader, design });
    setDialog(null);
    setNotice('Saved as a reusable template.');
  };

  const duplicate = () =>
    run(async () => {
      const copy = await newsletterApi.duplicateCampaign(id);
      router.push(`/admin/newsletter/campaigns/${copy.id}`);
    });

  // ---- audience picker ----
  const [pickSearch, setPickSearch] = useState('');
  const [pickHits, setPickHits] = useState<{ id: string; email: string }[]>([]);
  useEffect(() => {
    if (!isOwner || audienceType !== 'selected') return;
    const t = setTimeout(async () => {
      try {
        const { opsRequest, toQuery } = await import('@/lib/admin-ops-api');
        const data = await opsRequest(`/api/admin/newsletter/subscribers${toQuery({ status: 'active', search: pickSearch, limit: 10 })}`);
        setPickHits((data.subscribers || []).map((s: { id: string; email: string }) => ({ id: s.id, email: s.email })));
      } catch {
        setPickHits([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [pickSearch, audienceType, isOwner]);

  const toggleId = (sid: string, email: string) => {
    const n = Number(sid);
    setPickedEmails((m) => ({ ...m, [n]: email }));
    setAudienceIds((ids) => (ids.includes(n) ? ids.filter((x) => x !== n) : [...ids, n]));
    setDirty(true);
  };

  if (loading) return <Spinner label="Loading the campaign" />;
  if (!isNew && !campaign) {
    return (
      <div>
        <Link href="/admin/newsletter/campaigns" className="mb-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#5A6075] hover:text-[#11162B]">
          <ArrowLeft className="h-4 w-4" /> Campaigns
        </Link>
        <Notice tone="error">{error || 'Campaign not found.'}</Notice>
      </div>
    );
  }

  const stats = campaign?.stats;
  const tabs: { key: Tab; label: string }[] = [
    { key: 'content', label: editable ? 'Design' : 'Email' },
    { key: 'send', label: 'Audience & sending' },
    ...(!isNew && campaign?.status !== 'draft' ? [{ key: 'results' as Tab, label: 'Results' }] : []),
  ];

  return (
    <div>
      <Link href="/admin/newsletter/campaigns" className="mb-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#5A6075] hover:text-[#11162B]">
        <ArrowLeft className="h-4 w-4" /> Campaigns
      </Link>
      <PageHeader
        title={isNew ? 'New campaign' : name || 'Campaign'}
        subtitle={isNew ? 'Design the email, then save it as a draft.' : campaign ? `Created ${when(campaign.createdAt)}` : undefined}
        actions={
          <>
            {campaign && <CampaignStatusBadge status={campaign.status} />}
            {!isNew && (
              <button type="button" className={btnOutline} onClick={() => void duplicate()}>
                <Copy className="h-4 w-4" /> Duplicate
              </button>
            )}
            <button type="button" className={btnOutline} onClick={() => { setTemplateName(name); setDialog('template'); }}>
              <FileText className="h-4 w-4" /> Save as template
            </button>
            {editable && (
              <button type="button" className={btnPrimary} onClick={() => void save()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {isNew ? 'Create draft' : 'Save draft'}
              </button>
            )}
          </>
        }
      />

      {error && <Notice tone="error" className="mb-4">{error}</Notice>}
      {notice && <Notice tone="success" className="mb-4">{notice}</Notice>}
      {dirty && editable && <p className="mb-3 text-[14px] font-semibold text-[#7A4F00]">You have unsaved changes.</p>}
      {campaign?.errorNote && (
        <Notice tone={campaign.status === 'failed' ? 'error' : 'warning'} className="mb-4">
          {campaign.errorNote}
        </Notice>
      )}

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-[#E3E5EE]" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'whitespace-nowrap border-b-2 px-4 py-2.5 text-[15px] font-semibold transition-colors',
              tab === t.key ? 'border-[#4338CA] text-[#11162B]' : 'border-transparent text-[#5A6075] hover:text-[#11162B]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------------- DESIGN ---------------- */}
      {tab === 'content' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            {isNew && templates.length > 0 && !templateParam && (
              <Card title="Start from a template" description="Optional. Replaces the starter layout below.">
                <select
                  className={fieldClass}
                  aria-label="Template"
                  defaultValue=""
                  onChange={(e) => e.target.value && router.replace(`/admin/newsletter/campaigns/new?template=${encodeURIComponent(e.target.value)}`)}
                >
                  <option value="">Blank (starter layout)</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </Card>
            )}

            <Card title="Details">
              <div className="space-y-4">
                <div>
                  <label className={labelClass} htmlFor="c-name">Campaign name <span className="text-[#9A2C1F]">*</span></label>
                  <input id="c-name" className={fieldClass} maxLength={120} disabled={!editable} value={name} onChange={(e) => touch(setName)(e.target.value)} placeholder="Only you see this, for example “Autumn drop”" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="c-subject">Email subject <span className="text-[#9A2C1F]">*</span></label>
                  <input id="c-subject" className={fieldClass} maxLength={200} disabled={!editable} value={subject} onChange={(e) => touch(setSubject)(e.target.value)} />
                  <p className="mt-1 text-right text-[12px] text-[#5A6075]">{subject.length}/200</p>
                </div>
                <div>
                  <label className={labelClass} htmlFor="c-pre">Preview text</label>
                  <input id="c-pre" className={fieldClass} maxLength={200} disabled={!editable} value={preheader} onChange={(e) => touch(setPreheader)(e.target.value)} />
                  <p className="mt-1 text-[13px] text-[#5A6075]">The grey line many inboxes show next to the subject.</p>
                </div>
              </div>
            </Card>

            <Card title="Email content" description={editable ? 'Add blocks, edit them and reorder them. The preview updates as you type.' : 'This campaign can no longer be edited. Duplicate it to make changes.'}>
              <EmailBuilder design={design} onChange={(d) => touch(setDesign)(d)} disabled={!editable} />
            </Card>
          </div>

          <div className="xl:sticky xl:top-4 xl:self-start">
            <Card title="Preview" description="Exactly what subscribers will see, including the automatic footer.">
              <EmailPreview design={design} subject={subject} preheader={preheader} onWarnings={setWarnings} />
            </Card>
          </div>
        </div>
      )}

      {/* ---------------- AUDIENCE & SENDING ---------------- */}
      {tab === 'send' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {!isOwner ? (
            <Notice tone="info" className="xl:col-span-2">
              Choosing recipients, sending test emails, scheduling and sending are available to a <strong>Super Admin</strong> only. You can still create and edit drafts and preview them.
            </Notice>
          ) : (
            <>
              <div className="space-y-6">
                <Card title="Who receives it" description="Only active, confirmed subscribers are ever emailed. Pending, unsubscribed and bounced addresses are always excluded.">
                  <fieldset className="space-y-3" disabled={!editable}>
                    <legend className="sr-only">Audience</legend>
                    {(
                      [
                        ['all_active', 'All active subscribers'],
                        ['selected', 'Selected subscribers'],
                        ['source', 'Subscribers by signup source'],
                      ] as [AudienceType, string][]
                    ).map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-3 text-[15px] font-medium text-[#11162B]">
                        <input type="radio" name="audience" className="h-4 w-4 accent-[#4338CA]" checked={audienceType === value} onChange={() => touch(setAudienceType)(value)} />
                        {label}
                      </label>
                    ))}
                  </fieldset>

                  {audienceType === 'source' && (
                    <div className="mt-4">
                      <label className={labelClass} htmlFor="aud-source">Signup source</label>
                      <select id="aud-source" className={fieldClass} disabled={!editable} value={audienceSource} onChange={(e) => touch(setAudienceSource)(e.target.value)}>
                        <option value="">Choose a source</option>
                        {sources.map((s) => (
                          <option key={s.source} value={s.source}>{s.source} ({s.active} active)</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {audienceType === 'selected' && (
                    <div className="mt-4 space-y-3">
                      <input className={fieldClass} placeholder="Search active subscribers by email" aria-label="Search subscribers" disabled={!editable} value={pickSearch} onChange={(e) => setPickSearch(e.target.value)} />
                      <ul className="max-h-52 divide-y divide-[#E3E5EE] overflow-auto rounded-lg border border-[#E3E5EE]">
                        {pickHits.length === 0 && <li className="px-3 py-3 text-[14px] text-[#5A6075]">No active subscribers found.</li>}
                        {pickHits.map((h) => (
                          <li key={h.id}>
                            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-[15px] hover:bg-[#F5F6FA]">
                              <input type="checkbox" className="h-4 w-4 accent-[#4338CA]" disabled={!editable} checked={audienceIds.includes(Number(h.id))} onChange={() => toggleId(h.id, h.email)} />
                              <span className="break-all">{h.email}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[14px] text-[#5A6075]"><strong>{audienceIds.length}</strong> selected (at most 1,000).</p>
                      {audienceIds.length > 0 && (
                        <ul className="flex flex-wrap gap-1.5">
                          {audienceIds.slice(0, 30).map((sid) => (
                            <li key={sid} className="inline-flex items-center gap-1 rounded-full bg-[#F5F6FA] px-2.5 py-1 text-[13px] text-[#5A6075]">
                              {pickedEmails[sid] || `Subscriber #${sid}`}
                              {editable && (
                                <button type="button" aria-label="Remove" className="text-[#5A6075] hover:text-[#9A2C1F]" onClick={() => { setAudienceIds((ids) => ids.filter((x) => x !== sid)); setDirty(true); }}>
                                  ×
                                </button>
                              )}
                            </li>
                          ))}
                          {audienceIds.length > 30 && <li className="text-[13px] text-[#5A6075]">and {audienceIds.length - 30} more</li>}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-3 rounded-lg bg-[#F5F6FA] px-4 py-3">
                    <span className="text-[15px] text-[#5A6075]">
                      Recipients right now:{' '}
                      <strong className="text-[#11162B]">{counting ? '…' : recipients === null ? 'save to count' : num(recipients)}</strong>
                    </span>
                    {!isNew && (
                      <button type="button" className="ml-auto text-[14px] font-semibold text-[#9A2C1F] hover:underline" onClick={() => void (dirty ? save() : refreshCount(id))}>
                        {dirty ? 'Save and recount' : 'Recount'}
                      </button>
                    )}
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card title="Ready to send?">
                  <ul className="space-y-2">
                    {checks.map((c) => (
                      <li key={c.label} className="flex items-start gap-2 text-[15px]">
                        <span aria-hidden="true" className={c.ok ? 'text-[#17603F]' : 'text-[#9A2C1F]'}>{c.ok ? '✓' : '✗'}</span>
                        <span className={c.ok ? 'text-[#5A6075]' : 'font-semibold text-[#9A2C1F]'}>{c.label}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[13px] text-[#5A6075]">The server checks all of this again before anything is sent.</p>
                </Card>

                {editable ? (
                  <Card title="Send">
                    <div className="space-y-4">
                      <button type="button" className={`${btnOutline} w-full`} onClick={() => setDialog('test')} disabled={!subject.trim()}>
                        <Send className="h-4 w-4" /> Send a test email
                      </button>

                      <div className="border-t border-[#E3E5EE] pt-4">
                        <label className={labelClass} htmlFor="sched">Schedule for (your local time)</label>
                        <input id="sched" type="datetime-local" className={fieldClass} value={scheduleAt} min={fmtLocalInput(new Date(Date.now() + 2 * 60 * 1000))} onChange={(e) => setScheduleAt(e.target.value)} />
                        <button type="button" className={`${btnDark} mt-3 w-full`} onClick={() => setDialog('schedule')} disabled={!ready}>
                          <CalendarClock className="h-4 w-4" /> Schedule campaign
                        </button>
                      </div>

                      <div className="border-t border-[#E3E5EE] pt-4">
                        <button type="button" className={`${btnPrimary} w-full`} onClick={() => setDialog('send')} disabled={!ready}>
                          <Send className="h-4 w-4" /> Send now
                        </button>
                        <p className="mt-2 text-[13px] text-[#5A6075]">Real emails go to real subscribers. You will be asked to confirm.</p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card title="Status">
                    <p className="text-[15px] text-[#5A6075]">
                      This campaign is <strong>{campaign?.status.replace('_', ' ')}</strong>.
                      {campaign?.status === 'scheduled' && <> It will start {when(campaign.scheduledAt)}.</>}
                    </p>
                    {(campaign?.status === 'scheduled' || campaign?.status === 'sending') && (
                      <button type="button" className={`${btnDanger} mt-4`} onClick={() => setDialog('cancel')}>
                        <XCircle className="h-4 w-4" /> Cancel {campaign.status === 'sending' ? 'sending' : 'schedule'}
                      </button>
                    )}
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ---------------- RESULTS ---------------- */}
      {tab === 'results' && campaign && (
        <ResultsPanel campaign={campaign} isOwner={isOwner} live={Boolean(live)} onCancel={() => setDialog('cancel')} />
      )}

      {/* ---------------- DIALOGS ---------------- */}
      {dialog === 'test' && (
        <ConfirmDialog
          title="Send a test email"
          confirmLabel="Send test"
          description="A test goes to your own address by default. It is marked [TEST] and its unsubscribe link is inert. It never goes to subscribers."
          onConfirm={doTest}
          onClose={() => setDialog(null)}
        >
          <label className={labelClass} htmlFor="test-to">Other Admin addresses (optional, up to 2, comma separated)</label>
          <input id="test-to" className={fieldClass} value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="Leave empty to send to yourself" />
        </ConfirmDialog>
      )}

      {dialog === 'schedule' && (
        <ConfirmDialog
          title="Schedule this campaign?"
          confirmLabel="Yes, schedule it"
          description={
            <>
              It will be sent to <strong>{num(recipients)}</strong> active subscriber{recipients === 1 ? '' : 's'} starting{' '}
              <strong>{new Date(scheduleAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>. You can cancel it any time before then. It cannot be edited once scheduled.
            </>
          }
          onConfirm={doSchedule}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'send' && (
        <ConfirmDialog
          title="Send this campaign now?"
          confirmLabel="Send to subscribers"
          typeToConfirm="SEND"
          description={
            <>
              This sends a real email to <strong>{num(recipients)}</strong> active subscriber{recipients === 1 ? '' : 's'}. Emails go out gradually and <strong>cannot be recalled</strong> once sent. Anyone who unsubscribes meanwhile is skipped.
            </>
          }
          onConfirm={doSend}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'cancel' && (
        <ConfirmDialog
          title="Cancel this campaign?"
          danger
          confirmLabel="Yes, cancel it"
          description="Nothing still waiting in the queue will be sent. Emails already handed to the mail server cannot be recalled."
          onConfirm={doCancel}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'template' && (
        <ConfirmDialog title="Save as a reusable template" confirmLabel="Save template" description="Saves the current design, subject and preview text. Audience and results are not part of a template." onConfirm={doSaveTemplate} onClose={() => setDialog(null)}>
          <label className={labelClass} htmlFor="tpl-name">Template name</label>
          <input id="tpl-name" className={fieldClass} maxLength={120} value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
        </ConfirmDialog>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function ResultsPanel({ campaign, isOwner, live, onCancel }: { campaign: Campaign; isOwner: boolean; live: boolean; onCancel: () => void }) {
  const stats = campaign.stats;
  const [rows, setRows] = useState<RecipientRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const campaignId = campaign.id;
  const finished = stats ? stats.sent + stats.failed + stats.skipped : 0;
  const progress = stats && stats.queued > 0 ? Math.round((finished / stats.queued) * 100) : 0;

  useEffect(() => {
    if (!isOwner) return;
    let alive = true;
    setBusy(true);
    newsletterApi
      .recipients(campaignId, { page, limit: 20, status })
      .then((d) => {
        if (!alive) return;
        setRows(d.recipients);
        setPagination(d.pagination);
        setError('');
      })
      .catch((e) => alive && setError(message(e)))
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [campaignId, isOwner, page, status, stats?.sent, stats?.failed]);

  const cards: [string, string, string?][] = stats
    ? [
        ['Queued', num(stats.queued), 'People in this send'],
        ['Sent', num(stats.sent), 'Accepted by the mail server'],
        ['Delivered', num(stats.delivered), stats.providerData ? 'Reported by Brevo' : 'Needs the Brevo webhook'],
        ['Failed', num(stats.failed), stats.skipped ? `${stats.skipped} skipped (unsubscribed or cancelled)` : undefined],
        ['Bounced', num(stats.bounced), stats.providerData ? 'Reported by Brevo' : 'Needs the Brevo webhook'],
        ['Unsubscribed', num(stats.unsubscribed), 'Used the link in this email'],
        [stats.providerData ? 'Delivery rate' : 'Acceptance rate', pct(stats.providerData ? stats.deliveryRate : stats.acceptanceRate), stats.providerData ? 'Delivered ÷ sent' : 'Sent ÷ (sent + failed)'],
        ['Completion time', formatDuration(stats.completionSeconds), campaign.completedAt ? `Finished ${when(campaign.completedAt)}` : live ? 'Still in progress' : undefined],
      ]
    : [];

  return (
    <div className="space-y-6">
      {live && (
        <Notice tone="info">
          {campaign.status === 'scheduled' ? `Scheduled for ${when(campaign.scheduledAt)}. Nothing has been sent yet.` : 'Sending in progress. This page refreshes by itself.'}
          {isOwner && (
            <button type="button" onClick={onCancel} className="ml-3 font-bold underline">
              Cancel {campaign.status === 'sending' ? 'sending' : 'schedule'}
            </button>
          )}
        </Notice>
      )}

      {stats && stats.queued > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-[14px] text-[#5A6075]">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#F5F6FA]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Sending progress">
            <div className="h-full rounded-full bg-[#11162B] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-[#E3E5EE] bg-white p-4">
            <p className="text-[14px] font-semibold text-[#5A6075]">{label}</p>
            <p className="mt-1 text-[26px] font-bold leading-tight text-[#11162B]">{value}</p>
            {hint && <p className="mt-0.5 text-[13px] text-[#5A6075]">{hint}</p>}
          </div>
        ))}
      </div>

      {stats && !stats.providerData && (
        <Notice tone="info">
          Delivered and bounced counts appear only when Brevo reports them through the webhook. They show &ldquo;—&rdquo; rather than a guess. Open and click rates are not available over SMTP.
        </Notice>
      )}

      {isOwner ? (
        <Card
          title="Delivery records"
          description="One row per recipient, with the real outcome."
          bodyClassName="p-0"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <select className={`${fieldClass} !h-9 w-[150px]`} aria-label="Filter by delivery status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All</option>
                {['queued', 'sending', 'sent', 'failed', 'skipped'].map((s) => (
                  <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <button
                type="button"
                className={`${btnOutline} !min-h-0 !px-3 !py-1.5 !text-[14px]`}
                disabled={exporting}
                onClick={async () => {
                  setExporting(true);
                  try {
                    await downloadCsv(`/api/admin/newsletter/campaigns/${campaignId}/report.csv`, `kovenik-campaign-${campaignId}-report.csv`);
                  } catch (e) {
                    setError(message(e));
                  } finally {
                    setExporting(false);
                  }
                }}
              >
                <Download className="h-4 w-4" /> {exporting ? 'Preparing…' : 'Download CSV'}
              </button>
            </div>
          }
        >
          {error && <Notice tone="error" className="m-4">{error}</Notice>}
          {rows.length === 0 && !busy ? (
            <EmptyState title="No delivery records" icon={FileText}>Nothing has been queued for this campaign yet.</EmptyState>
          ) : (
            <div className="overflow-x-auto" aria-busy={busy}>
              <table className="w-full min-w-[720px] text-left text-[15px]">
                <thead className="border-b border-[#E3E5EE] text-[13px] uppercase tracking-wide text-[#5A6075]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Tries</th>
                    <th className="px-3 py-3 font-semibold">Sent</th>
                    <th className="px-3 py-3 font-semibold">Delivered</th>
                    <th className="px-5 py-3 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E5EE]">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="max-w-[240px] break-all px-5 py-2.5 font-medium text-[#11162B]">{r.email}</td>
                      <td className="px-3 py-2.5">
                        <StatusPill tone={r.status === 'sent' ? 'success' : r.status === 'failed' ? 'error' : r.status === 'skipped' ? 'neutral' : 'warning'}>{r.status}</StatusPill>
                        {r.bouncedAt && <span className="ml-1"><StatusPill tone="error">bounced</StatusPill></span>}
                      </td>
                      <td className="px-3 py-2.5 text-[#5A6075]">{r.attempts}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[#5A6075]">{when(r.sentAt)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[#5A6075]">{r.deliveredAt ? when(r.deliveredAt) : '—'}</td>
                      <td className="max-w-[260px] px-5 py-2.5 text-[13px] text-[#5A6075]">{r.error || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagination && <Pager pagination={pagination} onPage={setPage} busy={busy} noun="recipient" />}
        </Card>
      ) : (
        <Notice tone="info">Per-recipient delivery records contain email addresses and are available to a Super Admin only.</Notice>
      )}
    </div>
  );
}
