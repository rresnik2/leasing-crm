import { useMemo } from 'react';
import { collection } from 'firebase/firestore';

import { db } from '../firebase';
import useSnapshotList from './useSnapshotList';

const newestFirst = (items) => [...items].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

// A lead's timeline, newest first: { activities, loading, error }.
export default function useActivities(leadId) {
  const source = useMemo(() => (leadId ? collection(db, 'leads', leadId, 'activities') : null), [leadId]);
  const { items, loading, error } = useSnapshotList(source, newestFirst);
  return { activities: items, loading, error };
}
