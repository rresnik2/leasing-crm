# PipelineProgress (New Component)

Domain pattern, not a primitive. Source: `src/components/PipelineProgress.jsx`. Stage and status lists come from `src/constants/leadOptions.js` (`PIPELINE_STAGES`, `CLOSED_STATUSES`, `LEAD_STATUSES`). In use: `LeadCard` (`compact`) and `LeadModal` (`steps`).

## Problem

A lead moves through 7 pipeline stages (New Inquiry through Leased) and can leave the funnel through 3 off-pipeline statuses (Not Interested, Search Hold, Leased Elsewhere). The UI only showed a colored status pill, so a glance at a lead said *what* its status was but not *how far along* it was.

## Existing patterns

| Related component | Similarity | Why it's not enough |
|---|---|---|
| `StatusBadge` | Shows the lead's current status, colored by `STATUS_TONES` | Names one status; gives no sense of position, remaining stages or the 7-stage funnel |
| Generic progress bar (`role="progressbar"`) | A filled track that shows progress | Assumes a continuous 0-100% value. It has no named stages, no "finished" end state, and no way to say "this lead left the funnel" |

PipelineProgress complements `StatusBadge` rather than replacing it: the badge names the status, this shows where it sits.

## Proposed design

### Props

| Property | Type | Default | Description |
|---|---|---|---|
| `status` | `string` | none | A value from `LEAD_STATUSES`. A pipeline stage sets the position, a closed status renders off-pipeline, anything else (including `undefined`) renders "not started" |
| `variant` | `'compact' \| 'steps'` | `'compact'` | Layout. Any value other than `'steps'` renders `compact` |
| `className` | `string` | none | `compact`: merged onto the root with `cn`. `steps`: set on the outer wrapper `div` (not on the `<ol>`) |
| `...rest` | | none | Spread onto the root `div`. In `compact` it comes after `role` and `aria-label`, so either can be overridden |

### Variants

| Variant | Where | Layout |
|---|---|---|
| `compact` | Lead cards | One row of 7 thin segments (`h-1.5 flex-1 rounded-full`, `gap-1`, row has `min-w-32`). Segments up to and including the current stage are `bg-brand`, the rest `bg-line`. The row wraps if there is no room for the caption |
| `steps` | Lead detail modal | An `<ol>` of 7 numbered circles (`h-6 w-6`, `sm:h-7 sm:w-7`) joined by `h-0.5` connector lines, each with a `text-caption` stage label below. Completed steps show a check, the current step is ringed, upcoming steps are muted. Connectors are filled up to the current step |

### States

| State | `compact` | `steps` |
|---|---|---|
| In pipeline (stage N of 7) | Segments 1 to N are `bg-brand` | Steps before N are completed (check on `bg-brand`); step N is current (`bg-brand-subtle text-brand-strong ring-2 ring-brand`, label `text-fg font-medium`, `aria-current="step"`); later steps are upcoming (`bg-surface-muted text-fg-subtle ring-1 ring-inset ring-line`) |
| Leased (stage 7, finished) | All 7 segments `bg-brand`. No separate "finished" treatment | Step 7 renders as **completed** (check, `bg-brand`), not as an in-progress step, and all connectors are filled. It still carries `aria-current="step"`, keeps the visible `text-fg font-medium` label, and reads ", completed" to screen readers |
| Closed (Not Interested, Search Hold, Leased Elsewhere) | Nothing filled; segment row at `opacity-60`; an "Off pipeline" caption (`text-caption text-fg-subtle`) beside it. **No `StatusBadge`**: lead cards already show one, so pair it yourself where the status matters | Nothing filled; circles and connectors at `opacity-60` (labels stay full contrast); above it a `StatusBadge` (md) plus "Off pipeline" caption (`mb-3`). No step has `aria-current` |
| Unknown or missing status | Nothing filled, no caption; `aria-label="Pipeline: not started"` | Nothing filled, no badge or caption; every step reads "upcoming" |

### Tokens used

