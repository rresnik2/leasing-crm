import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

import { db } from '../firebase';
import useLeadScores from '../hooks/useLeadScores';
import { LeadsContext } from './leadsContext';
import { addLead, deleteLead, updateLead } from './leads';

// One leads listener and one set of scores for the whole app, so switching
// pages never refetches either.
function LeadsProvider({ children }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'leads'),
      (snapshot) => {
        setLeads(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to leads:', error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const scores = useLeadScores(leads);

  const getLead = useCallback((id) => leads.find((lead) => lead.id === id) ?? null, [leads]);

  const value = useMemo(
    () => ({ leads, loading, scores, getLead, addLead, updateLead, deleteLead }),
    [leads, loading, scores, getLead]
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export default LeadsProvider;
