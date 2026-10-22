import { useId } from 'react';

import { cn } from './cn';
import { controlClasses } from './controlStyles';
import Field from './Field';

export default function Input({
  id,
  label,
  hint,
  error,
  required,
  size = 'md',
  leadingIcon,
  wrapperClassName,
  className,
  ref,
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

  const control = (
    <input
      {...rest}
      ref={ref}
      id={controlId}
      required={required}
      aria-invalid={error ? true : ariaInvalid}
      aria-describedby={describedBy}
      className={cn(controlClasses({ invalid: Boolean(error), size }), leadingIcon && 'pl-9', className)}
    />
  );

  const content = leadingIcon ? (
    <div className={cn('relative', !hasField && wrapperClassName)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-fg-subtle"
      >
        {leadingIcon}
      </span>
      {control}
    </div>
  ) : (
    control
  );

  if (!hasField) return content;

  return (
    <Field id={controlId} label={label} required={required} hint={hint} error={error} className={wrapperClassName}>
      {content}
    </Field>
  );
}
