import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ToastProvider from '../components/ui/ToastProvider';

const mocks = vi.hoisted(() => ({
  tours: [],
  leads: [],
  addTour: vi.fn(),
  updateTour: vi.fn(),
  completeTour: vi.fn(),
  cancelTour: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../hooks/useTours', () => ({
  default: ({ from, to } = {}) => ({
    tours: from && to ? mocks.tours.filter((tour) => tour.start >= from && tour.start < to) : [],
    loading: false,
    error: null,
  }),
}));
vi.mock('../hooks/useLeads', () => ({
  default: () => ({
    leads: mocks.leads,
    loading: false,
    getLead: (id) => mocks.leads.find((lead) => lead.id === id) ?? null,
  }),
}));
vi.mock('../data/tours', () => ({
  addTour: (...args) => mocks.addTour(...args),
  updateTour: (...args) => mocks.updateTour(...args),
  completeTour: (...args) => mocks.completeTour(...args),
  cancelTour: (...args) => mocks.cancelTour(...args),
}));
vi.mock('../router', async (importOriginal) => ({
  ...(await importOriginal()),
  navigate: (...args) => mocks.navigate(...args),
}));

import ToursPage from './ToursPage';

const tour = (id, start, extra = {}) => ({
  id,
  leadId: 'lead-1',
  leadName: 'Sarah Mitchell',
  start,
  durationMinutes: 45,
  type: 'In person',
  units: [],
  status: 'Confirmed',
  notes: '',
  ...extra,
});

const renderPage = (query = {}) =>
  render(
    <ToastProvider>
      <ToursPage query={query} />
    </ToastProvider>
  );

