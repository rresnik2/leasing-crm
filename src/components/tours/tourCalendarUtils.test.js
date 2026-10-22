import { describe, expect, it } from 'vitest';

import { toLocalDateString } from '../../utils/dateUtils';
import {
  blockGeometry,
  bookedCaption,
  closedMessage,
  confirmationBody,
  defaultScheduleDate,
  formatDayLabel,
  formatHour,
  formatMinutes,
  formatTimeOfDay,
  formatTourWhen,
  formatWeekLabel,
  generateSlots,
  getSlotAvailability,
  getWeekDays,
  gridHeight,
  isClosedDate,
  layoutOverlaps,
  nextOpenDay,
  nowOffset,
  reminderBody,
  resolveWeekStart,
  slotOverlapsTour,
  startOfWeek,
  weekRange,
} from './tourCalendarUtils';

const tour = (start, extra = {}) => ({ id: start, leadId: 'l', leadName: 'A B', start, durationMinutes: 45, status: 'Confirmed', ...extra });

describe('weeks', () => {
  it('starts weeks on Monday', () => {
    expect(toLocalDateString(startOfWeek(new Date(2026, 9, 22, 15, 30)))).toBe('2026-10-19'); // Thu
    expect(toLocalDateString(startOfWeek(new Date(2026, 9, 19)))).toBe('2026-10-19'); // Mon
    expect(toLocalDateString(startOfWeek(new Date(2026, 9, 25, 23, 59)))).toBe('2026-10-19'); // Sun
    expect(toLocalDateString(startOfWeek(new Date(2026, 9, 26)))).toBe('2026-10-26');
  });

  it('resolves the week from a query date, or from now', () => {
    const now = new Date(2026, 9, 22);
    expect(toLocalDateString(resolveWeekStart('2026-11-04', now))).toBe('2026-11-02');
    expect(toLocalDateString(resolveWeekStart(undefined, now))).toBe('2026-10-19');
    expect(toLocalDateString(resolveWeekStart('garbage', now))).toBe('2026-10-19');
  });

  it('lists seven consecutive days across the fall DST change', () => {
    const days = getWeekDays(new Date(2026, 9, 26)).map(toLocalDateString);
    expect(days).toEqual([
      '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01',
    ]);
  });

  it('lists seven consecutive days across the spring DST change', () => {
    const days = getWeekDays(new Date(2026, 2, 2)).map(toLocalDateString);
    expect(days[6]).toBe('2026-03-08');
    expect(new Set(days).size).toBe(7);
  });

  it('builds a half-open range from Monday to next Monday', () => {
    expect(weekRange(new Date(2026, 9, 19))).toEqual({ from: '2026-10-19T00:00', to: '2026-10-26T00:00' });
    expect(weekRange(new Date(2026, 11, 28))).toEqual({ from: '2026-12-28T00:00', to: '2027-01-04T00:00' });
  });

  it('labels weeks, including month and year boundaries', () => {
    expect(formatWeekLabel(new Date(2026, 9, 19))).toBe('Oct 19 – 25, 2026');
    expect(formatWeekLabel(new Date(2026, 9, 26))).toBe('Oct 26 – Nov 1, 2026');
    expect(formatWeekLabel(new Date(2026, 11, 28))).toBe('Dec 28, 2026 – Jan 3, 2027');
  });
});

