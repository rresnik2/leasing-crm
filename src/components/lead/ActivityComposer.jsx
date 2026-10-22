import { useId, useState } from 'react';

import { ACTIVITY_LABELS } from '../../constants/activityOptions';
import { logActivity } from '../../data/activities';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { cn } from '../ui/cn';
import { useToast } from '../ui/useToast';
import { COMPOSER_TYPES } from './leadPageUtils';

// Logs a note/call/email/text on the timeline. A note can instead be pinned to lead.notes.
export default function ActivityComposer({ lead, type, onTypeChange, updateLead }) {
  const { toast } = useToast();
  const checkId = useId();
  const [body, setBody] = useState('');
  const [minutes, setMinutes] = useState('');
  const [pin, setPin] = useState(false);
  const [saving, setSaving] = useState(false);

  const config = COMPOSER_TYPES.find((t) => t.id === type) ?? COMPOSER_TYPES[0];
  const pinning = type === 'note' && pin;
  const text = body.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text || saving) return;
    setSaving(true);
    try {
      if (pinning) {
        await updateLead(lead.id, { notes: text });
        toast({ tone: 'success', title: 'Pinned note saved' });
      } else {
        const durationMinutes = type === 'call' ? parseInt(minutes, 10) : NaN;
        await logActivity(lead.id, {
          type,
          body: text,
          ...(durationMinutes > 0 ? { durationMinutes } : {}),
        });
        toast({ tone: 'success', title: `${ACTIVITY_LABELS[type]} logged` });
      }
      setBody('');
      setMinutes('');
      setPin(false);
    } catch (error) {
      console.error('Error saving activity: ', error);
      toast({ tone: 'danger', title: "Couldn't save activity" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div role="group" aria-label="Activity type" className="flex flex-wrap gap-2">
        {COMPOSER_TYPES.map((option) => (
          <Button
            key={option.id}
            size="sm"
            variant={option.id === type ? 'primary' : 'secondary'}
            aria-pressed={option.id === type}
            onClick={() => onTypeChange(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Textarea
        label={config.fieldLabel}
        placeholder={config.placeholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-4">
          {type === 'call' && (
            <Input
              label="Minutes"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Optional"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              wrapperClassName="w-28"
            />
          )}
          {type === 'note' && (
            <div className="flex items-center gap-2">
              <input
                id={checkId}
                type="checkbox"
                checked={pin}
                onChange={(e) => setPin(e.target.checked)}
                className={cn('h-4 w-4 rounded-control border-line-strong accent-brand focus-ring')}
              />
              <label htmlFor={checkId} className="text-body text-fg">
                Pin as lead note
              </label>
            </div>
          )}
        </div>
        <Button type="submit" loading={saving} disabled={!text}>
          {pinning ? 'Save pinned note' : config.saveLabel}
        </Button>
      </div>
    </form>
  );
}
