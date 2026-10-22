import { useEffect, useState } from 'react';

import { downloadCsv } from '../components/today/downloadCsv';
import { DownloadIcon } from '../components/today/icons';
import FollowUpsCard from '../components/today/FollowUpsCard';
import KpiRow from '../components/today/KpiRow';
import MoveInsCard from '../components/today/MoveInsCard';
import PipelineCard from '../components/today/PipelineCard';
import TodayToursCard from '../components/today/TodayToursCard';
import {
  buildLeadsCsv, buildSummary, computeKpis, csvFilename, formatLongDate, leasedPercent,
  offPipelineCounts, pipelineCounts, todayRange, upcomingMoveIns, weekRange,
} from '../components/today/todayUtils';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import useLeads from '../hooks/useLeads';
import useTours from '../hooks/useTours';
import { groupFollowUps } from '../utils/followUp';

// current time, refreshed every minute so follow-ups move between sections
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function TodayPage() {
  const now = useNow();
  const { leads, loading, scores, getLead } = useLeads();

  // one query for Monday–Sunday; today's tours are derived from it
  const week = weekRange(now);
  const { tours: weekTours, loading: toursLoading } = useTours(week);
  const today = todayRange(now);
  const todayTours = weekTours.filter(
    (tour) => tour.status !== 'Canceled' && tour.start >= today.from && tour.start < today.to
  );

  const groups = groupFollowUps(leads, now);
  const dueCount = groups.dueNow.length + groups.laterToday.length;
  const summary = loading || toursLoading ? null : buildSummary(dueCount, todayTours.length);

  const handleExport = () => downloadCsv(buildLeadsCsv(leads, scores), csvFilename(now));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-label text-fg-muted">{formatLongDate(now)}</p>
          <h1 className="mt-1 text-display text-fg">Today</h1>
          {summary ? (
            <p className="mt-1 text-body text-fg-muted">{summary}</p>
          ) : (
            <Skeleton className="mt-2 h-4 w-56" />
          )}
        </div>
        <Button variant="secondary" leadingIcon={<DownloadIcon />} onClick={handleExport} disabled={loading || leads.length === 0}>
          Export CSV
        </Button>
      </header>

      <KpiRow kpis={computeKpis(leads, weekTours, now)} loading={loading} />

      <div className="flex flex-wrap items-start gap-6">
        <FollowUpsCard groups={groups} loading={loading} scores={scores} now={now} />
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
          <TodayToursCard tours={todayTours} loading={toursLoading} getLead={getLead} />
          <MoveInsCard moveIns={upcomingMoveIns(leads, now)} loading={loading} />
        </div>
      </div>

      <PipelineCard
        stages={pipelineCounts(leads)}
        offPipeline={offPipelineCounts(leads)}
        leasedPct={leasedPercent(leads)}
        loading={loading}
      />
    </div>
  );
}

export default TodayPage;
