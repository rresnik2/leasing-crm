import { describe, expect, it } from 'vitest';

import {
  buildFactorRows,
  describeDaysUntil,
  filterActivities,
  formatActivityTime,
  getDueBadge,
  getFirstName,
  getInitials,
  getTaskDueLabel,
} from './leadPageUtils';

const NOW = new Date(2026, 9, 22, 12, 0); // Thu Oct 22, 2026 noon

describe('names', () => {
  it('builds initials and first names', () => {
    expect(getInitials('Sarah Mitchell')).toBe('SM');
    expect(getInitials('  cher ')).toBe('C');
    expect(getInitials('')).toBe('?');
    expect(getFirstName('Sarah  Mitchell')).toBe('Sarah');
    expect(getFirstName(undefined)).toBe('');
  });
});

describe('formatActivityTime', () => {
  it('labels today, yesterday and older dates', () => {
    expect(formatActivityTime(new Date(2026, 9, 22, 10, 52).toISOString(), NOW)).toBe('Today, 10:52 AM');
    expect(formatActivityTime(new Date(2026, 9, 21, 16, 10).toISOString(), NOW)).toBe('Yesterday, 4:10 PM');
    expect(formatActivityTime(new Date(2026, 9, 19, 14, 5).toISOString(), NOW)).toBe('Oct 19, 2:05 PM');
  });
  it('adds the year for other years and tolerates bad input', () => {
    expect(formatActivityTime(new Date(2025, 11, 30, 9, 0).toISOString(), NOW)).toBe('Dec 30, 2025, 9:00 AM');
    expect(formatActivityTime('nope', NOW)).toBe('');
  });
});

describe('getDueBadge', () => {
  it('marks overdue, due later today and later', () => {
    expect(getDueBadge({ dueAt: new Date(2026, 9, 20, 9, 0) }, NOW)).toEqual({ tone: 'danger', label: 'Overdue · 2 days' });
    expect(getDueBadge({ dueAt: new Date(2026, 9, 21, 9, 0) }, NOW).label).toBe('Overdue · 1 day');
    expect(getDueBadge({ dueAt: new Date(2026, 9, 22, 9, 0) }, NOW)).toEqual({ tone: 'danger', label: 'Overdue since 9:00 AM' });
    expect(getDueBadge({ dueAt: new Date(2026, 9, 22), estimated: true }, NOW)).toEqual({ tone: 'warning', label: 'Due today' });
    expect(getDueBadge({ dueAt: new Date(2026, 9, 22, 15, 0) }, NOW)).toEqual({ tone: 'warning', label: 'Due by 3:00 PM' });
    expect(getDueBadge({ dueAt: new Date(2026, 9, 24, 9, 0) }, NOW)).toEqual({ tone: 'neutral', label: 'Due Sat, Oct 24' });
  });
});

describe('getTaskDueLabel', () => {
  it('handles blank, overdue, today and future', () => {
    expect(getTaskDueLabel('', NOW)).toBeNull();
    expect(getTaskDueLabel('2026-10-20', NOW)).toEqual({ label: 'Overdue · Oct 20', tone: 'danger' });
    expect(getTaskDueLabel('2026-10-22', NOW)).toEqual({ label: 'Due today', tone: 'warning' });
    expect(getTaskDueLabel('2026-10-25', NOW)).toEqual({ label: 'Due Oct 25', tone: 'muted' });
  });
});

describe('describeDaysUntil', () => {
  it('reads naturally', () => {
    expect(describeDaysUntil(24)).toBe('in 24 days');
    expect(describeDaysUntil(1)).toBe('in 1 day');
    expect(describeDaysUntil(0)).toBe('today');
    expect(describeDaysUntil(-3)).toBe('3 days ago');
    expect(describeDaysUntil(null)).toBe('');
  });
});

describe('buildFactorRows', () => {
  const factors = { urgency: 28, engagement: 15, completeness: 3, demand: 15 };
  it('builds four rows with captions', () => {
    const lead = { moveInDate: '2026-11-15', status: 'Contacted', unitType: '1 Bedroom', notes: 'x', employer: 'Acme' };
    const rows = buildFactorRows(lead, factors, NOW);
    expect(rows.map((r) => r.label)).toEqual(['Move-in urgency', 'Pipeline stage', 'Profile completeness', 'Unit demand']);
    expect(rows[0]).toMatchObject({ value: 28, max: 35, percent: 80, caption: 'Moving in 24 days' });
    expect(rows[1].caption).toBe('Contacted');
    expect(rows[2].caption).toBe('Missing move reason');
    expect(rows[3]).toMatchObject({ caption: '1 Bedroom', percent: 100 });
  });
  it('covers passed dates, complete profiles and clamps', () => {
    const lead = { moveInDate: '2026-10-01', notes: 'a', employer: 'b', moveReason: 'c' };
    const rows = buildFactorRows(lead, { urgency: 99 }, NOW);
    expect(rows[0]).toMatchObject({ caption: 'Move-in date passed', percent: 100 });
    expect(rows[2].caption).toBe('Notes, employer and move reason on file');
    expect(rows[3].caption).toBe('No unit type');
    expect(buildFactorRows({}, {}, NOW)[2].caption).toBe('Missing notes, employer and move reason');
  });
});

describe('filterActivities', () => {
  const items = ['note', 'call', 'email', 'text', 'status'].map((type) => ({ type }));
  it('groups types', () => {
    expect(filterActivities(items, 'all')).toHaveLength(5);
    expect(filterActivities(items, 'notes')).toEqual([{ type: 'note' }]);
    expect(filterActivities(items, 'messages').map((i) => i.type)).toEqual(['email', 'text']);
  });
});
