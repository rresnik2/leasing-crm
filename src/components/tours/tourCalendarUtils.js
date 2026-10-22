import { CLOSED_WEEKDAYS, OFFICE_HOURS, TOUR_DURATION_MINUTES } from '../../constants/tourOptions';
import { addDays, parseLocalDate, startOfDay, toLocalDateString } from '../../utils/dateUtils';

export const HOUR_HEIGHT = 56;
export const SLOT_STEP_MINUTES = 30;
// shortest a block is drawn, so a clamped tour stays clickable
const MIN_BLOCK_HEIGHT = 22;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n) => String(n).padStart(2, '0');

// ---------- weeks (Monday to Sunday) ----------

// Monday 00:00 of the week containing `date`
export const startOfWeek = (date) => {
  const day = startOfDay(date);
  const sinceMonday = (day.getDay() + 6) % 7;
  return addDays(day, -sinceMonday);
};

// the week to show for a 'YYYY-MM-DD' query value; falls back to the week of `now`
export const resolveWeekStart = (dateString, now = new Date()) => {
  const parsed = dateString ? parseLocalDate(dateString) : null;
  return startOfWeek(parsed ?? now);
};

export const getWeekDays = (weekStart) => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

// useTours bounds for a week: Monday 00:00 up to (not including) the next Monday 00:00
export const weekRange = (weekStart) => ({
  from: `${toLocalDateString(weekStart)}T00:00`,
  to: `${toLocalDateString(addDays(weekStart, 7))}T00:00`,
});

// "Oct 19 – 25, 2026", "Oct 26 – Nov 1, 2026", "Dec 28, 2026 – Jan 3, 2027"
export const formatWeekLabel = (weekStart) => {
  const first = weekStart;
  const last = addDays(weekStart, 6);
  const firstMonth = MONTHS[first.getMonth()];
  const lastMonth = MONTHS[last.getMonth()];
  if (first.getFullYear() !== last.getFullYear()) {
    return `${firstMonth} ${first.getDate()}, ${first.getFullYear()} – ${lastMonth} ${last.getDate()}, ${last.getFullYear()}`;
  }
  if (first.getMonth() !== last.getMonth()) {
    return `${firstMonth} ${first.getDate()} – ${lastMonth} ${last.getDate()}, ${last.getFullYear()}`;
  }
  return `${firstMonth} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
};

export const weekdayShort = (date) => WEEKDAYS_SHORT[date.getDay()];

// ---------- clock formatting ----------

export const minutesOfDay = (date) => date.getHours() * 60 + date.getMinutes();

// 570 -> "9:30 AM"
export const formatMinutes = (minutes) => {
  const hour24 = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${pad(minute)} ${hour24 < 12 ? 'AM' : 'PM'}`;
};

// 13 -> "1 PM"
export const formatHour = (hour) => `${hour % 12 || 12} ${hour % 24 < 12 ? 'AM' : 'PM'}`;

// local 'YYYY-MM-DDTHH:mm' (or 'HH:mm') -> "1:30 PM"; '' when invalid
export const formatTimeOfDay = (value) => {
  const time = /^\d{2}:\d{2}$/.test(value ?? '') ? value : (value ?? '').slice(11, 16);
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  return match ? formatMinutes(Number(match[1]) * 60 + Number(match[2])) : '';
};

