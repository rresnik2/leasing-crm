import { PRIORITY_TONES } from '../../constants/leadOptions';
import { paths } from '../../router';
import { formatForDisplay } from '../../utils/phoneUtils';
import PipelineProgress from '../PipelineProgress';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import StatusBadge from '../ui/StatusBadge';
import ContactAction, { LinkButton } from './ContactAction';
import Icon from './icons';
import { formatAddedDate, getInitials } from './leadPageUtils';

function ScoreBadge({ entry }) {
  if (entry?.loading) {
    return (
      <span role="status">
        <span className="sr-only">Loading score…</span>
        <Skeleton className="h-6 w-28 !rounded-full" />
      </span>
    );
  }
  const data = entry?.data;
  if (!data) return null;
  return (
    <Badge tone={PRIORITY_TONES[data.priority] ?? 'neutral'}>
      Score {data.score} · {data.priority}
    </Badge>
  );
}

export default function LeadHeader({ lead, score, onEdit, onContact }) {
  const added = formatAddedDate(lead.createdAt);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-start gap-4">
          <div
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-title text-brand-strong"
          >
            {getInitials(lead.name)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="min-w-0 break-words text-display text-fg">{lead.name || 'Unnamed lead'}</h1>
              <StatusBadge status={lead.status} />
              <ScoreBadge entry={score} />
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-fg-muted">
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="break-all text-brand-strong hover:underline focus-ring rounded-control">
                  {lead.email}
                </a>
              )}
              {lead.email && lead.phone && <span aria-hidden="true">·</span>}
              {lead.phone && <span>{formatForDisplay(lead.phone)}</span>}
              {added && (lead.email || lead.phone) && <span aria-hidden="true">·</span>}
              {added && <span>Added {added}</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ContactAction kind="call" lead={lead} label="Call" onContact={onContact} />
          <ContactAction kind="text" lead={lead} label="Text" onContact={onContact} />
          <ContactAction kind="email" lead={lead} label="Email" onContact={onContact} />
          <Button variant="secondary" leadingIcon={<Icon name="pencil" />} onClick={onEdit}>
            Edit details
          </Button>
          <LinkButton href={paths.tours({ lead: lead.id })} icon={<Icon name="calendar" />}>
            Schedule tour
          </LinkButton>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <PipelineProgress variant="steps" status={lead.status} />
      </div>
    </Card>
  );
}
