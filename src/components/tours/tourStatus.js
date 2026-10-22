// Visual treatment of a tour block in the week grid. Status is never shown by colour alone:
// Unconfirmed also gets a dashed border and a short label.
export const BLOCK_STYLES = {
  Confirmed: 'border border-line-strong border-solid bg-brand-subtle text-brand-strong hover:shadow-raised',
  Unconfirmed: 'border border-dashed border-warning bg-warning-subtle text-warning-strong hover:shadow-raised',
  Completed: 'border border-line bg-surface-muted text-fg-muted hover:border-line-strong',
  'No-show': 'border border-danger bg-danger-subtle text-danger-strong hover:shadow-raised',
};

export const BLOCK_LABELS = {
  Confirmed: '',
  Unconfirmed: 'Unconf.',
  Completed: 'Done',
  'No-show': 'No-show',
};

export const isActiveTour = (tour) => tour.status !== 'Canceled';