// "Today" / "Tomorrow" / "Fri" (within the coming week) / "Fri, Nov 6"
export const formatDayLabel = (dateOrString, now = new Date()) => {
  const date = typeof dateOrString === 'string' ? parseLocalDate(dateOrString) : dateOrString;
  if (!date) return '';
  const diff = Math.round((startOfDay(date) - startOfDay(now)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  const short = WEEKDAYS_SHORT[date.getDay()];
  if (diff > 1 && diff < 7) return short;
  return `${short}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
};

// "Thursday, Oct 22"
export const formatLongDay = (dateOrString) => {
  const date = typeof dateOrString === 'string' ? parseLocalDate(dateOrString) : dateOrString;
  return date ? `${WEEKDAYS_LONG[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}` : '';
};

// "Thursday, Oct 22 · 1:30 PM – 2:15 PM"
export const formatTourWhen = (tour) => {
  const start = parseLocalDate(tour.start);
  if (!start) return tour.start || '';
  const startMin = minutesOfDay(start);
  const duration = tour.durationMinutes || TOUR_DURATION_MINUTES;
  return `${formatLongDay(start)} · ${formatMinutes(startMin)} – ${formatMinutes((startMin + duration) % 1440)}`;
};

// ---------- closed days ----------

export const isClosedDate = (dateOrString, closedWeekdays = CLOSED_WEEKDAYS) => {
  const date = typeof dateOrString === 'string' ? parseLocalDate(dateOrString) : dateOrString;
  return Boolean(date) && closedWeekdays.includes(date.getDay());
};

// "The office is closed on Sundays"
export const closedMessage = (closedWeekdays = CLOSED_WEEKDAYS) => {
  const names = closedWeekdays.map((day) => `${WEEKDAYS_LONG[day]}s`);
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  return `The office is closed on ${list}`;
};

// ---------- scheduling slots ----------

// start times ('HH:mm') every `step` minutes from opening up to the last start that still ends by closing
export const generateSlots = ({
  office = OFFICE_HOURS,
  step = SLOT_STEP_MINUTES,
  duration = TOUR_DURATION_MINUTES,
} = {}) => {
  const slots = [];
  const lastStart = office.end * 60 - duration;
  for (let minute = office.start * 60; minute <= lastStart; minute += step) {
    slots.push(`${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`);
  }
  return slots;
};

const slotMinutes = (slot) => {
  const [hour, minute] = slot.split(':').map(Number);
  return hour * 60 + minute;
};

// does a slot starting at `slot` ('HH:mm') run into a tour?
export const slotOverlapsTour = (slot, tour, duration = TOUR_DURATION_MINUTES) => {
  const tourStart = parseLocalDate(tour.start);
  if (!tourStart) return false;
  const start = slotMinutes(slot);
  const tourStartMin = minutesOfDay(tourStart);
  const tourEndMin = tourStartMin + (tour.durationMinutes || TOUR_DURATION_MINUTES);
  return start < tourEndMin && tourStartMin < start + duration;
};

// Open slots for a day given that day's tours. Canceled tours don't block a slot, and
// when `now` is given, today's slots that have already started are left out.
// Returns { closed, slots, booked } where booked lists the start times ("10:00 AM") of blocking tours.
export const getSlotAvailability = (dateString, tours = [], options = {}) => {
  const { closedWeekdays = CLOSED_WEEKDAYS, duration = TOUR_DURATION_MINUTES, now } = options;
  if (!parseLocalDate(dateString)) return { closed: false, slots: [], booked: [] };
  if (isClosedDate(dateString, closedWeekdays)) return { closed: true, slots: [], booked: [] };

  const blocking = tours
    .filter((tour) => tour.status !== 'Canceled' && (tour.start || '').slice(0, 10) === dateString)
    .sort((a, b) => a.start.localeCompare(b.start));
  const isToday = now && toLocalDateString(now) === dateString;
  const slots = generateSlots({ ...options, duration }).filter(
    (slot) =>
      !(isToday && slotMinutes(slot) <= minutesOfDay(now)) &&
      !blocking.some((tour) => slotOverlapsTour(slot, tour, duration))
  );
  const booked = [...new Set(blocking.map((tour) => formatTimeOfDay(tour.start)))];
  return { closed: false, slots, booked };
};

// "10:00 AM is booked." / "10:00 AM and 2:30 PM are booked." / "9:00 AM, 10:00 AM and 2:30 PM are booked."
export const bookedCaption = (booked) => {
  if (booked.length === 0) return '';
  const list = booked.length > 1 ? `${booked.slice(0, -1).join(', ')} and ${booked[booked.length - 1]}` : booked[0];
  return `${list} ${booked.length > 1 ? 'are' : 'is'} booked.`;
};

// first day on or after `date` that the office is open
export const nextOpenDay = (date, closedWeekdays = CLOSED_WEEKDAYS) => {
  let day = startOfDay(date);
  for (let i = 0; i < 7 && closedWeekdays.includes(day.getDay()); i += 1) day = addDays(day, 1);
  return day;
};

// Date the form starts on: today, or the next open day when the office is closed today
// or the last slot has already started.
export const defaultScheduleDate = (now = new Date(), options = {}) => {
  const { closedWeekdays = CLOSED_WEEKDAYS } = options;
  const slots = generateSlots(options);
  const lastSlot = slots.length ? slotMinutes(slots[slots.length - 1]) : OFFICE_HOURS.end * 60;
  const today = startOfDay(now);
  const pastLastSlot = minutesOfDay(now) > lastSlot;
  const candidate = closedWeekdays.includes(today.getDay()) || pastLastSlot ? addDays(today, 1) : today;
  return toLocalDateString(nextOpenDay(candidate, closedWeekdays));
};

// ---------- week grid geometry ----------

export const gridHeight = (office = OFFICE_HOURS, hourHeight = HOUR_HEIGHT) =>
  (office.end - office.start) * hourHeight;

// top and height in px for a tour block. Anything outside office hours is clamped to the edges.
export const blockGeometry = (tour, { office = OFFICE_HOURS, hourHeight = HOUR_HEIGHT } = {}) => {
  const start = parseLocalDate(tour.start);
  if (!start) return null;
  const open = office.start * 60;
  const close = office.end * 60;
  const total = (close - open) * (hourHeight / 60);
  const startMin = minutesOfDay(start);
  const endMin = startMin + (tour.durationMinutes || TOUR_DURATION_MINUTES);
  const clamp = (value) => Math.min(Math.max(value, open), close);
  const clampedStart = clamp(startMin);
  const clampedEnd = clamp(endMin);

  const height = Math.max(MIN_BLOCK_HEIGHT, ((clampedEnd - clampedStart) * hourHeight) / 60 - 2);
  const top = Math.min(((clampedStart - open) * hourHeight) / 60 + 1, total - height);
  return { top, height };
};

// y offset of a moment in a day column, or null when outside office hours
export const nowOffset = (now, { office = OFFICE_HOURS, hourHeight = HOUR_HEIGHT } = {}) => {
  const minutes = minutesOfDay(now);
  if (minutes < office.start * 60 || minutes > office.end * 60) return null;
  return ((minutes - office.start * 60) * hourHeight) / 60;
};

// Side-by-side columns for overlapping tours in one day.
// Returns [{ tour, column, columns }]: `columns` is the width of the overlap group the tour belongs to.
export const layoutOverlaps = (tours) => {
  const items = tours
    .map((tour) => {
      const start = parseLocalDate(tour.start);
      if (!start) return null;
      const startMin = minutesOfDay(start);
      return { tour, start: startMin, end: startMin + Math.max(1, tour.durationMinutes || TOUR_DURATION_MINUTES) };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const result = [];
  let group = [];
  let groupEnd = -Infinity;
  let columnEnds = [];

  const flush = () => {
    group.forEach((entry) => result.push({ tour: entry.tour, column: entry.column, columns: columnEnds.length }));
    group = [];
    columnEnds = [];
  };

  items.forEach((item) => {
    if (group.length > 0 && item.start >= groupEnd) flush();
    let column = columnEnds.findIndex((end) => end <= item.start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.end);
    } else {
      columnEnds[column] = item.end;
    }
    group.push({ tour: item.tour, column });
    groupEnd = Math.max(groupEnd, item.end);
  });
  flush();
  return result;
};

// ---------- text messages ----------

export const firstNameOf = (name) => (name ?? '').trim().split(/\s+/)[0] || 'there';

export const reminderBody = (leadName, start) => {
  const date = parseLocalDate(start);
  return `Hi ${firstNameOf(leadName)}, a reminder about your tour on ${formatLongDay(date)} at ${formatTimeOfDay(start)}. Can you confirm you're still able to make it?`;
};

export const confirmationBody = (leadName, start) => {
  const date = parseLocalDate(start);
  return `Hi ${firstNameOf(leadName)}, your tour is booked for ${formatLongDay(date)} at ${formatTimeOfDay(start)}. Reply here if you need to change it. See you then!`;
};
