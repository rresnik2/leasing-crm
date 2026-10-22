# Leasing CRM Design System

The shared visual language and component library for Leasing CRM. It sits on top of
Tailwind CSS v3: **tokens** live in `src/index.css` (CSS variables) and
`tailwind.config.js` (Tailwind names); **primitives** live in `src/components/ui/`;
**domain patterns** (lead-specific) live in `src/components/`.

## Principles

1. **Tokens, not raw values.** Use `bg-surface`, `text-fg-muted`, `border-line`,
   `bg-brand`, `rounded-control`, `shadow-card`. Never `bg-white`, `text-gray-600`,
   `bg-blue-600` or hex values in components. The one exception is categorical hues
   inside `Badge` (see Badge tones).
2. **One source per decision.** Lead statuses, unit types and move reasons come from
   `src/constants/leadOptions.js`. Status colors come from `STATUS_TONES`.
3. **Accessible by default.** Every interactive primitive has a visible
   `focus-ring`, a real accessible name, and keyboard support. Animations use
   `motion-safe:`.
4. **Composable.** Every primitive accepts `className` (merged last via `cn`) and
   spreads remaining props onto its root element.

---

## Tokens

### Color

| Token (Tailwind) | Use |
|---|---|
| `canvas` | Page background |
| `surface` / `surface-muted` | Cards, panels, modals / subtle fills, hover rows |
| `line` / `line-strong` | Dividers, card borders / form-control borders |
| `fg` / `fg-muted` / `fg-subtle` / `fg-inverse` | Primary text / secondary text and labels / captions and placeholders (on `surface` only — fails AA on `canvas`) / text on solid fills |
| `brand` · `brand-hover` · `brand-subtle` · `brand-strong` | Primary actions, links, selection; `strong` is text on `subtle` |
| `danger` · `danger-hover` · `danger-subtle` · `danger-strong` | Destructive actions, errors |
| `success` · `success-subtle` · `success-strong` | Confirmations. Solid `success` is for icons/fills only, never small text |
| `warning` · `warning-subtle` · `warning-strong` | Cautions. Solid `warning` is for icons/fills only |
| `focus` | Focus rings |

### Typography

| Class | Size / line-height / weight | Use |
|---|---|---|
| `text-display` | 30/36, 700 | Page title |
| `text-heading` | 20/28, 600 | Modal titles, section headings |
| `text-title` | 18/28, 600 | Card titles (lead name) |
| `text-body` | 14/20 | Default UI text |
| `text-label` | 14/20, 500 | Form labels, button text |
| `text-caption` | 12/16 | Metadata, hints, helper text |

### Shape, elevation, layering, motion

| Category | Tokens |
|---|---|
| Radius | `rounded-control` (8px: inputs, buttons), `rounded-card` (12px: cards, modals, panels), `rounded-full` (badges, pills, avatars) |
| Shadow | `shadow-card` (resting cards), `shadow-raised` (hover / floating buttons), `shadow-overlay` (modals, chat panel, toasts) |
| Z-index | `z-floating` (40: chat launcher/panel), `z-overlay` (50: modals), `z-toast` (60) |
| Duration | `duration-fast` (150ms: hover/color), `duration-base` (200ms: enter), `duration-slow` (300ms) |
| Easing | `ease-standard` |
| Animation | `animate-fade-in` (backdrops), `animate-scale-in` (dialogs), `animate-slide-up` (toasts) — always behind `motion-safe:` |
| Focus | `.focus-ring` component class (2px `focus` ring, 2px offset, `:focus-visible` only) |

### Spacing

Tailwind's default 4px scale. Conventions: control padding `px-3 py-2`; card padding
`p-5` (`p-4` on mobile is fine); stack gaps `gap-4` between fields, `gap-6` between
sections; page gutter `px-4 sm:px-6`, content width `max-w-5xl`.

---

## Component contracts

All primitives are `.jsx` function components with a default export, live in
`src/components/ui/`, use `cn` from `./cn` to merge classes, and pass `...rest` to
the root element. React 19: `ref` is a normal prop — accept it and forward it to the
underlying DOM element where noted.

### Actions — `Button.jsx`, `IconButton.jsx`, `Spinner.jsx`

