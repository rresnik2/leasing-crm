# Card, Badge, StatusBadge, EmptyState, Skeleton

The "Display" primitives in `src/components/ui/`. All five merge `className` last via `cn` and
spread remaining props onto their root element. `Card` also takes `ref` as a normal React 19
prop and forwards it to the root (no `forwardRef`); on the others a `ref` passed in the props
reaches the root element through the spread. The lead-specific `PipelineProgress` has its own
page: [PipelineProgress.md](./PipelineProgress.md).

## Description

- **Card** — the standard container: `surface` background, `line` border, `rounded-card`, `shadow-card`. Can render as any element (`section`, `form`, `li`) and can be made clickable.
- **Badge** — small pill for a status, priority, or count. Fourteen tones (five semantic, nine categorical hues; see Badge tones) plus an optional leading dot.
- **StatusBadge** — a `Badge` bound to the lead pipeline: pass a status string, get the right tone from `STATUS_TONES`.
- **EmptyState** — centered "nothing here yet" block with an optional icon, a description, and a call to action.
- **Skeleton** — a pulsing placeholder block shown while content loads. You size it with `className`.

## Variants

### Card padding

| `padding` | Class | Use when |
|---|---|---|
| `none` | — | The card holds edge-to-edge content (a table, a list with its own row padding) |
| `sm` | `p-4` | Dense cards, mobile layouts |
| `md` | `p-5` | Default, e.g. lead cards and panels |
| `lg` | `p-6` | Roomy form or detail sections |

### Badge tones

Semantic tones use design tokens. The categorical hue tones are the **only** place in the design
system where raw Tailwind palette classes are allowed. They are written as complete static strings
in a lookup object (never assembled from template strings) so Tailwind's scanner can see them.
Unknown tones fall back to `neutral`.

| Tone | Badge classes | Dot | Use when |
|---|---|---|---|
| `neutral` | `bg-surface-muted text-fg-muted ring-1 ring-inset ring-line` | `bg-fg-subtle` | Default, inactive, or low-priority information |
| `brand` | `bg-brand-subtle text-brand-strong` | `bg-brand` | Selected, informational, "new", or high priority |
| `success` | `bg-success-subtle text-success-strong` | `bg-success` | Confirmed, complete |
| `warning` | `bg-warning-subtle text-warning-strong` | `bg-warning` | Needs attention |
| `danger` | `bg-danger-subtle text-danger-strong` | `bg-danger` | Errors and destructive actions |
| `blue` | `bg-blue-100 text-blue-800` | `bg-blue-500` | Categorical (lead status) |
| `yellow` | `bg-yellow-100 text-yellow-800` | `bg-yellow-500` | Categorical (lead status) |
| `purple` | `bg-purple-100 text-purple-800` | `bg-purple-500` | Categorical (lead status) |
| `indigo` | `bg-indigo-100 text-indigo-800` | `bg-indigo-500` | Categorical (lead status) |
| `orange` | `bg-orange-100 text-orange-800` | `bg-orange-500` | Categorical (lead status) |
| `green` | `bg-green-100 text-green-800` | `bg-green-500` | Categorical (lead status) |
| `teal` | `bg-teal-100 text-teal-800` | `bg-teal-500` | Categorical (lead status) |
| `red` | `bg-red-100 text-red-800` | `bg-red-500` | Categorical (lead status) |
| `rose` | `bg-rose-100 text-rose-800` | `bg-rose-500` | Categorical (lead status) |

Use the semantic tones (`success`, `warning`, `danger`, `brand`, `neutral`) for meaning. Use the hue
tones only when you need many visually distinct categories at once, as with lead statuses.

### Badge sizes

| `size` | Classes | Use when |
|---|---|---|
| `md` | `px-2.5 py-0.5 text-caption font-medium` | Default |
| `sm` | `px-2 py-0.5 text-caption` | Inside tight rows and table cells |

### Status tones (`STATUS_TONES`)

