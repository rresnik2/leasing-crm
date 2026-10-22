import { FINISHED_STATUSES } from '../constants/leadOptions';
import { addDays, daysUntil, startOfDay } from './dateUtils';

// Mirrors get_optimal_followup in lead-score/main.py so the Today and Lead
// pages agree with the scoring API.

export const RESPONSE_WINDOW_HOURS = { critical: 1, high: 4, standard: 24 };

export const RESPONSE_WINDOW_LABELS = {
  critical: 'Within 1 hour',
  high: 'Within 2–4 hours',
  standard: 'Within 24 hours',
};

// days between touches once a lead has been contacted
export const CADENCE_DAYS = { critical: 1, high: 2, standard: 4 };
export const SEARCH_HOLD_CADENCE_DAYS = 30;

// critical under 30 days to move-in, high under 60; blank or invalid dates are standard
export const getUrgency = (lead, now = new Date()) => {
  const days = daysUntil(lead?.moveInDate, now);
  if (days === null) return 'standard';
  if (days < 30) return 'critical';
  if (days < 60) return 'high';
  return 'standard';
};

const validDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getChannel = (lead, urgency) => {
  switch (lead.status) {
    case 'Tour Scheduled':
      return { channel: 'text', method: 'Text a tour reminder' };
    case 'Tour Completed':
      return { channel: 'text', method: 'Thank-you text, then call' };
    case 'Application Submitted':
      return { channel: 'call', method: 'Call to keep the application moving' };
    case 'Approved':
      return { channel: 'call', method: 'Call to set up lease signing' };
    case 'Search Hold':
      return { channel: 'email', method: 'Monthly check-in email' };
    default:
      return urgency === 'critical'
        ? { channel: 'call', method: 'Call now' }
        : { channel: 'email', method: 'Email now, then call' };
  }
};

// Next follow-up for a lead, or null when the lead is finished.
export const getFollowUp = (lead, now = new Date()) => {
  if (!lead || FINISHED_STATUSES.includes(lead.status)) return null;

  const urgency = getUrgency(lead, now);
  const created = validDate(lead.createdAt);
  const statusChanged = validDate(lead.statusChangedAt);
  const anchor = [created, statusChanged]
    .filter(Boolean)
    .reduce((latest, date) => (!latest || date > latest ? date : latest), null);
  const lastContacted = validDate(lead.lastContactedAt);

  let dueAt;
  // true when there's no history to time from, so dueAt is only the day it's due
  let estimated = false;
  if (lastContacted && (!anchor || lastContacted >= anchor)) {
    const cadence = lead.status === 'Search Hold' ? SEARCH_HOLD_CADENCE_DAYS : CADENCE_DAYS[urgency];
    dueAt = addDays(lastContacted, cadence);
  } else if (anchor) {
    dueAt = new Date(anchor.getTime() + RESPONSE_WINDOW_HOURS[urgency] * 3600000);
  } else {
    // older lead with no history: urgent ones are due today, the rest tomorrow
    const today = startOfDay(now);
    dueAt = urgency === 'standard' ? addDays(today, 1) : today;
    estimated = true;
  }

  return { urgency, windowLabel: RESPONSE_WINDOW_LABELS[urgency], dueAt, estimated, ...getChannel(lead, urgency) };
};

// Splits open leads into overdue-or-due, later today, and after today; each sorted by dueAt.
export const groupFollowUps = (leads, now = new Date()) => {
  const endOfToday = addDays(startOfDay(now), 1);
  const groups = { dueNow: [], laterToday: [], upcoming: [] };

  leads.forEach((lead) => {
    const followUp = getFollowUp(lead, now);
    if (!followUp) return;
    const key = followUp.dueAt <= now ? 'dueNow' : followUp.dueAt < endOfToday ? 'laterToday' : 'upcoming';
    groups[key].push({ lead, followUp });
  });

  Object.values(groups).forEach((group) => group.sort((a, b) => a.followUp.dueAt - b.followUp.dueAt));
  return groups;
};

// Removes the emoji the scoring API puts in front of recommended_action.
export const cleanActionText = (text) =>
  (text ?? '').replace(/^[\p{Extended_Pictographic}︎️‍\s]+/u, '').trim();
