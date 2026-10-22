import { useId } from 'react';

import { cn } from './cn';
import { controlClasses } from './controlStyles';
import Field from './Field';

export default function Textarea({
  id,
  label,
  hint,
  error,
  required,
  rows = 3,
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
    <textarea
      {...rest}
      ref={ref}
      id={controlId}
      rows={rows}
      required={required}
      aria-invalid={error ? true : ariaInvalid}
      aria-describedby={describedBy}
      className={cn(controlClasses({ invalid: Boolean(error), multiline: true }), className)}
    />
  );

  if (!hasField) return control;

  return (
    <Field id={controlId} label={label} required={required} hint={hint} error={error} className={wrapperClassName}>
      {control}
    </Field>
  );
}
