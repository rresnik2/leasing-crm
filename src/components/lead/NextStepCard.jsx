import { useState } from 'react';

import { logActivity } from '../../data/activities';
import { cleanActionText, getFollowUp } from '../../utils/followUp';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useToast } from '../ui/useToast';
import ContactAction from './ContactAction';
import { getDueBadge, getFirstName } from './leadPageUtils';

const CHANNEL_VERBS = { call: 'Call', text: 'Text', email: 'Email' };

export default function NextStepCard({ lead, score, onContact }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const followUp = getFollowUp(lead, now);

  if (!followUp) {
    return (
      <Card>
        <h2 className="text-title text-fg">Next step</h2>
        <p className="mt-2 text-body text-fg-muted">No next step — this lead is {lead.status}.</p>
      </Card>
    );
  }

  const action = cleanActionText(score?.data?.recommended_action) || followUp.method;
  const due = getDueBadge(followUp, now);
  const first = getFirstName(lead.name);
  const verb = CHANNEL_VERBS[followUp.channel];

  const markDone = async () => {
    setSaving(true);
    try {
      await logActivity(lead.id, { type: 'follow-up', body: followUp.method });
      toast({ tone: 'success', title: 'Follow-up logged' });
    } catch (error) {
      console.error('Error logging follow-up: ', error);
      toast({ tone: 'danger', title: "Couldn't log follow-up" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-title text-fg">Next step</h2>
        <Badge tone={due.tone}>{due.label}</Badge>
      </div>
      <p className="mt-3 text-heading text-fg">{action}</p>
      <dl className="mt-3 grid gap-3 text-body sm:grid-cols-2">
        <div>
          <dt className="text-caption font-medium uppercase tracking-wide text-fg-subtle">How</dt>
          <dd className="mt-0.5 text-fg">{followUp.method}</dd>
        </div>
        <div>
          <dt className="text-caption font-medium uppercase tracking-wide text-fg-subtle">When</dt>
          <dd className="mt-0.5 text-fg">{followUp.windowLabel}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <ContactAction
          kind={followUp.channel}
          lead={lead}
          variant="primary"
          label={first ? `${verb} ${first}` : verb}
          onContact={onContact}
        />
        <Button variant="secondary" loading={saving} onClick={markDone}>
          Mark done
        </Button>
      </div>
    </Card>
  );
}
