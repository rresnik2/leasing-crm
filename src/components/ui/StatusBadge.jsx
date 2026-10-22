import { STATUS_TONES } from '../../constants/leadOptions';
import Badge from './Badge';

// Lead status pill. Color comes from STATUS_TONES; unknown statuses fall back to neutral.
function StatusBadge({ status, size, className, ...rest }) {
  return (
    <Badge {...rest} tone={STATUS_TONES[status] ?? 'neutral'} size={size} dot className={className}>
      {status}
    </Badge>
  );
}

export default StatusBadge;
