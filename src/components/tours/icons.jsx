const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

export const CalendarIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...base} className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export const ChevronLeftIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...base} className={className}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const ChevronRightIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...base} className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const PlusIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const CloseIcon = ({ className = 'h-3.5 w-3.5' }) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const MessageIcon = ({ className = 'h-3.5 w-3.5' }) => (
  <svg {...base} className={className}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" />
  </svg>
);

export const CheckIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...base} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
