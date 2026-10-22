import { useEffect } from 'react';

import AppShell from './components/layout/AppShell';
import EmptyState from './components/ui/EmptyState';
import LeadsProvider from './data/LeadsProvider';
import useLeads from './hooks/useLeads';
import LeadPage from './pages/LeadPage';
import LeadsPage from './pages/LeadsPage';
import TodayPage from './pages/TodayPage';
import ToursPage from './pages/ToursPage';
import { paths, useRoute } from './router';
// Uncomment the line below to seed the database ONCE
// import { seedDatabase } from './seedDatabase';

const TITLES = {
  today: 'Today',
  leads: 'Leads',
  lead: 'Lead',
  tours: 'Tours',
  notFound: 'Page not found',
};

function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="That page doesn't exist."
      action={
        <a
          href={paths.today()}
          className="inline-flex h-10 items-center rounded-control border border-line-strong bg-surface px-4 text-label text-fg transition-colors duration-fast hover:bg-surface-muted focus-ring"
        >
          Go to Today
        </a>
      }
    />
  );
}

function Routes() {
  const route = useRoute();
  const { getLead } = useLeads();

  // scroll only when the page changes, not when its query does
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.name, route.params.id]);

  const leadName = route.name === 'lead' ? getLead(route.params.id)?.name : null;
  useEffect(() => {
    document.title = `${leadName || TITLES[route.name]} · Leasing CRM`;
  }, [route.name, leadName]);

  switch (route.name) {
    case 'today':
      return <TodayPage />;
    case 'leads':
      return <LeadsPage query={route.query} />;
    case 'lead':
      return <LeadPage leadId={route.params.id} />;
    case 'tours':
      return <ToursPage query={route.query} />;
    default:
      return <NotFound />;
  }
}

function App() {
  return (
    <LeadsProvider>
      <AppShell>
        <Routes />
      </AppShell>
    </LeadsProvider>
  );
}

export default App;
