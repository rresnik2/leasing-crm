# Button, IconButton, Spinner

The "Actions" primitives in `src/components/ui/`. All three are native-element wrappers: they
merge `className` last via `cn` and spread remaining props onto the root. `ref` is a normal
React 19 prop (no `forwardRef`): Button and IconButton forward it to the `<button>`, and Spinner's
reaches its root `<span>` through the rest spread.

## Description

- **Button** — text button with optional leading/trailing icon and a loading state.
- **IconButton** — square, icon-only button. Requires a `label`, which is its accessible name and tooltip.
- **Spinner** — animated circle that inherits `currentColor`. Used by Button's loading state, or standalone for section loading.

## Variants

Shared by Button and IconButton.

| Variant | Use when |
|---|---|
| `primary` | The single main action in a view (Save, Add lead). Default for Button |
| `secondary` | Supporting actions next to a primary (Cancel, Export). Bordered, on `surface` |
| `ghost` | Low-emphasis or toolbar actions (Edit, Close). Default for IconButton |
| `danger` | Destructive actions (Delete lead). Pair with `ConfirmDialog` |

## Props

**Button**

| Property | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Height 32 / 40 / 44px |
| `loading` | `boolean` | `false` | Shows a Spinner in place of the leading icon, disables the button, sets `aria-busy` |
| `leadingIcon` / `trailingIcon` | `ReactNode` | — | Icon beside the label, wrapped in an `aria-hidden` span |
| `fullWidth` | `boolean` | `false` | Adds `w-full` |
| `type` | `string` | `'button'` | Not `submit`; pass `type="submit"` explicitly in forms |
| `disabled` | `boolean` | `false` | Native disabled; also set automatically while `loading` |
| `ref` | `Ref` | — | Forwarded to `<button>` |

**IconButton**

| Property | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | required | Becomes `aria-label` and `title` |
| `variant` | same as Button | `'ghost'` | Visual style |
| `size` | `'sm' \| 'md'` | `'md'` | 32 / 40px square |
| `type` | `string` | `'button'` | Not `submit`, same as Button |
| `children` | `ReactNode` | — | The icon (an inline SVG, 16–20px) |
| `ref` | `Ref` | — | Forwarded to `<button>` |

**Spinner**

| Property | Type | Default | Description |
|---|---|---|---|
| `size` | `'sm' \| 'md'` | `'md'` | 16 / 20px |
| `label` | `string` | `'Loading'` | Screen-reader text in an `sr-only` span |
| `aria-hidden` | `boolean \| 'true'` | — | `true` or `'true'` renders the graphic only: the root gets `aria-hidden="true"` and there is no `role="status"` and no `sr-only` label (`label` is ignored). Any other value keeps the role and label. Button uses this |

## States

| State | Appearance |
|---|---|
| Default | Variant colors; Button text is `text-label`, `text-caption` at `sm` |
| Hover | `primary` / `danger` darken (`brand-hover` / `danger-hover`); `secondary` / `ghost` fill with `surface-muted`; `ghost` text goes to `fg` |
| Focus-visible | `.focus-ring`: 2px `focus` ring, 2px offset (keyboard focus only) |
| Active | No separate style; the hover color holds while pressed |
| Disabled | `opacity-50`, `cursor-not-allowed`, not focusable, no click events |
| Loading | Disabled styling plus a spinning `Spinner`; label stays visible. Spin is `motion-safe:` only, so reduced-motion users see a static arc |

## Accessibility

- **Role:** native `<button>`, so no ARIA role is needed. IconButton's name is its `label`; Spinner outside a Button is `role="status"`.
- **Keyboard:** Tab focuses; Enter and Space activate. Disabled and loading buttons leave the tab order.
- **Screen reader:** the loading Button announces as busy (`aria-busy="true"`) and its Spinner is hidden so "Loading" is not read twice. A disabled button gives no live update, so report the outcome with a toast or status region. Icons are decorative (`aria-hidden`).

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use one `primary` Button per view or dialog footer | Place several `primary` Buttons side by side |
| Pass `type="submit"` for form submit buttons | Rely on a default `submit` type; the default is `button` |
| Use `IconButton` with a specific `label` ("Delete note") | Use a bare `<button>` with only an icon, or a vague label ("Button") |
| Use `loading` for async actions and keep the label | Swap the label for a spinner or hide the button |
| Style with tokens through `className` (`mt-4`, `w-48`) | Override colors with `bg-blue-600`, hex, or `text-gray-*` |

## Example

```jsx
import Button from './components/ui/Button';
import IconButton from './components/ui/IconButton';

<form onSubmit={handleSave}>
  <Button type="submit" loading={saving} leadingIcon={<PlusIcon className="h-4 w-4" />}>
    Save lead
  </Button>
  <Button variant="secondary" onClick={onCancel}>Cancel</Button>
  <IconButton label="Delete note" variant="danger" size="sm" onClick={onDelete}>
    <TrashIcon className="h-4 w-4" />
  </IconButton>
</form>
```
