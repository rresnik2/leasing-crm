import { useState } from 'react';

import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';
import { useToast } from '../ui/useToast';
import { TOUR_STATUS_TONES } from '../../constants/tourOptions';
import { cancelTour, completeTour, updateTour } from '../../data/tours';
import { paths } from '../../router';
import { smsHref } from '../../utils/contactLinks';
import { LINK_BUTTON_MD_CLASSES, LINK_CLASSES } from './linkStyles';
import { MessageIcon } from './icons';
import { formatTourWhen, reminderBody } from './tourCalendarUtils';

function Detail({ label, children }) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3">
      <dt className="text-body text-fg-muted">{label}</dt>
      <dd className="min-w-0 break-words text-body text-fg">{children}</dd>
    </div>
  );
}

// tour: the tour to show (null closes the dialog); lead: the matching lead, if loaded
function TourDetailsDialog({ tour, lead, onClose }) {
  const { toast } = useToast();
  const [pending, setPending] = useState(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const run = async (key, action, { success, failure, close = false }) => {
    setPending(key);
    try {
      await action();
      toast({ tone: 'success', title: success });
      if (close) onClose();
    } catch (error) {
      console.error(failure, error);
      toast({ tone: 'danger', title: failure });
    } finally {
      setPending(null);
      setConfirmingCancel(false);
    }
  };

  if (!tour) return null;

  const open = tour.status === 'Unconfirmed' || tour.status === 'Confirmed';
  const reminder = tour.status === 'Unconfirmed' ? smsHref(lead?.phone, reminderBody(tour.leadName, tour.start)) : null;
  const busy = pending !== null;

  return (
    <>
      <Modal open onClose={onClose} title="Tour details" size="md">
        <dl className="space-y-3">
          <Detail label="Lead">
            <a href={paths.lead(tour.leadId)} className={LINK_CLASSES}>
              {tour.leadName}
            </a>
          </Detail>
          <Detail label="When">
            <span className="tabular-nums">{formatTourWhen(tour)}</span>
          </Detail>
          <Detail label="Type">{tour.type}</Detail>
          <Detail label="Units">{tour.units?.length ? tour.units.join(', ') : <span className="text-fg-muted">None listed</span>}</Detail>
          <Detail label="Notes">
            {tour.notes ? <span className="whitespace-pre-wrap">{tour.notes}</span> : <span className="text-fg-muted">No notes</span>}
          </Detail>
          <Detail label="Status">
            <Badge tone={TOUR_STATUS_TONES[tour.status] ?? 'neutral'} dot>
              {tour.status}
            </Badge>
          </Detail>
        </dl>

        {open && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
            {tour.status === 'Unconfirmed' && (
              <Button
                loading={pending === 'confirm'}
                disabled={busy}
                onClick={() =>
                  run('confirm', () => updateTour(tour.id, { status: 'Confirmed' }), {
                    success: 'Tour confirmed',
                    failure: "Couldn't confirm tour",
                  })
                }
              >
                Mark confirmed
              </Button>
            )}
            {reminder && (
              <a href={reminder} className={LINK_BUTTON_MD_CLASSES}>
                <MessageIcon />
                Text reminder
              </a>
            )}
            <Button
              variant="secondary"
              loading={pending === 'complete'}
              disabled={busy}
              onClick={() =>
                run('complete', () => completeTour(tour), {
                  success: 'Tour marked completed',
                  failure: "Couldn't complete tour",
                  close: true,
                })
              }
            >
              Mark completed
            </Button>
            <Button
              variant="secondary"
              loading={pending === 'noshow'}
              disabled={busy}
              onClick={() =>
                run('noshow', () => updateTour(tour.id, { status: 'No-show' }), {
                  success: 'Marked as no-show',
                  failure: "Couldn't update tour",
                  close: true,
                })
              }
            >
              No-show
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setConfirmingCancel(true)}>
              Cancel tour
            </Button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel this tour?"
        description={`${tour.leadName}, ${formatTourWhen(tour)}. The time opens up again.`}
        confirmLabel="Cancel tour"
        cancelLabel="Keep tour"
        loading={pending === 'cancel'}
        onCancel={() => setConfirmingCancel(false)}
        onConfirm={() =>
          run('cancel', () => cancelTour(tour), {
            success: 'Tour canceled',
            failure: "Couldn't cancel tour",
            close: true,
          })
        }
      />
    </>
  );
}

export default TourDetailsDialog;
