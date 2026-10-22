import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ToastProvider from '../components/ui/ToastProvider';
import LeadPage from './LeadPage';

const mocks = vi.hoisted(() => ({
  leads: { value: null },
  logActivity: vi.fn(() => Promise.resolve('a1')),
  addTask: vi.fn(() => Promise.resolve('t1')),
  setTaskDone: vi.fn(() => Promise.resolve()),
  deleteTask: vi.fn(() => Promise.resolve()),
  updateLead: vi.fn(() => Promise.resolve()),
}));

vi.mock('../hooks/useLeads', () => ({ default: () => mocks.leads.value }));
vi.mock('../hooks/useActivities', () => ({
  default: () => ({
    loading: false,
    error: null,
    activities: [
      { id: 'a', type: 'note', body: 'Prefers high floor', createdAt: new Date().toISOString() },
      { id: 'b', type: 'call', body: 'Left voicemail', createdAt: new Date().toISOString(), durationMinutes: 3 },
      { id: 'c', type: 'status', body: '', from: 'New Inquiry', to: 'Contacted', createdAt: new Date().toISOString() },
    ],
  }),
}));
vi.mock('../hooks/useTasks', () => ({
  default: () => ({
    loading: false,
    error: null,
    tasks: [{ id: 't', title: 'Send floor plans', dueDate: '2000-01-01', done: false }],
  }),
}));
vi.mock('../hooks/useLeadTours', () => ({ default: () => ({ loading: false, error: null, tours: [] }) }));
vi.mock('../data/activities', () => ({ logActivity: mocks.logActivity }));
vi.mock('../data/tasks', () => ({
  addTask: mocks.addTask,
  setTaskDone: mocks.setTaskDone,
  deleteTask: mocks.deleteTask,
}));

const lead = {
  id: 'L1',
  name: 'Sarah Mitchell',
  email: 'sarah@example.com',
  phone: '(415) 555-0132',
  status: 'Contacted',
  moveInDate: '2030-01-15',
  unitType: '1 Bedroom',
  notes: 'Has a cat',
  createdAt: '2026-10-01T10:00:00.000Z',
};

const setup = (overrides = {}) => {
  mocks.leads.value = {
    loading: false,
    leads: [lead],
    scores: { L1: { loading: false, data: { score: 71, priority: 'Medium', recommended_action: '📞 Call now', factors: { urgency: 10, engagement: 15, completeness: 3, demand: 15 } } } },
    getLead: (id) => (id === 'L1' ? lead : null),
    updateLead: mocks.updateLead,
    deleteLead: vi.fn(),
    ...overrides,
  };
  return render(
    <ToastProvider>
      <LeadPage leadId="L1" />
    </ToastProvider>,
  );
};

describe('LeadPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a loading state and a not-found state', () => {
    const { unmount } = setup({ loading: true });
    expect(screen.getByText('Loading lead…')).toBeInTheDocument();
    unmount();
    mocks.leads.value.loading = false;
    render(
      <ToastProvider>
        <LeadPage leadId="nope" />
      </ToastProvider>,
    );
    expect(screen.getByText('Lead not found')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Back to Leads/ })[0]).toHaveAttribute('href', '#/leads');
  });

  it('renders the header, score and next step', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Sarah Mitchell' })).toBeInTheDocument();
    expect(screen.getByText('Score 71 · Medium')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Email Sarah' })).toHaveAttribute('href', 'mailto:sarah@example.com');
    expect(screen.getByText('Call now')).toBeInTheDocument();
    expect(screen.getByText('Move-in urgency')).toBeInTheDocument();
  });

  it('marks the follow-up done', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }));
    await waitFor(() => expect(mocks.logActivity).toHaveBeenCalledWith('L1', expect.objectContaining({ type: 'follow-up' })));
  });

  it('logs a call from the composer and switches type from the header', async () => {
    setup();
    fireEvent.click(screen.getByRole('link', { name: 'Text' }));
    expect(screen.getByRole('button', { name: 'Text', pressed: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Log call' }));
    const save = screen.getAllByRole('button', { name: 'Log call' }).pop();
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Call notes'), { target: { value: 'Talked tours' } });
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '5' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Log call' }).pop());
    await waitFor(() =>
      expect(mocks.logActivity).toHaveBeenCalledWith('L1', { type: 'call', body: 'Talked tours', durationMinutes: 5 }),
    );
  });

  it('pins a note through updateLead', async () => {
    setup();
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Pinned text' } });
    fireEvent.click(screen.getByLabelText('Pin as lead note'));
    fireEvent.click(screen.getByRole('button', { name: 'Save pinned note' }));
    await waitFor(() => expect(mocks.updateLead).toHaveBeenCalledWith('L1', { notes: 'Pinned text' }));
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it('filters the timeline', () => {
    setup();
    expect(screen.getByText('Prefers high floor')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Calls' }));
    expect(screen.queryByText('Prefers high floor')).not.toBeInTheDocument();
    expect(screen.getByText('Left voicemail')).toBeInTheDocument();
  });

  it('manages tasks', async () => {
    setup();
    fireEvent.click(screen.getByLabelText('Send floor plans'));
    await waitFor(() => expect(mocks.setTaskDone).toHaveBeenCalledWith('L1', 't', true));
    fireEvent.change(screen.getByLabelText('New task'), { target: { value: 'Call back' } });
    fireEvent.submit(screen.getByLabelText('New task').closest('form'));
    await waitFor(() => expect(mocks.addTask).toHaveBeenCalledWith('L1', { title: 'Call back', dueDate: '' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete task: Send floor plans' }));
    await waitFor(() => expect(mocks.deleteTask).toHaveBeenCalledWith('L1', 't'));
  });

  it('hides score and next step for finished leads', () => {
    const done = { ...lead, status: 'Leased' };
    setup({ getLead: () => done, scores: {} });
    expect(screen.queryByText('Lead score')).not.toBeInTheDocument();
    expect(screen.getByText(/No next step/)).toBeInTheDocument();
  });
});
