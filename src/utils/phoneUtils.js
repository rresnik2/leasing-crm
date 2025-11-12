import { parsePhoneNumber, getCountryCodeForRegionCode } from 'awesome-phonenumber';

// Format phone number as user types
export const formatPhoneInput = (value, countryCode = 'US') => {
  try {
    // Parse the phone number with country context
    const pn = parsePhoneNumber(value, { regionCode: countryCode });
    
    if (pn.valid) {
      // Return formatted national number for valid numbers
      return pn.number.national;
    } else if (value.length > 0) {
      // For partial numbers, do basic formatting
      const digits = value.replace(/\D/g, '');
      if (countryCode === 'US' && digits.length <= 10) {
        return formatUSPartial(digits);
      }
      return value;
    }
    return '';
  } catch (error) {
    return value;
  }
};

// Helper for partial US numbers while typing
const formatUSPartial = (digits) => {
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

// Validate phone number
export const validatePhone = (value, countryCode = 'US') => {
  try {
    const pn = parsePhoneNumber(value, { regionCode: countryCode });
    return pn.valid;
  } catch {
    return false;
  }
};

// Get clean number for storage (E.164 format)
export const getE164Format = (value, countryCode = 'US') => {
  try {
    const pn = parsePhoneNumber(value, { regionCode: countryCode });
    if (pn.valid) {
      return pn.number.e164; // Returns format like "+12065551234"
    }
    return value;
  } catch {
    return value;
  }
};

// Format for display (from stored E.164)
export const formatForDisplay = (value, style = 'national') => {
  try {
    const pn = parsePhoneNumber(value);
    if (pn.valid) {
      return style === 'international' ? pn.number.international : pn.number.national;
    }
    return value;
  } catch {
    return value;
  }
};

// Get suggested formats based on partial input
export const getSuggestedFormats = (value) => {
  const suggestions = [];
  
  // Try parsing as US number
  const usPhone = parsePhoneNumber(value, { regionCode: 'US' });
  if (usPhone.possibility !== 'invalid') {
    suggestions.push({
      country: 'US',
      formatted: usPhone.number.national || value,
      valid: usPhone.valid
    });
  }
  
  // Try other common formats for Seattle area
  if (value.startsWith('+')) {
    // Try international format
    const intlPhone = parsePhoneNumber(value);
    if (intlPhone.possibility !== 'invalid') {
      suggestions.push({
        country: intlPhone.regionCode,
        formatted: intlPhone.number.international,
        valid: intlPhone.valid
      });
    }
  }
  
  return suggestions;
};