import { describe, it, expect, vi, beforeEach } from 'vitest';

// in-memory stand-in for Firestore: doc/collection/query return tagged objects
const store = vi.hoisted(() => ({ docs: new Map(), auto: 0 }));

vi.mock('../firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: (_db, ...segments) => ({ kind: 'collection', path: segments.join('/') }),
  doc: (_db, ...segments) => ({ kind: 'doc', path: segments.join('/') }),
  where: (field, op, value) => ({ field, op, value }),
  query: (source, ...constraints) => ({ ...source, constraints }),
  addDoc: vi.fn(async (col, data) => {
    const id = `auto${++store.auto}`;
    store.docs.set(`${col.path}/${id}`, { ...data });
    return { id, path: `${col.path}/${id}` };
  }),
  updateDoc: vi.fn(async (ref, data) => {
    if (!store.docs.has(ref.path)) throw new Error(`missing ${ref.path}`);
    store.docs.set(ref.path, { ...store.docs.get(ref.path), ...data });
  }),
  deleteDoc: vi.fn(async (ref) => {
    store.docs.delete(ref.path);
  }),
  getDoc: vi.fn(async (ref) => ({
    exists: () => store.docs.has(ref.path),
    data: () => store.docs.get(ref.path),
  })),
  getDocs: vi.fn(async (source) => {
    const matches = [...store.docs.entries()].filter(([path, data]) => {
      const parent = path.slice(0, path.lastIndexOf('/'));
      if (parent !== source.path) return false;
      return (source.constraints ?? []).every((c) => data[c.field] === c.value);
    });
    return { docs: matches.map(([path, data]) => ({ id: path.split('/').pop(), ref: { path }, data: () => data })) };
  }),
}));

import { logActivity } from './activities';
import { addLead, deleteLead, updateLead } from './leads';
import { addTask, deleteTask, setTaskDone } from './tasks';
import { addTour, cancelTour, completeTour, updateTour } from './tours';

const under = (prefix) => [...store.docs.entries()].filter(([path]) => path.startsWith(prefix)).map(([, d]) => d);

beforeEach(() => {
  store.docs.clear();
  store.auto = 0;
});

describe('leads', () => {
  it('addLead stamps dates and logs an inquiry activity', async () => {
    const id = await addLead({ name: 'Ava', status: 'New Inquiry' });
    const lead = store.docs.get(`leads/${id}`);
    expect(lead.createdAt).toBeTruthy();
    expect(lead.statusChangedAt).toBe(lead.createdAt);
    const [activity] = under(`leads/${id}/activities/`);
    expect(activity).toMatchObject({ type: 'inquiry', body: 'Lead added' });
  });

  it('updateLead with a new status sets statusChangedAt and logs from/to', async () => {
    store.docs.set('leads/l1', { name: 'Ava', status: 'New Inquiry' });
    await updateLead('l1', { status: 'Contacted' });
    expect(store.docs.get('leads/l1').status).toBe('Contacted');
    expect(store.docs.get('leads/l1').statusChangedAt).toBeTruthy();
    expect(under('leads/l1/activities/')[0]).toMatchObject({ type: 'status', from: 'New Inquiry', to: 'Contacted' });
  });

  it('updateLead without a status change does not touch statusChangedAt or log', async () => {
    store.docs.set('leads/l1', { name: 'Ava', status: 'Contacted' });
    await updateLead('l1', { name: 'Ava M', status: 'Contacted' });
    await updateLead('l1', { phone: '1' });
    expect(store.docs.get('leads/l1').statusChangedAt).toBeUndefined();
    expect(under('leads/l1/activities/')).toHaveLength(0);
  });

  it('updateLead rejects when the write fails', async () => {
    await expect(updateLead('missing', { name: 'x' })).rejects.toThrow();
  });

  it('deleteLead removes activities, tasks, tours and the lead', async () => {
    store.docs.set('leads/l1', { status: 'Contacted' });
    store.docs.set('leads/l1/activities/a1', { type: 'note' });
    store.docs.set('leads/l1/tasks/t1', { title: 'x' });
    store.docs.set('tours/tour1', { leadId: 'l1' });
    store.docs.set('tours/tour2', { leadId: 'other' });
    store.docs.set('leads/l2', {});
    await deleteLead('l1');
    expect([...store.docs.keys()].sort()).toEqual(['leads/l2', 'tours/tour2']);
  });
});

