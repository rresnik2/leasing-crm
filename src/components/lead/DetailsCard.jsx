import { daysUntil, formatDate } from '../../utils/dateUtils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Icon from './icons';
import { describeDaysUntil } from './leadPageUtils';

const BLANK = '—';

export default function DetailsCard({ lead, onEdit }) {
  const days = daysUntil(lead.moveInDate);
  const moveIn = lead.moveInDate
    ? `${formatDate(lead.moveInDate)}${days === null ? '' : ` · ${describeDaysUntil(days)}`}`
    : BLANK;

  const rows = [
    ['Move-in date', moveIn],
    ['Unit type', lead.unitType],
    ['Occupants', lead.occupants],
    ['Pets', lead.pets],
    ['Employer', lead.employer],
    ['Move reason', lead.moveReason],
    ['Address', lead.address],
  ];

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title text-fg">Details</h2>
        <Button variant="secondary" size="sm" leadingIcon={<Icon name="pencil" />} onClick={onEdit}>
          Edit
        </Button>
      </div>
      <dl className="mt-3 divide-y divide-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2 text-body">
            <dt className="shrink-0 text-fg-muted">{label}</dt>
            <dd className="min-w-0 break-words text-right text-fg">{value || BLANK}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