`StatusBadge` reads this map from `src/constants/leadOptions.js`. That file is the single source
for status colors; change a color there, not in a component.

| Status | Tone | Stage |
|---|---|---|
| New Inquiry | `blue` | Pipeline 1 |
| Contacted | `yellow` | Pipeline 2 |
| Tour Scheduled | `purple` | Pipeline 3 |
| Tour Completed | `indigo` | Pipeline 4 |
| Application Submitted | `orange` | Pipeline 5 |
| Approved | `green` | Pipeline 6 |
| Leased | `teal` | Pipeline 7 |
| Not Interested | `neutral` | Closed |
| Search Hold | `rose` | Closed |
| Leased Elsewhere | `red` | Closed |

Any status not in the map renders as `neutral`.

Priority badges (lead score) use `PRIORITY_TONES` the same way: `High` → `brand`, `Medium` → `warning`, `Low` → `neutral`. High is not `danger`: red already means Leased Elsewhere and destructive actions, so hot leads would read as errors.

## Props

**Card**

| Property | Type | Default | Description |
|---|---|---|---|
| `as` | `ElementType` | `'div'` | Root element, e.g. `'section'`, `'form'`, `'li'`, `'button'`, `'a'` |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Inner padding |
| `interactive` | `boolean` | `false` | Hover/focus styles plus button semantics (see Accessibility) |
| `onClick` | `function` | — | Click handler. With `interactive`, Enter and Space also call it |
| `onKeyDown` | `function` | — | Always passed through. When Card adds button semantics (`interactive` on a non-native element) it is called first, and if it calls `preventDefault()` the Enter/Space activation is skipped |
| `className` | `string` | — | Merged last |
| `ref` | `Ref` | — | Forwarded to the root element |

**Badge**

| Property | Type | Default | Description |
|---|---|---|---|
| `tone` | see Badge tones | `'neutral'` | Color family |
| `size` | `'sm' \| 'md'` | `'md'` | See Badge sizes |
| `dot` | `boolean` | `false` | Leading 6px `rounded-full` dot in the tone's dot color, `aria-hidden` |
| `children` | `ReactNode` | — | Badge text |
| `className` | `string` | — | Merged last |

**StatusBadge**

| Property | Type | Default | Description |
|---|---|---|---|
| `status` | `string` | — | A lead status. Rendered as the badge text; the tone comes from `STATUS_TONES[status]`, else `neutral` |
| `size` | `'sm' \| 'md'` | `'md'` | Passed to Badge |
| `className` | `string` | — | Merged last |

It always renders the dot, so status is never conveyed by color alone.

**EmptyState**

| Property | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | — | Rendered as an `<h3>` in `text-title text-fg` |
| `description` | `ReactNode` | — | `text-body text-fg-muted`, `max-w-sm`, `mt-1` |
| `icon` | `ReactNode` | — | Inline SVG (about 24px) in a 48px `rounded-full bg-surface-muted text-fg-subtle` circle, `aria-hidden` |
| `action` | `ReactNode` | — | Usually a `Button`, below with `mt-4` |
| `className` | `string` | — | Merged onto the wrapper (`flex flex-col items-center justify-center px-6 py-12 text-center`) |

**Skeleton**

| Property | Type | Default | Description |
|---|---|---|---|
| `className` | `string` | — | Size and shape: `h-4 w-32`, `h-10 w-10 rounded-full` |

Renders `<div aria-hidden="true" class="rounded-control bg-line motion-safe:animate-pulse …">`.

## States

| Component | State | Appearance |
|---|---|---|
| Card | Default | `bg-surface border border-line rounded-card shadow-card` |
| Card | Interactive, hover | `shadow-raised` and `border-line-strong`; cursor is a pointer |
| Card | Interactive, focus-visible | `.focus-ring`: 2px `focus` ring, 2px offset (keyboard focus only) |
| Badge | Default | Tone colors; `whitespace-nowrap`, so long text widens the pill rather than wrapping |
| Badge | With dot | 6px dot in the tone's dot color before the text |
| EmptyState | Without icon / description / action | Each is omitted entirely; the block stays centered |
| Skeleton | Loading | Pulses (`motion-safe:animate-pulse`); reduced-motion users see a static gray block |