describe('logActivity', () => {
  it('sets lastContactedAt for contact types only', async () => {
    store.docs.set('leads/l1', { status: 'Contacted' });
    await logActivity('l1', { type: 'note', body: 'hmm' });
    expect(store.docs.get('leads/l1').lastContactedAt).toBeUndefined();

    await logActivity('l1', { type: 'call', body: 'Left voicemail', durationMinutes: 3 });
    const activity = under('leads/l1/activities/').find((a) => a.type === 'call');
    expect(activity).toMatchObject({ body: 'Left voicemail', durationMinutes: 3 });
    expect(activity).not.toHaveProperty('tourId');
    expect(store.docs.get('leads/l1').lastContactedAt).toBe(activity.createdAt);
  });
});

describe('tasks', () => {
  it('adds, completes, reopens and deletes', async () => {
    const id = await addTask('l1', { title: 'Send floor plan', dueDate: '2026-10-25' });
    const path = `leads/l1/tasks/${id}`;
    expect(store.docs.get(path)).toMatchObject({ title: 'Send floor plan', dueDate: '2026-10-25', done: false, doneAt: null });

    await setTaskDone('l1', id, true);
    expect(store.docs.get(path).done).toBe(true);
    expect(store.docs.get(path).doneAt).toBeTruthy();

    await setTaskDone('l1', id, false);
    expect(store.docs.get(path)).toMatchObject({ done: false, doneAt: null });

    await deleteTask('l1', id);
    expect(store.docs.has(path)).toBe(false);
  });
});

describe('tours', () => {
  const tour = { leadId: 'l1', leadName: 'Ava', start: '2026-10-24T14:00' };

  it('addTour applies defaults, logs an activity and advances an early-stage lead', async () => {
    store.docs.set('leads/l1', { status: 'New Inquiry' });
    const id = await addTour(tour);
    expect(store.docs.get(`tours/${id}`)).toMatchObject({
      status: 'Unconfirmed',
      durationMinutes: 45,
      type: 'In person',
      units: [],
    });
    expect(store.docs.get('leads/l1').status).toBe('Tour Scheduled');
    const activities = under('leads/l1/activities/');
    expect(activities.find((a) => a.type === 'tour')).toMatchObject({ tourId: id });
    expect(activities.find((a) => a.type === 'tour').body).toMatch(/^Tour scheduled for .*2:00/);
    expect(activities.find((a) => a.type === 'status')).toMatchObject({ from: 'New Inquiry', to: 'Tour Scheduled' });
  });

  it('addTour leaves later-stage leads alone and respects a given status', async () => {
    store.docs.set('leads/l1', { status: 'Application Submitted' });
    const id = await addTour({ ...tour, status: 'Confirmed' });
    expect(store.docs.get(`tours/${id}`).status).toBe('Confirmed');
    expect(store.docs.get('leads/l1').status).toBe('Application Submitted');
  });

  it('completeTour completes, logs and advances Tour Scheduled to Tour Completed', async () => {
    store.docs.set('leads/l1', { status: 'Tour Scheduled' });
    store.docs.set('tours/t1', { ...tour, status: 'Confirmed' });
    await completeTour({ id: 't1', ...tour });
    expect(store.docs.get('tours/t1').status).toBe('Completed');
    expect(store.docs.get('leads/l1').status).toBe('Tour Completed');
  });

  it('completeTour does not move a lead past Tour Completed backwards', async () => {
    store.docs.set('leads/l1', { status: 'Approved' });
    store.docs.set('tours/t1', { ...tour });
    await completeTour({ id: 't1', ...tour });
    expect(store.docs.get('leads/l1').status).toBe('Approved');
  });

  it('cancelTour and updateTour write the tour', async () => {
    store.docs.set('leads/l1', { status: 'Tour Scheduled' });
    store.docs.set('tours/t1', { ...tour, status: 'Unconfirmed' });
    await updateTour('t1', { status: 'Confirmed' });
    expect(store.docs.get('tours/t1').status).toBe('Confirmed');
    await cancelTour({ id: 't1', ...tour });
    expect(store.docs.get('tours/t1').status).toBe('Canceled');
    expect(store.docs.get('leads/l1').status).toBe('Tour Scheduled');
  });
});
