import { useMemo, useState } from 'react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { useToast } from '../ui/useToast';
import { updateTour } from '../../data/tours';
import useTours from '../../hooks/useTours';
import { paths } from '../../router';
import { smsHref } from '../../utils/contactLinks';
import { addDays, toLocalDateString, toLocalDateTimeString } from '../../utils/dateUtils';
import { LINK_BUTTON_CLASSES, LINK_CLASSES } from './linkStyles';
import { MessageIcon } from './icons';
import { formatDayLabel, formatTimeOfDay, reminderBody } from './tourCalendarUtils';

const LOOKAHEAD_DAYS = 14;

// Unconfirmed tours from now through the next 14 days, soonest first.
function NeedsConfirmationCard({ now, getLead }) {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(null);

  // The query covers whole days so it stays stable as the clock ticks; "from now" is filtered below.
  const today = toLocalDateString(now);
  const from = `${today}T00:00`;
  const to = `${toLocalDateString(addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), LOOKAHEAD_DAYS + 1))}T00:00`;
  const { tours, loading, error } = useTours({ from, to });

  const nowKey = toLocalDateTimeString(now);
  const horizon = toLocalDateTimeString(addDays(now, LOOKAHEAD_DAYS));
  const upcoming = useMemo(
    () =>
      tours
        .filter((tour) => tour.status === 'Unconfirmed' && tour.start >= nowKey && tour.start <= horizon)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [tours, nowKey, horizon]
  );

  const confirm = async (tour) => {
    setConfirming(tour.id);
    try {
      await updateTour(tour.id, { status: 'Confirmed' });
      toast({ tone: 'success', title: 'Tour confirmed' });
    } catch (err) {
      console.error('Error confirming tour: ', err);
      toast({ tone: 'danger', title: "Couldn't confirm tour" });
    } finally {
      setConfirming(null);
    }
  };

  return (
    <Card as="section" padding="none" aria-labelledby="needs-confirmation-title">
      <div className="border-b border-line px-5 py-4">
        <h2 id="needs-confirmation-title" className="text-heading text-fg">
          Needs confirmation
        </h2>
      </div>

      {loading ? (
        <div role="status" className="space-y-3 px-5 py-4">
          <span className="sr-only">Loading tours…</span>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <p role="alert" className="px-5 py-4 text-body text-danger-strong">
          Couldn&apos;t load upcoming tours.
        </p>
      ) : upcoming.length === 0 ? (
        <p className="px-5 py-4 text-body text-fg-muted">Every upcoming tour is confirmed.</p>
      ) : (
        <ul className="divide-y divide-line">
          {upcoming.map((tour) => {
            const phoneLink = smsHref(getLead(tour.leadId)?.phone, reminderBody(tour.leadName, tour.start));
            return (
              <li key={tour.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-label">
                    <a href={paths.lead(tour.leadId)} className={LINK_CLASSES}>
                      {tour.leadName}
                    </a>
                  </p>
                  <p className="text-caption tabular-nums text-fg-muted">
                    {formatDayLabel(tour.start, now)}, {formatTimeOfDay(tour.start)} · {tour.type}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {phoneLink && (
                    <a href={phoneLink} className={LINK_BUTTON_CLASSES} aria-label={`Text reminder to ${tour.leadName}`}>
                      <MessageIcon />
                      Text reminder
                    </a>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={confirming === tour.id}
                    disabled={confirming !== null}
                    aria-label={`Mark confirmed, ${tour.leadName}`}
                    onClick={() => confirm(tour)}
                  >
                    Mark confirmed
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default NeedsConfirmationCard;
