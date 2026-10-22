import { describe, it, expect } from 'vitest';
import { formatDate } from './dateUtils';

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
