// LeadScoreBadge.jsx
import {useEffect, useState } from 'react';

function LeadScoreBadge({ lead }) {
  const [score, setScore] = useState(null);
  
  useEffect(() => {fetchLeadScore(lead);}, [lead]);
  
  const fetchLeadScore = async (lead) => {
    try {
      const response = await fetch('http://localhost:8000/api/score-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
      const data = await response.json();
      setScore(data);
    } catch (error) {
      console.error('Error fetching lead score:', error);
    }
  };
  
  if (!score) return null;
  
  const getScoreColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`${getScoreColor(score.priority)} text-white px-2 py-1 rounded text-xs`}>
        Score: {score.score}
      </div>
      <span className="text-xs text-gray-600">{score.recommended_action}</span>
    </div>
  );
}
export default LeadScoreBadge;