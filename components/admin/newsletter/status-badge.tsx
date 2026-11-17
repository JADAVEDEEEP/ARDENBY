import { StatusPill } from '@/components/admin/ui';
import { STATUS_LABEL } from '@/lib/newsletter-campaign-api';
import type { CampaignStatus } from '@/lib/newsletter-campaign-api';

const TONE: Record<CampaignStatus, 'success' | 'warning' | 'error' | 'neutral' | 'accent'> = {
  draft: 'neutral',
  scheduled: 'accent',
  sending: 'warning',
  sent: 'success',
  partially_failed: 'warning',
  failed: 'error',
  cancelled: 'neutral',
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <StatusPill tone={TONE[status] ?? 'neutral'}>{STATUS_LABEL[status] ?? status}</StatusPill>;
}
