import { useState } from 'react';

import useLeads from '../../hooks/useLeads';
import { navigate, paths, useRoute } from '../../router';
import AddLeadModal from '../AddLeadModal';
import ChatAssistant from '../ChatAssistant';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { cn } from '../ui/cn';
import { useToast } from '../ui/useToast';

const NAV_ITEMS = [
  { label: 'Today', href: paths.today(), routes: ['today'] },
  { label: 'Leads', href: paths.leads(), routes: ['leads', 'lead'] },
  { label: 'Tours', href: paths.tours(), routes: ['tours'] },
];

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// Top app bar, page container, footer and the chat assistant shared by every page.
function AppShell({ children }) {
  const route = useRoute();
  const { addLead } = useLeads();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(paths.leads({ q: searchTerm.trim() }));
  };

  // returns whether the lead was saved; AddLeadModal shows the error inline
  const handleAddLead = async (data) => {
    try {
      const id = await addLead(data);
      toast({ tone: 'success', title: 'Lead added', description: data.name });
      navigate(paths.lead(id));
      return true;
    } catch (error) {
      console.error('Error adding lead: ', error);
      return false;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <a href={paths.today()} className="flex items-center gap-2.5 rounded-control text-fg focus-ring">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-control bg-brand text-fg-inverse">
              <HomeIcon />
            </span>
            <span className="text-body font-bold">Leasing CRM</span>
          </a>

          <nav aria-label="Main" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const active = item.routes.includes(route.name);
              return (
                <a
                  key={item.label}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'whitespace-nowrap rounded-control px-3 py-2 text-label focus-ring',
                    active ? 'bg-brand-subtle text-brand-strong' : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="flex min-w-0 flex-1 basis-72 items-center justify-end gap-2">
            <form role="search" onSubmit={handleSearch} className="min-w-0 max-w-xs flex-1">
              <Input
                type="search"
                aria-label="Search leads"
                placeholder="Search leads…"
                leadingIcon={<SearchIcon />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
            <Button leadingIcon={<PlusIcon />} onClick={() => setIsAddOpen(true)} className="shrink-0">
              Add lead
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <main>{children}</main>
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

      {isAddOpen && <AddLeadModal onClose={() => setIsAddOpen(false)} onAddLead={handleAddLead} />}
      <ChatAssistant />
    </div>
  );
}

export default AppShell;
