import { useMemo, useState } from 'react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import IconButton from '../ui/IconButton';
import Input from '../ui/Input';
import Select from '../ui/Select';
import StatusBadge from '../ui/StatusBadge';
import Textarea from '../ui/Textarea';
import { cn } from '../ui/cn';
import { useToast } from '../ui/useToast';
import { FINISHED_STATUSES } from '../../constants/leadOptions';
import { TOUR_TYPES } from '../../constants/tourOptions';
import { addTour } from '../../data/tours';
import useTours from '../../hooks/useTours';
import { smsHref } from '../../utils/contactLinks';
import { addDays, formatDate, parseLocalDate, toLocalDateString } from '../../utils/dateUtils';
import { CheckIcon, CloseIcon, MessageIcon, PlusIcon } from './icons';
import { LINK_BUTTON_CLASSES } from './linkStyles';
import {
  bookedCaption,
  closedMessage,
  confirmationBody,
  defaultScheduleDate,
  firstNameOf,
  formatLongDay,
  formatTimeOfDay,
  getSlotAvailability,
} from './tourCalendarUtils';

const SLOT_BASE =
  'h-10 rounded-control border text-body tabular-nums transition-colors duration-fast ease-standard focus-ring';

// leads: all leads; defaultLeadId: preselected lead id; leadRef: ref to the first field (for "Schedule tour")
function ScheduleTourForm({ leads, defaultLeadId, now, leadRef, onScheduled }) {
  const { toast } = useToast();

  const activeLeads = useMemo(
    () =>
      leads
        .filter((lead) => !FINISHED_STATUSES.includes(lead.status))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [leads]
  );

  // undefined until the user picks; until then the preselected lead (once the leads have loaded)
  const [leadChoice, setLeadChoice] = useState(undefined);
  const preselected = activeLeads.some((lead) => lead.id === defaultLeadId) ? defaultLeadId : '';
  const leadId = leadChoice ?? preselected;
  const lead = activeLeads.find((item) => item.id === leadId) ?? null;

  const [date, setDate] = useState(() => defaultScheduleDate(now));
  const [time, setTime] = useState('');
  const [type, setType] = useState(TOUR_TYPES[0]);
  const [units, setUnits] = useState([]);
  const [unitDraft, setUnitDraft] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  // that day's tours decide which slots are open
  const dateIsValid = Boolean(parseLocalDate(date));
  const dayRange = useMemo(() => {
    const parsed = parseLocalDate(date);
    if (!parsed) return {};
    return { from: `${date}T00:00`, to: `${toLocalDateString(addDays(parsed, 1))}T00:00` };
  }, [date]);
  const { tours: dayTours, loading: slotsLoading } = useTours(dayRange);
  const availability = useMemo(() => getSlotAvailability(date, dayTours, { now }), [date, dayTours, now]);

  // a slot that got booked (or a date change) quietly drops the selection
  const selectedTime = availability.slots.includes(time) ? time : '';

  const clearError = (field) => setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  const addUnit = () => {
    const value = unitDraft.trim();
    if (!value) return;
    setUnits((current) =>
      current.some((unit) => unit.toLowerCase() === value.toLowerCase()) ? current : [...current, value]
    );
    setUnitDraft('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!lead) nextErrors.lead = 'Choose a lead';
    if (!dateIsValid) nextErrors.date = 'Choose a date';
    else if (availability.closed) nextErrors.date = closedMessage();
    if (dateIsValid && !availability.closed && !selectedTime) nextErrors.time = 'Pick a time';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // a unit typed but not added yet still counts
    const draft = unitDraft.trim();
    const finalUnits =
      draft && !units.some((unit) => unit.toLowerCase() === draft.toLowerCase()) ? [...units, draft] : units;
    const start = `${date}T${selectedTime}`;

    setSubmitting(true);
    try {
      await addTour({
        leadId: lead.id,
        leadName: lead.name,
        start,
        type,
        units: finalUnits,
        notes: notes.trim(),
      });
      toast({ tone: 'success', title: 'Tour scheduled' });
      setSuccess({
        name: lead.name,
        start,
        href: smsHref(lead.phone, confirmationBody(lead.name, start)),
      });
      setTime('');
      setUnits([]);
      setUnitDraft('');
      setNotes('');
      onScheduled?.(date);
    } catch (error) {
      console.error('Error scheduling tour: ', error);
      toast({ tone: 'danger', title: "Couldn't schedule tour" });
    } finally {
      setSubmitting(false);
    }
  };

  const leadHint = lead ? (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <StatusBadge status={lead.status} size="sm" />
      <span>
        {[lead.unitType, lead.moveInDate && `Move-in ${formatDate(lead.moveInDate)}`].filter(Boolean).join(' · ') ||
          'No unit type or move-in date yet'}
      </span>
    </span>
  ) : undefined;

  return (
    <Card as="form" padding="none" aria-labelledby="schedule-tour-title" onSubmit={handleSubmit} noValidate>
      <div className="border-b border-line px-5 py-4">
        <h2 id="schedule-tour-title" className="text-heading text-fg">
          Schedule a tour
        </h2>
      </div>

      <div className="space-y-4 p-5">
        <Select
          ref={leadRef}
          label="Lead"
          required
          placeholder="Choose a lead"
          value={leadId}
          options={activeLeads.map((item) => ({ value: item.id, label: item.name }))}
          error={errors.lead}
          hint={leadHint}
          onChange={(event) => {
            setLeadChoice(event.target.value);
            clearError('lead');
          }}
        />

        <Input
          type="date"
          label="Date"
          required
          value={date}
          error={errors.date}
          onChange={(event) => {
            setDate(event.target.value);
            clearError('date');
            clearError('time');
          }}
        />

        <fieldset aria-describedby="tour-time-help" aria-busy={slotsLoading || undefined}>
          <legend className="mb-2 text-label text-fg">
            Time
            <span aria-hidden="true" className="ml-0.5 text-danger-strong">
              *
            </span>
          </legend>
          {availability.closed ? (
            <p id="tour-time-help" className="text-body text-fg-muted">
              {closedMessage()}
            </p>
          ) : !dateIsValid ? (
            <p id="tour-time-help" className="text-body text-fg-muted">
              Choose a date to see open times.
            </p>
          ) : availability.slots.length === 0 ? (
            <p id="tour-time-help" className="text-body text-fg-muted">
              No open times left that day.
              {availability.booked.length > 0 && ` ${bookedCaption(availability.booked)}`}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {availability.slots.map((slot) => {
                  const selected = slot === selectedTime;
                  return (
                    <button
                      key={slot}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setTime(slot);
                        clearError('time');
                      }}
                      className={cn(
                        SLOT_BASE,
                        selected
                          ? 'border-brand bg-brand font-semibold text-fg-inverse'
                          : 'border-line-strong bg-surface text-fg hover:bg-surface-muted'
                      )}
                    >
                      {formatTimeOfDay(slot)}
                    </button>
                  );
                })}
              </div>
              <p id="tour-time-help" className="mt-2 text-caption text-fg-subtle">
                Open times only.
                {availability.booked.length > 0 && ` ${bookedCaption(availability.booked)}`}
              </p>
            </>
          )}
          {errors.time && (
            <p role="alert" className="mt-1.5 text-caption text-danger-strong">
              {errors.time}
            </p>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-label text-fg">Tour type</legend>
          <div className="flex flex-wrap gap-2">
            {TOUR_TYPES.map((option) => (
              <label key={option} className="relative min-w-[5.5rem] flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="tour-type"
                  value={option}
                  checked={type === option}
                  onChange={() => setType(option)}
                  className="peer sr-only"
                />
                <span className="flex h-10 items-center justify-center rounded-control border border-line-strong bg-surface px-2.5 text-body text-fg transition-colors duration-fast ease-standard hover:bg-surface-muted peer-checked:border-brand peer-checked:bg-brand-subtle peer-checked:font-medium peer-checked:text-brand-strong peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
                  {option}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <Input
              label="Units to show"
              placeholder="e.g. Unit 204"
              value={unitDraft}
              wrapperClassName="min-w-0 flex-1"
              onChange={(event) => setUnitDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addUnit();
                }
              }}
            />
            <Button variant="secondary" leadingIcon={<PlusIcon />} disabled={!unitDraft.trim()} onClick={addUnit}>
              Add
            </Button>
          </div>
          {units.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Units to show">
              {units.map((unit) => (
                <li
                  key={unit}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-surface-muted py-0 pl-3 pr-1 text-caption font-medium text-fg ring-1 ring-inset ring-line"
                >
                  {unit}
                  <IconButton
                    label={/^unit\b/i.test(unit) ? `Remove ${unit}` : `Remove unit ${unit}`}
                    size="sm"
                    className="!h-6 !w-6 !rounded-full"
                    onClick={() => setUnits((current) => current.filter((item) => item !== unit))}
                  >
                    <CloseIcon />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Textarea
          label="Notes"
          hint="Optional"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        {success && (
          <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-control bg-success-subtle p-3 text-body text-success-strong">
            <span className="inline-flex items-center gap-1.5">
              <CheckIcon />
              Tour scheduled for {formatLongDay(success.start)} at {formatTimeOfDay(success.start)}.
            </span>
            {success.href && (
              <a href={success.href} className={cn(LINK_BUTTON_CLASSES, 'text-fg')}>
                <MessageIcon />
                Text {firstNameOf(success.name)} a confirmation
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-line px-5 py-4">
        <Button type="submit" loading={submitting}>
          Schedule tour
        </Button>
      </div>
    </Card>
  );
}

export default ScheduleTourForm;