describe('formatting', () => {
  it('formats clock values', () => {
    expect(formatMinutes(0)).toBe('12:00 AM');
    expect(formatMinutes(9 * 60)).toBe('9:00 AM');
    expect(formatMinutes(12 * 60 + 5)).toBe('12:05 PM');
    expect(formatMinutes(17 * 60 + 15)).toBe('5:15 PM');
    expect(formatHour(9)).toBe('9 AM');
    expect(formatHour(12)).toBe('12 PM');
    expect(formatHour(17)).toBe('5 PM');
    expect(formatTimeOfDay('2026-10-22T13:30')).toBe('1:30 PM');
    expect(formatTimeOfDay('09:00')).toBe('9:00 AM');
    expect(formatTimeOfDay('')).toBe('');
  });

  it('labels days relative to now', () => {
    const now = new Date(2026, 9, 22, 10);
    expect(formatDayLabel('2026-10-22T16:00', now)).toBe('Today');
    expect(formatDayLabel('2026-10-23T16:00', now)).toBe('Tomorrow');
    expect(formatDayLabel('2026-10-26T16:00', now)).toBe('Mon');
    expect(formatDayLabel('2026-10-29T16:00', now)).toBe('Thu, Oct 29');
    expect(formatDayLabel('nope', now)).toBe('');
  });

  it('describes when a tour happens', () => {
    expect(formatTourWhen(tour('2026-10-22T13:30'))).toBe('Thursday, Oct 22 · 1:30 PM – 2:15 PM');
  });

  it('writes text message bodies with the first name, day and time', () => {
    expect(reminderBody('Sarah Mitchell', '2026-10-22T13:30')).toContain('Hi Sarah');
    expect(reminderBody('Sarah Mitchell', '2026-10-22T13:30')).toContain('Thursday, Oct 22 at 1:30 PM');
    expect(confirmationBody('', '2026-10-22T13:30')).toContain('Hi there');
  });
});

describe('closed days', () => {
  it('detects Sundays', () => {
    expect(isClosedDate('2026-10-25')).toBe(true);
    expect(isClosedDate('2026-10-24')).toBe(false);
    expect(isClosedDate(new Date(2026, 9, 25))).toBe(true);
    expect(isClosedDate('bad')).toBe(false);
  });

  it('words the closed message', () => {
    expect(closedMessage([0])).toBe('The office is closed on Sundays');
    expect(closedMessage([0, 6])).toBe('The office is closed on Sundays and Saturdays');
  });

  it('finds the next open day', () => {
    expect(toLocalDateString(nextOpenDay(new Date(2026, 9, 25)))).toBe('2026-10-26');
    expect(toLocalDateString(nextOpenDay(new Date(2026, 9, 24)))).toBe('2026-10-24');
  });
});

