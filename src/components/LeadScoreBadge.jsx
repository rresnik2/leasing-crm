// LeadScoreBadge.jsx
import { PRIORITY_TONES } from '../constants/leadOptions';
import Badge from './ui/Badge';
import Skeleton from './ui/Skeleton';

// score is one entry from useLeadScores: { loading, data }.
// Finished leads have no entry, so nothing renders for them.
function LeadScoreBadge({ score }) {
  const data = score?.data;

  // skeleton only on the first load; a re-score keeps the old value visible
  if (score?.loading && !data) {
    return <Skeleton className="h-5 w-24 !rounded-full" />;
  }
  if (!data){
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={PRIORITY_TONES[data.priority] ?? 'neutral'} size="sm">Score {data.score}</Badge>
      <span className="text-caption text-fg-muted">{data.recommended_action}</span>
    </div>
  );

}
export default LeadScoreBadge;
