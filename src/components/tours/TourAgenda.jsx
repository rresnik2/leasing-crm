import { useMemo } from 'react';

import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import { TOUR_STATUS_TONES } from '../../constants/tourOptions';
import { paths } from '../../router';
import { formatLongDay, formatTimeOfDay } from './tourCalendarUtils';
import { isActiveTour } from './tourStatus';

function TourAgenda({ tours, loading, onSelectTour }) {
  const groups = useMemo(() => {
    const byDay = new Map();
    tours
      .filter(isActiveTour)
      .slice()
      .sort((a, b) => a.start.localeCompare(b.start))
      .forEach((tour) => {
        const key = tour.start.slice(0, 10);
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key).push(tour);
      });
    return Array.from(byDay, ([day, list]) => ({ day, list }));
  }, [tours]);

  if (loading) {
    return (
      <div role="status" className="space-y-3 p-4">
        <span className="sr-only">Loading tours…</span>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (groups.length === 0) {
    return <p className="px-4 py-8 text-center text-body text-fg-muted">No tours scheduled this week.</p>;
  }

  return (
    <div className="divide-y divide-line">
      {groups.map(({ day, list }) => (
        <section key={day} aria-label={formatLongDay(day)}>
          <h3 className="bg-surface-muted px-4 py-2 text-label text-fg">{formatLongDay(day)}</h3>
          <ul className="divide-y divide-line">
            {list.map((tour) => (
              <li key={tour.id} className="flex items-start gap-3 px-4 py-3">
                <p className="w-20 shrink-0 pt-0.5 text-label tabular-nums text-fg">{formatTimeOfDay(tour.start)}</p>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-label">
                    <a
                      href={paths.lead(tour.leadId)}
                      className="text-brand hover:text-brand-hover hover:underline focus-ring rounded-sm"
                    >
                      {tour.leadName}
                    </a>
                  </p>
                  <p className="text-caption text-fg-muted">
                    {tour.type}
                    {tour.units?.length > 0 && ` · ${tour.units.join(', ')}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                  <Badge tone={TOUR_STATUS_TONES[tour.status] ?? 'neutral'} dot>
                    {tour.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Details for ${tour.leadName} at ${formatTimeOfDay(tour.start)}`}
                    onClick={() => onSelectTour(tour)}
                  >
                    Details
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default TourAgenda;
