import { describe, it, expect } from 'vitest';
import { daysUntil, formatDate, parseLocalDate, toLocalDateString, toLocalDateTimeString } from './dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats a YYYY-MM-DD date', () => {
      expect(formatDate('2024-11-15')).toBe('Nov 15, 2024');
    });

    it('keeps the stored day regardless of time zone', () => {
      expect(formatDate('2025-01-01')).toBe('Jan 1, 2025');
    });

    it('returns an empty string for missing values', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate(null)).toBe('');
    });

    it('returns other formats unchanged', () => {
      expect(formatDate('11/15/2024')).toBe('11/15/2024');
    });

    it('returns impossible dates unchanged', () => {
      expect(formatDate('2024-02-31')).toBe('2024-02-31');
    });
  });
});

describe('local date helpers', () => {
  it('formats local dates and datetimes', () => {
    const d = new Date(2026, 0, 5, 9, 7);
    expect(toLocalDateString(d)).toBe('2026-01-05');
    expect(toLocalDateTimeString(d)).toBe('2026-01-05T09:07');
  });

  it('parses local strings and rejects bad ones', () => {
    expect(parseLocalDate('2026-10-22T14:30')).toEqual(new Date(2026, 9, 22, 14, 30));
    expect(parseLocalDate('2026-02-31')).toBeNull();
    expect(parseLocalDate('')).toBeNull();
  });

  it('counts whole local days until a date', () => {
    const now = new Date(2026, 9, 22, 23, 30);
    expect(daysUntil('2026-10-22', now)).toBe(0);
    expect(daysUntil('2026-10-23', now)).toBe(1);
    expect(daysUntil('2026-10-21', now)).toBe(-1);
    expect(daysUntil('', now)).toBeNull();
  });
});
