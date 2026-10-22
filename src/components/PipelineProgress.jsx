import { CLOSED_STATUSES, PIPELINE_STAGES } from '../constants/leadOptions';
import StatusBadge from './ui/StatusBadge';
import { cn } from './ui/cn';

const STAGE_COUNT = PIPELINE_STAGES.length;

// Where a status sits relative to the pipeline:
//  - 'pipeline': one of PIPELINE_STAGES (index is its 0-based position)
//  - 'closed':   one of CLOSED_STATUSES (off the funnel; nothing filled)
//  - 'unknown':  anything else (treated as not started; nothing filled)
function getProgress(status) {
  const index = PIPELINE_STAGES.indexOf(status);
  if (index !== -1) return { state: 'pipeline', index };
  if (CLOSED_STATUSES.includes(status)) return { state: 'closed', index: -1 };
  return { state: 'unknown', index: -1 };
}

function getAriaLabel({ state, index }, status) {
  if (state === 'pipeline') return `Pipeline: stage ${index + 1} of ${STAGE_COUNT}, ${status}`;
  if (state === 'closed') return `Pipeline: off pipeline, ${status}`;
  return 'Pipeline: not started';
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

function Connector({ filled, hidden }) {
  return (
    <div
      aria-hidden="true"
      className={cn('h-0.5 flex-1', !hidden && (filled ? 'bg-brand' : 'bg-line'))}
    />
  );
}

function CompactProgress({ status, className, ...rest }) {
  const progress = getProgress(status);
  const isClosed = progress.state === 'closed';

  return (
    <div
      role="img"
      aria-label={getAriaLabel(progress, status)}
      {...rest}
      className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5', className)}
    >
      <div className={cn('flex min-w-32 flex-1 gap-1', isClosed && 'opacity-60')}>
        {PIPELINE_STAGES.map((stage, i) => (
          <div
            key={stage}
            className={cn('h-1.5 flex-1 rounded-full', i <= progress.index ? 'bg-brand' : 'bg-line')}
          />
        ))}
      </div>
      {/* No StatusBadge here: compact sits on lead cards, which already show one. */}
      {isClosed && <span className="shrink-0 text-caption text-fg-subtle">Off pipeline</span>}
    </div>
  );
}

const STEP_CIRCLE = {
  completed: 'bg-brand text-fg-inverse',
  current: 'bg-brand-subtle text-brand-strong ring-2 ring-brand',
  upcoming: 'bg-surface-muted text-fg-subtle ring-1 ring-inset ring-line',
};

const STEP_LABEL = {
  completed: 'text-fg-muted',
  current: 'text-fg font-medium',
  upcoming: 'text-fg-subtle',
};

function StepsProgress({ status, className, ...rest }) {
  const progress = getProgress(status);
  const { index } = progress;
  const isClosed = progress.state === 'closed';

  return (
    <div {...rest} className={className}>
      {isClosed && (
        <div className="mb-3 flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-caption text-fg-subtle">Off pipeline</span>
        </div>
      )}
      <ol
        role="list"
        aria-label="Leasing pipeline"
        className="flex items-start"
      >
        {PIPELINE_STAGES.map((stage, i) => {
          const isCurrent = i === index;
          // Leased is the end of the funnel: it reads as finished, not "in progress".
          const isFinished = isCurrent && i === STAGE_COUNT - 1;
          let stepState = 'upcoming';
          if (i < index || isFinished) stepState = 'completed';
          else if (isCurrent) stepState = 'current';

          return (
            <li
              key={stage}
              aria-current={isCurrent ? 'step' : undefined}
              // Below sm the current stage gets extra width for its label; the rest shrink to circles.
              className={cn('flex min-w-0 basis-0 flex-col items-center', isCurrent ? 'grow-[3] sm:grow' : 'grow')}
            >
              {/* Closed leads dim only the track; labels keep full contrast. */}
              {/* Gap lives here, not on the label: sm:not-sr-only resets the label's margin to 0. */}
              <div className={cn('mb-1.5 flex w-full items-center', isClosed && 'opacity-60')}>
                <Connector hidden={i === 0} filled={i <= index} />
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-medium sm:mx-1 sm:h-7 sm:w-7',
                    STEP_CIRCLE[stepState],
                  )}
                >
                  {stepState === 'completed' ? <CheckIcon /> : i + 1}
                </span>
                <Connector hidden={i === STAGE_COUNT - 1} filled={i < index} />
              </div>
              {/* Non-current labels stay available to screen readers but hide visually below sm. */}
              <span
                className={cn(
                  'text-center text-caption',
                  isCurrent ? STEP_LABEL.current : STEP_LABEL[stepState],
                  !isCurrent && 'sr-only sm:not-sr-only',
                )}
              >
                {stage}
                <span className="sr-only">, {stepState}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PipelineProgress({ status, variant = 'compact', ...rest }) {
  if (variant === 'steps') return <StepsProgress status={status} {...rest} />;
  return <CompactProgress status={status} {...rest} />;
}

export default PipelineProgress;