**Button**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | primary: `bg-brand text-fg-inverse hover:bg-brand-hover`; secondary: `bg-surface border border-line-strong text-fg hover:bg-surface-muted`; ghost: transparent, `text-fg-muted hover:bg-surface-muted hover:text-fg`; danger: `bg-danger text-fg-inverse hover:bg-danger-hover` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | sm `h-8 px-3 text-caption font-medium`; md `h-10 px-4 text-label`; lg `h-11 px-5 text-label` |
| `loading` | bool | `false` | Shows `Spinner` before the label, sets `disabled` and `aria-busy` |
| `leadingIcon` / `trailingIcon` | node | — | Rendered `aria-hidden` |
| `fullWidth` | bool | `false` | `w-full` |
| `type` | string | `'button'` | **Defaults to `button`, not `submit`** — pass `type="submit"` explicitly in forms |
| `ref` | ref | — | Forwarded to `<button>` |

Base: `inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors duration-fast ease-standard focus-ring disabled:opacity-50 disabled:cursor-not-allowed`.

**IconButton** — square icon-only button. Props: `label` (**required**; becomes `aria-label` and `title`), `variant` (`'ghost'` default; same variants as Button), `size` (`'sm'` 32px / `'md'` 40px), `children` (the icon), `ref`, `type` default `'button'`.

**Spinner** — `size` `'sm'` (16px) | `'md'` (20px), `label` (default `'Loading'`), `className`. Renders an animated SVG circle using `currentColor` with `motion-safe:animate-spin`, wrapped in `<span role="status">` with a `sr-only` label. When used inside Button, pass `label` via Button so it is not announced twice (Button renders Spinner with `aria-hidden` and relies on `aria-busy`).

### Forms — `Field.jsx`, `Input.jsx`, `Select.jsx`, `Textarea.jsx`, `controlStyles.js`

**controlStyles.js** exports `controlClasses({ invalid = false, size = 'md' })` returning the shared class string for text-like controls:
`w-full rounded-control border bg-surface text-body text-fg placeholder:text-fg-subtle transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-focus/40 focus:border-focus disabled:bg-surface-muted disabled:text-fg-subtle disabled:cursor-not-allowed`
plus `border-line-strong` (or `border-danger focus:ring-danger/30 focus:border-danger` when invalid) plus size `h-10 px-3` (md) / `h-8 px-2.5 text-caption` (sm). Textarea overrides height with `h-auto py-2`.

**Field** — layout wrapper that ties a label, control, hint and error together.

| Prop | Type | Notes |
|---|---|---|
| `id` | string | **Required.** The control's id |
| `label` | node | Rendered as `<label htmlFor={id} className="text-label text-fg">` |
| `required` | bool | Appends a `*` marked `aria-hidden` after the label (the control itself carries `required`) |
| `hint` | node | `<p id={id + '-hint'} className="text-caption text-fg-subtle">` — hidden when `error` is set |
| `error` | node | `<p id={id + '-error'} className="text-caption text-danger-strong">` |
| `children` | node | The control |
| `className` | string | On the wrapper (`flex flex-col gap-1.5`) |

**Input / Select / Textarea** — accept every native attribute plus:

| Prop | Type | Notes |
|---|---|---|
| `label` | node | When given, the control renders inside `Field`. When omitted, renders the bare control (caller must supply `aria-label`) |
| `hint`, `error` | node | Passed to Field. `error` sets `aria-invalid="true"` and invalid styling |
| `id` | string | Defaults to `useId()` |
| `size` | `'sm' \| 'md'` | Default `'md'` (Input/Select only). Note: shadows the native `size` attribute, which is fine |
| `wrapperClassName` | string | Passed to Field's `className` |
| `className` | string | Merged onto the control element |
| `ref` | ref | Forwarded to the control element |

`aria-describedby` is set to the error id when there is an error, otherwise the hint id when there is a hint.

Input extra: `leadingIcon` (node) — rendered absolutely at the left inside a `relative` wrapper with `pointer-events-none text-fg-subtle`, and the input gets `pl-9`.

Select extras: `options` — array of strings or `{ value, label }` objects (rendered as `<option>`s; `children` also allowed); `placeholder` — when set, renders a first `<option value="" disabled>` with that text so an empty value is visible instead of silently showing the first option. Uses `appearance-none` with a chevron SVG positioned at the right (`pointer-events-none`), `pr-9`.

Textarea extra: `rows` default 3.

### Display — `Card.jsx`, `Badge.jsx`, `StatusBadge.jsx`, `EmptyState.jsx`, `Skeleton.jsx`, and `src/components/PipelineProgress.jsx`

**Card**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `as` | element type | `'div'` | e.g. `'form'`, `'section'` |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | none / `p-4` / `p-5` / `p-6` |
| `interactive` | bool | `false` | Adds `cursor-pointer hover:shadow-raised hover:border-line-strong transition-shadow duration-fast focus-ring`, `role="button"`, `tabIndex={0}`, and calls `onClick` on Enter/Space (Space: `preventDefault` to stop page scroll). Only when `as` is not a native interactive element |

