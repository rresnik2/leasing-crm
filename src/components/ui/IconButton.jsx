import { cn } from './cn';

const base =
  'inline-flex shrink-0 items-center justify-center rounded-control transition-colors duration-fast ease-standard focus-ring disabled:opacity-50 disabled:cursor-not-allowed';

// same variants as Button (duplicated: ui files may only default-export a component)
const variants = {
  primary: 'bg-brand text-fg-inverse hover:bg-brand-hover',
  secondary: 'bg-surface border border-line-strong text-fg hover:bg-surface-muted',
  ghost: 'bg-transparent text-fg-muted hover:bg-surface-muted hover:text-fg',
  danger: 'bg-danger text-fg-inverse hover:bg-danger-hover',
};

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
};

// square icon-only button; label is required and becomes the accessible name and tooltip
export default function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className,
  children,
  ref,
  ...rest
}) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        base,
        variants[variant] ?? variants.ghost,
        sizes[size] ?? sizes.md,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