describe('slots', () => {
  it('runs every 30 minutes until the last tour that ends by closing', () => {
    const slots = generateSlots();
    expect(slots[0]).toBe('09:00');
    expect(slots[1]).toBe('09:30');
    expect(slots[slots.length - 1]).toBe('17:00'); // 17:30 would end at 6:15 PM
    expect(slots).toHaveLength(17);
  });

  it('honors other hours and durations', () => {
    expect(generateSlots({ office: { start: 10, end: 12 }, duration: 60 })).toEqual(['10:00', '10:30', '11:00']);
    expect(generateSlots({ office: { start: 10, end: 12 }, duration: 150 })).toEqual([]);
  });

  it('detects slot and tour overlap at the boundaries', () => {
    const t = tour('2026-10-22T10:00'); // 10:00 - 10:45
    expect(slotOverlapsTour('09:00', t)).toBe(false); // ends 9:45
    expect(slotOverlapsTour('09:30', t)).toBe(true); // ends 10:15
    expect(slotOverlapsTour('10:30', t)).toBe(true);
    expect(slotOverlapsTour('11:00', t)).toBe(false);
    expect(slotOverlapsTour('09:16', tour('2026-10-22T10:00', { durationMinutes: 30 }))).toBe(true);
    expect(slotOverlapsTour('09:00', { start: 'bad' })).toBe(false);
  });

  it('removes booked slots and ignores canceled tours', () => {
    const tours = [tour('2026-10-22T10:00'), tour('2026-10-22T14:30', { status: 'Canceled' }), tour('2026-10-22T15:00', { status: 'Unconfirmed' })];
    const { closed, slots, booked } = getSlotAvailability('2026-10-22', tours);
    expect(closed).toBe(false);
    expect(slots).not.toContain('09:30');
    expect(slots).not.toContain('10:00');
    expect(slots).not.toContain('10:30');
    expect(slots).toContain('11:00');
    expect(slots).toContain('14:00');
    expect(slots).not.toContain('14:30');
    expect(slots).not.toContain('15:00');
    expect(booked).toEqual(['10:00 AM', '3:00 PM']);
  });

  it('leaves out slots that have already started today', () => {
    const now = new Date(2026, 9, 22, 11, 15);
    expect(getSlotAvailability('2026-10-22', [], { now }).slots[0]).toBe('11:30');
    expect(getSlotAvailability('2026-10-23', [], { now }).slots[0]).toBe('09:00');
  });

  it('only counts tours on that day', () => {
    const { slots } = getSlotAvailability('2026-10-22', [tour('2026-10-23T10:00')]);
    expect(slots).toEqual(generateSlots());
  });

  it('returns no slots on a closed day', () => {
    expect(getSlotAvailability('2026-10-25', [])).toEqual({ closed: true, slots: [], booked: [] });
  });

  it('returns nothing for an invalid date', () => {
    expect(getSlotAvailability('', [])).toEqual({ closed: false, slots: [], booked: [] });
  });

  it('captions booked times', () => {
    expect(bookedCaption([])).toBe('');
    expect(bookedCaption(['10:00 AM'])).toBe('10:00 AM is booked.');
    expect(bookedCaption(['10:00 AM', '2:30 PM'])).toBe('10:00 AM and 2:30 PM are booked.');
    expect(bookedCaption(['9:00 AM', '10:00 AM', '2:30 PM'])).toBe('9:00 AM, 10:00 AM and 2:30 PM are booked.');
  });
});

describe('defaultScheduleDate', () => {
  it('is today while slots remain', () => {
    expect(defaultScheduleDate(new Date(2026, 9, 22, 8, 0))).toBe('2026-10-22');
    expect(defaultScheduleDate(new Date(2026, 9, 22, 17, 0))).toBe('2026-10-22');
  });

  it('moves to tomorrow after the last slot', () => {
    expect(defaultScheduleDate(new Date(2026, 9, 22, 17, 1))).toBe('2026-10-23');
    expect(defaultScheduleDate(new Date(2026, 9, 22, 21, 0))).toBe('2026-10-23');
  });

  it('skips closed days', () => {
    expect(defaultScheduleDate(new Date(2026, 9, 25, 10))).toBe('2026-10-26'); // Sunday
    expect(defaultScheduleDate(new Date(2026, 9, 24, 18))).toBe('2026-10-26'); // Saturday evening
  });

  it('crosses month and DST boundaries', () => {
    expect(defaultScheduleDate(new Date(2026, 9, 31, 18))).toBe('2026-11-02'); // Sat -> Sun closed -> Mon
    expect(defaultScheduleDate(new Date(2026, 11, 31, 18))).toBe('2027-01-01');
  });
});

