import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';

import { db } from '../firebase';
import { TOUR_DURATION_MINUTES } from '../constants/tourOptions';
import { formatDateTime } from '../utils/dateUtils';
import { logActivitySafely } from './activities';
import { advanceLeadStatus, statusesUpTo } from './leads';

// Schedules a tour and returns its id. Logs a tour activity and moves a
// New Inquiry or Contacted lead to Tour Scheduled.
export async function addTour(tour) {
  const data = {
    durationMinutes: TOUR_DURATION_MINUTES,
    type: 'In person',
    units: [],
    status: 'Unconfirmed',
    notes: '',
    ...tour,
    createdAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, 'tours'), data);
  await logActivitySafely(data.leadId, {
    type: 'tour',
    body: `Tour scheduled for ${formatDateTime(data.start)}`,
    tourId: ref.id,
  });
  await advanceLeadStatus(data.leadId, ['New Inquiry', 'Contacted'], 'Tour Scheduled');
  return ref.id;
}

export async function updateTour(id, changes) {
  await updateDoc(doc(db, 'tours', id), changes);
}

// tour is a tour object including its id
export async function completeTour(tour) {
  await updateDoc(doc(db, 'tours', tour.id), { status: 'Completed' });
  await logActivitySafely(tour.leadId, {
    type: 'tour',
    body: `Tour completed (${formatDateTime(tour.start)})`,
    tourId: tour.id,
  });
  await advanceLeadStatus(tour.leadId, statusesUpTo('Tour Scheduled'), 'Tour Completed');
}

export async function cancelTour(tour) {
  await updateDoc(doc(db, 'tours', tour.id), { status: 'Canceled' });
  await logActivitySafely(tour.leadId, {
    type: 'tour',
    body: `Tour canceled (${formatDateTime(tour.start)})`,
    tourId: tour.id,
  });
}
