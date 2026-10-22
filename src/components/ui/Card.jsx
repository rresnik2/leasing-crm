import { cn } from './cn';

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

// Elements that already have button/link semantics and keyboard activation.
const NATIVE_INTERACTIVE = ['button', 'a'];

function Card({
  as: Component = 'div',
  padding = 'md',
  interactive = false,
  className,
  onClick,
  onKeyDown,
  ref,
  ...rest
}) {
  const needsButtonSemantics = interactive && !NATIVE_INTERACTIVE.includes(Component);

  function handleKeyDown(event) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    // Ignore keys pressed inside a control nested in the card (input, button, link).
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      // Space would otherwise scroll the page.
      if (event.key === ' ') event.preventDefault();
      onClick?.(event);
    }
  }

  return (
    <Component
      role={needsButtonSemantics ? 'button' : undefined}
      tabIndex={needsButtonSemantics ? 0 : undefined}
      {...rest}
      ref={ref}
      onClick={onClick}
      onKeyDown={needsButtonSemantics ? handleKeyDown : onKeyDown}
      className={cn(
        'bg-surface border border-line rounded-card shadow-card',
        PADDING[padding],
        interactive &&
          'cursor-pointer hover:shadow-raised hover:border-line-strong transition-shadow duration-fast focus-ring',
        className,
      )}
    />
  );
}

export default Card;
