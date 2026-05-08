import { describe, it, expect } from 'vitest';
import {
  formatPhoneInput,
  validatePhone,
  getE164Format,
  formatForDisplay,
  getSuggestedFormats
} from './phoneUtils';

describe('phoneUtils', () => {
  describe('formatPhoneInput', () => {
    describe('US numbers', () => {
      it('formats complete valid US number', () => {
        const result = formatPhoneInput('2065551234', 'US');
        expect(result).toBe('(206) 555-1234');
      });

      it('formats partial US number with 3 digits', () => {
        const result = formatPhoneInput('206', 'US');
        expect(result).toBe('(206');
      });

      it('formats partial US number with 6 digits', () => {
        const result = formatPhoneInput('206555', 'US');
        expect(result).toBe('(206) 555');
      });

      it('formats partial US number with 7 digits', () => {
        const result = formatPhoneInput('2065551', 'US');
        expect(result).toBe('(206) 555-1');
      });

      it('returns empty string for empty input', () => {
        const result = formatPhoneInput('', 'US');
        expect(result).toBe('');
      });

      it('handles already formatted input', () => {
        const result = formatPhoneInput('(206) 555-1234', 'US');
        expect(result).toBe('(206) 555-1234');
      });

      it('handles input with spaces', () => {
        const result = formatPhoneInput('206 555 1234', 'US');
        expect(result).toBe('(206) 555-1234');
      });

      it('handles input with dashes', () => {
        const result = formatPhoneInput('206-555-1234', 'US');
        expect(result).toBe('(206) 555-1234');
      });
    });

    describe('edge cases', () => {
      it('handles null country code gracefully', () => {
        // Should default to US
        const result = formatPhoneInput('2065551234');
        expect(result).toBe('(206) 555-1234');
      });

      it('handles non-US country code', () => {
        const result = formatPhoneInput('+441onal234567', 'GB');
        // Should return something, not throw
        expect(typeof result).toBe('string');
      });

      it('handles letters in input gracefully', () => {
        const result = formatPhoneInput('206abc5551234', 'US');
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('validatePhone', () => {
    describe('valid US numbers', () => {
      it('validates complete US number', () => {
        expect(validatePhone('2065551234', 'US')).toBe(true);
      });

      it('validates formatted US number', () => {
        expect(validatePhone('(206) 555-1234', 'US')).toBe(true);
      });

      it('validates US number with dashes', () => {
        expect(validatePhone('206-555-1234', 'US')).toBe(true);
      });

      it('validates US number with +1 prefix', () => {
        expect(validatePhone('+12065551234', 'US')).toBe(true);
      });
    });

    describe('invalid numbers', () => {
      it('rejects incomplete US number', () => {
        expect(validatePhone('20655512', 'US')).toBe(false);
      });

      it('rejects too short number', () => {
        expect(validatePhone('206', 'US')).toBe(false);
      });

      it('rejects empty string', () => {
        expect(validatePhone('', 'US')).toBe(false);
      });

      it('rejects letters only', () => {
        expect(validatePhone('abcdefghij', 'US')).toBe(false);
      });

      it('rejects invalid area code', () => {
        // 000 is not a valid area code
        expect(validatePhone('0005551234', 'US')).toBe(false);
      });
    });
  });

  describe('getE164Format', () => {
    it('converts US number to E.164 format', () => {
      const result = getE164Format('2065551234', 'US');
      expect(result).toBe('+12065551234');
    });

    it('converts formatted US number to E.164', () => {
      const result = getE164Format('(206) 555-1234', 'US');
      expect(result).toBe('+12065551234');
    });

    it('returns original value for invalid number', () => {
      const result = getE164Format('abc', 'US');
      expect(result).toBe('abc');
    });

    it('handles already E.164 formatted number', () => {
      const result = getE164Format('+12065551234', 'US');
      expect(result).toBe('+12065551234');
    });

    it('returns original for partial number', () => {
      const result = getE164Format('206555', 'US');
      expect(result).toBe('206555');
    });
  });

  describe('formatForDisplay', () => {
    describe('national format', () => {
      it('formats E.164 to national format', () => {
        const result = formatForDisplay('+12065551234', 'national');
        expect(result).toBe('(206) 555-1234');
      });

      it('defaults to national format', () => {
        const result = formatForDisplay('+12065551234');
        expect(result).toBe('(206) 555-1234');
      });
    });

    describe('international format', () => {
      it('formats E.164 to international format', () => {
        const result = formatForDisplay('+12065551234', 'international');
        expect(result).toBe('+1 206-555-1234');
      });
    });

    describe('edge cases', () => {
      it('returns original value for invalid number', () => {
        const result = formatForDisplay('invalid');
        expect(result).toBe('invalid');
      });

      it('handles empty string', () => {
        const result = formatForDisplay('');
        expect(result).toBe('');
      });
    });
  });

  describe('getSuggestedFormats', () => {
    it('returns suggestions for US number', () => {
      const suggestions = getSuggestedFormats('2065551234');
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      const usSuggestion = suggestions.find(s => s.country === 'US');
      expect(usSuggestion).toBeDefined();
      expect(usSuggestion.valid).toBe(true);
    });

    it('returns suggestions for international format', () => {
      const suggestions = getSuggestedFormats('+12065551234');
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('handles partial numbers', () => {
      const suggestions = getSuggestedFormats('206555');
      expect(Array.isArray(suggestions)).toBe(true);
      // Should still provide suggestions even for partial
      const usSuggestion = suggestions.find(s => s.country === 'US');
      if (usSuggestion) {
        expect(usSuggestion.valid).toBe(false);
      }
    });

    it('handles empty input', () => {
      const suggestions = getSuggestedFormats('');
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('includes formatted property in suggestions', () => {
      const suggestions = getSuggestedFormats('2065551234');
      const usSuggestion = suggestions.find(s => s.country === 'US');
      expect(usSuggestion).toBeDefined();
      expect(usSuggestion.formatted).toBeDefined();
      expect(typeof usSuggestion.formatted).toBe('string');
    });
  });
});