describe('block geometry', () => {
  it('positions by start and duration at 56px per hour', () => {
    expect(gridHeight()).toBe(504);
    const noon = blockGeometry(tour('2026-10-22T12:00'));
    expect(noon.top).toBe(3 * 56 + 1);
    expect(noon.height).toBeCloseTo((45 * 56) / 60 - 2);
    expect(blockGeometry(tour('2026-10-22T09:00')).top).toBe(1);
    expect(blockGeometry(tour('2026-10-22T10:00', { durationMinutes: 120 })).height).toBe(2 * 56 - 2);
  });

  it('clamps tours outside office hours to the edges', () => {
    const early = blockGeometry(tour('2026-10-22T07:00', { durationMinutes: 180 })); // 7-10, shows 9-10
    expect(early.top).toBe(1);
    expect(early.height).toBe(56 - 2);

    const late = blockGeometry(tour('2026-10-22T17:30', { durationMinutes: 90 })); // 5:30-7, shows 5:30-6
    expect(late.top + late.height).toBeLessThanOrEqual(504);
    expect(late.height).toBe(28 - 2);

    const after = blockGeometry(tour('2026-10-22T19:00'));
    expect(after.top + after.height).toBeLessThanOrEqual(504);
    expect(after.height).toBeGreaterThan(0);

    const before = blockGeometry(tour('2026-10-22T06:00'));
    expect(before.top).toBe(1);
    expect(before.height).toBeGreaterThan(0);
  });

  it('defaults a missing duration and rejects a bad start', () => {
    expect(blockGeometry({ start: '2026-10-22T10:00' }).height).toBeCloseTo((45 * 56) / 60 - 2);
    expect(blockGeometry({ start: 'bad' })).toBeNull();
  });

  it('places the now line only within office hours', () => {
    expect(nowOffset(new Date(2026, 9, 22, 11, 15))).toBe(2 * 56 + 14);
    expect(nowOffset(new Date(2026, 9, 22, 9, 0))).toBe(0);
    expect(nowOffset(new Date(2026, 9, 22, 18, 0))).toBe(504);
    expect(nowOffset(new Date(2026, 9, 22, 8, 59))).toBeNull();
    expect(nowOffset(new Date(2026, 9, 22, 18, 1))).toBeNull();
  });
});

describe('layoutOverlaps', () => {
  const find = (layout, id) => layout.find((entry) => entry.tour.id === id);

  it('gives non-overlapping tours the full width', () => {
    const layout = layoutOverlaps([tour('2026-10-22T10:00'), tour('2026-10-22T11:00')]);
    layout.forEach((entry) => {
      expect(entry.column).toBe(0);
      expect(entry.columns).toBe(1);
    });
  });

  it('treats back-to-back tours as separate', () => {
    const layout = layoutOverlaps([tour('2026-10-22T10:00', { durationMinutes: 60 }), tour('2026-10-22T11:00')]);
    expect(layout.every((entry) => entry.columns === 1)).toBe(true);
  });

  it('puts overlapping tours side by side', () => {
    const layout = layoutOverlaps([tour('2026-10-22T10:00'), tour('2026-10-22T10:30')]);
    expect(find(layout, '2026-10-22T10:00')).toMatchObject({ column: 0, columns: 2 });
    expect(find(layout, '2026-10-22T10:30')).toMatchObject({ column: 1, columns: 2 });
  });

  it('reuses a freed column within a group', () => {
    // a 10:00-12:00, b 10:15-10:45, c 10:45-11:30: c reuses b's column
    const a = tour('2026-10-22T10:00', { id: 'a', durationMinutes: 120 });
    const b = tour('2026-10-22T10:15', { id: 'b', durationMinutes: 30 });
    const c = tour('2026-10-22T10:45', { id: 'c', durationMinutes: 45 });
    const layout = layoutOverlaps([c, a, b]);
    expect(find(layout, 'a')).toMatchObject({ column: 0, columns: 2 });
    expect(find(layout, 'b')).toMatchObject({ column: 1, columns: 2 });
    expect(find(layout, 'c')).toMatchObject({ column: 1, columns: 2 });
  });

  it('sizes each group independently', () => {
    const layout = layoutOverlaps([
      tour('2026-10-22T09:00', { id: 'x' }),
      tour('2026-10-22T09:00', { id: 'y' }),
      tour('2026-10-22T09:00', { id: 'z' }),
      tour('2026-10-22T15:00', { id: 'solo' }),
    ]);
    expect(find(layout, 'x').columns).toBe(3);
    expect(find(layout, 'solo')).toMatchObject({ column: 0, columns: 1 });
  });

  it('skips tours with an invalid start and handles empty input', () => {
    expect(layoutOverlaps([])).toEqual([]);
    expect(layoutOverlaps([{ id: 'bad', start: 'nope' }])).toEqual([]);
  });
});
