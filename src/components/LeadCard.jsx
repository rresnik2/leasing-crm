import { useState } from 'react';
import { formatDate } from '../utils/dateUtils';
import { formatForDisplay } from '../utils/phoneUtils';
import { LEAD_STATUSES, UNIT_TYPES } from '../constants/leadOptions';
import LeadScoreBadge from './LeadScoreBadge';
import PipelineProgress from './PipelineProgress';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';
import StatusBadge from './ui/StatusBadge';

// shown in place of empty detail values
const emptyValue = <span className="text-fg-subtle">—</span>;

function LeadCard({ lead, name, email, phone, status, moveInDate, unitType, score, onEdit, onCardClick }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState(status);
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);
  const [editMoveInDate, setEditMoveInDate] = useState(moveInDate);
  const [editUnitType, setEditUnitType] = useState(unitType);

  const handleSave = (e) => {
    e.preventDefault();
    // onEdit receives an object with new details.
    const updatedData = {
      name: editName,
      email: editEmail,
      phone: editPhone,
      status: editStatus,
      moveInDate: editMoveInDate,
      unitType: editUnitType
    }
    onEdit(updatedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    //Resets the edit fields to original values
    setEditName(name);
    setEditEmail(email);
    setEditPhone(phone);
    setEditStatus(status);
    setEditMoveInDate(moveInDate);
    setEditUnitType(unitType);
    setIsEditing(false);

  };
  // editing display mode
  if (isEditing) {
    return (
      <Card>
        <div className="grid gap-3">
          <Input
            label="Name"
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
          />
          <Input
            label="Phone"
            type="tel"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />
          <Input
            label="Move-in date"
            type="date"
            value={editMoveInDate}
            onChange={(e) => setEditMoveInDate(e.target.value)}
          />
          <Select
            label="Unit type"
            value={editUnitType}
            onChange={(e) => setEditUnitType(e.target.value)}
            options={UNIT_TYPES}
          />
          <Select
            label="Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            options={LEAD_STATUSES}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleSave(e);
            }}
          >
            Save
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
          >
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  // Normal display mode
  return (
    <Card interactive onClick={() => onCardClick(lead)} aria-label={`Open details for ${name}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-title text-fg truncate">{name}</h2>
          <div className="mt-1">
            <LeadScoreBadge score={score} />
          </div>
        </div>
        <StatusBadge status={status} className="shrink-0" />
      </div>

      <PipelineProgress status={status} variant="compact" className="mt-4" />

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
        <div className="min-w-0">
          <dt className="text-caption text-fg-subtle">Email</dt>
          <dd className="text-body text-fg truncate">{email || emptyValue}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-caption text-fg-subtle">Phone</dt>
          <dd className="text-body text-fg truncate">{formatForDisplay(phone) || emptyValue}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-caption text-fg-subtle">Move-in date</dt>
          <dd className="text-body text-fg truncate">{formatDate(moveInDate) || emptyValue}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-caption text-fg-subtle">Unit type</dt>
          <dd className="text-body text-fg truncate">{unitType || emptyValue}</dd>
        </div>
      </dl>
    </Card>
  );
}
export default LeadCard;
