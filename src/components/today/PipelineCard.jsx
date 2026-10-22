import { STATUS_TONES } from '../../constants/leadOptions';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';

// stage dot colors come from Badge's dot tones via a dot-only badge
function PipelineCard({ stages, offPipeline, leasedPct, loading }) {
  const max = Math.max(1, ...stages.map((s) => s.count));

  return (
    <Card as="section" aria-labelledby="pipeline-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="pipeline-title" className="text-heading text-fg">Pipeline</h2>
        {!loading && (
          <p className="text-body text-fg-muted">
            Leased: <span className="tabular-nums">{leasedPct}%</span> of all leads
          </p>
        )}
      </div>
      {loading ? (
        <div role="status" className="mt-4 space-y-3">
          <span className="sr-only">Loading pipeline…</span>
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-5 w-full" />)}
        </div>
      ) : (
        <>
          <dl className="mt-4 space-y-3">
            {stages.map(({ stage, count }) => (
              <div key={stage} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <dt className="w-full sm:w-48 sm:shrink-0">
                  <Badge tone={STATUS_TONES[stage] ?? 'neutral'} dot className="!bg-transparent !px-0 !text-fg">
                    {stage}
                  </Badge>
                </dt>
                <dd className="m-0 flex min-w-0 flex-1 items-center gap-3">
                  <div aria-hidden="true" className="h-2.5 min-w-0 flex-1 rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-label tabular-nums text-fg">{count}</span>
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span className="text-caption font-medium uppercase tracking-wide text-fg-muted">Off pipeline</span>
            {offPipeline.map(({ status, count }) => (
              <Badge key={status} tone={STATUS_TONES[status] ?? 'neutral'} size="sm" dot>
                {status} <span className="tabular-nums">{count}</span>
              </Badge>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export default PipelineCard;
