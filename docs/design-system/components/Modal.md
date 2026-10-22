# Modal, ConfirmDialog

Source: `src/components/ui/Modal.jsx` and `src/components/ui/ConfirmDialog.jsx`.

## Description

- **Modal**: a focused dialog that sits above the page for a task the user must finish or abandon before going back (edit a lead, schedule a tour). It renders through a portal into `document.body`, dims the page with a `bg-fg/50` backdrop, traps keyboard focus, and locks page scroll while it is open.
- **ConfirmDialog**: a small `Modal` (`size="sm"`) that asks a yes/no question, usually before a destructive action. It supplies the Cancel and Confirm buttons for you and starts with focus on **Cancel**.

Use a Modal when the task needs the user's full attention and has a clear exit (Save / Cancel). Do not use one for passive feedback (use a [toast](./Toast.md)), for field-level problems (use the field's inline `error`), or for content people should be able to read side by side with the page.

Both components return `null` while `open` is `false`, so components rendered inside `children` unmount on close and lose their own state. State held by the component that renders the Modal (a form `draft`, say) survives. Mount that owner conditionally (or `key` it) when it should start fresh each time.

## Props

**Modal**

| Property | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | required | Renders nothing when `false` |
| `onClose` | `() => void` | required | Called on Escape, a backdrop click, and the header close button. The dialog never closes itself; you set `open` to `false` |
| `title` | `ReactNode` | none | Rendered as `<h2 className="text-heading text-fg">`. The dialog's accessible name (`aria-labelledby`). Treat it as required; if you omit it, pass an `aria-label` |
| `description` | `ReactNode` | none | `<p className="text-body text-fg-muted">` under the title. Wired to `aria-describedby` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Panel max width: `max-w-md` / `max-w-xl` / `max-w-2xl` |
| `footer` | `ReactNode` | none | Footer row pinned below the scrolling body: `flex justify-end gap-3 border-t border-line px-6 py-4`. Put the action Buttons here |
| `initialFocusRef` | `Ref` | none | Element to focus on open. Pass a stable ref from `useRef` |
| `closeOnBackdrop` | `boolean` | `true` | Set `false` for forms where an accidental click would lose work |
| `hideCloseButton` | `boolean` | `false` | Hides the header "Close" IconButton. Escape still closes |
| `className` | `string` | none | Merged last onto the **dialog panel** (not the backdrop) |
| `children` | `ReactNode` | none | Scrollable body (`overflow-y-auto px-6 py-5`) |
| `...rest` | | | Spread onto the dialog panel (`aria-label`, `data-*`, `id`). `role`, `aria-modal`, `aria-labelledby`, `aria-describedby`, `tabIndex` and the focus/Escape handling are fixed (set after the spread, so they cannot be overridden). A caller `onKeyDown` runs first, then the built-in one |

The panel is `max-h-[90vh]`; when the body is taller, the body scrolls and the header and footer stay put.

**ConfirmDialog**

| Property | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | required | Renders nothing when `false` |
| `title` | `ReactNode` | none | The question, as a short sentence ("Delete this lead?") |
| `description` | `ReactNode` | none | The consequence ("This removes Jordan Lee and all notes. This cannot be undone.") |
| `confirmLabel` | `string` | `'Confirm'` | Use a specific verb ("Delete lead") |
| `cancelLabel` | `string` | `'Cancel'` | |
| `tone` | `'danger' \| 'primary'` | `'danger'` | Variant of the confirm Button. `danger` for destructive actions, `primary` for ordinary confirmations |
| `loading` | `boolean` | `false` | Passed to the confirm Button: spinner, disabled, `aria-busy` |
| `onConfirm` | `() => void` | required | Runs when the confirm Button is pressed. Close the dialog yourself when the work is done |
| `onCancel` | `() => void` | required | Cancel button, Escape, backdrop click and the header close button all call this |
| `...rest` | | | Passed to `Modal` (`className`, `closeOnBackdrop`, `hideCloseButton`, ...) |

