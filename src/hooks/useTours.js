import { useMemo } from 'react';
import { collection, orderBy, query, where } from 'firebase/firestore';

import { db } from '../firebase';
import useSnapshotList from './useSnapshotList';

// Tours with from <= start < to (local 'YYYY-MM-DDTHH:mm' strings), by start:
// { tours, loading, error }. Range and order are on the same field, so no index is needed.
export default function useTours({ from, to } = {}) {
  const source = useMemo(
    () =>
      from && to
        ? query(collection(db, 'tours'), where('start', '>=', from), where('start', '<', to), orderBy('start'))
        : null,
    [from, to]
  );
  const { items, loading, error } = useSnapshotList(source);
  return { tours: items, loading, error };
}
