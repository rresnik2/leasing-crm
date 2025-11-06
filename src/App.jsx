import { useState, useEffect } from 'react';
import LeadCard from './components/LeadCard';
import AddLeadForm from './components/AddLeadForm';

function App() {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  const [leads, setLeads] = useState(() => {
    const savedLeads = localStorage.getItem('crmLeads');
    if (savedLeads) {
      return JSON.parse(savedLeads);
    }
    // Default leads if nothing in storage
    return [
      {
        id: 1,
        name: "Sarah Johnson",
        email: "sarah@email.com",
        phone: "(206) 555-0101",
        status: "New Inquiry"
      },
      {
        id: 2,
        name: "Mike Chen",
        email: "mike@email.com",
        phone: "(206) 555-0102",
        status: "Search Hold"
      },
      {
        id: 3,
        name: "Emily Davis",
        email: "emily@email.com",
        phone: "(206) 555-0103",
        status: "Applied"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('crmLeads', JSON.stringify(leads));
  }, [leads]);

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

  const handleAddLead = (newLead) => {
    // add the new lead to the leads array
    
    setLeads([...leads, newLead]);
  };

  const handleDeleteLead = (id) => {
    // Uses setLeads to remove the lead with this id
    setLeads(filteredAndSortedLeads.filter(lead => lead.id !== id))
  };

  const handleEditLead = (id, updatedData) => {
    // Update the lead with this id
    setLeads(filteredAndSortedLeads.map(lead => lead.id === id ? { ...lead, ...updatedData } : lead
  ));
    
  };


  return (
    <div className="min-h-screen bg-blue-100 p-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-8 text-center">Leasing CRM </h1>
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
          name={lead.name} 
          email={lead.email} 
          phone={lead.phone} 
          status={lead.status}
          moveInDate={lead.moveInDate}
          unitType={lead.unitType}
          onDelete={() => handleDeleteLead(lead.id)} 
          onEdit={(updatedData) => handleEditLead(lead.id, updatedData)}/>))}
      </div>
    </div>
  );
}

export default App;