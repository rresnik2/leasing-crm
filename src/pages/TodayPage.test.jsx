import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const logActivity = vi.fn(() => Promise.resolve('id'));
const updateTour = vi.fn(() => Promise.resolve());
const toast = vi.fn();

vi.mock('../firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({}));
vi.mock('../data/activities', () => ({ logActivity: (...a) => logActivity(...a) }));
vi.mock('../data/tours', () => ({ updateTour: (...a) => updateTour(...a) }));
vi.mock('../components/ui/useToast', () => ({ useToast: () => ({ toast }) }));

const iso = (d) => d.toISOString();
const now = new Date();
const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const pad = (n) => String(n).padStart(2, '0');
const localStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const leadsState = {
  loading: false,
  leads: [
    {
      id: 'l1', name: 'Sarah Mitchell', email: 's@x.com', phone: '(415) 555-0100', status: 'Contacted',
      moveInDate: '', createdAt: iso(new Date(now.getTime() - 3 * 86400000)),
    },
    { id: 'l2', name: 'Bob Stone', email: 'bob@x.com', phone: '', status: 'Leased', moveInDate: '' },
  ],
  scores: { l1: { loading: false, data: { score: 81, priority: 'High', recommended_action: '🔥 Call now' } } },
  getLead: (id) => leadsState.leads.find((l) => l.id === id),
};
let toursState;

vi.mock('../hooks/useLeads', () => ({ default: () => leadsState }));
vi.mock('../hooks/useTours', () => ({ default: () => toursState }));

import TodayPage from './TodayPage';

beforeEach(() => {
  vi.clearAllMocks();
  const start = new Date(startToday.getTime() + 23 * 3600000 + 30 * 60000);
  toursState = {
    loading: false,
    tours: [{ id: 't1', leadId: 'l1', leadName: 'Sarah Mitchell', start: localStr(start), type: 'In person', units: ['204'], status: 'Unconfirmed' }],
  };
});

describe('TodayPage', () => {
  it('renders summary, KPIs, follow-up and tour', () => {
    render(<TodayPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText('1 follow-up due and 1 tour today.')).toBeInTheDocument();
    expect(screen.getByText('+1 new this week')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Call Sarah Mitchell' })).toHaveAttribute('href', expect.stringMatching(/^tel:/));
    expect(screen.getByText('Call now')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark confirmed' })).toBeInTheDocument();
  });

  it('logs a follow-up when Done is clicked', async () => {
    render(<TodayPage />);
    fireEvent.click(screen.getByRole('button', { name: /Done/ }));
    await waitFor(() => expect(logActivity).toHaveBeenCalledWith('l1', { type: 'follow-up', body: expect.any(String) }));
    await waitFor(() => expect(toast).toHaveBeenCalled());
  });

  it('confirms an unconfirmed tour', async () => {
    render(<TodayPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark confirmed' }));
    await waitFor(() => expect(updateTour).toHaveBeenCalledWith('t1', { status: 'Confirmed' }));
  });

  it('shows empty states', () => {
    leadsState.leads = [];
    toursState = { loading: false, tours: [] };
    render(<TodayPage />);
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    expect(screen.getByText(/No tours today/)).toBeInTheDocument();
  });
});
