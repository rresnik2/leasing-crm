import { describe, it, expect } from 'vitest';
import {
  buildLeadsCsv, buildSummary, computeKpis, countFollowUps, csvEscape, csvFilename, dueLabel,
  filterFollowUps, offPipelineCounts, pipelineCounts, startOfWeek, tourReminderBody,
  upcomingMoveIns, weekRange, moveInLabel,
} from './todayUtils';

const now = new Date(2026, 9, 22, 10, 0); // Thu Oct 22 2026

describe('weeks', () => {
  it('starts on Monday', () => {
    expect(startOfWeek(now)).toEqual(new Date(2026, 9, 19));
    expect(startOfWeek(new Date(2026, 9, 25, 12))).toEqual(new Date(2026, 9, 19)); // Sunday
  });
  it('builds a Mon-Mon range', () => {
    expect(weekRange(now)).toEqual({ from: '2026-10-19T00:00', to: '2026-10-26T00:00' });
  });
});

describe('buildSummary', () => {
  it('handles plurals and zeros', () => {
    expect(buildSummary(6, 3)).toBe('6 follow-ups due and 3 tours today.');
    expect(buildSummary(1, 1)).toBe('1 follow-up due and 1 tour today.');
    expect(buildSummary(0, 2)).toBe('2 tours today.');
    expect(buildSummary(0, 0)).toBe('Nothing due today.');
  });
});

describe('computeKpis', () => {
  const leads = [
    { id: '1', status: 'New Inquiry', createdAt: new Date(2026, 9, 20).toISOString() },
    { id: '2', status: 'Application Submitted' },
    { id: '3', status: 'Approved' },
    { id: '4', status: 'Leased' },
    { id: '5', status: 'Not Interested' },
  ];
  const tours = [
    { start: '2026-10-22T14:00', status: 'Unconfirmed' },
    { start: '2026-10-23T14:00', status: 'Confirmed' },
    { start: '2026-10-21T14:00', status: 'Canceled' },
  ];
  it('computes values and captions', () => {
    const [active, toursKpi, apps, leased] = computeKpis(leads, tours, now);
    expect(active).toMatchObject({ value: 3, caption: '+1 new this week' });
    expect(toursKpi).toMatchObject({ value: 2, caption: '1 today · 1 unconfirmed' });
    expect(apps).toMatchObject({ value: 1, caption: '1 approved, lease not signed' });
    expect(leased).toMatchObject({ value: 1, caption: '20% of all leads' });
  });
  it('omits captions with nothing to say', () => {
    const kpis = computeKpis([], [], now);
    expect(kpis.map((k) => k.caption)).toEqual([null, null, null, null]);
    expect(kpis.map((k) => k.value)).toEqual([0, 0, 0, 0]);
  });
});

describe('follow-up filtering', () => {
  const items = [
    { followUp: { channel: 'call' } },
    { followUp: { channel: 'text' } },
    { followUp: { channel: 'email' } },
  ];
  it('filters and counts', () => {
    expect(filterFollowUps(items, 'all')).toHaveLength(3);
    expect(filterFollowUps(items, 'calls')).toHaveLength(1);
    expect(filterFollowUps(items, 'messages')).toHaveLength(2);
    expect(countFollowUps(items)).toEqual({ all: 3, calls: 1, messages: 2 });
  });
});

describe('dueLabel', () => {
  const at = (ms) => new Date(now.getTime() - ms);
  it('labels overdue and upcoming', () => {
    expect(dueLabel(at(2 * 86400000 + 5), now)).toEqual({ text: 'Overdue · 2 days', tone: 'danger' });
    expect(dueLabel(at(86400000), now).text).toBe('Overdue · 1 day');
    expect(dueLabel(at(3 * 3600000), now).text).toBe('Overdue · 3 hrs');
    expect(dueLabel(at(3600000), now).text).toBe('Overdue · 1 hr');
    expect(dueLabel(at(5 * 60000), now).text).toBe('Overdue · 5 min');
    expect(dueLabel(at(0), now).text).toBe('Due now');
    expect(dueLabel(new Date(2026, 9, 22, 15, 0), now)).toEqual({ text: 'Due by 3:00 PM', tone: 'warning' });
    expect(dueLabel(new Date(2026, 9, 22), now, true)).toEqual({ text: 'Due today', tone: 'warning' });
  });
});

describe('tourReminderBody', () => {
  it('includes first name and time', () => {
    expect(tourReminderBody('Sarah Mitchell', '2026-10-22T15:30')).toContain('Hi Sarah');
    expect(tourReminderBody('Sarah Mitchell', '2026-10-22T15:30')).toContain('3:30 PM');
  });
});

describe('upcomingMoveIns', () => {
  it('keeps approved/leased within 30 days, soonest first', () => {
    const leads = [
      { id: 'a', name: 'A', status: 'Approved', moveInDate: '2026-11-15' },
      { id: 'b', name: 'B', status: 'Leased', moveInDate: '2026-10-25' },
      { id: 'c', name: 'C', status: 'Approved', moveInDate: '2026-12-25' },
      { id: 'd', name: 'D', status: 'Approved', moveInDate: '2026-10-01' },
      { id: 'e', name: 'E', status: 'Contacted', moveInDate: '2026-10-25' },
      { id: 'f', name: 'F', status: 'Approved', moveInDate: '' },
    ];
    expect(upcomingMoveIns(leads, now).map(({ lead }) => lead.id)).toEqual(['b', 'a']);
    expect(moveInLabel(0)).toBe('today');
    expect(moveInLabel(1)).toBe('tomorrow');
    expect(moveInLabel(3)).toBe('in 3 days');
  });
});

describe('pipeline counts', () => {
  const leads = [{ status: 'New Inquiry' }, { status: 'New Inquiry' }, { status: 'Leased' }, { status: 'Search Hold' }];
  it('counts stages and closed statuses', () => {
    expect(pipelineCounts(leads)[0]).toEqual({ stage: 'New Inquiry', count: 2 });
    expect(pipelineCounts(leads).at(-1)).toEqual({ stage: 'Leased', count: 1 });
    expect(offPipelineCounts(leads)).toEqual([
      { status: 'Not Interested', count: 0 },
      { status: 'Search Hold', count: 1 },
      { status: 'Leased Elsewhere', count: 0 },
    ]);
  });
});

describe('CSV', () => {
  it('escapes values', () => {
    expect(csvEscape('plain')).toBe('plain');
    expect(csvEscape('Smith, Jo')).toBe('"Smith, Jo"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape('a\nb')).toBe('"a\nb"');
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(0)).toBe('0');
    expect(csvEscape('=SUM(A1)')).toBe("'=SUM(A1)");
  });
  it('builds rows with scores', () => {
    const csv = buildLeadsCsv(
      [{ id: '1', name: 'Doe, Jane', email: 'j@x.com', phone: '', status: 'Approved', moveInDate: '2026-11-01', unitType: 'Studio' }],
      { 1: { data: { score: 81, priority: 'High' } } }
    );
    expect(csv.split('\r\n')).toEqual([
      'Name,Email,Phone,Status,Move-in date,Unit type,Score,Priority',
      '"Doe, Jane",j@x.com,,Approved,2026-11-01,Studio,81,High',
    ]);
  });
  it('names the file by date', () => {
    expect(csvFilename(now)).toBe('leads-2026-10-22.csv');
  });
});
