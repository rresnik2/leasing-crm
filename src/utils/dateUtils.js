const displayFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

// Format a stored YYYY-MM-DD date for display, e.g. "Nov 15, 2024".
// Built from local date parts: new Date('2024-11-15') is UTC midnight,
// which shows as the previous day in US time zones.
export const formatDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return value || '';

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  // reject impossible dates like 2024-02-31 instead of rolling them over
  if (date.getMonth() !== month - 1) return value;

  return displayFormat.format(date);
};


const pad = (n) => String(n).padStart(2, '0');

// Date -> local 'YYYY-MM-DD' (toISOString would give the UTC date).
export const toLocalDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Date -> local 'YYYY-MM-DDTHH:mm', the format tours store in `start`.
export const toLocalDateTimeString = (date) =>
  `${toLocalDateString(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

// 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm' -> local Date, or null when blank or invalid.
export const parseLocalDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value ?? '');
  if (!match) return null;

  const [year, month, day, hour, minute] = match.slice(1).map((part) => Number(part ?? 0));
  const date = new Date(year, month - 1, day, hour, minute);
  // reject impossible dates like 2024-02-31 instead of rolling them over
  if (date.getMonth() !== month - 1) return null;
  return date;
};

export const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// local calendar-day arithmetic, safe across daylight saving changes
export const addDays = (date, days) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, date.getHours(), date.getMinutes());

// Whole local days from today to a 'YYYY-MM-DD' date (negative if past); null when blank or invalid.
export const daysUntil = (dateString, now = new Date()) => {
  const target = parseLocalDate(dateString);
  if (!target) return null;
  return Math.round((startOfDay(target) - startOfDay(now)) / 86400000);
};

const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

// Local 'YYYY-MM-DDTHH:mm' -> "Thu, Oct 22, 2:00 PM" (separator varies by runtime).
export const formatDateTime = (value) => {
  const date = parseLocalDate(value);
  return date ? dateTimeFormat.format(date) : value || '';
};
