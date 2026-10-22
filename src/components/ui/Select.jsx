import { useId } from 'react';

import { cn } from './cn';
import { controlClasses } from './controlStyles';
import Field from './Field';

export default function Select({
  id,
  label,
  hint,
  error,
  required,
  size = 'md',
  options,
  placeholder,
  wrapperClassName,
  className,
  ref,
  children,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hasField = Boolean(label);

  // Hint/error only exist in the DOM inside a Field, so only reference them then.
  const fieldDescription = hasField ? (error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined) : undefined;
  const describedBy = [fieldDescription, ariaDescribedBy].filter(Boolean).join(' ') || undefined;

  // The placeholder option is disabled, so an uncontrolled <select> would skip it and
  // silently show the first real option. Default to "" so the placeholder is what shows.
  const hasValue = rest.value !== undefined || rest.defaultValue !== undefined;
  const placeholderDefault = placeholder && !hasValue ? '' : undefined;

  const control = (
    <div className={cn('relative', !hasField && wrapperClassName)}>
      <select
        defaultValue={placeholderDefault}
        {...rest}
        ref={ref}
        id={controlId}
        required={required}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedBy}
        className={cn(controlClasses({ invalid: Boolean(error), size }), 'appearance-none pr-9', className)}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options?.map((option) => {
          const { value, label: optionLabel } = typeof option === 'object' ? option : { value: option };
          return (
            <option key={value} value={value}>
              {optionLabel ?? value}
            </option>
          );
        })}
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
      >
        <path d="m5 7.5 5 5 5-5" />
      </svg>
    </div>
  );

  if (!hasField) return control;

  return (
    <Field id={controlId} label={label} required={required} hint={hint} error={error} className={wrapperClassName}>
      {control}
    </Field>
  );
}
