import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import { cn } from './cn';
import IconButton from './IconButton';

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
};

// Tabbable candidates. getFocusable() then drops disabled, hidden and tabindex="-1" elements.
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusable(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.matches(':disabled') &&
      el.getAttribute('tabindex') !== '-1' &&
      !el.closest('[hidden], [inert]')
  );
}

// Scroll lock is shared by every open Modal: the first one to open locks the page and
// remembers the inline overflow value, the last one to close puts it back.
let openModalCount = 0;
let previousBodyOverflow = '';

function lockBodyScroll() {
  if (openModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  openModalCount += 1;
}

function unlockBodyScroll() {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="h-5 w-5"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// className and any other props (aria-label, data-*, ...) go on the dialog panel.
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  initialFocusRef,
  closeOnBackdrop = true,
  hideCloseButton = false,
  className,
  children,
  onKeyDown,
  ...rest
}) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef(null);
  const bodyRef = useRef(null);
  // True while a mouse press that began on the backdrop itself is still in progress.
  const pressStartedOnBackdrop = useRef(false);

  // Runs on open and again on close/unmount (cleanup), so it also covers a Modal that is
  // unmounted while open.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;
    lockBodyScroll();

    const target =
      initialFocusRef?.current ?? getFocusable(bodyRef.current)[0] ?? panelRef.current;
    target?.focus();

    return () => {
      unlockBodyScroll();
      if (
        previouslyFocused &&
        typeof previouslyFocused.focus === 'function' &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
      }
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  const hasBody = children !== undefined && children !== null && children !== false;
  const hasHeader = Boolean(title || description) || !hideCloseButton;

  const handleKeyDown = (e) => {
    onKeyDown?.(e);

    // React events bubble through portals, so a ConfirmDialog (or any Modal) rendered inside
    // this one would otherwise close or trap it. Only act on events from this panel's DOM.
    const panel = panelRef.current;
    if (!panel || !panel.contains(e.target)) return;

    if (e.key === 'Escape') {
      // Lets an inner widget (e.g. an open combobox) claim Escape first.
      if (e.defaultPrevented) return;
      e.preventDefault();
      onClose?.();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = getFocusable(panel);
    if (focusable.length === 0) {
      e.preventDefault();
      panel.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || active === panel) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleBackdropMouseDown = (e) => {
    pressStartedOnBackdrop.current = e.target === e.currentTarget;
  };

  const handleBackdropClick = (e) => {
    const startedOnBackdrop = pressStartedOnBackdrop.current;
    pressStartedOnBackdrop.current = false;
    if (closeOnBackdrop && startedOnBackdrop && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-overlay flex items-center justify-center bg-fg/50 p-4 motion-safe:animate-fade-in"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      <div
        {...rest}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex max-h-[90vh] w-full flex-col rounded-card bg-surface shadow-overlay outline-none motion-safe:animate-scale-in',
          SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
          className
        )}
      >
        {hasHeader && (
          <div
            className={cn(
              'flex shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-5',
              // Without a body the footer's own top border is the only divider needed.
              hasBody && 'border-b border-line'
            )}
          >
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="text-heading text-fg">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className={cn('text-body text-fg-muted', title && 'mt-1')}>
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <IconButton
                label="Close"
                size="sm"
                onClick={() => onClose?.()}
                className="-mr-2 -mt-1"
              >
                <CloseIcon />
              </IconButton>
            )}
          </div>
        )}

        {hasBody && (
          <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>
        )}

        {footer && (
          <div className="flex shrink-0 justify-end gap-3 border-t border-line px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