Base: `bg-surface border border-line rounded-card shadow-card`.

**Badge**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `tone` | see below | `'neutral'` | |
| `size` | `'sm' \| 'md'` | `'md'` | sm `px-2 py-0.5 text-caption`; md `px-2.5 py-0.5 text-caption font-medium` |
| `dot` | bool | `false` | Leading 6px `rounded-full` dot in the tone's dot color, `aria-hidden` |

Base: `inline-flex items-center gap-1.5 rounded-full whitespace-nowrap`.

Tones (bg / text / dot). Semantic tones use tokens; categorical hue tones are the **only** place raw Tailwind palette classes are allowed, and they must be complete static strings so Tailwind's scanner sees them:

| Tone | Classes | Dot |
|---|---|---|
| `neutral` | `bg-surface-muted text-fg-muted ring-1 ring-inset ring-line` | `bg-fg-subtle` |
| `brand` | `bg-brand-subtle text-brand-strong` | `bg-brand` |
| `success` | `bg-success-subtle text-success-strong` | `bg-success` |
| `warning` | `bg-warning-subtle text-warning-strong` | `bg-warning` |
| `danger` | `bg-danger-subtle text-danger-strong` | `bg-danger` |
| `blue` · `yellow` · `purple` · `indigo` · `orange` · `green` · `teal` · `red` · `rose` | `bg-{hue}-100 text-{hue}-800` | `bg-{hue}-500` |

**StatusBadge** — `{ status, size, className }` → `<Badge tone={STATUS_TONES[status] ?? 'neutral'} dot>{status}</Badge>`.

**EmptyState** — `{ icon?, title, description?, action?, className }`. Centered column, `py-12 px-6`, icon in a 48px `rounded-full bg-surface-muted text-fg-subtle` circle, title `text-title text-fg`, description `text-body text-fg-muted max-w-sm`, `action` (node, usually a Button) below with `mt-4`.

**Skeleton** — `{ className }` → `<div aria-hidden="true" className={cn('rounded-control bg-line motion-safe:animate-pulse', className)} />`. Callers size it (`h-4 w-32`). Wrap groups of skeletons in a container with `role="status"` and an `sr-only` "Loading…" label.

**PipelineProgress** (domain pattern, `src/components/PipelineProgress.jsx`) — shows where a lead is in `PIPELINE_STAGES`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `status` | string | — | Any value from `LEAD_STATUSES` |
| `variant` | `'compact' \| 'steps'` | `'compact'` | compact: a row of 7 thin `h-1.5 rounded-full flex-1` segments, `gap-1`, filled `bg-brand` up to and including the current stage, `bg-line` after; `role="img"` with `aria-label="Pipeline: stage 3 of 7, Tour Scheduled"`. steps: an `<ol aria-label="Leasing pipeline">` of the 7 stages with a numbered/checked circle and `text-caption` label each; completed = `bg-brand text-fg-inverse` check, current = `ring-2 ring-brand bg-brand-subtle text-brand-strong` + `aria-current="step"`, upcoming = `bg-surface-muted text-fg-subtle`; connector lines between circles; each item has an `sr-only` "completed"/"current"/"upcoming" suffix; on narrow screens labels may hide below `sm:` except the current one |

Closed statuses (`CLOSED_STATUSES`): all segments/steps render in the upcoming style at 60% opacity with `Off pipeline` in `text-caption text-fg-subtle` beside the bar (compact) or, together with a `StatusBadge`, above the steps (steps). Compact omits the badge because lead cards already show one; pair it with a `StatusBadge` wherever the status matters. aria-label becomes `"Pipeline: off pipeline, Search Hold"`. Unknown status: treat as stage 0 not started (nothing filled).

### Overlays & feedback — `Modal.jsx`, `ConfirmDialog.jsx`, `ToastProvider.jsx`, `toastContext.js`, `useToast.js`

**Modal**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `open` | bool | — | Renders nothing when false |
| `onClose` | fn | — | Called on Escape, backdrop click, and the header close button |
| `title` | node | — | `<h2 id={titleId} className="text-heading text-fg">`; dialog has `aria-labelledby={titleId}` |
| `description` | node | — | `<p id={descId} className="text-body text-fg-muted">`; `aria-describedby` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | `max-w-md` / `max-w-xl` / `max-w-2xl` |
| `footer` | node | — | Sticky footer row `flex justify-end gap-3 border-t border-line px-6 py-4` |
| `initialFocusRef` | ref | — | Focused on open; otherwise the first focusable element in the body, else the panel |
| `closeOnBackdrop` | bool | `true` | |
| `hideCloseButton` | bool | `false` | Header close is an `IconButton` with `label="Close"` |
| `children` | node | — | Scrollable body `overflow-y-auto px-6 py-5` |

