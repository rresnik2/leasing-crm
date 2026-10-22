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
