import { addDays, daysUntil, formatDate, parseLocalDate, startOfDay, toLocalDateString } from '../../utils/dateUtils';

// Pure helpers for the Lead workspace: labels and derived rows, no React.

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const monthDayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const monthDayYearFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const dueDayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();

export const getInitials = (name) => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
};

export const getFirstName = (name) => (name ?? '').trim().split(/\s+/)[0] || '';

// ISO timestamp -> "Today, 10:52 AM", "Yesterday, 4:10 PM", "Oct 19, 2:05 PM" (year added when not this year)
export const formatActivityTime = (iso, now = new Date()) => {
  const date = toDate(iso);
  if (!date) return '';
  const time = timeFormat.format(date);
  if (sameDay(date, now)) return `Today, ${time}`;
  if (sameDay(date, addDays(now, -1))) return `Yesterday, ${time}`;
  const day = (date.getFullYear() === now.getFullYear() ? monthDayFormat : monthDayYearFormat).format(date);
  return `${day}, ${time}`;
};

// ISO createdAt -> "Oct 3, 2026", or '' when missing or invalid
export const formatAddedDate = (iso) => {
  const date = toDate(iso);
  return date ? formatDate(toLocalDateString(date)) : '';
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Badge for a follow-up's due time: { tone, label }
export const getDueBadge = (followUp, now = new Date()) => {
  const { dueAt, estimated } = followUp;
  const time = timeFormat.format(dueAt);
  // an estimated due time is only a day, so it can't be overdue by hours
  if (estimated && dueAt <= now) return { tone: 'warning', label: 'Due today' };
  if (dueAt <= now) {
    if (sameDay(dueAt, now)) return { tone: 'danger', label: `Overdue since ${time}` };
    const days = Math.round((startOfDay(now) - startOfDay(dueAt)) / 86400000);
    return { tone: 'danger', label: `Overdue · ${plural(days, 'day')}` };
  }
  if (sameDay(dueAt, now)) return { tone: 'warning', label: `Due by ${time}` };
  return { tone: 'neutral', label: `Due ${dueDayFormat.format(dueAt)}` };
};

// Task due date -> { label, tone: 'danger' | 'warning' | 'muted' }, or null without a date
export const getTaskDueLabel = (dueDate, now = new Date()) => {
  const days = daysUntil(dueDate, now);
  if (days === null) return null;
  const formatted = monthDayFormat.format(parseLocalDate(dueDate));
  if (days < 0) return { label: `Overdue · ${formatted}`, tone: 'danger' };
  if (days === 0) return { label: 'Due today', tone: 'warning' };
  return { label: `Due ${formatted}`, tone: 'muted' };
};

// "in 24 days", "today", "3 days ago"
export const describeDaysUntil = (days) => {
  if (days === null) return '';
  if (days === 0) return 'today';
  return days > 0 ? `in ${plural(days, 'day')}` : `${plural(-days, 'day')} ago`;
};

const joinList = (items) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

export const FACTOR_MAX = { urgency: 35, engagement: 30, completeness: 6, demand: 15 };

const urgencyCaption = (moveInDate, now) => {
  const days = daysUntil(moveInDate, now);
  if (days === null) return 'No move-in date';
  if (days < 0) return 'Move-in date passed';
  if (days === 0) return 'Moving in today';
  return `Moving in ${plural(days, 'day')}`;
};

const completenessCaption = (lead) => {
  const missing = [
    !lead.notes && 'notes',
    !lead.employer && 'employer',
    !lead.moveReason && 'move reason',
  ].filter(Boolean);
  if (missing.length === 0) return 'Notes, employer and move reason on file';
  return `Missing ${joinList(missing)}`;
};

// The four score factors as display rows: { key, label, value, max, percent, caption }
export const buildFactorRows = (lead, factors, now = new Date()) => {
  const captions = {
    urgency: urgencyCaption(lead.moveInDate, now),
    engagement: lead.status || 'No status',
    completeness: completenessCaption(lead),
    demand: lead.unitType || 'No unit type',
  };
  const labels = {
    urgency: 'Move-in urgency',
    engagement: 'Pipeline stage',
    completeness: 'Profile completeness',
    demand: 'Unit demand',
  };
  return Object.keys(FACTOR_MAX).map((key) => {
    const max = FACTOR_MAX[key];
    const value = Number(factors?.[key]) || 0;
    return {
      key,
      label: labels[key],
      value,
      max,
      percent: Math.max(0, Math.min(100, Math.round((value / max) * 100))),
      caption: captions[key],
    };
  });
};

// Timeline filter groups; types outside every group (status, tour, inquiry) only show under All
export const ACTIVITY_FILTERS = [
  { id: 'all', label: 'All', types: null },
  { id: 'notes', label: 'Notes', types: ['note'] },
  { id: 'calls', label: 'Calls', types: ['call'] },
  { id: 'messages', label: 'Messages', types: ['email', 'text'] },
];

export const filterActivities = (activities, filterId) => {
  const filter = ACTIVITY_FILTERS.find((f) => f.id === filterId);
  if (!filter?.types) return activities;
  return activities.filter((activity) => filter.types.includes(activity.type));
};

// Composer types: log types the agent can add by hand
export const COMPOSER_TYPES = [
  { id: 'note', label: 'Note', fieldLabel: 'Note', saveLabel: 'Save note', placeholder: 'Add a note about this lead…' },
  { id: 'call', label: 'Log call', fieldLabel: 'Call notes', saveLabel: 'Log call', placeholder: 'What did you discuss?' },
  { id: 'email', label: 'Email', fieldLabel: 'Email summary', saveLabel: 'Log email', placeholder: 'What did you send or receive?' },
  { id: 'text', label: 'Text', fieldLabel: 'Text summary', saveLabel: 'Log text', placeholder: 'What did you text about?' },
];
