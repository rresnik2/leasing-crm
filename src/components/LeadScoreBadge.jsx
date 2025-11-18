// LeadScoreBadge.jsx
import {useEffect, useState } from 'react';

// Define this OUTSIDE the component - it never changes
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function LeadScoreBadge({ lead }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {fetchLeadScore(lead);}, [lead]);
  
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
  
  
  const getScoreColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-gray-300 text-white px-2 py-1 rounder text-xs animate-pulse">
          Loading...
        </div>
      </div>
    );
  }
  if (!score){
    return null;
  }
  
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
