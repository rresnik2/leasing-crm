import { useState } from 'react';

import { LinkButton } from '../components/lead/ContactAction';
import ActivityCard from '../components/lead/ActivityCard';
import DetailsCard from '../components/lead/DetailsCard';
import LeadHeader from '../components/lead/LeadHeader';
import NextStepCard from '../components/lead/NextStepCard';
import ScoreCard from '../components/lead/ScoreCard';
import TasksCard from '../components/lead/TasksCard';
import ToursCard from '../components/lead/ToursCard';
import Icon from '../components/lead/icons';
import LeadModal from '../components/LeadModal';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/useToast';
import useLeads from '../hooks/useLeads';
import { navigate, paths } from '../router';

function BackLink() {
  return (
    <a
      href={paths.leads()}
      className="inline-flex items-center gap-1 rounded-control text-body font-medium text-brand-strong hover:underline focus-ring"
    >
      <Icon name="back" />
      Back to Leads
    </a>
  );
}

function PageSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading lead…</span>
      <Skeleton className="h-5 w-32" />
      <Card>
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 shrink-0 !rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>
        <Skeleton className="mt-6 h-12 w-full" />
      </Card>
      <div className="flex flex-wrap gap-6">
        <div className="min-w-0 flex-[999_1_560px] space-y-6">
          <Skeleton className="h-40 w-full !rounded-card" />
          <Skeleton className="h-72 w-full !rounded-card" />
        </div>
        <div className="min-w-0 flex-[1_1_320px] space-y-6">
          <Skeleton className="h-64 w-full !rounded-card" />
          <Skeleton className="h-48 w-full !rounded-card" />
        </div>
      </div>
    </div>
  );
}

function LeadWorkspace({ lead }) {
  const { toast } = useToast();
  const { scores, updateLead, deleteLead } = useLeads();
  const [editing, setEditing] = useState(false);
  const [composerType, setComposerType] = useState('note');
  const score = scores[lead.id];

  const openEditor = () => setEditing(true);
  const closeEditor = () => setEditing(false);

  const handleSave = async (editedLead) => {
    const { id: _id, ...changes } = editedLead;
    try {
      await updateLead(lead.id, changes);
      toast({ tone: 'success', title: 'Changes saved' });
    } catch (error) {
      console.error('Error updating lead: ', error);
      toast({ tone: 'danger', title: "Couldn't save changes" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLead(lead.id);
      toast({ tone: 'success', title: 'Lead deleted' });
      navigate(paths.leads());
    } catch (error) {
      console.error('Error deleting lead: ', error);
      toast({ tone: 'danger', title: "Couldn't delete lead" });
    }
  };

  return (
    <div className="space-y-6">
      <BackLink />
      <LeadHeader lead={lead} score={score} onEdit={openEditor} onContact={setComposerType} />

      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[999_1_560px] space-y-6">
          <NextStepCard lead={lead} score={score} onContact={setComposerType} />
          <ActivityCard
            lead={lead}
            composerType={composerType}
            onComposerTypeChange={setComposerType}
            updateLead={updateLead}
          />
        </div>
        <div className="min-w-0 flex-[1_1_320px] space-y-6">
          <ScoreCard lead={lead} entry={score} />
          <DetailsCard lead={lead} onEdit={openEditor} />
          <ToursCard lead={lead} />
          <TasksCard lead={lead} />
        </div>
      </div>

      {editing && (
        <LeadModal lead={lead} isOpen onClose={closeEditor} onSave={handleSave} onDelete={handleDelete} />
      )}
    </div>
  );
}

function LeadPage({ leadId }) {
  const { loading, getLead } = useLeads();

  if (loading) return <PageSkeleton />;

  const lead = getLead(leadId);
  if (!lead) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Card>
          <EmptyState
            icon={<Icon name="inquiry" className="h-6 w-6" />}
            title="Lead not found"
            description="This lead may have been deleted, or the link is wrong."
            action={
              <LinkButton href={paths.leads()}>Back to Leads</LinkButton>
            }
          />
        </Card>
      </div>
    );
  }

  return <LeadWorkspace lead={lead} />;
}

export default LeadPage;
