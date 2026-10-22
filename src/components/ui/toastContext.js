import { createContext } from 'react';

// Holds { toast, dismiss } from ToastProvider. null means "no provider above".
export const ToastContext = createContext(null);
