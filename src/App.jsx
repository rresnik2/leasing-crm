import { useState, useEffect } from 'react';
import LeadCard from './components/LeadCard';
import AddLeadForm from './components/AddLeadForm';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
// import Dashboard from './components/Dashboard';
import LeadModal from './components/LeadModal';
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

  // const [leads, setLeads] = useState(() => {
  //   const savedLeads = localStorage.getItem('crmLeads');
  //   if (savedLeads) {
  //     return JSON.parse(savedLeads);
  //   }
  //   // Default leads if nothing in storage
  //   return [
  //     {
  //       id: 1,
  //       name: "Sarah Mitchell",
  //       email: "sarah.mitchell@email.com",
  //       phone: "(206) 555-1234",
  //       status: "Tour Completed",
  //       moveInDate: "2025-12-01",
  //       unitType: "2 Bedroom"
  //     },
  //     {
  //       id: 2,
  //       name: "Marcus Chen",
  //       email: "mchen92@email.com",
  //       phone: "(425) 555-5678",
  //       status: "Leased",
  //       moveInDate: "2025-01-15",
  //       unitType: "1 Bedroom"
  //     },
  //     {
  //       id: 3,
  //       name: "Jennifer Davis",
  //       email: "jdavis.seattle@email.com",
  //       phone: "(206) 555-9012",
  //       status: "New Inquiry",
  //       moveInDate: "2025-11-11",
  //       unitType: "Studio"
  //     }
  //     ,
  //     {
  //       id: 4,
  //       name: "Ken Doll",
  //       email: "mymansion@email.com",
  //       phone: "(425) 986-1238",
  //       status: "Leased Elsewhere",
  //       moveInDate: "2025-12-31",
  //       unitType: "3 Bedroom"
  //     },
  //     {
  //       id: 5,
  //       name: "Ben Jamin",
  //       email: "beninseattle@email.com",
  //       phone: "(206) 555-0921",
  //       status: "Search Hold",
  //       moveInDate: "2026-05-01",
  //       unitType: "Studio"
  //     },

  //     {
  //       id: 8,
  //       name: "Robert & Amy Johnson",
  //       email: "johnson.family@email.com",
  //       phone: "(425) 555-0154",
  //       status: "Tour Completed",
  //       moveInDate: "2025-03-01",
  //       unitType: "3 Bedroom"
  //     },
  //     {
  //       id: 9,
  //       name: "Alex Rivera",
  //       email: "arivera.seattle@gmail.com",
  //       phone: "(206) 555-0121",
  //       status: "New Inquiry",
  //       moveInDate: "2025-02-15",
  //       unitType: "1 Bedroom"
  //     },
  //     {
  //       id: 6,
  //       name: "David Park",
  //       email: "dpark89@outlook.com",
  //       phone: "(425) 555-0189",
  //       status: "Contacted",
  //       moveInDate: "2025-01-30",
  //       unitType: "2 Bedroom"
  //     },
  //     {
  //       id: 7,
  //       name: "Lisa Thompson",
  //       email: "lisa.thompson@uw.edu",
  //       phone: "(206) 555-0167",
  //       status: "Leased",
  //       moveInDate: "2024-12-01",
  //       unitType: "Studio"
  //     }
  //   ];
  // });

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
        // Just remove from local state, don't try Firestore
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
    console.log("Saving lead:", updatedLead);
    try {
      const { id, ...leadData } = updatedLead;

      // Check if this is a valid Firestore ID (should be a string)
      if (!id || typeof id !== 'string') {
        console.error("Invalid ID for modal save:", id);
        alert("Cannot save: This lead has an invalid ID. It may have been added incorrectly.");
        return;
      }

      console.log("Updating document with ID:", id);
      console.log("Data being saved:", leadData);

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