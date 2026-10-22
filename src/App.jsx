import { useState, useEffect } from 'react';
import LeadCard from './components/LeadCard';
import AddLeadForm from './components/AddLeadForm';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import LeadModal from './components/LeadModal';
import ChatAssistant from './components/ChatAssistant';
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import EmptyState from './components/ui/EmptyState';
import Input from './components/ui/Input';
import Select from './components/ui/Select';
import Skeleton from './components/ui/Skeleton';
import { useToast } from './components/ui/useToast';
// Uncomment the line below to seed the database ONCE
// import { seedDatabase } from './seedDatabase';

const SORT_OPTIONS = [
  { value: 'name', label: 'Sort by Name' },
  { value: 'status', label: 'Sort by Status' },
];

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

function App() {
  const { toast } = useToast();

  useEffect(() => {
    // Uncomment the line below to seed the database ONCE
    // seedDatabase();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listener
    const unsubscribe = onSnapshot(collection(db, 'leads'), (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeads(leadsData);
      setLoading(false);
    });
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const uniqueStatuses = ['All', ...new Set(leads.map(lead => lead.status))];

  // Filter leads based on search term and status, then sort
  const filteredAndSortedLeads = leads
    .filter(lead => {
      // Search matches name or email
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase());
      // Status matches filter or "All" is selected
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort alphabetically by name or status
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  const handleAddLead = async (newLead) => {
    try {
      await addDoc(collection(db, 'leads'), newLead);
      // The onSnapshot listener will automatically update the state
      toast({ tone: 'success', title: 'Lead added', description: newLead.name });
    } catch (error) {
      console.error("Error adding lead: ", error);
      toast({ tone: 'danger', title: "Couldn't add lead", description: 'Check your connection and try again.' });
    }
  };

  const handleDeleteLead = async (id) => {
    try {
      // Check if this is a numeric ID (invalid)
      if (typeof id === 'number') {
        console.log("Removing invalid lead with numeric ID from local state");
        //removes from local state, doesn't Firestore
        setLeads(leads.filter(lead => lead.id !== id));
        return;
      }

      // Normal Firestore delete for valid IDs
      await deleteDoc(doc(db, 'leads', id));
      toast({ tone: 'success', title: 'Lead deleted' });
    } catch (error) {
      console.error("Error deleting lead: ", error);
      toast({ tone: 'danger', title: "Couldn't delete lead" });
    }
  };

  const handleEditLead = async (id, updatedData) => {
    console.log("handleEditLead called with id:", id, "type:", typeof id);

    if (!id) {
      console.error("No ID provided for edit");
      return;
    }

    try {
      // Ensure id is a string
      const docId = String(id);
      await updateDoc(doc(db, 'leads', docId), updatedData);
    } catch (error) {
      console.error("Error updating lead: ", error);
      toast({ tone: 'danger', title: "Couldn't update lead" });
    }
  };

  const handleCardClick = (lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  }
  const handleModalSave = async (updatedLead) => {
    // Debugging for updating lead
    // console.log("Saving lead:", updatedLead);
    try {
      const { id, ...leadData } = updatedLead;

      if (!id || typeof id !== 'string') {
        // console.error("Invalid ID for modal save:", id);
        toast({
          tone: 'danger',
          title: "Can't save this lead",
          description: 'Cannot save: This lead has an invalid ID. It may have been added incorrectly.',
        });
        return;
      }
      // Debugging for updating lead
      // console.log("Updating document with ID:", id);
      // console.log("Data being saved:", leadData);

      await updateDoc(doc(db, 'leads', id), leadData);
      setIsModalOpen(false);
      toast({ tone: 'success', title: 'Changes saved' });
    } catch (error) {
      console.error("Error saving lead: ", error);
      toast({ tone: 'danger', title: "Couldn't save changes", description: 'Please try again.' });
    }
  };


  return (

    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <h1 className="text-display text-fg">Leasing CRM</h1>
          <p className="mt-1 text-body text-fg-muted">Track prospects from first inquiry to signed lease.</p>
        </header>
        {/* // button for importing sample data to database */}
        {/*<div className="text-center mb-4">
          <button
            onClick={seedDatabase}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Seed Database (Dev Only)
          </button>
        </div>*/}

        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <Card>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
              {/* Search Input */}
              <Input
                type="search"
                aria-label="Search leads"
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
                options={uniqueStatuses.map(status => ({
                  value: status,
                  label: status === 'All' ? 'All statuses' : status,
                }))}
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
              Showing {filteredAndSortedLeads.length} of {leads.length} leads
            </div>
          </Card>
          <AddLeadForm onAddLead={handleAddLead} />
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
                description="Add your first lead with the form above."
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
                  onDelete={() => handleDeleteLead(lead.id)}
                  onEdit={(updatedData) => handleEditLead(lead.id, updatedData)}
                  onCardClick={handleCardClick} />))}
            </div>
          )}
        </div>
        <footer className="mt-12 border-t border-line pt-6 text-center text-caption text-fg-muted">
          <p>
            Built by Reece Resnik |
            <a
              href="https://github.com/rresnik2/leasing-crm"
              className="ml-1 rounded-sm text-brand hover:underline focus-ring"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </footer>
      </div>
      {isModalOpen && (
        <LeadModal
          lead={selectedLead}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
          onDelete={() => {
            handleDeleteLead(selectedLead.id);
            setIsModalOpen(false);
          }}
        />
      )}
      <ChatAssistant />
    </div>

  );

}

export default App;