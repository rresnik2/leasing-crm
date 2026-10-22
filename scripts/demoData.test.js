import { describe, it, expect } from 'vitest';

import { CONTACT_ACTIVITY_TYPES, ACTIVITY_TYPES } from '../src/constants/activityOptions';
import { LEAD_STATUSES, MOVE_REASONS, PIPELINE_STAGES, UNIT_TYPES } from '../src/constants/leadOptions';
import {
  CLOSED_WEEKDAYS,
  OFFICE_HOURS,
  TOUR_DURATION_MINUTES,
  TOUR_STATUSES,
  TOUR_TYPES,
} from '../src/constants/tourOptions';
import { addDays, daysUntil, parseLocalDate, startOfDay } from '../src/utils/dateUtils';
import { groupFollowUps } from '../src/utils/followUp';
import { UNITS_BY_TYPE, buildDemoData } from './demoData';

const counter = () => {
  let n = 0;
  return () => `id${++n}`;
};

// local times; Oct 22 2026 is a Thursday
const THURSDAY_TIMES = [
  ['Thursday 08:30', new Date(2026, 9, 22, 8, 30, 17)],
  ['Thursday 11:15', new Date(2026, 9, 22, 11, 15, 42)],
  ['Thursday 16:45', new Date(2026, 9, 22, 16, 45, 5)],
  ['Thursday 20:30', new Date(2026, 9, 22, 20, 30, 0)],
];
const TIMES = [
  ...THURSDAY_TIMES,
  ['Sunday 10:00', new Date(2026, 9, 25, 10, 0, 0)],
  ['Sunday 15:20', new Date(2026, 9, 25, 15, 20, 30)],
  ['Monday 08:30', new Date(2026, 9, 26, 8, 30, 0)],
  ['Monday 13:05', new Date(2026, 9, 26, 13, 5, 59)],
  ['Saturday 12:00', new Date(2026, 9, 24, 12, 0, 0)],
];

const EXPECTED_STATUS_COUNTS = {
  'New Inquiry': 5,
  Contacted: 4,
  'Tour Scheduled': 4,
  'Tour Completed': 4,
  'Application Submitted': 3,
  Approved: 3,
  Leased: 4,
  'Search Hold': 2,
  'Not Interested': 2,
  'Leased Elsewhere': 1,
};

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const ms = (iso) => new Date(iso).getTime();

// every nested value, to look for undefined
function* walk(value, path = '') {
  yield [path, value];
  if (Array.isArray(value)) {
    for (const [i, item] of value.entries()) yield* walk(item, `${path}[${i}]`);
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) yield* walk(item, `${path}.${key}`);
  }
}

const openLeadObjects = (data) => data.leads.map((lead) => ({ id: lead.id, ...lead.data }));

