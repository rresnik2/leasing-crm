import { useMemo, useRef, useState } from 'react';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import IconButton from '../components/ui/IconButton';
import NeedsConfirmationCard from '../components/tours/NeedsConfirmationCard';
import ScheduleTourForm from '../components/tours/ScheduleTourForm';
import TourAgenda from '../components/tours/TourAgenda';
import TourDetailsDialog from '../components/tours/TourDetailsDialog';
import WeekCalendar from '../components/tours/WeekCalendar';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/tours/icons';
import {
  formatWeekLabel,
  resolveWeekStart,
  weekRange,
} from '../components/tours/tourCalendarUtils';
import { isActiveTour } from '../components/tours/tourStatus';
import useNow from '../components/tours/useNow';
import useLeads from '../hooks/useLeads';
import useTours from '../hooks/useTours';
import { navigate, paths } from '../router';
import { addDays, toLocalDateString } from '../utils/dateUtils';
import { cn } from '../components/ui/cn';

const VIEWS = [
  { value: 'week', label: 'Week' },
  { value: 'list', label: 'List' },
];

// query is { lead?, date? }: lead preselects the form, date picks the week
function ToursPage({ query }) {
  const now = useNow();
  const { leads, getLead } = useLeads();
  const [view, setView] = useState('week');
  const [selectedId, setSelectedId] = useState(null);
  const leadFieldRef = useRef(null);

  const leadParam = query?.lead;
  const weekStart = useMemo(
    () => resolveWeekStart(query?.date, new Date()),
    // the week only changes with the date param (or when the page is opened on a new day)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query?.date, toLocalDateString(now)]
  );
  const { from, to } = useMemo(() => weekRange(weekStart), [weekStart]);
  const { tours, loading, error } = useTours({ from, to });

  const activeTours = useMemo(() => tours.filter(isActiveTour), [tours]);
  const unconfirmedCount = activeTours.filter((tour) => tour.status === 'Unconfirmed').length;
  const selectedTour = tours.find((tour) => tour.id === selectedId) ?? null;

  const goToWeek = (date) => navigate(paths.tours({ date: date ? toLocalDateString(date) : undefined, lead: leadParam }));

  const focusForm = () => {
    const field = leadFieldRef.current;
    if (!field) return;
    if (typeof field.scrollIntoView === 'function') field.scrollIntoView({ block: 'center' });
    field.focus({ preventScroll: true });
  };

  // after scheduling, follow the tour to its week if it is not on screen
  const handleScheduled = (dateString) => {
    if (dateString < from.slice(0, 10) || dateString >= to.slice(0, 10)) {
      navigate(paths.tours({ date: dateString, lead: leadParam }));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-fg">Tours</h1>
          <p className="mt-1 text-body text-fg-muted" aria-live="polite">
            {loading
              ? 'Loading this week…'
              : `${activeTours.length} ${activeTours.length === 1 ? 'tour' : 'tours'} this week · ${unconfirmedCount} waiting on confirmation`}
          </p>
        </div>
        <Button leadingIcon={<CalendarIcon />} onClick={focusForm}>
          Schedule tour
        </Button>
      </header>

      <div className="flex flex-wrap items-start gap-6">
        <Card as="section" padding="none" aria-labelledby="week-title" className="min-w-0 flex-[999_1_600px] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <IconButton label="Previous week" variant="secondary" onClick={() => goToWeek(addDays(weekStart, -7))}>
                <ChevronLeftIcon />
              </IconButton>
              <Button variant="secondary" onClick={() => goToWeek(null)}>
                Today
              </Button>
              <IconButton label="Next week" variant="secondary" onClick={() => goToWeek(addDays(weekStart, 7))}>
                <ChevronRightIcon />
              </IconButton>
              <h2 id="week-title" className="ml-2 text-title tabular-nums text-fg" aria-live="polite">
                {formatWeekLabel(weekStart)}
              </h2>
            </div>

            <div role="group" aria-label="View" className="inline-flex gap-0.5 rounded-control bg-surface-muted p-[3px] ring-1 ring-inset ring-line">
              {VIEWS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={view === value}
                  onClick={() => setView(value)}
                  className={cn(
                    'h-8 rounded-control px-3 text-caption font-medium transition-colors duration-fast ease-standard focus-ring',
                    view === value ? 'bg-surface text-fg shadow-card' : 'text-fg-muted hover:text-fg'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="border-b border-line bg-danger-subtle px-4 py-2 text-body text-danger-strong">
              Couldn&apos;t load this week&apos;s tours. Try reloading the page.
            </p>
          )}

          {view === 'week' ? (
            <>
              <WeekCalendar
                weekStart={weekStart}
                tours={tours}
                loading={loading}
                now={now}
                onSelectTour={(tour) => setSelectedId(tour.id)}
              />
              {!loading && !error && activeTours.length === 0 && (
                <p className="border-t border-line px-4 py-3 text-center text-body text-fg-muted">
                  No tours scheduled this week.
                </p>
              )}
            </>
          ) : (
            <TourAgenda tours={tours} loading={loading} onSelectTour={(tour) => setSelectedId(tour.id)} />
          )}
        </Card>

        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-5">
          <ScheduleTourForm
            key={leadParam ?? ''}
            leads={leads}
            defaultLeadId={leadParam}
            now={now}
            leadRef={leadFieldRef}
            onScheduled={handleScheduled}
          />
          <NeedsConfirmationCard now={now} getLead={getLead} />
        </div>
      </div>

      <TourDetailsDialog
        key={selectedTour?.id ?? 'none'}
        tour={selectedTour}
        lead={selectedTour ? getLead(selectedTour.leadId) : null}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

export default ToursPage;
