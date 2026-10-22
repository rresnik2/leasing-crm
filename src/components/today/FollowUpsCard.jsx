import { useState } from 'react';

import { logActivity } from '../../data/activities';
import { paths } from '../../router';
import { cleanActionText } from '../../utils/followUp';
import { PRIORITY_TONES } from '../../constants/leadOptions';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import StatusBadge from '../ui/StatusBadge';
import { useToast } from '../ui/useToast';
import ContactActions from './ContactActions';
import { CheckCircleIcon, CheckIcon, ClockIcon } from './icons';
import { FOLLOW_UP_FILTERS, countFollowUps, dueLabel, filterFollowUps } from './todayUtils';

const MAX_ROWS = 8;

const DUE_TONES = { danger: 'text-danger-strong', warning: 'text-warning-strong' };

function ScoreBadge({ score }) {
  if (!score) return null;
  if (score.loading) return <Skeleton className="h-5 w-16 !rounded-full" />;
  if (!score.data) return null;
  return (
    <Badge tone={PRIORITY_TONES[score.data.priority] ?? 'neutral'} size="sm" className="tabular-nums">
      Score {score.data.score}
    </Badge>
  );
}

function FollowUpRow({ item, now, score, saving, onDone }) {
  const { lead, followUp } = item;
  const due = dueLabel(followUp.dueAt, now, followUp.estimated);
  const action = cleanActionText(score?.data?.recommended_action) || followUp.method;

  return (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line px-5 py-4">
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <a href={paths.lead(lead.id)} className="rounded-control text-title text-fg hover:text-brand focus-ring">
            {lead.name}
          </a>
          <StatusBadge status={lead.status} size="sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ScoreBadge score={score} />
          <span className="text-body text-fg-muted">{action}</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-[0_1_170px] flex-col gap-0.5">
        <span className={`inline-flex items-center gap-1.5 text-label tabular-nums ${DUE_TONES[due.tone]}`}>
          <ClockIcon />
          {due.text}
        </span>
        <span className="text-caption text-fg-muted">{followUp.method}</span>
      </div>
      <div className="flex gap-2">
        <ContactActions lead={lead} />
        <Button variant="secondary" leadingIcon={<CheckIcon />} disabled={saving} onClick={() => onDone(item)}>
          Done
        </Button>
      </div>
    </li>
  );
}

function Section({ title, items, now, scores, savingIds, onDone }) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, MAX_ROWS);
  return (
    <div>
      <h3 className="border-t border-line bg-surface-muted px-5 py-2 text-caption font-medium uppercase tracking-wide text-fg-muted">
        {title} · <span className="tabular-nums">{items.length}</span>
      </h3>
      <ul>
        {visible.map((item) => (
          <FollowUpRow
            key={item.lead.id}
            item={item}
            now={now}
            score={scores[item.lead.id]}
            saving={savingIds.has(item.lead.id)}
            onDone={onDone}
          />
        ))}
      </ul>
      {items.length > MAX_ROWS && (
        <div className="border-t border-line px-5 py-2">
          <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show fewer' : `Show all ${items.length}`}
          </Button>
        </div>
      )}
    </div>
  );
}

function FollowUpsCard({ groups, loading, scores, now }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const [savingIds, setSavingIds] = useState(() => new Set());

  const handleDone = async ({ lead, followUp }) => {
    setSavingIds((prev) => new Set(prev).add(lead.id));
    try {
      await logActivity(lead.id, { type: 'follow-up', body: followUp.method });
      toast({ tone: 'success', title: `Follow-up logged for ${lead.name}` });
      // the row leaves on the next snapshot; keep it disabled until then
    } catch (error) {
      console.error('Error logging follow-up:', error);
      toast({ tone: 'danger', title: "Couldn't log follow-up" });
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });
    }
  };

  const dueToday = [...groups.dueNow, ...groups.laterToday];
  const counts = countFollowUps(dueToday);
  const dueNow = filterFollowUps(groups.dueNow, filter);
  const laterToday = filterFollowUps(groups.laterToday, filter);

  return (
    <Card as="section" padding="none" aria-labelledby="followups-title" className="min-w-0 flex-[999_1_560px] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 id="followups-title" className="text-heading text-fg">Follow-ups</h2>
          <p className="mt-0.5 text-caption text-fg-muted">
            Timing comes from each lead&apos;s move-in date and stage.
          </p>
        </div>
        <div role="group" aria-label="Show" className="inline-flex gap-0.5 rounded-control bg-surface-muted p-[3px]">
          {FOLLOW_UP_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`h-8 rounded-control px-3 text-caption font-medium focus-ring ${
                filter === value ? 'bg-surface text-fg shadow-card' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {label} <span className="tabular-nums">{counts[value]}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div role="status" className="space-y-4 border-t border-line px-5 py-4">
          <span className="sr-only">Loading follow-ups…</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
          ))}
        </div>
      ) : dueToday.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState icon={<CheckCircleIcon />} title="You're all caught up" description="No follow-ups are due today." />
        </div>
      ) : (
        <>
          <Section title="Due now" items={dueNow} now={now} scores={scores} savingIds={savingIds} onDone={handleDone} />
          <Section title="Later today" items={laterToday} now={now} scores={scores} savingIds={savingIds} onDone={handleDone} />
          {dueNow.length + laterToday.length === 0 && (
            <p className="border-t border-line px-5 py-6 text-body text-fg-muted">
              Nothing in this view. Switch the filter to see everything due today.
            </p>
          )}
        </>
      )}

      {!loading && groups.upcoming.length > 0 && (
        <p className="border-t border-line px-5 py-3 text-body text-fg-muted">
          <span className="tabular-nums">{groups.upcoming.length}</span> more coming up.{' '}
          <a href={paths.leads()} className="rounded-control text-brand-strong hover:underline focus-ring">
            View leads
          </a>
        </p>
      )}
    </Card>
  );
}

export default FollowUpsCard;