Behavior requirements:
- Render through `createPortal(…, document.body)`.
- Backdrop: `fixed inset-0 z-overlay bg-fg/50 motion-safe:animate-fade-in`, flex-centered with `p-4`. Panel: `role="dialog" aria-modal="true"`, `w-full bg-surface rounded-card shadow-overlay max-h-[90vh] flex flex-col motion-safe:animate-scale-in`, `tabIndex={-1}`. Header `flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line`.
- Escape and the Tab focus trap are handled in an `onKeyDown` on the panel **and only when `panelRef.current.contains(e.target)`** — React portal events bubble through the React tree, so a `ConfirmDialog` opened from inside a Modal must not also close or trap its parent.
- Backdrop closes only when the press both started and ended on the backdrop itself (`e.target === e.currentTarget` on `mousedown` and `click`), so a drag that ends outside the panel doesn't close it.
- On open, remember `document.activeElement`; on close/unmount, restore focus to it.
- Lock page scroll while any modal is open with a module-level open-count: increment on open, set `document.body.style.overflow = 'hidden'`; decrement on close and restore only when the count reaches 0.

**ConfirmDialog** — built on Modal `size="sm"`. Props: `open`, `title`, `description`, `confirmLabel` (`'Confirm'`), `cancelLabel` (`'Cancel'`), `tone` (`'danger'` default | `'primary'` — sets the confirm Button variant), `loading` (passed to the confirm Button), `onConfirm`, `onCancel`. Footer: Cancel (secondary) then Confirm. Initial focus goes to **Cancel** (safe default for destructive actions). `onCancel` is also the Modal's `onClose`.

**Toasts**
- `toastContext.js`: `export const ToastContext = createContext(null)`.
- `useToast.js`: `export function useToast()` returns the context value; throws a clear error if used outside `ToastProvider`.
- `ToastProvider.jsx` (default export): holds a toast list in state and provides `{ toast, dismiss }`.
  - `toast({ title, description, tone = 'info', duration = 4000 })` returns the id. Tones: `info` (brand icon), `success`, `danger`. `duration: 0` means sticky.
  - Viewport: `fixed bottom-4 left-4 z-toast flex flex-col gap-2 w-[calc(100vw-2rem)] sm:w-96` (bottom-left so it never covers the chat launcher at bottom-right). Max 3 visible; oldest drops first.
  - Each toast: `bg-surface border border-line rounded-card shadow-overlay p-4 flex gap-3 motion-safe:animate-slide-up`, a tone icon (inline SVG, `aria-hidden`, colored `text-brand` / `text-success` / `text-danger`), `title` in `text-label text-fg`, `description` in `text-caption text-fg-muted`, and an `IconButton` `label="Dismiss notification"` size `sm`.
  - Accessibility: `info`/`success` toasts sit in a `role="status" aria-live="polite"` region; `danger` toasts in a `role="alert" aria-live="assertive"` region (two regions, both inside the viewport). Auto-dismiss timers pause while the pointer is over or focus is within the toast.

---

## Inventory

| Component | File | Kind |
|---|---|---|
| Button, IconButton, Spinner | `src/components/ui/` | Primitive |
| Field, Input, Select, Textarea | `src/components/ui/` | Primitive |
| Card, Badge, StatusBadge, EmptyState, Skeleton | `src/components/ui/` | Primitive |
| Modal, ConfirmDialog, ToastProvider + useToast | `src/components/ui/` | Primitive |
| PipelineProgress | `src/components/PipelineProgress.jsx` | Domain pattern |

Per-component docs: [`components/`](./components/). A live gallery of every component
renders in development at `http://localhost:5173/#design-system` (`src/DesignSystemGallery.jsx`,
excluded from production builds).

## Open questions

- **Similar reds.** `red` (Leased Elsewhere) and `rose` (Search Hold)
  are hard to tell apart side by side. Consider moving Search Hold to `warning` or a neutral tone.
- **Dark mode.** Tokens are CSS variables, so a `prefers-color-scheme: dark` block in
  `src/index.css` is all a dark theme needs — except the categorical Badge hues, which use raw
  palette classes and would need `dark:` variants.
- **Sticky toasts.** A fourth toast evicts the oldest even if it is sticky (`duration: 0`).
- **Select placeholder color.** Native `<select>` can't style its placeholder option, so
  "Select unit type" renders in `text-fg`, not `text-fg-subtle`.
- **Pipeline history.** See [PipelineProgress open questions](./components/PipelineProgress.md#open-questions).
