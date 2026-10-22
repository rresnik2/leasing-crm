import { cn } from './cn';

// Loading placeholder. Callers size it (`h-4 w-32`). Wrap groups of skeletons in a
// container with role="status" and an sr-only "Loading…" label.
function Skeleton({ className, ...rest }) {
  return (
    <div
      aria-hidden="true"
      {...rest}
      className={cn('rounded-control bg-line motion-safe:animate-pulse', className)}
    />
  );
}

export default Skeleton;
