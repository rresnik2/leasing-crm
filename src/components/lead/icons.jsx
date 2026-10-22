// Inline stroke icons for the Lead workspace. All are decorative (aria-hidden).
const PATHS = {
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  text: <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />,
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  note: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 12h7M9 16h5" />
    </>
  ),
  status: <path d="M4 12h14M13 6l6 6-6 6" />,
  tour: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  'follow-up': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 3 3 5-6" />
    </>
  ),
  inquiry: (
    <>
      <path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M3 13h5l1 3h6l1-3h5" />
    </>
  ),
  back: <path d="M15 6l-6 6 6 6" />,
  pencil: <path d="M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
};

export default function Icon({ name, className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[name] ?? PATHS.note}
    </svg>
  );
}
