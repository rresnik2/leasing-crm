import { paths } from '../../router';
import { TOUR_STATUS_TONES } from '../../constants/tourOptions';
import { updateTour } from '../../data/tours';
import { parseLocalDate } from '../../utils/dateUtils';
import { smsHref } from '../../utils/contactLinks';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { useToast } from '../ui/useToast';
import { formatTime, tourReminderBody } from './todayUtils';

function TourRow({ tour, lead }) {
  const { toast } = useToast();
  const start = parseLocalDate(tour.start);
  const sms = tour.status === 'Unconfirmed' ? smsHref(lead?.phone, tourReminderBody(tour.leadName, tour.start)) : null;

  const confirm = async () => {
    try {
      await updateTour(tour.id, { status: 'Confirmed' });
      toast({ tone: 'success', title: `Tour confirmed for ${tour.leadName}` });
    } catch (error) {
      console.error('Error confirming tour:', error);
      toast({ tone: 'danger', title: "Couldn't confirm tour" });
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-5 py-3">
      <span className="w-20 shrink-0 text-label tabular-nums text-fg">{start ? formatTime(start) : tour.start}</span>
      <div className="min-w-0 flex-[1_1_160px]">
        <a href={paths.lead(tour.leadId)} className="rounded-control text-label text-fg hover:text-brand focus-ring">
          {tour.leadName}
        </a>
        <p className="text-caption text-fg-muted">
          {[tour.type, (tour.units ?? []).join(', ')].filter(Boolean).join(' · ')}
        </p>
      </div>
      <Badge tone={TOUR_STATUS_TONES[tour.status] ?? 'neutral'} size="sm">{tour.status}</Badge>
      {tour.status === 'Unconfirmed' && (
        <div className="flex flex-wrap items-center gap-2">
          {sms && (
            <a
              href={sms}
              className="inline-flex h-8 items-center rounded-control px-3 text-caption font-medium text-brand-strong hover:bg-surface-muted focus-ring"
            >
              Text reminder
            </a>
          )}
          <Button variant="secondary" size="sm" onClick={confirm}>Mark confirmed</Button>
        </div>
      )}
    </li>
  );
}

function TodayToursCard({ tours, loading, getLead }) {
  return (
    <Card as="section" padding="none" aria-labelledby="today-tours-title" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 id="today-tours-title" className="text-heading text-fg">Today&apos;s tours</h2>
        <a href={paths.tours()} className="rounded-control text-label text-brand-strong hover:underline focus-ring">
          Open calendar
        </a>
      </div>
      {loading ? (
        <div role="status" className="space-y-3 border-t border-line px-5 py-4">
          <span className="sr-only">Loading tours…</span>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : tours.length === 0 ? (
        <p className="border-t border-line px-5 py-4 text-body text-fg-muted">
          No tours today.{' '}
          <a href={paths.tours()} className="rounded-control text-brand-strong hover:underline focus-ring">
            Schedule a tour
          </a>
        </p>
      ) : (
        <ul>
          {tours.map((tour) => (
            <TourRow key={tour.id} tour={tour} lead={getLead?.(tour.leadId)} />
          ))}
        </ul>
      )}
    </Card>
  );
}

export default TodayToursCard;
