import { useEffect, useRef, useState } from 'react';
import { FINISHED_STATUSES } from '../constants/leadOptions';

// Retrieves url or defaults to local dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// wait before each retry of a failed score request, long enough to ride out
// a Render deploy restarting the API
export const RETRY_DELAYS_MS = [5000, 15000];

// resolves to the score, or null when the API rejects the lead (4xx);
// rejects on network errors and 5xx so the caller can retry
const fetchScore = (snapshot) =>
  fetch(`${API_URL}/api/score-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: snapshot,
  }).then((response) => {
    if (response.ok) return response.json();
    if (response.status >= 500) throw new Error(`Score request failed with ${response.status}`);
    return null;
  });

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

      // false once the lead changed or finished, so stale work is dropped
      const isCurrent = () => requested.current.get(lead.id) === snapshot;

      const settle = (data) => {
        if (!isCurrent()) return;
        setScores((prev) => ({ ...prev, [lead.id]: { loading: false, data } }));
      };

      // the badge stays in its loading state until the last attempt settles
      const attempt = (retry) => {
        if (!isCurrent()) return;
        fetchScore(snapshot)
          .then(settle)
          .catch((error) => {
            if (retry < RETRY_DELAYS_MS.length) {
              setTimeout(() => attempt(retry + 1), RETRY_DELAYS_MS[retry]);
              return;
            }
            console.error('Error fetching lead score:', error);
            settle(null);
          });
      };
      attempt(0);
    });
  }, [leads]);

  return scores;
}