## Behavior

**Focus on open.** When `open` becomes `true`, the element that had focus is remembered, then focus moves into the dialog. Priority: `initialFocusRef.current`, else the first focusable element in the body (the first field of a form), else the panel itself (`tabIndex={-1}`). The header close button and the footer are not candidates unless you point `initialFocusRef` at them. ConfirmDialog always points it at Cancel.

**Focus trap.** Tab and Shift+Tab cycle through the focusable elements inside the panel (links with `href`, buttons, inputs, selects, textareas and `[tabindex]` other than `-1`, skipping disabled, hidden and `inert` ones). Tab on the last element wraps to the first; Shift+Tab on the first wraps to the last. With nothing focusable, focus stays on the panel. The trap lives in the panel's `onKeyDown` and only acts when the key event came from an element inside this panel.

**Escape.** Calls `onClose()`. Skipped if an inner widget already called `preventDefault()` on the event, so an open combobox or date picker can use Escape for itself first.

**Backdrop.** Clicking the dimmed area calls `onClose()` only when `closeOnBackdrop` is on **and** the mouse press started (`mousedown`) and ended (`click`) on the backdrop itself. Dragging a text selection out of an input and releasing over the backdrop does not close the dialog.

**Focus restore.** On close, or if the Modal unmounts while open, focus returns to the element that opened it, as long as that element is still in the document. If the trigger was removed, focus is left alone rather than thrown to `<body>` by force.

**Scroll lock.** While any Modal is open, `document.body.style.overflow` is `'hidden'`. A module-level counter is shared by every Modal, so stacked dialogs lock once and unlock once: the previous inline `overflow` value is saved when the first one opens and restored when the last one closes.

**Animation.** The backdrop fades in and the panel scales in, both behind `motion-safe:`, so users who prefer reduced motion see the dialog appear instantly.

**Nesting a ConfirmDialog inside a Modal.** This is supported and is the intended way to confirm an action from a form dialog. Render the ConfirmDialog anywhere in the owning component, including as a child of the Modal:

