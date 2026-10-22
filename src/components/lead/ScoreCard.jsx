import { FINISHED_STATUSES, PRIORITY_TONES } from '../../constants/leadOptions';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { buildFactorRows } from './leadPageUtils';

function FactorRow({ row }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-body font-medium text-fg">{row.label}</span>
        <span className="text-caption text-fg-muted">
          {row.value} / {row.max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={row.label}
        aria-valuemin={0}
        aria-valuemax={row.max}
        aria-valuenow={row.value}
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${row.percent}%` }} />
      </div>
      <p className="mt-1 text-caption text-fg-muted">{row.caption}</p>
    </li>
  );
}

export default function ScoreCard({ lead, entry }) {
  if (FINISHED_STATUSES.includes(lead.status) || !entry) return null;

  let content;
  if (entry.loading) {
    content = (
      <div role="status" className="space-y-4">
        <span className="sr-only">Loading score…</span>
        <Skeleton className="h-10 w-32" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-1.5 w-full !rounded-full" />
          </div>
        ))}
      </div>
    );
  } else if (!entry.data) {
    content = <p className="text-body text-fg-muted">Score unavailable</p>;
  } else {
    const { score, priority, factors } = entry.data;
    content = (
      <>
        <div className="flex items-center gap-3">
          <span className="text-display text-fg">{score}</span>
          <Badge tone={PRIORITY_TONES[priority] ?? 'neutral'}>{priority}</Badge>
        </div>
        <ul role="list" className="mt-4 space-y-4">
          {buildFactorRows(lead, factors).map((row) => (
            <FactorRow key={row.key} row={row} />
          ))}
        </ul>
      </>
    );
  }

  return (
    <Card>
      <h2 className="mb-3 text-title text-fg">Lead score</h2>
      {content}
    </Card>
  );
}
