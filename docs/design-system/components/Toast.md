# Toast

Source: `src/components/ui/ToastProvider.jsx` (default export), `useToast.js` (named export `useToast`), `toastContext.js` (named export `ToastContext`, default value `null`).

## Description

A toast is a short, non-blocking message about something that already happened ("Lead added", "Couldn't delete lead"). It appears bottom-left, dismisses itself after a few seconds, and never takes focus.

| Situation | Use |
|---|---|
| A background action finished or failed (lead added, delete failed) | **Toast** |
| One field's value is wrong or missing | Inline `error` on `Input` / `Select` / `Textarea` |
| A failed save while a `Modal` is open | Inline message in the dialog body, not a toast (see Accessibility) |
| An irreversible action needs a yes/no before it runs | `ConfirmDialog` |
| A problem that stays until the user fixes it | Inline message on the page, not a toast |

## Setup

Mount `ToastProvider` once, above everything that calls `useToast()` (it is in `src/main.jsx`, wrapping `Root`). It renders `children` plus the toast viewport, which it portals into `document.body`.

```jsx
// src/main.jsx
import ToastProvider from './components/ui/ToastProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <Root />
    </ToastProvider>
  </StrictMode>,
)
```

`useToast()` returns `{ toast, dismiss }` and throws `useToast must be used inside <ToastProvider>` when there is no provider above. Both functions are stable and the returned object is memoized, so components that call `useToast()` do not re-render as toasts come and go, and the functions are safe in dependency arrays.

## API

**`toast(options)`** returns the toast's id (a string such as `'toast-3'`).

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | none | The outcome, in `text-label text-fg`. Always pass one; a toast with neither `title` nor `description` is an icon and a dismiss button |
| `description` | `ReactNode` | none | Detail or next step, in `text-caption text-fg-muted` below the title |
| `tone` | `'info' \| 'success' \| 'danger'` | `'info'` | See Tones. Any other value falls back to `info` |
| `duration` | `number` (ms) | `4000` | Time before auto-dismiss. `0` makes the toast sticky; any non-positive or non-numeric value behaves the same |

**`dismiss(id)`** removes the toast with that id. An unknown or already-dismissed id is a no-op. There is no "dismiss all".

## Tones

All tones share the same card (`bg-surface border border-line rounded-card shadow-overlay p-4`); only the icon and the live region differ. The glyph differs per tone, so meaning is not carried by color alone.

| Tone | Icon (decorative) | Icon color | Announced | Use when |
|---|---|---|---|---|
| `info` | Circle with an "i" | `text-brand` | Polite | Neutral news that needs no action |
| `success` | Circle with a check | `text-success` | Polite | An action completed |
| `danger` | Circle with "!" | `text-danger` | Assertive | An action failed |

## Timing and layout

| Behavior | Detail |
|---|---|
| Default duration | 4000 ms |
| Sticky | `duration: 0`. Stays until the user dismisses it, code calls `dismiss(id)`, or it is evicted (below) |
| Pause | The timer stops while the pointer is over the toast or focus is inside it |
| Resume | Continues with the time that was left, not the full duration |
| Max visible | 3 in total, across all tones. A fourth toast evicts the oldest, **including a sticky one** |
| Order | Info and success toasts stack in the polite region, danger toasts in the region below it, newest last in each. Mixed tones are therefore grouped by region, not strictly by time |
| Position | `fixed bottom-4 left-4 z-toast`; `w-[calc(100vw-6.5rem)]` below `sm` (stops short of the chat launcher), `sm:w-96` from `sm` up. `z-toast` (60) sits above modals (`z-overlay`, 50) |
| Click-through | The viewport is `pointer-events-none`; each toast is `pointer-events-auto`, so the empty space around toasts does not block clicks |
| Motion | `motion-safe:animate-slide-up` on entry. No exit animation |

## Accessibility

- **Two live regions, always mounted.** Info and success go in `role="status" aria-live="polite"`; danger goes in `role="alert" aria-live="assertive"`. Both exist before the first toast so screen readers have registered them. `aria-atomic="false"` means only the newly added toast is announced, not the whole region.
- **Polite vs assertive.** Assertive interrupts whatever the screen reader is saying, so reserve `danger` for real failures.
- **Dismiss button.** An `IconButton` with `label="Dismiss notification"`; its icon is `aria-hidden`. It is the only focusable element in a toast.
- **Keyboard reach.** The viewport is portaled to `document.body` after the app's own content, so its dismiss buttons come after everything else in the tab order. Keyboard users will often not get there before a toast expires: never make a toast the only place important information appears.
- **Pause on hover and focus.** Timers stop while the pointer is over the toast or focus is within it, so there is time to read.
- **Modals.** A toast renders above a modal visually, but the modal's focus trap and `aria-modal` keep keyboard and screen-reader attention inside the dialog. Report failures inside an open dialog inline.
- **Placement.** Bottom-left keeps the stack clear of the chat launcher at bottom-right (`fixed bottom-6 right-6`). From `sm` up the stack is 384px wide; below `sm` it is `100vw - 6.5rem` wide, which leaves the launcher's 80px corner clear.
- **Motion.** The entrance animation is behind `motion-safe:`.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Make the title the outcome ("Lead deleted") and the description the next step ("Check your connection and try again.") | Show a form validation error only in a toast; use the field's `error` |
| Use `danger` for failures and `success` for completions | Use `danger` just to get attention; it interrupts screen readers |
| Show save errors inline inside an open `Modal` | Rely on a toast for a failure the user cannot reach while a dialog traps focus |
| Keep the returned id when you need `dismiss(id)` later | Fire one toast per row in a bulk action; only 3 show and older ones are dropped. Send one summary toast |
| Reserve `duration: 0` for state you will clear from code | Make a sticky toast the only record of something important; a fourth toast can evict it |
| Keep messages to a sentence or two of plain text | Put buttons, links or raw error text in a toast |

## Example

```jsx
import { useToast } from './components/ui/useToast';

function LeadActions({ lead, onAdd }) {
  const { toast, dismiss } = useToast();

  async function handleAdd() {
    try {
      await onAdd(lead);
      toast({ tone: 'success', title: 'Lead added', description: lead.name });
    } catch {
      toast({
        tone: 'danger',
        title: "Couldn't add lead",
        description: 'Check your connection and try again.',
      });
    }
  }

  // Sticky until the code that raised it clears it
  function watchConnection(onReconnected) {
    const id = toast({ title: 'Reconnecting…', duration: 0 });
    onReconnected(() => dismiss(id));
  }

  // ...
}
```