describe('buildDemoData', () => {
  const base = new Date(2026, 9, 22, 11, 15, 42);
  const data = buildDemoData(base, counter());

  it('is deterministic for the same time and id source', () => {
    expect(buildDemoData(base, counter())).toEqual(data);
  });

  it('works with the default id maker and a default now', () => {
    expect(buildDemoData(base).leads).toHaveLength(32);
    expect(buildDemoData().leads).toHaveLength(32);
  });

  it('uses unique document ids', () => {
    const ids = [
      ...data.leads.flatMap((l) => [l.id, ...l.activities.map((a) => a.id), ...l.tasks.map((t) => t.id)]),
      ...data.tours.map((t) => t.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has the requested number of leads per status', () => {
    const counts = {};
    data.leads.forEach((l) => {
      counts[l.data.status] = (counts[l.data.status] ?? 0) + 1;
    });
    expect(counts).toEqual(EXPECTED_STATUS_COUNTS);
    expect(data.leads).toHaveLength(32);
  });

  it('includes Sarah Mitchell as in the mockup', () => {
    const sarah = data.leads.find((l) => l.data.name === 'Sarah Mitchell');
    expect(sarah.data).toMatchObject({ status: 'Tour Completed', unitType: '2 Bedroom', pets: expect.stringContaining('corgi') });
    const tour = data.tours.find((t) => t.data.leadId === sarah.id);
    expect(tour.data.units).toEqual(['508', '612']);
    expect(tour.data.status).toBe('Completed');
  });

  it('uses fictional contact details, known options and no emoji', () => {
    const emails = new Set();
    const phones = new Set();
    data.leads.forEach(({ data: lead }) => {
      expect(lead.email).toMatch(/@example\.(com|net)$/);
      expect(lead.phone).toMatch(/^\((206|425|253)\) 555-01\d\d$/);
      expect(UNIT_TYPES).toContain(lead.unitType);
      expect(MOVE_REASONS).toContain(lead.moveReason);
      expect(LEAD_STATUSES).toContain(lead.status);
      expect(Number.isInteger(lead.occupants)).toBe(true);
      expect(lead.address).toMatch(/, (Seattle|Bellevue|Redmond|Kirkland|Tacoma|Kent|Renton|Edmonds|Puyallup), WA 98\d{3}$/);
      emails.add(lead.email);
      phones.add(lead.phone);
    });
    expect(emails.size).toBe(32);
    expect(phones.size).toBe(32);
    for (const [path, value] of walk(data)) {
      if (typeof value === 'string') expect(value, path).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('contains no undefined values', () => {
    for (const [path, value] of walk(data)) expect(value, path).not.toBeUndefined();
  });
});

describe.each(TIMES)('buildDemoData at %s', (_label, now) => {
  const data = buildDemoData(now, counter());
  const leadById = Object.fromEntries(data.leads.map((l) => [l.id, l]));
  const startOf = (tour) => parseLocalDate(tour.data.start);
  const endOf = (tour) => new Date(+startOf(tour) + TOUR_DURATION_MINUTES * 60000);

  describe('dates', () => {
    it('are well formed and never in the future when they record the past', () => {
      data.leads.forEach(({ data: lead, activities, tasks }) => {
        expect(lead.moveInDate).toMatch(DATE);
        expect(parseLocalDate(lead.moveInDate)).not.toBeNull();
        ['createdAt', 'statusChangedAt'].forEach((field) => expect(lead[field]).toMatch(ISO));
        if (lead.lastContactedAt !== undefined) expect(lead.lastContactedAt).toMatch(ISO);
        expect(ms(lead.createdAt)).toBeLessThanOrEqual(+now);
        expect(ms(lead.createdAt)).toBeGreaterThan(+now - 50 * 86400000);
        activities.forEach((a) => {
          expect(a.data.createdAt).toMatch(ISO);
          expect(ms(a.data.createdAt)).toBeLessThanOrEqual(+now);
        });
        tasks.forEach((t) => {
          expect(t.data.createdAt).toMatch(ISO);
          expect(ms(t.data.createdAt)).toBeLessThanOrEqual(+now);
          expect(ms(t.data.createdAt)).toBeGreaterThanOrEqual(ms(lead.createdAt));
          expect(t.data.dueDate === '' || DATE.test(t.data.dueDate)).toBe(true);
          if (t.data.done) {
            expect(t.data.doneAt).toMatch(ISO);
            expect(ms(t.data.doneAt)).toBeGreaterThanOrEqual(ms(t.data.createdAt));
            expect(ms(t.data.doneAt)).toBeLessThanOrEqual(+now);
          } else {
            expect(t.data.doneAt).toBeNull();
          }
        });
      });
      data.tours.forEach(({ data: tour }) => {
        expect(tour.start).toMatch(LOCAL_DATETIME);
        expect(parseLocalDate(tour.start)).not.toBeNull();
        expect(tour.createdAt).toMatch(ISO);
        expect(ms(tour.createdAt)).toBeLessThanOrEqual(+now);
        expect(ms(tour.createdAt)).toBeLessThan(+parseLocalDate(tour.start));
      });
    });

    it('spread move-in dates realistically', () => {
      const days = (status) =>
        data.leads.filter((l) => l.data.status === status).map((l) => daysUntil(l.data.moveInDate, now));
      const active = data.leads.filter((l) =>
        [...PIPELINE_STAGES, 'Search Hold'].filter((s) => !['Approved', 'Leased'].includes(s)).includes(l.data.status)
      );
      const activeDays = active.map((l) => daysUntil(l.data.moveInDate, now));
      expect(Math.min(...activeDays)).toBeGreaterThanOrEqual(10);
      expect(Math.max(...activeDays)).toBeLessThanOrEqual(120);
      // urgency varies: some under 30 days, some 30-59, some 60 and over
      expect(activeDays.filter((d) => d < 30).length).toBeGreaterThanOrEqual(4);
      expect(activeDays.filter((d) => d >= 30 && d < 60).length).toBeGreaterThanOrEqual(4);
      expect(activeDays.filter((d) => d >= 60).length).toBeGreaterThanOrEqual(4);
      days('Approved').forEach((d) => {
        expect(d).toBeGreaterThanOrEqual(7);
        expect(d).toBeLessThanOrEqual(28);
      });
      const leased = days('Leased');
      expect(leased.filter((d) => d < 0 && d >= -30)).toHaveLength(2);
      expect(leased.filter((d) => d >= 0 && d <= 30)).toHaveLength(2);
    });
  });

  describe('tours', () => {
    it('link to existing leads with matching names', () => {
      data.tours.forEach(({ data: tour }) => {
        expect(leadById[tour.leadId], tour.leadName).toBeDefined();
        expect(tour.leadName).toBe(leadById[tour.leadId].data.name);
      });
    });

    it('fit the office hours, grid, closed days and have no overlaps', () => {
      expect(data.tours.length).toBeGreaterThanOrEqual(14);
      expect(data.tours.length).toBeLessThanOrEqual(22);
      const sorted = [...data.tours].sort((a, b) => +startOf(a) - +startOf(b));
      sorted.forEach((tour, i) => {
        const start = startOf(tour);
        const minutes = start.getHours() * 60 + start.getMinutes();
        expect(tour.data.durationMinutes).toBe(TOUR_DURATION_MINUTES);
        expect(minutes % 30).toBe(0);
        expect(minutes).toBeGreaterThanOrEqual(OFFICE_HOURS.start * 60);
        expect(minutes + TOUR_DURATION_MINUTES).toBeLessThanOrEqual(OFFICE_HOURS.end * 60);
        expect(CLOSED_WEEKDAYS).not.toContain(start.getDay());
        expect(TOUR_TYPES).toContain(tour.data.type);
        expect(TOUR_STATUSES).toContain(tour.data.status);
        if (i > 0) expect(+endOf(sorted[i - 1])).toBeLessThanOrEqual(+start);
      });
    });

    it('have statuses consistent with the time', () => {
      data.tours.forEach((tour) => {
        const { status } = tour.data;
        if (+startOf(tour) > +now) {
          expect(['Confirmed', 'Unconfirmed']).toContain(status);
        } else {
          // finished before now, never half way through it
          expect(+endOf(tour)).toBeLessThanOrEqual(+now);
          expect(['Completed', 'No-show', 'Canceled']).toContain(status);
        }
      });
      const past = data.tours.filter((t) => +startOf(t) < +now);
      expect(past.filter((t) => t.data.status === 'No-show')).toHaveLength(1);
      expect(past.filter((t) => t.data.status === 'Canceled')).toHaveLength(1);
      expect(past.filter((t) => t.data.status === 'Completed').length).toBeGreaterThanOrEqual(past.length - 4);
      const soon = data.tours.filter(
        (t) => t.data.status === 'Unconfirmed' && +startOf(t) < +addDays(now, 14)
      );
      expect(soon.length).toBeGreaterThanOrEqual(2);
      expect(soon.length).toBeLessThanOrEqual(3);
    });

    it('cover last week, this week and next week', () => {
      const today = startOfDay(now);
      const offset = (tour) => Math.round((+startOfDay(startOf(tour)) - +today) / 86400000);
      expect(data.tours.filter((t) => offset(t) < 0 && offset(t) >= -8).length).toBeGreaterThanOrEqual(8);
      expect(data.tours.filter((t) => offset(t) >= 0 && offset(t) <= 7 && +startOf(t) > +now).length).toBeGreaterThanOrEqual(3);
      expect(data.tours.filter((t) => offset(t) > 7).length).toBeGreaterThanOrEqual(1);
    });

    it('put two or three tours on today, or on the next open day when today is closed', () => {
      const today = startOfDay(now);
      let day = today;
      while (CLOSED_WEEKDAYS.includes(day.getDay())) day = addDays(day, 1);
      const onDay = data.tours.filter((t) => +startOfDay(startOf(t)) === +day);
      expect(onDay.length).toBeGreaterThanOrEqual(2);
      expect(onDay.length).toBeLessThanOrEqual(3);
      if (+day === +today) {
        // finished tours today are completed, later ones are still open
        onDay.forEach((t) => {
          expect(+startOf(t) < +now ? 'Completed' : t.data.status).toBe(t.data.status);
        });
      }
    });

    it('match the lead pipeline stage', () => {
      data.leads.forEach((lead) => {
        const tours = data.tours.filter((t) => t.data.leadId === lead.id);
        const upcoming = tours.filter((t) => +startOf(t) > +now);
        const completed = tours.filter((t) => t.data.status === 'Completed' && +startOf(t) < +now);
        if (lead.data.status === 'Tour Scheduled') expect(upcoming.length, lead.data.name).toBeGreaterThanOrEqual(1);
        if (['Tour Completed', 'Application Submitted', 'Approved', 'Leased'].includes(lead.data.status)) {
          expect(completed.length, lead.data.name).toBeGreaterThanOrEqual(1);
        }
      });
    });

    it('show units of the lead unit type', () => {
      data.tours.forEach(({ data: tour }) => {
        const lead = leadById[tour.leadId];
        expect(tour.units.length).toBeGreaterThanOrEqual(1);
        tour.units.forEach((unit) => expect(UNITS_BY_TYPE[lead.data.unitType]).toContain(unit));
        expect(new Set(tour.units).size).toBe(tour.units.length);
      });
    });
  });

  describe('activities', () => {
    it('tell a consistent, time-ordered story for every lead', () => {
      data.leads.forEach(({ id, data: lead, activities }) => {
        const label = lead.name;
        expect(activities.length, label).toBeGreaterThanOrEqual(2);
        expect(activities.length, label).toBeLessThanOrEqual(8);

        const times = activities.map((a) => ms(a.data.createdAt));
        expect([...times].sort((a, b) => a - b), label).toEqual(times);

        expect(activities[0].data.type, label).toBe('inquiry');
        expect(activities[0].data.createdAt, label).toBe(lead.createdAt);
        expect(activities.filter((a) => a.data.type === 'inquiry'), label).toHaveLength(1);

        const statusActs = activities.filter((a) => a.data.type === 'status');
        let current = 'New Inquiry';
        statusActs.forEach((a) => {
          expect(a.data.from, label).toBe(current);
          expect(a.data.to, label).not.toBe(current);
          expect(LEAD_STATUSES).toContain(a.data.to);
          expect(a.data.body).toBe(`Status changed from ${a.data.from} to ${a.data.to}`);
          current = a.data.to;
        });
        expect(current, label).toBe(lead.status);
        expect(lead.statusChangedAt, label).toBe(statusActs.at(-1)?.data.createdAt ?? lead.createdAt);

        const contacts = activities.filter((a) => CONTACT_ACTIVITY_TYPES.includes(a.data.type));
        expect(lead.lastContactedAt, label).toBe(contacts.at(-1)?.data.createdAt);
        expect(ms(lead.lastContactedAt ?? lead.createdAt), label).toBeGreaterThanOrEqual(ms(lead.createdAt));

        activities.forEach((a) => {
          expect(ACTIVITY_TYPES).toContain(a.data.type);
          expect(a.data.body.length).toBeGreaterThan(5);
          if (a.data.type === 'call') expect(a.data.durationMinutes, label).toBeGreaterThan(0);
          else expect(a.data.durationMinutes).toBeUndefined();
          if (a.data.type !== 'status') {
            expect(a.data.from).toBeUndefined();
            expect(a.data.to).toBeUndefined();
          }
          if (a.data.type === 'tour') {
            const tour = data.tours.find((t) => t.id === a.data.tourId);
            expect(tour, label).toBeDefined();
            expect(tour.data.leadId, label).toBe(id);
            const start = +startOf(tour);
            const at = ms(a.data.createdAt);
            if (a.data.body.startsWith('Tour scheduled')) expect(at).toBeLessThan(start);
            if (a.data.body.startsWith('Tour canceled')) expect(at).toBeLessThan(start);
            if (a.data.body.startsWith('Tour completed')) {
              expect(at).toBeGreaterThanOrEqual(+endOf(tour));
              expect(tour.data.status).toBe('Completed');
            }
            if (a.data.body.startsWith('Tour marked no-show')) {
              expect(at).toBeGreaterThan(start);
              expect(tour.data.status).toBe('No-show');
            }
          } else {
            expect(a.data.tourId).toBeUndefined();
          }
        });
      });
    });

    it('log a tour activity for every tour, and complete only completed ones', () => {
      data.tours.forEach((tour) => {
        const lead = leadById[tour.data.leadId];
        const logged = lead.activities.filter((a) => a.data.tourId === tour.id);
        expect(logged.length, tour.data.leadName).toBeGreaterThanOrEqual(1);
        expect(logged.some((a) => a.data.body.startsWith('Tour scheduled'))).toBe(true);
        const completedLogged = logged.some((a) => a.data.body.startsWith('Tour completed'));
        expect(completedLogged, tour.data.leadName).toBe(tour.data.status === 'Completed');
      });
    });

    it('put the Tour Completed status after the tour finished', () => {
      data.leads
        .filter((l) => l.data.status === 'Tour Completed')
        .forEach((lead) => {
          const done = lead.activities.find((a) => a.data.to === 'Tour Completed');
          const tour = data.tours.find((t) => t.data.leadId === lead.id && t.data.status === 'Completed');
          expect(ms(done.data.createdAt), lead.data.name).toBeGreaterThanOrEqual(+endOf(tour));
        });
    });
  });

  describe('tasks', () => {
    it('cover about a dozen leads with 1-3 tasks, overdue, today, upcoming and done', () => {
      const withTasks = data.leads.filter((l) => l.tasks.length > 0);
      expect(withTasks.length).toBeGreaterThanOrEqual(12);
      expect(withTasks.length).toBeLessThanOrEqual(20);
      withTasks.forEach((l) => {
        expect(l.tasks.length).toBeGreaterThanOrEqual(1);
        expect(l.tasks.length).toBeLessThanOrEqual(3);
      });
      const tasks = withTasks.flatMap((l) => l.tasks.map((t) => t.data));
      const today = startOfDay(now);
      const open = tasks.filter((t) => !t.done && t.dueDate);
      const due = (t) => +parseLocalDate(t.dueDate) - +today;
      expect(open.filter((t) => due(t) < 0).length).toBeGreaterThanOrEqual(3);
      expect(open.filter((t) => due(t) === 0).length).toBeGreaterThanOrEqual(3);
      expect(open.filter((t) => due(t) > 0).length).toBeGreaterThanOrEqual(5);
      expect(tasks.filter((t) => t.done).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Today page', () => {
    const groups = groupFollowUps(openLeadObjects(data), now);

    it('has 3-6 follow-ups due now, 3-6 later today and the rest upcoming', () => {
      expect(groups.dueNow.length).toBeGreaterThanOrEqual(3);
      expect(groups.dueNow.length).toBeLessThanOrEqual(6);
      expect(groups.laterToday.length).toBeGreaterThanOrEqual(3);
      expect(groups.laterToday.length).toBeLessThanOrEqual(6);
      expect(groups.upcoming.length).toBeGreaterThanOrEqual(8);
      // 25 open leads: Leased, Not Interested and Leased Elsewhere have no follow-up
      expect(groups.dueNow.length + groups.laterToday.length + groups.upcoming.length).toBe(25);
    });

    it('never relies on the no-history fallback', () => {
      [...groups.dueNow, ...groups.laterToday, ...groups.upcoming].forEach(({ lead, followUp }) => {
        expect(followUp.estimated, lead.name).toBe(false);
      });
    });

    it('has later-today follow-ups before midnight and upcoming ones after it', () => {
      const midnight = addDays(startOfDay(now), 1);
      groups.laterToday.forEach(({ followUp }) => {
        expect(+followUp.dueAt).toBeGreaterThan(+now);
        expect(+followUp.dueAt).toBeLessThan(+midnight);
      });
      groups.upcoming.forEach(({ followUp }) => expect(+followUp.dueAt).toBeGreaterThanOrEqual(+midnight));
    });

    it('has move-ins to show on the Today page', () => {
      const moveIns = data.leads.filter(
        (l) => ['Approved', 'Leased'].includes(l.data.status) && daysUntil(l.data.moveInDate, now) >= 0 && daysUntil(l.data.moveInDate, now) <= 30
      );
      expect(moveIns.length).toBeGreaterThanOrEqual(4);
    });
  });
});

describe('buildDemoData follow-up spread across the day', () => {
  // a sweep of run times; the groups must stay in range whenever the script is run
  const sweep = [];
  for (let day = 22; day <= 28; day += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      for (const minute of [7, 38]) sweep.push(new Date(2026, 9, day, hour, minute, 11));
    }
  }

  it.each(sweep.map((d) => [d.toString().slice(0, 21), d]))('holds at %s', (_label, now) => {
    const data = buildDemoData(now, counter());
    const groups = groupFollowUps(openLeadObjects(data), now);
    expect(groups.dueNow.length).toBeGreaterThanOrEqual(3);
    expect(groups.dueNow.length).toBeLessThanOrEqual(6);
    expect(groups.laterToday.length).toBeGreaterThanOrEqual(3);
    expect(groups.laterToday.length).toBeLessThanOrEqual(6);
    data.leads.forEach((lead) => {
      expect(ms(lead.data.createdAt)).toBeLessThanOrEqual(+now);
      expect(ms(lead.data.lastContactedAt ?? lead.data.createdAt)).toBeGreaterThanOrEqual(ms(lead.data.createdAt));
    });
  });
});
