import { useState } from 'react';

import useActivities from '../../hooks/useActivities';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ActivityComposer from './ActivityComposer';
import ActivityTimeline from './ActivityTimeline';
import { ACTIVITY_FILTERS, filterActivities } from './leadPageUtils';

export default function ActivityCard({ lead, composerType, onComposerTypeChange, updateLead }) {
  const { activities, loading, error } = useActivities(lead.id);
  const [filter, setFilter] = useState('all');
  const visible = filterActivities(activities, filter);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-title text-fg">Activity</h2>
        <div role="group" aria-label="Filter activity" className="flex gap-1">
          {ACTIVITY_FILTERS.map((option) => (
            <Button
              key={option.id}
              size="sm"
              variant={option.id === filter ? 'secondary' : 'ghost'}
              aria-pressed={option.id === filter}
              onClick={() => setFilter(option.id)}
              className={option.id === filter ? 'bg-surface-muted' : undefined}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <ActivityComposer lead={lead} type={composerType} onTypeChange={onComposerTypeChange} updateLead={updateLead} />
      </div>

      {lead.notes && (
        <div className="mt-5 rounded-control border border-line bg-surface-muted p-4">
          <h3 className="text-caption font-medium uppercase tracking-wide text-fg-muted">Pinned note</h3>
          <p className="mt-1 whitespace-pre-wrap break-words text-body text-fg">{lead.notes}</p>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-5">
        <ActivityTimeline activities={visible} loading={loading} error={error} filtered={filter !== 'all'} />
      </div>
    </Card>
  );
}
