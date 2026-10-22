import { cn } from './cn';

function EmptyState({ icon, title, description, action, className, ...rest }) {
  return (
    <div
      {...rest}
      className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-fg-subtle"
        >
          {icon}
        </div>
      )}
      <h3 className="text-title text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-body text-fg-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
