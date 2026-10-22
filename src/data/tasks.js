import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';

import { db } from '../firebase';

// Adds an open task to a lead and returns its id. dueDate is 'YYYY-MM-DD' or ''.
export async function addTask(leadId, { title, dueDate = '' }) {
  const ref = await addDoc(collection(db, 'leads', leadId, 'tasks'), {
    title,
    dueDate,
    done: false,
    createdAt: new Date().toISOString(),
    doneAt: null,
  });
  return ref.id;
}

export async function setTaskDone(leadId, taskId, done) {
  await updateDoc(doc(db, 'leads', leadId, 'tasks', taskId), {
    done,
    doneAt: done ? new Date().toISOString() : null,
  });
}

export async function deleteTask(leadId, taskId) {
  await deleteDoc(doc(db, 'leads', leadId, 'tasks', taskId));
}
