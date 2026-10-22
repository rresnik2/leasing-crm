import { useMemo } from 'react';

import Skeleton from '../ui/Skeleton';
import { cn } from '../ui/cn';
import { CLOSED_WEEKDAYS, OFFICE_HOURS } from '../../constants/tourOptions';
import { toLocalDateString } from '../../utils/dateUtils';
import {
  HOUR_HEIGHT,
  blockGeometry,
  formatHour,
  formatTimeOfDay,
  formatMinutes,
  getWeekDays,
  gridHeight,
  layoutOverlaps,
  minutesOfDay,
  nowOffset,
  weekdayShort,
} from './tourCalendarUtils';
import { BLOCK_LABELS, BLOCK_STYLES, isActiveTour } from './tourStatus';

const HOURS = Array.from({ length: OFFICE_HOURS.end - OFFICE_HOURS.start }, (_, i) => OFFICE_HOURS.start + i);

const HOUR_LINES =
  'bg-[repeating-linear-gradient(to_bottom,rgb(var(--color-line))_0,rgb(var(--color-line))_1px,transparent_1px,transparent_56px)]';
const HATCH =
  'bg-[repeating-linear-gradient(135deg,rgb(var(--color-surface-muted))_0,rgb(var(--color-surface-muted))_8px,rgb(var(--color-line)/0.7)_8px,rgb(var(--color-line)/0.7)_16px)]';

// where the loading placeholders sit in each open column (px from the top)
const SKELETON_TOPS = [[57, 253], [113, 309], [169], [57, 225], [141, 337], [85]];

function LegendSwatch({ className, children }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={cn('h-2.5 w-3.5 rounded-sm', className)} />
      {children}
    </span>
  );
}

function TourBlock({ tour, column, columns, onSelect }) {
  const geometry = blockGeometry(tour);
  if (!geometry) return null;
  const label = BLOCK_LABELS[tour.status];
  const time = formatTimeOfDay(tour.start);
  const width = 100 / columns;

  return (
    <button
      type="button"
      onClick={() => onSelect(tour)}
      aria-label={`${time}, ${tour.leadName}, ${tour.status}`}
      className={cn(
        'absolute overflow-hidden rounded-control px-2 py-0.5 text-left transition-shadow duration-fast focus-ring',
        BLOCK_STYLES[tour.status] ?? BLOCK_STYLES.Confirmed
      )}
      style={{
        top: geometry.top,
        height: geometry.height,
        left: `calc(${column * width}% + 4px)`,
        width: `calc(${width}% - 8px)`,
      }}
    >
      <span className="block truncate text-caption tabular-nums">
        {time}
        {label ? ` · ${label}` : ''}
      </span>
      <span className="block truncate text-caption font-semibold">{tour.leadName}</span>
    </button>
  );
}

function WeekCalendar({ weekStart, tours, loading, now, onSelectTour }) {
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const todayKey = toLocalDateString(now);
  const height = gridHeight();

  const layoutByDay = useMemo(() => {
    const byDay = {};
    tours.filter(isActiveTour).forEach((tour) => {
      const key = (tour.start || '').slice(0, 10);
      (byDay[key] ??= []).push(tour);
    });
    return Object.fromEntries(Object.entries(byDay).map(([key, list]) => [key, layoutOverlaps(list)]));
  }, [tours]);

  const nowLineTop = nowOffset(now);

  return (
    <>
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-line px-4 py-2.5 text-caption text-fg-muted">
        <LegendSwatch className="border border-line-strong bg-brand-subtle">Confirmed</LegendSwatch>
        <LegendSwatch className="border border-dashed border-warning bg-warning-subtle">Unconfirmed</LegendSwatch>
        <LegendSwatch className="border border-line bg-surface-muted">Completed</LegendSwatch>
        <LegendSwatch className="border border-danger bg-danger-subtle">No-show</LegendSwatch>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-line">
            <div />
            {days.map((day) => {
              const isToday = toLocalDateString(day) === todayKey;
              return (
                <div
                  key={day.getTime()}
                  aria-current={isToday ? 'date' : undefined}
                  className={cn('border-l border-line px-2 py-2.5 text-center', isToday && 'bg-brand-subtle/40')}
                >
                  <p className={cn('text-caption', isToday ? 'font-semibold text-brand-strong' : 'text-fg-subtle')}>
                    {weekdayShort(day)}
                  </p>
                  <p
                    className={cn(
                      'mx-auto mt-0.5 flex items-center justify-center tabular-nums',
                      isToday
                        ? 'h-7 w-7 rounded-full bg-brand text-label text-fg-inverse'
                        : 'text-title text-fg-muted'
                    )}
                  >
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="relative grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
            <div aria-hidden="true" className="relative" style={{ height }}>
              {HOURS.map((hour, i) => (
                <span
                  key={hour}
                  className="absolute right-2 text-caption tabular-nums text-fg-subtle"
                  style={{ top: i * HOUR_HEIGHT + 4 }}
                >
                  {formatHour(hour)}
                </span>
              ))}
            </div>

            {days.map((day, dayIndex) => {
              const key = toLocalDateString(day);
              const isToday = key === todayKey;
              const closed = CLOSED_WEEKDAYS.includes(day.getDay());
              const layout = layoutByDay[key] ?? [];
              return (
                <div
                  key={key}
                  className={cn(
                    'relative border-l border-line',
                    closed ? HATCH : HOUR_LINES,
                    isToday && !closed && 'bg-brand-subtle/20'
                  )}
                  style={{ height }}
                >
                  {closed && <p className="px-2 py-3 text-center text-caption text-fg-muted">Office closed</p>}

                  {loading &&
                    !closed &&
                    (SKELETON_TOPS[dayIndex % SKELETON_TOPS.length] ?? []).map((top) => (
                      <Skeleton key={top} className="absolute left-1 right-1 h-10" style={{ top }} />
                    ))}

                  {layout.map(({ tour, column, columns }) => (
                    <TourBlock key={tour.id} tour={tour} column={column} columns={columns} onSelect={onSelectTour} />
                  ))}

                  {isToday && nowLineTop !== null && !closed && (
                    <div
                      role="img"
                      aria-label={`Now, ${formatMinutes(minutesOfDay(now))}`}
                      className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-danger"
                      style={{ top: nowLineTop }}
                    >
                      <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-danger" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading && (
        <div role="status" className="sr-only">
          Loading tours…
        </div>
      )}
    </>
  );
}

export default WeekCalendar;
