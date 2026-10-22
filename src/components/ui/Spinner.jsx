import { cn } from './cn';

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
};

// animated circle that inherits the current text color
// pass aria-hidden to render only the graphic (no role="status" or sr-only label),
// e.g. inside a Button that already sets aria-busy
export default function Spinner({
  size = 'md',
  label = 'Loading',
  className,
  'aria-hidden': ariaHidden,
  ...rest
}) {
  const hidden = ariaHidden === true || ariaHidden === 'true';

  return (
    <span
      {...(hidden ? { 'aria-hidden': 'true' } : { role: 'status' })}
      className={cn('inline-flex shrink-0', className)}
      {...rest}
    >
      <svg
        className={cn(sizes[size] ?? sizes.md, 'motion-safe:animate-spin')}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      {!hidden && <span className="sr-only">{label}</span>}
    </span>
  );
}
