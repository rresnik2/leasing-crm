import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';

const CAPTION_TONES = {
  success: 'text-success-strong font-medium',
  warning: 'text-warning-strong font-medium',
  muted: 'text-fg-muted',
};

function KpiRow({ kpis, loading }) {
  return (
    <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {loading
        ? [0, 1, 2, 3].map((i) => (
            <Card key={i} padding="none" className="min-w-0 p-4 sm:p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-9 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </Card>
          ))
        : kpis.map((kpi) => (
            <Card key={kpi.label} padding="none" className="min-w-0 p-4 sm:p-5">
              <p className="text-body text-fg-muted">{kpi.label}</p>
              <p className="mt-2 text-display tabular-nums text-fg">{kpi.value}</p>
              {kpi.caption && (
                <p className={`mt-1 text-caption tabular-nums ${CAPTION_TONES[kpi.tone] ?? CAPTION_TONES.muted}`}>
                  {kpi.caption}
                </p>
              )}
            </Card>
          ))}
    </section>
  );
}

export default KpiRow;