- It portals to `document.body` after the parent, so it stacks on top (same `z-overlay`, later in the DOM).
- React events bubble through portals, so Escape and Tab inside the ConfirmDialog also reach the parent Modal's `onKeyDown`. The parent ignores them because the event target is not inside its own panel. The child closes on Escape and traps Tab; the parent does neither.
- The same holds for pointer events: a click on the child's backdrop does not close the parent, because the backdrop handler requires the click target to be the parent's own backdrop.
- When the ConfirmDialog closes, focus returns to the control that opened it (for example the Delete button in the parent's footer). When both close together, focus ends on the element that opened the parent.

## Accessibility

- **Role and name.** The panel is `role="dialog" aria-modal="true"`, named by the title via `aria-labelledby` and described by the description via `aria-describedby`. Both ids come from `useId()`. The attributes are only added when `title` / `description` are provided.
- **Keyboard.** Escape closes. Tab and Shift+Tab stay inside the dialog. Enter and Space activate the focused button as usual.
- **Focus management.** Focus enters the dialog on open and returns to the trigger on close, so keyboard and screen-reader users never lose their place.
- **Safe default.** ConfirmDialog focuses Cancel, so a reflexive Enter does not delete anything.
- **Close button.** An `IconButton` with `label="Close"` (accessible name and tooltip); its icon is `aria-hidden`.
- **Background.** The page behind a modal is dimmed and scroll-locked; assistive tech is told it is inert through `aria-modal`.
- **Motion.** Enter animations respect `prefers-reduced-motion` through `motion-safe:`.
- **Contrast.** Panel text uses `text-fg` and `text-fg-muted` on `bg-surface`; the backdrop is `bg-fg/50`.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Give every Modal a `title` (it names the dialog) | Open a Modal with no title and no `aria-label` |
| Put the primary action last in the footer, Cancel before it | Put several `primary` Buttons in the footer |
| Submit forms from the footer with `<Button type="submit" form="my-form">` | Put the submit button in the body and the Cancel button in the footer, or rely on Button's default `type` (it is `button`) |
| Use `initialFocusRef` for the one control you want focused first | Use the `autoFocus` attribute: it runs before the Modal records the trigger, so focus can't be restored to it |
| Use `ConfirmDialog` for irreversible actions, with a specific `confirmLabel` ("Delete lead") | Use a bare "OK" / "Yes" / "No", or confirm things that are easily undone |
| State the consequence in the `description` | Repeat the title in the description |
| Set `closeOnBackdrop={false}` on long forms | Let a stray click discard minutes of typing |
| Keep the body for content; show save errors inline in it (`error` on fields, a message above the form) | Report a failed save only with a [toast](./Toast.md); the focus trap keeps attention inside the dialog |
| Keep dialogs short; use `size="lg"` for forms, `sm` for confirmations | Stack a third dialog on top of a second, or use a Modal for passive information |
| Style with tokens via `className` (`max-w-3xl`) | Override colors with `bg-white`, `bg-black/50` or hex values |

## Examples

### Form modal with a footer

The footer sits outside the body, so the submit Button points at the form with the `form` attribute. `onClose` should reset or discard unsaved edits.

```jsx
import { useState } from 'react';

import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Modal from './components/ui/Modal';
import Select from './components/ui/Select';
import Textarea from './components/ui/Textarea';
import { LEAD_STATUSES } from './constants/leadOptions';

const FORM_ID = 'edit-lead-form';

// Mount this only while editing, e.g. {editing && <EditLeadModal ... />},
// so the draft starts fresh from `lead` every time.
function EditLeadModal({ lead, onClose, onSave }) {
  const [draft, setDraft] = useState(lead);
  const [saving, setSaving] = useState(false);
  const set = (field) => (e) => setDraft({ ...draft, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit lead"
      description="Changes apply as soon as you save."
      size="lg"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Name" required value={draft.name} onChange={set('name')} />
        <Input label="Email" type="email" value={draft.email} onChange={set('email')} />
        <Select label="Status" options={LEAD_STATUSES} value={draft.status} onChange={set('status')} />
        <Textarea label="Notes" value={draft.notes} onChange={set('notes')} />
      </form>
    </Modal>
  );
}
```

Focus lands on the Name input (the first focusable element in the body) when it opens, and returns to the "Edit" button that opened it when it closes.

### Delete confirmation

```jsx
import { useState } from 'react';

import Button from './components/ui/Button';
import ConfirmDialog from './components/ui/ConfirmDialog';
import { useToast } from './components/ui/useToast';

function DeleteLeadButton({ lead, onDelete }) {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onDelete(lead.id);
      toast({ title: 'Lead deleted', tone: 'success' });
    } catch {
      toast({ title: 'Could not delete lead', description: 'Check your connection and try again.', tone: 'danger' });
    } finally {
      // The dialog closes either way; the toast above reports the outcome
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Delete
      </Button>
      <ConfirmDialog
        open={confirming}
        title={`Delete ${lead.name}?`}
        description="This removes the lead and all of its notes. This cannot be undone."
        confirmLabel="Delete lead"
        loading={deleting}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
```

### ConfirmDialog inside a form modal

Render the ConfirmDialog next to the Modal's content; the nesting rules above make Escape close only the topmost dialog.

```jsx
function LeadModal({ lead, open, onClose, onSave, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lead details"
      footer={
        <>
          <Button variant="danger" className="mr-auto" onClick={() => setConfirmingDelete(true)}>
            Delete
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="lead-form">Save changes</Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={onSave}>{/* fields */}</form>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this lead?"
        description="This cannot be undone."
        confirmLabel="Delete lead"
        onConfirm={() => {
          setConfirmingDelete(false);
          onDelete();
          onClose();
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </Modal>
  );
}
```
