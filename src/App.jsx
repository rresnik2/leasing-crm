import { useState, useEffect } from 'react';
import LeadCard from './components/LeadCard';
import AddLeadForm from './components/AddLeadForm';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import LeadModal from './components/LeadModal';
// Uncomment the line below to seed the database ONCE
// import { seedDatabase } from './seedDatabase';

function App() {

  useEffect(() => {
    // Uncomment the line below to seed the database ONCE
    // seedDatabase();
  }, []);

  const [currentView, setCurrentView] = useState('leads');
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
    } catch (error) {
      console.error("Error adding lead: ", error);
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
    } catch (error) {
      console.error("Error deleting lead: ", error);
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
        alert("Cannot save: This lead has an invalid ID. It may have been added incorrectly.");
        return;
      }
      // Debugging for updating lead
      // console.log("Updating document with ID:", id);
      // console.log("Data being saved:", leadData);

      await updateDoc(doc(db, 'leads', id), leadData);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving lead: ", error);
      alert("Failed to save changes. Please try again.");
    }
  };


  return (

    <div className="min-h-screen bg-blue-100 p-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-8 text-center">Leasing CRM </h1>
      {/* // button for importing sample data to database */}
      {/* <div className="text-center mb-4">
        <button
          onClick={seedDatabase}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Seed Database (Dev Only)
        </button>
      </div> */}

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border rounded"
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded"
            >
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredAndSortedLeads.length} of {leads.length} leads
          </div>
        </div>
        <AddLeadForm onAddLead={handleAddLead} />
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
      <footer className="mt-8 py-4 text-center text-gray-500 text-sm border-t">
        <p>
          Built by Reece Resnik |
          <a
            href="https://github.com/rresnik2/leasing-crm"
            className="ml-1 text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </p>
      </footer>
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
    </div>

  );

}

export default App;