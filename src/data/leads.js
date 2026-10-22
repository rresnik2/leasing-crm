import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';

import { db } from '../firebase';
import { PIPELINE_STAGES } from '../constants/leadOptions';
import { logActivitySafely } from './activities';

// Creates a lead and returns its id.
export async function addLead(data) {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'leads'), { ...data, createdAt: now, statusChangedAt: now });
  await logActivitySafely(ref.id, { type: 'inquiry', body: 'Lead added' });
  return ref.id;
}

// the one code path for status changes: stamps statusChangedAt and logs it
async function applyLeadUpdate(id, changes, previousStatus) {
  const statusChanged = changes.status !== undefined && changes.status !== previousStatus;
  const data = statusChanged ? { ...changes, statusChangedAt: new Date().toISOString() } : changes;
  await updateDoc(doc(db, 'leads', id), data);
  if (statusChanged) {
    await logActivitySafely(id, {
      type: 'status',
      body: `Status changed from ${previousStatus || 'none'} to ${changes.status}`,
      from: previousStatus,
      to: changes.status,
    });
  }
}

// Saves changes to a lead. A different `status` also sets statusChangedAt and logs a status activity.
export async function updateLead(id, changes) {
  let previousStatus;
  if (changes.status !== undefined) {
    const snapshot = await getDoc(doc(db, 'leads', id));
    previousStatus = snapshot.exists() ? snapshot.data().status : undefined;
  }
  await applyLeadUpdate(id, changes, previousStatus);
}

// Moves a lead to `to` only if it is currently at one of the `from` statuses.
export async function advanceLeadStatus(id, from, to) {
  const snapshot = await getDoc(doc(db, 'leads', id));
  if (!snapshot.exists()) return false;
  const status = snapshot.data().status;
  if (!from.includes(status)) return false;
  await applyLeadUpdate(id, { status: to }, status);
  return true;
}

// statuses up to and including `status` in the pipeline
export const statusesUpTo = (status) => PIPELINE_STAGES.slice(0, PIPELINE_STAGES.indexOf(status) + 1);

async function deleteAll(snapshot) {
  await Promise.allSettled(snapshot.docs.map((d) => deleteDoc(d.ref)));
}

// Deletes a lead and, best-effort, its activities, tasks and tours.
export async function deleteLead(id) {
  const related = [
    collection(db, 'leads', id, 'activities'),
    collection(db, 'leads', id, 'tasks'),
    query(collection(db, 'tours'), where('leadId', '==', id)),
  ];
  await Promise.allSettled(related.map((source) => getDocs(source).then(deleteAll)));
  await deleteDoc(doc(db, 'leads', id));
}
