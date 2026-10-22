// LeadScoreBadge.jsx
import {useEffect, useState } from 'react';
import { PRIORITY_TONES } from '../constants/leadOptions';
import Badge from './ui/Badge';
import Skeleton from './ui/Skeleton';

// Retrieves url or defaults to local dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function LeadScoreBadge({ lead }) {

  // tracking score
  const [score, setScore] = useState(null);
  // for loading state
  const [loading, setLoading] = useState(false);


  useEffect(() => {fetchLeadScore(lead);}, [lead]);

  // gets lead score with await fetch call
  const fetchLeadScore = async (lead) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/score-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
      const data = await response.json();
      setScore(data);

    } catch (error) {
      console.error('Error fetching lead score:', error);
    }
    finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <Skeleton className="h-5 w-24 !rounded-full" />;
  }
  if (!score){
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={PRIORITY_TONES[score.priority] ?? 'neutral'} size="sm">Score {score.score}</Badge>
      <span className="text-caption text-fg-muted">{score.recommended_action}</span>
    </div>
  );

}
export default LeadScoreBadge;
