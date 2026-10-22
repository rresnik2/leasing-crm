// Joins class names, skipping falsy values: cn('px-2', isActive && 'bg-brand')
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
