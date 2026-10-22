import { useContext } from 'react';

import { ToastContext } from './toastContext';

// Returns { toast, dismiss }. Both functions are stable, so the returned object never changes.
export function useToast() {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return context;
}
