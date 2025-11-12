import { useState, useEffect } from 'react';
import { formatPhoneInput, validatePhone, getE164Format } from '../utils/phoneUtils';

function PhoneInput({ 
  value, 
  onChange, 
  placeholder = "(206) 555-1234",
  required = false,
  className = "w-full p-2 border rounded",
  countryCode = 'US'
}) {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Format the value for display
    if (value) {
      setDisplayValue(formatPhoneInput(value, countryCode));
    }
  }, [value, countryCode]);

  const handleChange = (e) => {
    const input = e.target.value;
    const formatted = formatPhoneInput(input, countryCode);
    setDisplayValue(formatted);
    
    // Validate the phone number
    const valid = validatePhone(formatted, countryCode);
    setIsValid(valid || input.length < 10);
    
    // Pass the E.164 format to parent for storage
    const e164 = getE164Format(formatted, countryCode);
    onChange({ target: { value: valid ? e164 : formatted } });
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Final validation on blur
    if (displayValue) {
      const valid = validatePhone(displayValue, countryCode);
      setIsValid(valid);
    }
  };

  return (
    <div className="relative">
      <input
        type="tel"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${className} ${!isValid && !isFocused && displayValue ? 'border-red-500' : ''}`}
        required={required}
        autoComplete="tel"
      />
      {!isValid && !isFocused && displayValue && (
        <p className="text-red-500 text-xs mt-1">Please enter a valid phone number</p>
      )}
    </div>
  );
}

export default PhoneInput;