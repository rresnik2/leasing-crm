import { useEffect, useRef, useState } from 'react';
import { FINISHED_STATUSES } from '../constants/leadOptions';

// Retrieves url or defaults to local dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Scores every unfinished lead with the scoring API and returns
// { [leadId]: { loading, data } }. A lead is re-scored only when its data
// changes, so re-renders, filtering and sorting don't refetch.
export default function useLeadScores(leads) {
  const [scores, setScores] = useState({});
  // lead id -> snapshot of the lead data last sent for scoring
  const requested = useRef(new Map());

  useEffect(() => {
    leads.forEach((lead) => {
      // finished leads have no next step, so drop any old score
      if (FINISHED_STATUSES.includes(lead.status)) {
        if (requested.current.delete(lead.id)) {
          setScores((prev) => {
            const { [lead.id]: _removed, ...rest } = prev;
            return rest;
          });
        }
        return;
      }

      const snapshot = JSON.stringify(lead);
      if (requested.current.get(lead.id) === snapshot) return;
      requested.current.set(lead.id, snapshot);

      // keep the previous score visible while the new one loads
      setScores((prev) => ({ ...prev, [lead.id]: { loading: true, data: prev[lead.id]?.data ?? null } }));

      const settle = (data) => {
        // ignore the response if the lead changed again in the meantime
        if (requested.current.get(lead.id) !== snapshot) return;
        setScores((prev) => ({ ...prev, [lead.id]: { loading: false, data } }));
      };

      fetch(`${API_URL}/api/score-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: snapshot,
      })
        .then((response) => (response.ok ? response.json() : null))
        .then(settle)
        .catch((error) => {
          console.error('Error fetching lead score:', error);
          settle(null);
        });
    });
  }, [leads]);

  return scores;
}
