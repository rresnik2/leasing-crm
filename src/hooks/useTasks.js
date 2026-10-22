import { useMemo } from 'react';
import { collection } from 'firebase/firestore';

import { db } from '../firebase';
import useSnapshotList from './useSnapshotList';

// open tasks by due date (blank last), then done tasks by when they were finished
const openFirst = (items) => {
  const open = items
    .filter((task) => !task.done)
    .sort((a, b) => {
      if (!a.dueDate !== !b.dueDate) return a.dueDate ? -1 : 1;
      return (a.dueDate || '').localeCompare(b.dueDate || '') || (a.createdAt || '').localeCompare(b.createdAt || '');
    });
  const done = items.filter((task) => task.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));
  return [...open, ...done];
};

// A lead's tasks, open first: { tasks, loading, error }.
export default function useTasks(leadId) {
  const source = useMemo(() => (leadId ? collection(db, 'leads', leadId, 'tasks') : null), [leadId]);
  const { items, loading, error } = useSnapshotList(source, openFirst);
  return { tasks: items, loading, error };
}
