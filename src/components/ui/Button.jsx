import Spinner from './Spinner';
import { cn } from './cn';

const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors duration-fast ease-standard focus-ring disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary: 'bg-brand text-fg-inverse hover:bg-brand-hover',
  secondary: 'bg-surface border border-line-strong text-fg hover:bg-surface-muted',
  ghost: 'bg-transparent text-fg-muted hover:bg-surface-muted hover:text-fg',
  danger: 'bg-danger text-fg-inverse hover:bg-danger-hover',
};

const sizes = {
  sm: 'h-8 px-3 text-caption font-medium',
  md: 'h-10 px-4 text-label',
  lg: 'h-11 px-5 text-label',
};

// type defaults to "button" (not "submit"), so pass type="submit" explicitly in forms
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  type = 'button',
  disabled = false,
  className,
  children,
  ref,
  ...rest
}) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        base,
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {/* spinner replaces the leading icon; aria-hidden because aria-busy covers it */}
      {loading ? (
        <Spinner size="sm" aria-hidden="true" />
      ) : (
        leadingIcon && (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {leadingIcon}
          </span>
        )
      )}
      {children}
      {trailingIcon && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {trailingIcon}
        </span>
      )}
    </button>
  );
}
