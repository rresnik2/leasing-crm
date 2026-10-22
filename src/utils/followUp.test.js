import { describe, it, expect } from 'vitest';
import {
  CADENCE_DAYS,
  RESPONSE_WINDOW_HOURS,
  cleanActionText,
  getFollowUp,
  getUrgency,
  groupFollowUps,
} from './followUp';
import { addDays } from './dateUtils';

// local noon, Thursday Oct 22 2026
const now = new Date(2026, 9, 22, 12, 0);
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();
const base = { status: 'New Inquiry', moveInDate: '2027-03-01' };

describe('getUrgency', () => {
  it('uses 30 and 60 day boundaries on local dates', () => {
    expect(getUrgency({ moveInDate: '2026-10-22' }, now)).toBe('critical');
    expect(getUrgency({ moveInDate: '2026-11-20' }, now)).toBe('critical'); // 29 days
    expect(getUrgency({ moveInDate: '2026-11-21' }, now)).toBe('high'); // 30 days
    expect(getUrgency({ moveInDate: '2026-12-20' }, now)).toBe('high'); // 59 days
    expect(getUrgency({ moveInDate: '2026-12-21' }, now)).toBe('standard'); // 60 days
  });

  it('treats past move-in dates as critical and blank or invalid as standard', () => {
    expect(getUrgency({ moveInDate: '2026-09-01' }, now)).toBe('critical');
    expect(getUrgency({ moveInDate: '' }, now)).toBe('standard');
    expect(getUrgency({}, now)).toBe('standard');
    expect(getUrgency({ moveInDate: 'soon' }, now)).toBe('standard');
  });
});

describe('getFollowUp', () => {
  it('returns null for finished statuses', () => {
    ['Leased', 'Not Interested', 'Leased Elsewhere'].forEach((status) => {
      expect(getFollowUp({ ...base, status }, now)).toBeNull();
    });
  });

  it('exports the cadence and window tables', () => {
    expect(RESPONSE_WINDOW_HOURS).toEqual({ critical: 1, high: 4, standard: 24 });
    expect(CADENCE_DAYS).toEqual({ critical: 1, high: 2, standard: 4 });
  });

  it('is due one response window after the latest of createdAt and statusChangedAt', () => {
    const lead = { ...base, moveInDate: '2026-11-01', createdAt: hoursAgo(10), statusChangedAt: hoursAgo(3) };
    const followUp = getFollowUp(lead, now);
    expect(followUp.urgency).toBe('critical');
    expect(followUp.windowLabel).toBe('Within 1 hour');
    expect(followUp.dueAt.getTime()).toBe(new Date(hoursAgo(3)).getTime() + 3600000);
  });

  it('ignores invalid anchor dates', () => {
    const lead = { ...base, createdAt: hoursAgo(2), statusChangedAt: 'garbage' };
    expect(getFollowUp(lead, now).dueAt.getTime()).toBe(new Date(hoursAgo(2)).getTime() + 24 * 3600000);
  });

  it('adds the cadence to lastContactedAt when it is not before the anchor', () => {
    const lead = { ...base, moveInDate: '2026-12-01', createdAt: hoursAgo(100), lastContactedAt: hoursAgo(5) };
    const followUp = getFollowUp(lead, now);
    expect(followUp.urgency).toBe('high');
    expect(followUp.dueAt.getTime()).toBe(new Date(hoursAgo(5)).getTime() + 2 * 86400000);
  });

  it('uses the response window when a status change came after the last contact', () => {
    const lead = { ...base, createdAt: hoursAgo(100), lastContactedAt: hoursAgo(50), statusChangedAt: hoursAgo(2) };
    expect(getFollowUp(lead, now).dueAt.getTime()).toBe(new Date(hoursAgo(2)).getTime() + 24 * 3600000);
  });

  it('uses lastContactedAt alone when there is no anchor', () => {
    const lead = { ...base, lastContactedAt: hoursAgo(5) };
    expect(getFollowUp(lead, now).dueAt.getTime()).toBe(new Date(hoursAgo(5)).getTime() + 4 * 86400000);
  });

  it('uses a 30 day cadence for Search Hold', () => {
    const lead = { ...base, status: 'Search Hold', lastContactedAt: hoursAgo(1) };
    expect(getFollowUp(lead, now).dueAt).toEqual(addDays(new Date(hoursAgo(1)), 30));
  });

  it('with no history, is due start of today when urgent and start of tomorrow otherwise', () => {
    const critical = getFollowUp({ ...base, moveInDate: '2026-11-01' }, now);
    expect(critical.dueAt).toEqual(new Date(2026, 9, 22));
    expect(critical.estimated).toBe(true);
    const high = getFollowUp({ ...base, moveInDate: '2026-12-01' }, now);
    expect(high.dueAt).toEqual(new Date(2026, 9, 22));
    const standard = getFollowUp(base, now);
    expect(standard.dueAt).toEqual(new Date(2026, 9, 23));
  });

  it('picks channel and method by status', () => {
    const pick = (lead) => {
      const { channel, method } = getFollowUp(lead, now);
      return [channel, method];
    };
    expect(pick({ ...base, status: 'Tour Scheduled' })).toEqual(['text', 'Text a tour reminder']);
    expect(pick({ ...base, status: 'Tour Completed' })).toEqual(['text', 'Thank-you text, then call']);
    expect(pick({ ...base, status: 'Application Submitted' })).toEqual(['call', 'Call to keep the application moving']);
    expect(pick({ ...base, status: 'Approved' })).toEqual(['call', 'Call to set up lease signing']);
    expect(pick({ ...base, status: 'Search Hold' })).toEqual(['email', 'Monthly check-in email']);
    expect(pick({ ...base, moveInDate: '2026-11-01' })).toEqual(['call', 'Call now']);
    expect(pick({ ...base, status: 'Contacted' })).toEqual(['email', 'Email now, then call']);
  });
});

describe('groupFollowUps', () => {
  it('splits into due now, later today and upcoming, sorted by dueAt', () => {
    const leads = [
      { id: 'later', ...base, createdAt: hoursAgo(1) }, // due in 23h: tomorrow noon
      { id: 'soon', ...base, moveInDate: '2026-12-01', createdAt: hoursAgo(1) }, // high: due in 3h
      { id: 'overdue', ...base, createdAt: hoursAgo(30) },
      { id: 'overdue2', ...base, createdAt: hoursAgo(48) },
      { id: 'done', ...base, status: 'Leased' },
    ];
    const groups = groupFollowUps(leads, now);
    expect(groups.dueNow.map((x) => x.lead.id)).toEqual(['overdue2', 'overdue']);
    expect(groups.laterToday.map((x) => x.lead.id)).toEqual(['soon']);
    expect(groups.upcoming.map((x) => x.lead.id)).toEqual(['later']);
    expect(groups.dueNow[0].followUp.urgency).toBe('standard');
  });
});

describe('cleanActionText', () => {
  it('strips leading emoji, variation selectors and whitespace', () => {
    expect(cleanActionText('🔥 Call immediately')).toBe('Call immediately');
    expect(cleanActionText('☎️ Call today')).toBe('Call today');
    expect(cleanActionText('📞  📧 Email')).toBe('Email');
    expect(cleanActionText('Plain text')).toBe('Plain text');
    expect(cleanActionText('2 follow-ups')).toBe('2 follow-ups');
    expect(cleanActionText(undefined)).toBe('');
  });
});