Badges and Skeletons are not interactive, so they have no hover, focus, or disabled states.

## Accessibility

- **Card, non-interactive:** a plain container with no role. Pick a landmark or list element with `as` when it has meaning (`as="section"` with a heading, `as="li"` inside a `ul`).
- **Card, interactive on a `div`/`section`/etc.:** gets `role="button"` and `tabIndex={0}`. Enter and Space call `onClick(event)`; Space calls `preventDefault()` so the page does not scroll. Keys pressed inside a control nested in the card (an input, a button, a link) are ignored, so typing a space in a field does not trigger the card.
- **Card, `as="button"` or `as="a"`:** the browser already supplies the role, focus, and keyboard activation, so Card adds no `role`, `tabIndex`, or key handler. For `as="button"`, pass `type="button"` yourself and add `text-left` if the contents should align left.
- **Interactive card name:** a `role="button"` card is named from its contents. Keep the contents short and meaningful, or add `aria-label`. Do not put other buttons or links inside an interactive card without stopping propagation on them, because nested interactive elements confuse assistive tech.
- **Badge:** plain text in a `<span>`, no role. The dot is `aria-hidden`. Never rely on color alone: the badge text carries the meaning.
- **Contrast:** token tones and `-100`/`-800` hue pairs meet WCAG AA for the 12px text. `neutral` uses `fg-muted` on `surface-muted`.
- **EmptyState:** the icon is decorative (`aria-hidden`); the title is an `<h3>`, so place it under an `h2` section heading. The action is a real Button with its own accessible name.
- **Skeleton:** `aria-hidden`, so it is invisible to assistive tech. Wrap a group in a container with `role="status"` and an `sr-only` label so the loading state is announced once.
- **Motion:** pulse animation is behind `motion-safe:`.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use `StatusBadge` for any lead status | Hand-pick a `Badge` tone for a status, or keep a local status-to-color map in a component |
| Put new status colors in `STATUS_TONES` | Add raw palette classes (`bg-blue-100`) outside `Badge.jsx` |
| Use `interactive` Cards for whole-card click targets (open a lead) | Put several buttons inside an interactive Card without `stopPropagation` |
| Use `as="a"` / `as="button"` when the card truly navigates or acts | Add `role="button"` yourself on a Card already rendered as `button` |
| Keep badge text short (one to three words) | Put sentences in a Badge, or use it as a button |
| Size Skeletons to match the real content (`h-6 w-40` for a name) | Show a Skeleton with no live-region wrapper on a long load |
| Give EmptyState a clear next step in `action` | Use EmptyState for errors; use a danger message or toast instead |

## Example

```jsx
import Card from './components/ui/Card';
import Badge from './components/ui/Badge';
import StatusBadge from './components/ui/StatusBadge';
import EmptyState from './components/ui/EmptyState';
import Skeleton from './components/ui/Skeleton';
import Button from './components/ui/Button';

// Clickable lead card
<Card interactive onClick={() => openLead(lead)} aria-label={`Open ${lead.name}`}>
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-title text-fg">{lead.name}</h2>
    <StatusBadge status={lead.status} />
  </div>
  <Badge tone="brand" size="sm" dot className="mt-2">High priority</Badge>
</Card>

// Empty list
<EmptyState
  icon={<UsersIcon className="h-6 w-6" />}
  title="No leads yet"
  description="Add your first lead to start tracking it through the pipeline."
  action={<Button onClick={openAddLead}>Add lead</Button>}
/>

// Loading list
<div role="status" className="flex flex-col gap-3">
  <span className="sr-only">Loading leads…</span>
  <Skeleton className="h-24 w-full rounded-card" />
  <Skeleton className="h-24 w-full rounded-card" />
</div>
```
