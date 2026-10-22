import { cn } from './cn';

// Layout wrapper that ties a label, a control, a hint and an error together.
// `id` is the control's id; the hint and error ids derive from it so the control
// can reference them with aria-describedby (`${id}-hint`, `${id}-error`).
export default function Field({ id, label, required = false, hint, error, children, className, ...rest }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...rest}>
      {label && (
        <label htmlFor={id} className="text-label text-fg">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-danger-strong">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-caption text-danger-strong">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