| Category | Tokens |
|---|---|
| Color | `bg-brand` (filled segment, connector, completed circle), `bg-line` (empty segment, empty connector), `bg-brand-subtle` + `text-brand-strong` + `ring-brand` (current circle), `bg-surface-muted` + `text-fg-subtle` + `ring-line` (upcoming circle), `text-fg-inverse` (check), `text-fg` / `text-fg-muted` / `text-fg-subtle` (labels), `text-fg-subtle` (Off pipeline caption) |
| Spacing | `gap-1` between segments, `gap-x-3 gap-y-1.5` for the compact row, `h-1.5` segments, `h-0.5` connectors, `h-6 w-6` / `sm:h-7 sm:w-7` circles with `sm:mx-1`, `mt-1.5` under circles, `mb-3` under the closed header |
| Typography | `text-caption` for labels, captions and circle numbers; `font-medium` on circle numbers and the current label |
| Shape | `rounded-full` for segments and circles |
| Motion | None. Opacity (`opacity-60` on the bar, or on circles and connectors in `steps`) is the only closed-state change |

### Accessibility

- **`compact`:** the root is `role="img"` with an `aria-label`; the segments are decorative and the "Off pipeline" caption is not read separately.
  - In pipeline: `Pipeline: stage 3 of 7, Tour Scheduled`
  - Closed: `Pipeline: off pipeline, Search Hold` (this is the only place the status name lives in this variant)
  - Unknown: `Pipeline: not started`
- **`steps`:** an `<ol role="list" aria-label="Leasing pipeline">` (the explicit role keeps list semantics now that list styling is reset). Circles, check icons and connectors are `aria-hidden`; each stage label carries an `sr-only` suffix (`, completed` / `, current` / `, upcoming`). The current stage has `aria-current="step"`.
- **Narrow screens (below `sm`):** non-current labels use `sr-only sm:not-sr-only`, so they are hidden visually but still announced. Only the current label stays visible, and its step gets `grow-[3]` for room; the others shrink to circles. From `sm` up, every label shows and steps share width equally.
- **Color is never the only signal:** position is carried by the check, ring and number, and by the label text.
- **Closed contrast:** in `steps`, only the circles and connectors dim (`opacity-60`); stage labels keep `fg-subtle`/`fg-muted` contrast (AA on `surface`).

### Do's and Don'ts

| Do | Don't |
|---|---|
| Show a `StatusBadge` near a `compact` bar when the status name matters (lead cards already do) | Use `compact` alone for a closed lead: the visible UI says only "Off pipeline", and the status name is in the `aria-label` |
| Use `steps` where there is room for labels (detail views, modals) | Use `steps` inside a lead card list; use `compact` |
| Pass the lead's real `status` string | Pass a made-up label; anything outside `LEAD_STATUSES` renders as "not started" |
| Add stages or closed statuses in `leadOptions.js` | Hard-code stage names or a count of 7 in a caller |

### Example

```jsx
import PipelineProgress from './components/PipelineProgress';
import StatusBadge from './components/ui/StatusBadge';

// Lead card: the badge names the status, the bar shows the position
<div className="flex items-center justify-between gap-3">
  <h2 className="text-title text-fg">{lead.name}</h2>
  <StatusBadge status={lead.status} />
</div>
<PipelineProgress status={lead.status} variant="compact" className="mt-4" />

// Lead detail modal
<PipelineProgress status={editedLead.status} variant="steps" />
```

## Open questions

1. **Search Hold:** should a paused lead remember the stage it stopped at, so the bar shows that stage dimmed instead of empty? This needs a stored `pausedFromStage` (or a status history); today the status string is all we have.
2. **Not Interested / Leased Elsewhere:** should closed leads show the stage they reached before closing? Useful for funnel drop-off at a glance, but needs the same history data.
3. **Interactive steps:** should the `steps` variant become clickable to change status (buttons inside the `<li>`s, a confirm step for skipping stages)? Today status changes happen in a `Select` in the modal.
4. **Compact closed state:** is "Off pipeline" enough on its own, or should the caption name the status for views where no `StatusBadge` is nearby?
