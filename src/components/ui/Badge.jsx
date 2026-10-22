import { cn } from './cn';

// Semantic tones use design tokens. The categorical hue tones are the only place
// raw Tailwind palette classes are allowed in the design system; each class is a
// complete static string so Tailwind's scanner can see it (never build these with
// template strings).
const TONES = {
  neutral: { badge: 'bg-surface-muted text-fg-muted ring-1 ring-inset ring-line', dot: 'bg-fg-subtle' },
  brand: { badge: 'bg-brand-subtle text-brand-strong', dot: 'bg-brand' },
  success: { badge: 'bg-success-subtle text-success-strong', dot: 'bg-success' },
  warning: { badge: 'bg-warning-subtle text-warning-strong', dot: 'bg-warning' },
  danger: { badge: 'bg-danger-subtle text-danger-strong', dot: 'bg-danger' },
  blue: { badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  yellow: { badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  purple: { badge: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  indigo: { badge: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  orange: { badge: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  green: { badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  teal: { badge: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
  red: { badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  rose: { badge: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
};

const SIZES = {
  sm: 'px-2 py-0.5 text-caption',
  md: 'px-2.5 py-0.5 text-caption font-medium',
};

function Badge({ tone = 'neutral', size = 'md', dot = false, className, children, ...rest }) {
  const classes = TONES[tone] ?? TONES.neutral;

  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full whitespace-nowrap',
        SIZES[size],
        classes.badge,
        className,
      )}
    >
      {dot && <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', classes.dot)} />}
      {children}
    </span>
  );
}

export default Badge;
