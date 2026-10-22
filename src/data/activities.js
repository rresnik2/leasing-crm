import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';

import { db } from '../firebase';
import { CONTACT_ACTIVITY_TYPES } from '../constants/activityOptions';

// Firestore rejects undefined field values
export const withoutUndefined = (data) =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

// Adds an activity to a lead's timeline and returns its id. Contact types
// (call, email, text, follow-up) also stamp the lead's lastContactedAt.
export async function logActivity(leadId, { type, body, from, to, durationMinutes, tourId }) {
  const createdAt = new Date().toISOString();
  const ref = await addDoc(
    collection(db, 'leads', leadId, 'activities'),
    withoutUndefined({ type, body, createdAt, from, to, durationMinutes, tourId })
  );
  if (CONTACT_ACTIVITY_TYPES.includes(type)) {
    await updateDoc(doc(db, 'leads', leadId), { lastContactedAt: createdAt });
  }
  return ref.id;
}

// the main write already succeeded, so a failed timeline entry shouldn't fail the caller
export async function logActivitySafely(leadId, activity) {
  try {
    await logActivity(leadId, activity);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