describe('ToursPage', () => {
  beforeEach(() => {
    // Thursday Oct 22, 2026, 11:15 AM
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'], now: new Date(2026, 9, 22, 11, 15) });
    mocks.tours = [
      tour('t1', '2026-10-20T10:00'),
      tour('t2', '2026-10-22T14:30', { leadName: 'Kevin OBrien', leadId: 'lead-2', status: 'Unconfirmed' }),
      tour('t3', '2026-10-21T09:00', { status: 'Canceled', leadName: 'Gone Person' }),
      tour('t4', '2026-10-28T09:00', { leadName: 'Next Week' }),
    ];
    mocks.leads = [
      { id: 'lead-2', name: 'Zed Zimmer', status: 'Contacted', phone: '(206) 555-9012', unitType: 'Studio', moveInDate: '2026-11-11' },
      { id: 'lead-1', name: 'Amy Adams', status: 'New Inquiry', phone: '' },
      { id: 'lead-3', name: 'Done Dana', status: 'Leased' },
    ];
    Object.values(mocks).forEach((mock) => typeof mock?.mockReset === 'function' && mock.mockReset());
    mocks.addTour.mockResolvedValue('new-id');
    mocks.updateTour.mockResolvedValue();
    mocks.completeTour.mockResolvedValue();
    mocks.cancelTour.mockResolvedValue();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('summarizes the week and labels it', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Tours' })).toBeTruthy();
    expect(screen.getByText('2 tours this week · 1 waiting on confirmation')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Oct 19 – 25, 2026' })).toBeTruthy();
  });

  it('draws active tours, hides canceled ones, and marks today and now', () => {
    renderPage();
    expect(screen.getByRole('button', { name: '10:00 AM, Sarah Mitchell, Confirmed' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '2:30 PM, Kevin OBrien, Unconfirmed' })).toBeTruthy();
    expect(screen.queryByText('Gone Person')).toBeNull();
    expect(screen.queryByText('Next Week')).toBeNull();
    expect(document.querySelector('[aria-current="date"]').textContent).toContain('22');
    expect(screen.getByRole('img', { name: 'Now, 11:15 AM' })).toBeTruthy();
    expect(screen.getByText('Office closed')).toBeTruthy();
  });

  it('shows the week named by the date query', () => {
    renderPage({ date: '2026-10-28' });
    expect(screen.getByRole('heading', { name: 'Oct 26 – Nov 1, 2026' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '9:00 AM, Next Week, Confirmed' })).toBeTruthy();
  });

  it('navigates between weeks and keeps the lead in the URL', () => {
    renderPage({ lead: 'lead-1' });
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(mocks.navigate).toHaveBeenLastCalledWith('#/tours?lead=lead-1&date=2026-10-26');
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    expect(mocks.navigate).toHaveBeenLastCalledWith('#/tours?lead=lead-1&date=2026-10-12');
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(mocks.navigate).toHaveBeenLastCalledWith('#/tours?lead=lead-1');
  });

  it('switches to the list view', () => {
    renderPage();
    const list = screen.getByRole('button', { name: 'List' });
    fireEvent.click(list);
    expect(list.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Tuesday, Oct 20')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sarah Mitchell' }).getAttribute('href')).toBe('#/leads/lead-1');
  });

  it('opens tour details and confirms an unconfirmed tour', async () => {
    vi.useRealTimers();
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '2:30 PM, Kevin OBrien, Unconfirmed' }));
    const dialog = screen.getByRole('dialog', { name: 'Tour details' });
    expect(within(dialog).getByText('Thursday, Oct 22 · 2:30 PM – 3:15 PM')).toBeTruthy();
    const reminder = within(dialog).getByRole('link', { name: 'Text reminder' });
    expect(reminder.getAttribute('href')).toMatch(/^sms:\+1206555901/);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mark confirmed' }));
    await waitFor(() => expect(mocks.updateTour).toHaveBeenCalledWith('t2', { status: 'Confirmed' }));
  });

  it('cancels a tour after confirmation', async () => {
    vi.useRealTimers();
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '10:00 AM, Sarah Mitchell, Confirmed' }));
    const dialog = screen.getByRole('dialog', { name: 'Tour details' });
    expect(within(dialog).queryByRole('button', { name: 'Mark confirmed' })).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel tour' }));
    expect(mocks.cancelTour).not.toHaveBeenCalled();
    const confirm = screen.getByRole('dialog', { name: 'Cancel this tour?' });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Cancel tour' }));
    await waitFor(() => expect(mocks.cancelTour).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' })));
  });

  it('lists confirmation work and offers a reminder link', () => {
    renderPage();
    const card = screen.getByRole('region', { name: 'Needs confirmation' });
    expect(within(card).getByText('Kevin OBrien')).toBeTruthy();
    expect(within(card).getByText('Today, 2:30 PM · In person')).toBeTruthy();
    expect(within(card).getByRole('button', { name: 'Mark confirmed, Kevin OBrien' })).toBeTruthy();
  });

  it('says when everything is confirmed', () => {
    mocks.tours = [tour('t1', '2026-10-23T10:00')];
    renderPage();
    expect(screen.getByText('Every upcoming tour is confirmed.')).toBeTruthy();
  });

  describe('schedule form', () => {
    it('lists active leads by name and preselects the lead from the query', () => {
      renderPage({ lead: 'lead-2' });
      const select = screen.getByLabelText(/Lead/);
      const names = within(select).getAllByRole('option').map((option) => option.textContent);
      expect(names).toEqual(['Choose a lead', 'Amy Adams', 'Zed Zimmer']);
      expect(select.value).toBe('lead-2');
      expect(screen.getByText('Studio · Move-in Nov 11, 2026')).toBeTruthy();
    });

    it('defaults to today and leaves out booked slots', () => {
      renderPage();
      expect(screen.getByLabelText(/Date/).value).toBe('2026-10-22');
      expect(screen.queryByRole('button', { name: '2:30 PM' })).toBeNull();
      expect(screen.queryByRole('button', { name: '2:00 PM' })).toBeNull();
      expect(screen.getByRole('button', { name: '1:30 PM' })).toBeTruthy();
      expect(screen.getByText(/2:30 PM is booked\./)).toBeTruthy();
    });

    it('shows a closed message on Sundays', () => {
      renderPage();
      fireEvent.change(screen.getByLabelText(/Date/), { target: { value: '2026-10-25' } });
      expect(screen.getByText('The office is closed on Sundays')).toBeTruthy();
      expect(screen.queryByRole('button', { name: '9:00 AM' })).toBeNull();
    });

    it('validates before submitting', () => {
      renderPage();
      fireEvent.click(screen.getAllByRole('button', { name: 'Schedule tour' }).at(-1));
      expect(screen.getByText('Choose a lead', { selector: 'p' })).toBeTruthy();
      expect(screen.getByText('Pick a time')).toBeTruthy();
      expect(mocks.addTour).not.toHaveBeenCalled();
    });

    it('schedules a tour with units and shows the text link', async () => {
      vi.useRealTimers();
      renderPage();
      fireEvent.change(screen.getByLabelText(/Lead/), { target: { value: 'lead-2' } });
      fireEvent.click(screen.getByRole('button', { name: '3:30 PM' }));
      fireEvent.click(screen.getByRole('radio', { name: 'Virtual' }));
      const unitInput = screen.getByLabelText('Units to show');
      fireEvent.change(unitInput, { target: { value: 'Unit 204' } });
      fireEvent.keyDown(unitInput, { key: 'Enter' });
      fireEvent.change(unitInput, { target: { value: 'unit 204' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(screen.getAllByRole('button', { name: 'Remove Unit 204' })).toHaveLength(1);
      fireEvent.change(screen.getByLabelText(/Notes/), { target: { value: ' Has a dog ' } });
      fireEvent.click(screen.getAllByRole('button', { name: 'Schedule tour' }).at(-1));

      await waitFor(() =>
        expect(mocks.addTour).toHaveBeenCalledWith({
          leadId: 'lead-2',
          leadName: 'Zed Zimmer',
          start: '2026-10-22T15:30',
          type: 'Virtual',
          units: ['Unit 204'],
          notes: 'Has a dog',
        })
      );
      const link = await screen.findByRole('link', { name: /Text Zed a confirmation/ });
      expect(link.getAttribute('href')).toMatch(/^sms:\+1206555901/);
      expect(mocks.navigate).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: 'Remove Unit 204' })).toBeNull();
    });

    it('moves to the right week when the tour is outside the visible one', async () => {
      vi.useRealTimers();
      renderPage();
      fireEvent.change(screen.getByLabelText(/Lead/), { target: { value: 'lead-1' } });
      fireEvent.change(screen.getByLabelText(/Date/), { target: { value: '2026-11-03' } });
      fireEvent.click(screen.getByRole('button', { name: '9:00 AM' }));
      fireEvent.click(screen.getAllByRole('button', { name: 'Schedule tour' }).at(-1));
      await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('#/tours?date=2026-11-03'));
    });

    it('focuses the lead field from the header button', () => {
      renderPage();
      fireEvent.click(screen.getAllByRole('button', { name: 'Schedule tour' })[0]);
      expect(document.activeElement).toBe(screen.getByLabelText(/Lead/));
    });
  });
});
