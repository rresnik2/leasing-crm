import { useState } from 'react';

import LeadCard from '../components/LeadCard';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/useToast';
import { FINISHED_STATUSES, LEAD_STATUSES } from '../constants/leadOptions';
import useLeads from '../hooks/useLeads';
import { navigate, paths } from '../router';

const SORT_OPTIONS = [
  { value: 'name', label: 'Sort by name' },
  { value: 'status', label: 'Sort by status' },
  { value: 'score', label: 'Sort by score' },
  { value: 'moveInDate', label: 'Sort by move-in date' },
];

// position in the pipeline; statuses not in LEAD_STATUSES go last
const statusRank = (status) => {
  const index = LEAD_STATUSES.indexOf(status);
  return index === -1 ? LEAD_STATUSES.length : index;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.4c1.8.8 3 2.6 3 5.6" />
    </svg>
  );
}

function SearchOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M8.5 8.5l5 5M13.5 8.5l-5 5" />
    </svg>
  );
}

// placeholder shaped like a lead card while leads load
function LeadCardSkeleton() {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-6 w-24 !rounded-full" />
      </div>
      <Skeleton className="mt-4 h-1.5 w-full !rounded-full" />
      <div className="mt-4 flex gap-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>
    </Card>
  );
}


// query.q seeds the search box (the top bar search links here)
function LeadsPage({ query }) {
  const { toast } = useToast();
  const { leads, loading, scores, updateLead, deleteLead } = useLeads();

  const initialSearch = query?.q ?? '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [seededSearch, setSeededSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  // a new search from the top bar replaces the box while this page stays mounted
  if (initialSearch !== seededSearch) {
    setSeededSearch(initialSearch);
    setSearchTerm(initialSearch);
  }

  // every status in pipeline order, then any unknown ones found in the data
  const statusCounts = leads.reduce((counts, lead) => {
    counts[lead.status] = (counts[lead.status] || 0) + 1;
    return counts;
  }, {});
  const filterStatuses = [
    'All',
    ...LEAD_STATUSES,
    ...Object.keys(statusCounts).filter(status => status && !LEAD_STATUSES.includes(status)),
  ];
  const statusOptions = filterStatuses.map(status => {
    const label = status === 'All' ? 'All statuses' : status;
    const count = status === 'All' ? leads.length : statusCounts[status] || 0;
    // counts would all read 0 until leads arrive
    return { value: status, label: loading ? label : `${label} (${count})` };
  });

  // highest first; finished and unscored leads go last
  const scoreOf = (lead) => scores[lead.id]?.data?.score ?? -1;

  // Filter leads based on search term and status, then sort
  const filteredAndSortedLeads = leads
    .filter(lead => {
      // Search matches name or email
      const matchesSearch = (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      // Status matches filter or "All" is selected
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // ties fall back to name order
      const byName = (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'status') {
        return statusRank(a.status) - statusRank(b.status) || byName;
      } else if (sortBy === 'score') {
        return scoreOf(b) - scoreOf(a) || byName;
      } else if (sortBy === 'moveInDate') {
        // soonest first; finished leads and blank dates go last.
        // YYYY-MM-DD strings sort as dates.
        const aFinished = FINISHED_STATUSES.includes(a.status);
        if (aFinished !== FINISHED_STATUSES.includes(b.status)) return aFinished ? 1 : -1;
        if (!a.moveInDate !== !b.moveInDate) return a.moveInDate ? -1 : 1;
        return (a.moveInDate || '').localeCompare(b.moveInDate || '') || byName;
      }
      return byName;
    });

  const handleDeleteLead = async (id) => {
    try {
      await deleteLead(id);
      toast({ tone: 'success', title: 'Lead deleted' });
    } catch (error) {
      console.error('Error deleting lead: ', error);
      toast({ tone: 'danger', title: "Couldn't delete lead" });
    }
  };

  const handleEditLead = async (id, updatedData) => {
    try {
      await updateLead(id, updatedData);
    } catch (error) {
      console.error('Error updating lead: ', error);
      toast({ tone: 'danger', title: "Couldn't update lead" });
    }
  };

  const handleCardClick = (lead) => navigate(paths.lead(lead.id));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-fg">Leads</h1>
        <p className="mt-1 text-body text-fg-muted">Track prospects from first inquiry to signed lease.</p>
      </header>

      {/* Search and Filter Bar */}
      <Card>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
          {/* Search Input */}
          <Input
            type="search"
            aria-label="Search by name or email"
            placeholder="Search by name or email…"
            leadingIcon={<SearchIcon />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Status Filter */}
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />

          {/* Sort Dropdown */}
          <Select
            aria-label="Sort leads"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={SORT_OPTIONS}
          />
        </div>

        {/* Results count */}
        <div className="mt-3 text-caption text-fg-muted" aria-live="polite">
          {loading
            ? 'Loading leads…'
            : `Showing ${filteredAndSortedLeads.length} of ${leads.length} leads`}
        </div>
      </Card>
      {loading ? (
        <div role="status" className="space-y-4">
          <span className="sr-only">Loading leads…</span>
          <LeadCardSkeleton />
          <LeadCardSkeleton />
          <LeadCardSkeleton />
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UsersIcon />}
            title="No leads yet"
            description="Use Add lead at the top of the page to start tracking your first one."
          />
        </Card>
      ) : filteredAndSortedLeads.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchOffIcon />}
            title="No leads match your filters"
            description="Try a different search or status."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                }}
              >
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedLeads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              name={lead.name}
              email={lead.email}
              phone={lead.phone}
              status={lead.status}
              moveInDate={lead.moveInDate}
              unitType={lead.unitType}
              score={scores[lead.id]}
              onDelete={() => handleDeleteLead(lead.id)}
              onEdit={(updatedData) => handleEditLead(lead.id, updatedData)}
              onCardClick={handleCardClick} />))}
        </div>
      )}
    </div>
  );
}

export default LeadsPage;
