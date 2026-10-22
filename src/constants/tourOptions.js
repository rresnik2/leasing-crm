export const TOUR_TYPES = ['In person', 'Virtual', 'Self-guided'];

export const TOUR_STATUSES = ['Unconfirmed', 'Confirmed', 'Completed', 'No-show', 'Canceled'];

// Badge tone for each tour status.
export const TOUR_STATUS_TONES = {
  Unconfirmed: 'warning',
  Confirmed: 'brand',
  Completed: 'neutral',
  'No-show': 'danger',
  Canceled: 'neutral',
};

export const TOUR_DURATION_MINUTES = 45;

// hours on a 24-hour clock; tours are booked from start up to end
export const OFFICE_HOURS = { start: 9, end: 18 };

// Date.getDay() values: 0 is Sunday
export const CLOSED_WEEKDAYS = [0];
