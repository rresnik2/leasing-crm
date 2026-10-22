import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';

import { db } from '../firebase';
import useSnapshotList from './useSnapshotList';

const byStart = (items) => [...items].sort((a, b) => (a.start || '').localeCompare(b.start || ''));

// All of one lead's tours, soonest first: { tours, loading, error }.
export default function useLeadTours(leadId) {
  const source = useMemo(
    () => (leadId ? query(collection(db, 'tours'), where('leadId', '==', leadId)) : null),
    [leadId]
  );
  const { items, loading, error } = useSnapshotList(source, byStart);
  return { tours: items, loading, error };
}
