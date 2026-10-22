import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';

// Subscribes to a collection or query and returns { items, loading, error }.
// `source` must be referentially stable (memoize it) or null to stay idle;
// `sort` must be a stable function. Loading is derived from which source the
// last result belongs to, so a changed source reads as loading again.
export default function useSnapshotList(source, sort) {
  const [state, setState] = useState({ source: null, items: [], error: null });

  useEffect(() => {
    if (!source) return undefined;
    return onSnapshot(
      source,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setState({ source, items: sort ? sort(items) : items, error: null });
      },
      (error) => {
        console.error('Error listening to data:', error);
        setState({ source, items: [], error });
      }
    );
  }, [source, sort]);

  if (!source) return { items: [], loading: false, error: null };
  const ready = state.source === source;
  return { items: ready ? state.items : [], loading: !ready, error: ready ? state.error : null };
}
