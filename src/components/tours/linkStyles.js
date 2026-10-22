export const LINK_CLASSES = 'rounded-sm text-brand hover:underline focus-ring';

// an <a> that looks like a small secondary Button (used for sms links)
export const LINK_BUTTON_CLASSES =
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 text-caption font-medium text-fg transition-colors duration-fast ease-standard hover:bg-surface-muted focus-ring';
export const LINK_BUTTON_MD_CLASSES = LINK_BUTTON_CLASSES.replace('h-8', 'h-10').replace('text-caption', 'text-label');
