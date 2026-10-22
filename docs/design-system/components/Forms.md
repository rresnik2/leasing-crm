# Forms: Field, Input, Select, Textarea

Source: `src/components/ui/` (`Field.jsx`, `Input.jsx`, `Select.jsx`, `Textarea.jsx`, `controlStyles.js`).

## Description

- **Input**: single-line text, email, tel, number, date, search.
- **Select**: choose one value from a known list (status, unit type, move reason). Use a native select; keep lists short enough to scan.
- **Textarea**: multi-line free text such as notes. Defaults to 3 rows.
- **Field**: the layout wrapper (label, control, hint, error). Input, Select and Textarea use it for you; use it directly only to wrap a custom control.

**`label` vs bare control.** Pass `label` and the control renders inside a `Field` with a visible label, hint and error. Omit `label` and you get the bare control: no label, no hint or error text, so you **must** pass `aria-label` (or `aria-labelledby`). `error` still sets `aria-invalid` and the invalid styling, but nothing shows the message. Select (for its chevron) and Input with `leadingIcon` keep a `relative` wrapper `div`; otherwise there is no wrapper. Bare is for toolbars and filters such as a search box.

All three controls share one visual language via `controlClasses({ invalid, size, multiline })` in `controlStyles.js`. `multiline` (used by Textarea) drops the fixed height and `size`: `h-auto px-3 py-2 text-body`, so rows set the height.

## Props

Shared by Input, Select and Textarea (every native attribute is also accepted and spread onto the control):

| Property | Type | Default | Description |
|---|---|---|---|
| `label` | node | none | Renders inside `Field` with a visible `<label>`. Omit for a bare control |
| `hint` | node | none | Helper text under the control. Hidden while `error` is set |
| `error` | node | none | Error text. Sets `aria-invalid="true"` and invalid styling |
| `required` | bool | `false` | Sets native `required` and shows an `aria-hidden` `*` after the label |
| `id` | string | `useId()` | Control id. Label, hint and error ids derive from it |
| `wrapperClassName` | string | none | Class for the `Field` wrapper, or for the `relative` wrapper when bare. A bare Input without `leadingIcon` and a bare Textarea have no wrapper, so it is ignored there (use `className`) |
| `className` | string | none | Merged last onto the control element |
| `aria-describedby` | string | none | Merged after the hint/error id |
| `ref` | ref | none | Forwarded to the `<input>`, `<select>` or `<textarea>` |

Per control:

| Property | Applies to | Type | Default | Description |
|---|---|---|---|---|
| `size` | Input, Select | `'sm' \| 'md'` | `'md'` | `md` is `h-10`; `sm` is `h-8` with `text-caption`. Not forwarded to the DOM |
| `leadingIcon` | Input | node | none | Icon at the left, `aria-hidden` and `pointer-events-none`. Use a 16px icon (`h-4 w-4`) |
| `options` | Select | `(string \| { value, label })[]` | none | Rendered as `<option>`s. `children` are rendered after them |
| `placeholder` | Select | string | none | Adds a first `<option value="" disabled>`. Uncontrolled selects default to it |
| `rows` | Textarea | number | `3` | Visible rows. Textarea has no `size` prop and no fixed height |

`Field` props: `id` (required), `label`, `required`, `hint`, `error`, `children`, `className` (on the wrapper `div`). Any other props are spread onto that `div`.

## States

| State | Appearance |
|---|---|
| Default | `border-line-strong` on `bg-surface`; placeholder in `text-fg-subtle` |
| Hover | No separate style; the border stays `line-strong` |
| Focus | Border becomes `focus` with a 2px `focus/40` ring (shown on mouse and keyboard focus) |
| Invalid | `border-danger` with a `danger/30` ring on focus; `error` text in `text-danger-strong` below |
| Disabled | `bg-surface-muted`, `text-fg-subtle`, `cursor-not-allowed` |

## Accessibility

- **Label association.** `Field` renders `<label htmlFor={id}>`, so clicking the label focuses the control and screen readers announce it. Never use `placeholder` as the label.
- **`aria-invalid`.** `error` sets `aria-invalid="true"`. A caller-supplied `aria-invalid` is respected when there is no `error`.
- **`aria-describedby`.** Points at the error id when there is an error, otherwise the hint id. It is only set when a `label` is present, because the hint/error element only exists inside a `Field`. Your own `aria-describedby` is always kept.
- **Select placeholder.** A native select with no empty option silently shows its first option, so an unanswered field looks answered. The disabled `value=""` placeholder keeps "nothing chosen" visible and stops it being submitted by mistake. Pair it with `required` when a choice is mandatory.
- **Required.** The `*` is `aria-hidden`; the control's native `required` is what assistive tech announces.
- **Error text** does not announce itself. On submit, move focus to the first invalid control.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Give every control a `label`, or `aria-label` when bare | Use `placeholder` as the only label |
| Use `hint` for format help ("10-digit phone") and `error` for what went wrong and how to fix it | Show a hint and an error together; the error replaces the hint |
| Pass `placeholder` to a Select with no sensible default | Leave a required Select without a placeholder |
| Set `type`, `inputMode` and `autoComplete` on Input so mobile keyboards and autofill work | Hard-code `border-gray-*`, `bg-white` or hex colors on a control |
| Use `wrapperClassName` for layout (`col-span-2`, `max-w-xs`) | Put layout classes in `className`; that targets the control itself |
| Use `Textarea` for notes | Use `Input` with a tall height for multi-line text |

## Examples

Labeled input with hint and error:

```jsx
<Input
  label="Email"
  type="email"
  required
  hint="We only use this for tour reminders."
  error={errors.email}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

Select with options and a placeholder:

```jsx
import { UNIT_TYPES } from './constants/leadOptions';

<Select
  label="Unit type"
  placeholder="Choose a unit type"
  options={UNIT_TYPES}   // or [{ value: 'studio', label: 'Studio' }, ...]
  value={unitType}
  onChange={(e) => setUnitType(e.target.value)}
/>
```

Bare search input with `aria-label` and `leadingIcon`:

```jsx
<Input
  type="search"
  aria-label="Search leads"
  placeholder="Search leads"
  size="sm"
  wrapperClassName="max-w-xs"
  leadingIcon={<SearchIcon className="h-4 w-4" />}
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>
```
