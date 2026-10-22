import { CLOSED_STATUSES, FINISHED_STATUSES, PIPELINE_STAGES } from '../../constants/leadOptions';
import { addDays, daysUntil, parseLocalDate, startOfDay, toLocalDateTimeString } from '../../utils/dateUtils';

const MINUTE = 60000;
const HOUR = 3600000;
const DAY = 86400000;

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const longDateFormat = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

// "Thursday, October 22"
export const formatLongDate = (date) => longDateFormat.format(date);

// "3:00 PM"
export const formatTime = (date) => timeFormat.format(date);

// Monday 00:00 of the week containing `now`
export const startOfWeek = (now) => {
  const today = startOfDay(now);
  return addDays(today, -((today.getDay() + 6) % 7));
};

// local 'YYYY-MM-DDTHH:mm' bounds for useTours
export const todayRange = (now) => {
  const today = startOfDay(now);
  return { from: toLocalDateTimeString(today), to: toLocalDateTimeString(addDays(today, 1)) };
};

export const weekRange = (now) => {
  const monday = startOfWeek(now);
  return { from: toLocalDateTimeString(monday), to: toLocalDateTimeString(addDays(monday, 7)) };
};

// one-line header summary; null while data is still loading
export const buildSummary = (followUpCount, tourCount) => {
  if (followUpCount === 0 && tourCount === 0) return 'Nothing due today.';
  const parts = [];
  if (followUpCount > 0) parts.push(`${plural(followUpCount, 'follow-up')} due`);
  if (tourCount > 0) parts.push(`${plural(tourCount, 'tour')} today`);
  return `${parts.join(' and ')}.`;
};

const isValid = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isActiveLead = (lead) => !FINISHED_STATUSES.includes(lead.status);

// Each KPI: { label, value, caption, tone } where caption is null when there is nothing true to say.
export const computeKpis = (leads, weekTours, now) => {
  const weekStart = startOfWeek(now);
  const todayPrefix = toLocalDateTimeString(startOfDay(now)).slice(0, 10);

  const active = leads.filter(isActiveLead).length;
  const newThisWeek = leads.filter((lead) => {
    const created = isValid(lead.createdAt);
    return created && created >= weekStart && created <= now;
  }).length;

  const liveTours = weekTours.filter((tour) => tour.status !== 'Canceled');
  const toursToday = liveTours.filter((tour) => (tour.start ?? '').startsWith(todayPrefix)).length;
  const unconfirmed = liveTours.filter((tour) => tour.status === 'Unconfirmed').length;
  const tourParts = [];
  if (toursToday > 0) tourParts.push(`${toursToday} today`);
  if (unconfirmed > 0) tourParts.push(`${unconfirmed} unconfirmed`);

  const openApps = leads.filter((lead) => lead.status === 'Application Submitted').length;
  const approved = leads.filter((lead) => lead.status === 'Approved').length;
  const leased = leads.filter((lead) => lead.status === 'Leased').length;

  return [
    {
      label: 'Active leads',
      value: active,
      caption: newThisWeek > 0 ? `+${newThisWeek} new this week` : null,
      tone: newThisWeek > 0 ? 'success' : 'muted',
    },
    {
      label: 'Tours this week',
      value: liveTours.length,
      caption: tourParts.length ? tourParts.join(' · ') : null,
      tone: 'muted',
    },
    {
      label: 'Open applications',
      value: openApps,
      caption: approved > 0 ? `${approved} approved, lease not signed` : null,
      tone: approved > 0 ? 'warning' : 'muted',
    },
    {
      label: 'Leased',
      value: leased,
      caption: leads.length > 0 ? `${leasedPercent(leads)}% of all leads` : null,
      tone: 'muted',
    },
  ];
};

export const leasedPercent = (leads) =>
  leads.length === 0 ? 0 : Math.round((leads.filter((lead) => lead.status === 'Leased').length / leads.length) * 100);

// ---- follow-ups ----

export const FOLLOW_UP_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'calls', label: 'Calls' },
  { value: 'messages', label: 'Messages' },
];

export const filterFollowUps = (items, filter) => {
  if (filter === 'calls') return items.filter((item) => item.followUp.channel === 'call');
  if (filter === 'messages') return items.filter((item) => item.followUp.channel !== 'call');
  return items;
};

export const countFollowUps = (items) => ({
  all: items.length,
  calls: filterFollowUps(items, 'calls').length,
  messages: filterFollowUps(items, 'messages').length,
});

// { text, tone: 'danger' | 'warning' } for a follow-up's due time.
// An estimated due time is only a day, so it can't be overdue by hours.
export const dueLabel = (dueAt, now, estimated = false) => {
  const diff = now - dueAt;
  if (estimated && diff >= 0) return { text: 'Due today', tone: 'warning' };
  if (diff < 0) return { text: `Due by ${formatTime(dueAt)}`, tone: 'warning' };
  if (diff >= DAY) return { text: `Overdue · ${plural(Math.floor(diff / DAY), 'day')}`, tone: 'danger' };
  if (diff >= HOUR) return { text: `Overdue · ${Math.floor(diff / HOUR)} hrs`.replace('1 hrs', '1 hr'), tone: 'danger' };
  if (diff >= MINUTE) return { text: `Overdue · ${Math.floor(diff / MINUTE)} min`, tone: 'danger' };
  return { text: 'Due now', tone: 'danger' };
};

// ---- tours ----

export const tourReminderBody = (leadName, start) => {
  const date = parseLocalDate(start);
  const firstName = (leadName ?? '').trim().split(/\s+/)[0] || 'there';
  const when = date ? ` today at ${formatTime(date)}` : '';
  return `Hi ${firstName}, this is a friendly reminder about your tour${when}. Can you confirm you'll be able to make it?`;
};

// ---- move-ins ----

export const upcomingMoveIns = (leads, now, windowDays = 30) =>
  leads
    .filter((lead) => lead.status === 'Approved' || lead.status === 'Leased')
    .map((lead) => ({ lead, days: daysUntil(lead.moveInDate, now) }))
    .filter(({ days }) => days !== null && days >= 0 && days <= windowDays)
    .sort((a, b) => a.days - b.days || (a.lead.name || '').localeCompare(b.lead.name || ''));

export const moveInLabel = (days) => (days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`);

// ---- pipeline ----

export const pipelineCounts = (leads) =>
  PIPELINE_STAGES.map((stage) => ({ stage, count: leads.filter((lead) => lead.status === stage).length }));

export const offPipelineCounts = (leads) =>
  CLOSED_STATUSES.map((status) => ({ status, count: leads.filter((lead) => lead.status === status).length }));

// ---- CSV export ----

export const CSV_HEADERS = ['Name', 'Email', 'Phone', 'Status', 'Move-in date', 'Unit type', 'Score', 'Priority'];

// Quotes values containing commas, quotes or line breaks; neutralizes spreadsheet formulas.
export const csvEscape = (value) => {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const buildLeadsCsv = (leads, scores = {}) => {
  const rows = leads.map((lead) => {
    const data = scores[lead.id]?.data;
    return [
      lead.name,
      lead.email,
      lead.phone,
      lead.status,
      lead.moveInDate,
      lead.unitType,
      data?.score,
      data?.priority,
    ];
  });
  return [CSV_HEADERS, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
};

export const csvFilename = (now) => `leads-${toLocalDateTimeString(now).slice(0, 10)}.csv`;
