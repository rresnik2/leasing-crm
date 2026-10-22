import { ACTIVITY_LABELS } from '../../constants/activityOptions';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import StatusBadge from '../ui/StatusBadge';
import Icon from './icons';
import { formatActivityTime } from './leadPageUtils';

function TimelineSkeleton() {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">Loading activity…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 shrink-0 !rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityItem({ activity, now }) {
  const label = ACTIVITY_LABELS[activity.type] ?? activity.type;
  const time = formatActivityTime(activity.createdAt, now);
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg-muted"
      >
        <Icon name={activity.type} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-body">
          <span className="font-medium text-fg">{label}</span>
          {activity.durationMinutes > 0 && <span className="text-fg-muted">{activity.durationMinutes} min</span>}
          <span className="text-caption text-fg-subtle">{time}</span>
        </p>
        {activity.type === 'status' && (activity.from || activity.to) && (
          <p className="mt-1 flex flex-wrap items-center gap-2">
            {activity.from && <StatusBadge status={activity.from} />}
            <span aria-label="to" className="text-fg-subtle">→</span>
            {activity.to && <StatusBadge status={activity.to} />}
          </p>
        )}
        {activity.body && <p className="mt-0.5 whitespace-pre-wrap break-words text-body text-fg-muted">{activity.body}</p>}
      </div>
    </li>
  );
}

export default function ActivityTimeline({ activities, loading, error, filtered }) {
  if (loading) return <TimelineSkeleton />;
  if (error) return <p className="text-body text-danger-strong">Couldn't load activity. Try refreshing the page.</p>;
  if (activities.length === 0) {
    return (
      <EmptyState
        className="py-8"
        icon={<Icon name="note" className="h-6 w-6" />}
        title="No activity yet"
        description={filtered ? 'Nothing matches this filter.' : 'Log a call, note or message to start the timeline.'}
      />
    );
  }
  const now = new Date();
  return (
    <ol role="list" className="space-y-4">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} now={now} />
      ))}
    </ol>
  );
}
