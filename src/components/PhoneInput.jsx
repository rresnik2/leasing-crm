import { useState, useEffect } from 'react';
import { formatPhoneInput, validatePhone, getE164Format } from '../utils/phoneUtils';
import Input from './ui/Input';

function PhoneInput({
    value,
    onChange,
    placeholder = "(XXX) XXX-XXXX",
    countryCode = 'US',
    onFocus,
    onBlur,
    ...rest
}) {
    const [displayValue, setDisplayValue] = useState('');
    const [isValid, setIsValid] = useState(true);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        // Format the value for display
        if (value) {
            setDisplayValue(formatPhoneInput(value, countryCode));
        }
        else {
            setDisplayValue('');
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

    const handleFocus = (e) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        // Final validation on blur
        if (displayValue) {
            const valid = validatePhone(displayValue, countryCode);
            setIsValid(valid);
        }
        onBlur?.(e);
    };

    return (
        <Input
            {...rest}
            type="tel"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            error={!isValid && !isFocused && displayValue ? 'Please enter a valid phone number' : undefined}
            autoComplete="tel"
            inputMode="tel"
        />
    );
}

export default PhoneInput;
