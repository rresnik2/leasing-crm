import { paths } from '../../router';
import { formatDate } from '../../utils/dateUtils';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { moveInLabel } from './todayUtils';

function MoveInsCard({ moveIns, loading }) {
  return (
    <Card as="section" padding="none" aria-labelledby="move-ins-title" className="overflow-hidden">
      <div className="px-5 py-4">
        <h2 id="move-ins-title" className="text-heading text-fg">Upcoming move-ins</h2>
        <p className="mt-0.5 text-caption text-fg-muted">Approved and leased, next 30 days.</p>
      </div>
      {loading ? (
        <div role="status" className="space-y-3 border-t border-line px-5 py-4">
          <span className="sr-only">Loading move-ins…</span>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : moveIns.length === 0 ? (
        <p className="border-t border-line px-5 py-4 text-body text-fg-muted">No move-ins in the next 30 days.</p>
      ) : (
        <ul>
          {moveIns.map(({ lead, days }) => (
            <li key={lead.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line px-5 py-3">
              <div className="min-w-0">
                <a href={paths.lead(lead.id)} className="rounded-control text-label text-fg hover:text-brand focus-ring">
                  {lead.name}
                </a>
                <p className="text-caption text-fg-muted">
                  {formatDate(lead.moveInDate)} · {moveInLabel(days)}
                  {lead.unitType ? ` · ${lead.unitType}` : ''}
                </p>
              </div>
              {lead.status === 'Approved' ? (
                <Badge tone="warning" size="sm">Lease not signed</Badge>
              ) : (
                <Badge tone="success" size="sm">Leased</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default MoveInsCard;
