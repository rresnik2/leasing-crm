import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from './cn';
import IconButton from './IconButton';
import { ToastContext } from './toastContext';

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;

const ICON_COLORS = {
  info: 'text-brand',
  success: 'text-success',
  danger: 'text-danger',
};

// Shared outline circle; each tone adds its own glyph. All are decorative.
const ICON_GLYPHS = {
  info: <path d="M12 11v5M12 8h.01" />,
  success: <path d="m8.5 12.5 2.5 2.5 4.5-5" />,
  danger: <path d="M12 7.5v5M12 16h.01" />,
};

function ToneIcon({ tone }) {
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
      className={cn('mt-0.5 h-5 w-5 shrink-0', ICON_COLORS[tone])}
    >
      <circle cx="12" cy="12" r="9" />
      {ICON_GLYPHS[tone]}
    </svg>
  );
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
      className="h-4 w-4"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { id, title, description, tone, duration } = toast;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;

  // Time left on the auto-dismiss timer. Pausing keeps what is left; resuming restarts the
  // timer with it instead of the full duration.
  const remainingRef = useRef(duration);

  useEffect(() => {
    if (!(duration > 0) || paused) return; // duration 0 = sticky; paused = hover / focus-within

    const startedAt = performance.now();
    const timer = setTimeout(() => onDismiss(id), remainingRef.current);

    return () => {
      clearTimeout(timer); // also runs when the toast or the whole provider unmounts
      remainingRef.current = Math.max(0, remainingRef.current - (performance.now() - startedAt));
    };
  }, [duration, paused, id, onDismiss]);

  return (
    <div
      className="pointer-events-auto flex gap-3 rounded-card border border-line bg-surface p-4 shadow-overlay motion-safe:animate-slide-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // Moving focus between controls inside the toast is still "focus within".
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <ToneIcon tone={tone} />
      <div className="min-w-0 flex-1 break-words">
        {title && <p className="text-label text-fg">{title}</p>}
        {description && (
          <p className={cn('text-caption text-fg-muted', title && 'mt-0.5')}>{description}</p>
        )}
      </div>
      <IconButton
        label="Dismiss notification"
        size="sm"
        onClick={() => onDismiss(id)}
        className="-mr-1 -mt-1"
      >
        <CloseIcon />
      </IconButton>
    </div>
  );
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextIdRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) =>
      current.some((t) => t.id === id) ? current.filter((t) => t.id !== id) : current
    );
  }, []);

  const toast = useCallback(
    ({ title, description, tone = 'info', duration = DEFAULT_DURATION } = {}) => {
      nextIdRef.current += 1;
      const id = `toast-${nextIdRef.current}`;
      const resolvedTone = tone === 'success' || tone === 'danger' ? tone : 'info';
      // Newest last; once past the cap the oldest toasts fall off the front.
      setToasts((current) =>
        [...current, { id, title, description, tone: resolvedTone, duration }].slice(-MAX_VISIBLE)
      );
      return id;
    },
    []
  );

  // dismiss and toast never change, so neither does this object: consumers of useToast()
  // do not re-render when toasts come and go.
  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  const polite = toasts.filter((t) => t.tone !== 'danger');
  const assertive = toasts.filter((t) => t.tone === 'danger');

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className={cn(
            // On phones, stop short of the chat launcher (bottom-right, 56px + 24px inset).
            'pointer-events-none fixed bottom-4 left-4 z-toast flex w-[calc(100vw-6.5rem)] flex-col sm:w-96',
            // Only space the two regions apart when both have toasts, so an empty one
            // never adds a phantom gap under or over the stack.
            polite.length > 0 && assertive.length > 0 && 'gap-2'
          )}
        >
          {/* Both live regions are always mounted so screen readers register them
              before the first toast is added. aria-atomic="false" announces only the
              toast that was added, not the whole region. */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="false"
            className="flex flex-col gap-2"
          >
            {polite.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>
          <div
            role="alert"
            aria-live="assertive"
            aria-atomic="false"
            className="flex flex-col gap-2"
          >
            {assertive.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
