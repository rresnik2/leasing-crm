// Shared classes for text-like form controls (Input, Select, Textarea).
//
// Conflicting utilities (height, text size, border/ring color) are each emitted
// from exactly one branch below. Tailwind resolves conflicts by stylesheet
// order, not class order, so two competing classes would pick a winner by accident.

const BASE =
  'w-full rounded-control border bg-surface text-fg placeholder:text-fg-subtle transition-colors duration-fast ' +
  'focus:outline-none focus:ring-2 ' +
  'disabled:bg-surface-muted disabled:text-fg-subtle disabled:cursor-not-allowed';

const VALID = 'border-line-strong focus:ring-focus/40 focus:border-focus';
const INVALID = 'border-danger focus:ring-danger/30 focus:border-danger';

const SIZES = {
  md: 'h-10 px-3 text-body',
  sm: 'h-8 px-2.5 text-caption',
};

// Multi-line controls size themselves from `rows`, so they take no fixed height.
const MULTILINE = 'h-auto px-3 py-2 text-body';

export function controlClasses({ invalid = false, size = 'md', multiline = false } = {}) {
  return [BASE, invalid ? INVALID : VALID, multiline ? MULTILINE : (SIZES[size] ?? SIZES.md)].join(' ');
}
