import { TOUR_STATUS_TONES } from '../../constants/tourOptions';
import useLeadTours from '../../hooks/useLeadTours';
import { paths } from '../../router';
import { formatDateTime, toLocalDateTimeString } from '../../utils/dateUtils';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { LinkButton } from './ContactAction';
import Icon from './icons';

function TourRow({ tour }) {
  const details = [tour.type, (tour.units ?? []).join(', ')].filter(Boolean).join(' · ');
  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-body font-medium text-fg">{formatDateTime(tour.start)}</p>
        {details && <p className="break-words text-caption text-fg-muted">{details}</p>}
      </div>
      <Badge tone={TOUR_STATUS_TONES[tour.status] ?? 'neutral'}>{tour.status}</Badge>
    </li>
  );
}

function TourGroup({ title, tours }) {
  if (tours.length === 0) return null;
  return (
    <section className="mt-3">
      <h3 className="text-caption font-medium uppercase tracking-wide text-fg-muted">{title}</h3>
      <ul role="list" className="divide-y divide-line">
        {tours.map((tour) => (
          <TourRow key={tour.id} tour={tour} />
        ))}
      </ul>
    </section>
  );
}

export default function ToursCard({ lead }) {
  const { tours, loading, error } = useLeadTours(lead.id);
  const nowKey = toLocalDateTimeString(new Date());
  const upcoming = tours.filter((tour) => tour.start >= nowKey);
  // most recent first
  const past = tours.filter((tour) => tour.start < nowKey).reverse();

  let body;
  if (loading) {
    body = (
      <div role="status" className="mt-3 space-y-3">
        <span className="sr-only">Loading tours…</span>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  } else if (error) {
    body = <p className="mt-3 text-body text-danger-strong">Couldn't load tours.</p>;
  } else if (tours.length === 0) {
    body = <p className="mt-3 text-body text-fg-muted">No tours scheduled yet.</p>;
  } else {
    body = (
      <>
        <TourGroup title="Upcoming" tours={upcoming} />
        <TourGroup title="Past" tours={past} />
      </>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title text-fg">Tours</h2>
        <LinkButton href={paths.tours({ lead: lead.id })} size="sm" icon={<Icon name="plus" />}>
          Schedule tour
        </LinkButton>
      </div>
      {body}
    </Card>
  );
}
