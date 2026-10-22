// Types allowed in leads/{id}/activities, with display labels.
export const ACTIVITY_TYPES = ['inquiry', 'note', 'call', 'email', 'text', 'status', 'tour', 'follow-up'];

export const ACTIVITY_LABELS = {
  inquiry: 'Inquiry',
  note: 'Note',
  call: 'Call',
  email: 'Email',
  text: 'Text',
  status: 'Status change',
  tour: 'Tour',
  'follow-up': 'Follow-up',
};

// Logging one of these counts as contacting the lead (sets lastContactedAt).
export const CONTACT_ACTIVITY_TYPES = ['call', 'email', 'text', 'follow-up'];
