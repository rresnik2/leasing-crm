import { useContext } from 'react';

import { LeadsContext } from '../data/leadsContext';

// Returns { leads, loading, scores, getLead, addLead, updateLead, deleteLead }.
export default function useLeads() {
  const context = useContext(LeadsContext);
  if (context === null) {
    throw new Error('useLeads must be used inside <LeadsProvider>');
  }
  return context;
}
