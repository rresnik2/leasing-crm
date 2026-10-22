// Hand-written demo dataset for the leasing CRM, dated relative to `now`.
//
// Pure module: no firebase import. `buildDemoData(now, makeId)` returns
//   { leads: [{ id, data, activities: [{ id, data }], tasks: [{ id, data }] }],
//     tours: [{ id, data }] }
// ready to be written to Firestore (leads/{id}, leads/{id}/activities,
// leads/{id}/tasks, tours/{id}).
//
// How the Today page stays realistic whenever the script runs: every open
// lead gets a target follow-up group ("now", "later" or "up"). The anchor
// time of its story (the last contact, or the status change / creation time
// for window-based leads) is solved backwards from that target using the same
// rules as getFollowUp in src/utils/followUp.js, so the groups hold at any
// time of day. All other event times are offsets from that anchor or from
// the tour they belong to.

import { CONTACT_ACTIVITY_TYPES } from '../src/constants/activityOptions.js';
import { CLOSED_WEEKDAYS, OFFICE_HOURS, TOUR_DURATION_MINUTES } from '../src/constants/tourOptions.js';
import {
  addDays,
  formatDateTime,
  startOfDay,
  toLocalDateString,
  toLocalDateTimeString,
} from '../src/utils/dateUtils.js';
import {
  CADENCE_DAYS,
  RESPONSE_WINDOW_HOURS,
  SEARCH_HOLD_CADENCE_DAYS,
  getUrgency,
} from '../src/utils/followUp.js';

const MIN = 60000;
const HOUR = 3600000;
const DAY = 86400000;

const floorMinute = (ms) => Math.floor(ms / MIN) * MIN;
const ceilMinute = (ms) => Math.ceil(ms / MIN) * MIN;

// Unit numbers by unit type; tours only ever show units of the lead's type.
export const UNITS_BY_TYPE = {
  Studio: ['204', '217', '305', '318'],
  '1 Bedroom': ['412', '425', '509', '523'],
  '2 Bedroom': ['508', '612', '514', '620'],
  '3 Bedroom': ['701', '705', '802'],
};

// ---------------------------------------------------------------------------
// Time helpers

// Tour start times are the :00 / :30 marks where a full tour fits before closing.
const GRID_MINUTES = [];
for (let m = OFFICE_HOURS.start * 60; m + TOUR_DURATION_MINUTES <= OFFICE_HOURS.end * 60; m += 30) {
  GRID_MINUTES.push(m);
}

const isOpenDay = (date) => !CLOSED_WEEKDAYS.includes(date.getDay());
const atMinutes = (day, minutes) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);

// A last-contact time that lands outside office hours moves to the end of the
// previous working afternoon (or late this afternoon), so contacts look human.
function snapToOfficeHours(ms) {
  const d = new Date(ms);
  const hour = d.getHours();
  if (hour >= OFFICE_HOURS.start && hour < OFFICE_HOURS.end) return ms;
  if (hour < OFFICE_HOURS.start) {
    const previous = addDays(d, -1);
    return new Date(previous.getFullYear(), previous.getMonth(), previous.getDate(), 16, 45).getTime();
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 17, 40).getTime();
}

// ---------------------------------------------------------------------------
// Tour calendar: places tours on free office-hours slots, never on a closed day.

function createCalendar(now) {
  const taken = [];
  const isFree = (start) => {
    const s = +start;
    const e = s + TOUR_DURATION_MINUTES * MIN;
    return taken.every(([a, b]) => e <= a || s >= b);
  };
  const take = (start) => {
    taken.push([+start, +start + TOUR_DURATION_MINUTES * MIN]);
    return start;
  };

  // First free slot at or after `time` ('HH:mm') on day offset `dayOffset`
  // from today; when the day is full or closed, move on in direction `dir`.
  const place = (dayOffset, time, dir) => {
    const [h, m] = time.split(':').map(Number);
    let offset = dayOffset;
    let from = h * 60 + m;
    for (let guard = 0; guard < 30; guard += 1) {
      const day = addDays(startOfDay(now), offset);
      if (isOpenDay(day)) {
        for (const minutes of GRID_MINUTES) {
          if (minutes < from) continue;
          const start = atMinutes(day, minutes);
          if (isFree(start)) return take(start);
        }
      }
      offset += dir;
      from = OFFICE_HOURS.start * 60;
    }
    throw new Error(`No free tour slot near day offset ${dayOffset}`);
  };

  return { place, take };
}

// Tours today are placed around `now`: the latest one that ended at least 70
// minutes ago (a completed morning tour), then upcoming ones at least 15
// minutes out and 90 minutes apart. Nothing ever spans `now`.
function planToday(now, calendar) {
  const plan = { past: [], future: [] };
  const day = startOfDay(now);
  if (!isOpenDay(day)) return plan;

  const starts = GRID_MINUTES.map((m) => atMinutes(day, m));
  const pastSlots = starts.filter((s) => +s + TOUR_DURATION_MINUTES * MIN <= +now - 70 * MIN);
  const futureSlots = starts.filter((s) => +s >= +now + 15 * MIN);

  const p1 = pastSlots.at(-1);
  const maxFuture = p1 ? 2 : 3;
  let previous = -Infinity;
  for (const slot of futureSlots) {
    if (plan.future.length >= maxFuture) break;
    if (+slot >= previous + 90 * MIN) {
      plan.future.push(slot);
      previous = +slot;
    }
  }
  if (p1) plan.past.push(p1);
  // late in the day there may be too few upcoming slots; add an earlier completed tour
  if (p1 && plan.past.length + plan.future.length < 2) {
    const p2 = pastSlots.filter((s) => +s <= +p1 - 90 * MIN).at(-1);
    if (p2) plan.past.push(p2);
  }
  [...plan.past, ...plan.future].forEach((slot) => calendar.take(slot));
  return plan;
}

// ---------------------------------------------------------------------------
// Follow-up timing. Each helper says where the lead should land on the Today
// page; resolveAnchor() turns that into the timestamp the story hangs from.

const contactNow = (overdueMinutes) => ({ via: 'contact', group: 'now', param: overdueMinutes });
const contactLater = (fraction) => ({ via: 'contact', group: 'later', param: fraction });
const contactUp = (hoursAgo) => ({ via: 'contact', group: 'up', param: hoursAgo });
const windowNow = (overdueMinutes) => ({ via: 'window', group: 'now', param: overdueMinutes });
const windowLater = (fraction) => ({ via: 'window', group: 'later', param: fraction });
const windowUp = (minutesAgo) => ({ via: 'window', group: 'up', param: minutesAgo });
const freeDaysAgo = (days) => ({ via: 'free', param: days });
const atTime = (fn) => ({ via: 'at', param: fn });

const moveInDateOf = (spec, now) => toLocalDateString(addDays(now, spec.moveIn));

// Returns the anchor in ms: lastContactedAt for contact-based leads, the later
// of createdAt / statusChangedAt for window-based ones.
function resolveAnchor(spec, c) {
  const { via, group, param } = spec.timing;
  const { now, startToday, endToday } = c;

  if (via === 'free') return floorMinute(+now - param * DAY);
  if (via === 'at') return param(c);

  const urgency = getUrgency({ moveInDate: moveInDateOf(spec, now) }, now);
  const cadence = spec.status === 'Search Hold' ? SEARCH_HOLD_CADENCE_DAYS : CADENCE_DAYS[urgency];
  const windowMs = RESPONSE_WINDOW_HOURS[urgency] * HOUR;

  if (group === 'now') {
    const dueAt = floorMinute(+now - param * MIN);
    return via === 'contact' ? +addDays(new Date(dueAt), -cadence) : dueAt - windowMs;
  }

  if (group === 'later') {
    // due strictly after now and before local midnight
    const room = +endToday - +now;
    const span = via === 'window' ? Math.min(room, windowMs - 15 * MIN) : room;
    let dueAt = ceilMinute(+now + Math.max(MIN, param * span));
    if (dueAt >= +endToday) dueAt = +endToday - MIN;
    return via === 'contact' ? +addDays(new Date(dueAt), -cadence) : dueAt - windowMs;
  }

  // 'up': due after today
  if (via === 'contact') {
    // contacted `param` hours ago, but never so long ago that the next touch is still due today
    let t = Math.max(+now - param * HOUR, +addDays(endToday, -cadence) + 2 * MIN);
    if (cadence >= 2) t = snapToOfficeHours(t);
    return floorMinute(Math.min(t, +now - MIN));
  }
  // window-based and not yet due: created today, so the 24 hour window ends tomorrow
  const sinceMidnight = +now - +startToday;
  return floorMinute(+now - Math.min(param * MIN, sinceMidnight / 2));
}

// ---------------------------------------------------------------------------
// Leads. Event times: a number is hours before the lead's anchor (negative =
// after it); a Date comes from c.start(tour, hoursBefore) / c.end(tour, minutesAfter).

const LEAD_SPECS = [
  // ---- New Inquiry ------------------------------------------------------
  {
    key: 'priya',
    name: 'Priya Raman',
    email: 'priya.raman@example.com',
    phone: '(206) 555-0112',
    status: 'New Inquiry',
    moveIn: 12,
    unitType: '1 Bedroom',
    occupants: 1,
    pets: 'None',
    notes: 'Starting a new job on the first. Asked about parking and gym hours.',
    address: '1820 Eastlake Ave E, Seattle, WA 98102',
    employer: 'Fred Hutch Cancer Center',
    moveReason: 'Job Relocation',
    timing: windowNow(150),
    events: () => [
      [0, 'inquiry', 'Inquiry from Apartments.com asking about 1 bedrooms available in the next two weeks.'],
      [0, 'note', 'Needs to be in by the first of next month for a new job. Wants a parking spot.'],
    ],
    tasks: [{ title: 'Confirm parking availability for the 1 bedroom', due: 0, createdAgoHours: 1 }],
  },
  {
    key: 'tomas',
    name: 'Tomas Alvarez',
    email: 'tomas.alvarez@example.net',
    phone: '(206) 555-0124',
    status: 'New Inquiry',
    moveIn: 40,
    unitType: 'Studio',
    occupants: 1,
    pets: 'None',
    notes: 'Prefers a north-facing studio. Budget is firm.',
    address: '915 E Pike St, Seattle, WA 98122',
    employer: 'Seattle Public Library',
    moveReason: 'First Time Renter',
    timing: windowLater(0.5),
    events: () => [
      [0, 'inquiry', 'Web form inquiry for a studio; asked whether any are available on a quiet side of the building.'],
      [-0.1, 'note', 'First apartment. Mentioned a budget ceiling and asked about move-in specials.'],
    ],
  },
  {
    key: 'hannah',
    name: 'Hannah Bergstrom',
    email: 'hannah.bergstrom@example.com',
    phone: '(425) 555-0131',
    status: 'New Inquiry',
    moveIn: 72,
    unitType: '2 Bedroom',
    occupants: 2,
    pets: 'None',
    notes: 'Moving in with a roommate. Wants an in-unit washer and dryer.',
    address: '7410 160th Ave NE, Redmond, WA 98052',
    employer: 'Boeing',
    moveReason: 'Closer to Work',
    timing: windowUp(150),
    events: () => [
      [0, 'inquiry', 'Referral from a current resident. Looking for a 2 bedroom to share with a roommate.'],
      [0, 'note', 'Both applicants work in Redmond; flexible on move-in by a couple of weeks.'],
    ],
  },
  {
    key: 'devon',
    name: 'Devon Okafor',
    email: 'devon.okafor@example.net',
    phone: '(253) 555-0147',
    status: 'New Inquiry',
    moveIn: 95,
    unitType: '1 Bedroom',
    occupants: 2,
    pets: '1 dog (lab mix)',
    notes: 'Partner is still job hunting. Needs a dog-friendly building.',
    address: '2204 N 30th St, Tacoma, WA 98403',
    employer: 'Nordstrom',
    moveReason: 'Other',
    timing: windowUp(130),
    events: () => [
      [0, 'inquiry', 'Zillow inquiry for a 1 bedroom; asked about the dog policy and breed restrictions.'],
      [0, 'note', 'Not in a hurry. Wants to see pricing for a 12 month and a 15 month lease.'],
    ],
  },
  {
    key: 'mei',
    name: 'Mei-Ling Tsai',
    email: 'meiling.tsai@example.com',
    phone: '(206) 555-0158',
    status: 'New Inquiry',
    moveIn: 88,
    unitType: 'Studio',
    occupants: 1,
    pets: 'None',
    notes: 'Works from home; asked about natural light and quiet hours.',
    address: '3315 Fremont Ave N, Seattle, WA 98103',
    employer: 'Freelance illustrator',
    moveReason: 'Downsizing',
    timing: windowUp(50),
    events: () => [
      [0, 'inquiry', 'Phone inquiry taken at the front desk about studio availability this fall.'],
      [0, 'note', 'Works from home and wants a unit with good daylight. Will send photos of her current setup.'],
    ],
  },

  // ---- Contacted ----------------------------------------------------------
  {
    key: 'jordan',
    name: 'Jordan Whitfield',
    email: 'jordan.whitfield@example.com',
    phone: '(425) 555-0163',
    status: 'Contacted',
    moveIn: 21,
    unitType: '1 Bedroom',
    occupants: 1,
    pets: 'None',
    notes: 'Works downtown until 6. Prefers a weekend tour.',
    address: '12045 NE 8th St, Bellevue, WA 98005',
    employer: 'Expedia Group',
    moveReason: 'Job Relocation',
    timing: contactNow(70),
    events: () => [
      [56, 'inquiry', 'Website inquiry for a 1 bedroom; hopes to move in about three weeks from now.'],
      [54, 'email', 'Sent 1 bedroom availability, pricing and the online application link.'],
      [54, 'status', 'Contacted'],
      [30, 'call', 'Left a voicemail offering tour times on Thursday or Saturday.', { durationMinutes: 1 }],
      [9, 'note', 'Works downtown until 6; prefers a tour after 6:30 or on a weekend.'],
      [0, 'text', 'Texted two Saturday tour times; no reply yet.'],
    ],
    tasks: [{ title: 'Email the 1 bedroom floor plan comparison', due: -2, createdAgoHours: 40 }],
  },
  {
    key: 'fatima',
    name: 'Fatima Haddad',
    email: 'fatima.haddad@example.net',
    phone: '(253) 555-0172',
    status: 'Contacted',
    moveIn: 34,
    unitType: '2 Bedroom',
    occupants: 3,
    pets: '1 cat',
    notes: 'Needs a den or a second room for a home office. Husband travels for work.',
    address: '5518 S Orchard St, Tacoma, WA 98409',
    employer: 'Tacoma General Hospital',
    moveReason: 'Upsizing',
    timing: contactLater(0.5),
    events: () => [
      [120, 'inquiry', 'Called the leasing office asking about 2 bedroom units that include a den.'],
      [119, 'call', 'Returned her call and went over floor plans, the pet policy and parking.', { durationMinutes: 14 }],
      [119, 'status', 'Contacted'],
      [72, 'email', 'Emailed the 2 bedroom floor plans and the current rent specials.'],
      [30, 'note', 'Husband travels for work, so a tour would need to be on a weekend.'],
      [0, 'email', 'Followed up to offer weekend tour times.'],
    ],
  },
  {
    key: 'noah',
    name: 'Noah Lindqvist',
    email: 'noah.lindqvist@example.com',
    phone: '(206) 555-0186',
    status: 'Contacted',
    moveIn: 66,
    unitType: 'Studio',
    occupants: 1,
    pets: 'None',
    notes: 'Comparing buildings near Fremont. Flexible on move-in date.',
    address: '4102 Stone Way N, Seattle, WA 98103',
    employer: 'Zillow Group',
    moveReason: 'Closer to Work',
    timing: contactUp(5),
    events: () => [
      [150, 'inquiry', 'Zillow inquiry about studios; flexible on move-in date.'],
      [148, 'email', 'Sent studio availability and the application checklist.'],
      [148, 'status', 'Contacted'],
      [60, 'text', 'Checked whether he wanted to see studios this week.'],
      [26, 'note', 'Replied that he is still comparing buildings near Fremont.'],
      [0, 'email', 'Sent a short comparison of our studio sizes and what utilities are included.'],
    ],
  },
  {
    key: 'alicia',
    name: 'Alicia Romero',
    email: 'alicia.romero@example.net',
    phone: '(425) 555-0193',
    status: 'Contacted',
    moveIn: 104,
    unitType: '3 Bedroom',
    occupants: 4,
    pets: '1 dog (beagle)',
    notes: 'Canceled her first tour; wants to rebook once her husband confirms his work schedule.',
    address: '16420 NE 85th St, Redmond, WA 98052',
    employer: 'Lake Washington School District',
    moveReason: 'Upsizing',
    timing: contactUp(20),
    events: (c) => [
      [c.start('alicia', 130), 'inquiry', 'Referral from a current resident; needs a 3 bedroom for her family of four.'],
      [c.start('alicia', 100), 'call', 'Phone screen: two adults, two kids, one beagle. Wants a school-friendly area.', { durationMinutes: 16 }],
      [c.start('alicia', 72), 'tour', 'alicia', 'booked'],
      [c.start('alicia', 72), 'status', 'Tour Scheduled'],
      [c.start('alicia', 5), 'tour', 'alicia', 'canceled'],
      [c.start('alicia', 5), 'status', 'Contacted'],
      [0, 'email', 'Offered to rebook once her husband confirms his work schedule.'],
    ],
  },

  // ---- Tour Scheduled -----------------------------------------------------
  {
    key: 'elena',
    name: 'Elena Vasquez',
    email: 'elena.vasquez@example.com',
    phone: '(206) 555-0105',
    status: 'Tour Scheduled',
    moveIn: 45,
    unitType: '2 Bedroom',
    occupants: 2,
    pets: '1 small dog (terrier mix)',
    notes: 'Both work at the UW; wants to be near the light rail.',
    address: '620 Roy St, Seattle, WA 98109',
    employer: 'University of Washington',
    moveReason: 'Closer to Work',
    timing: contactLater(0.6),
    events: () => [
      [96, 'inquiry', 'Instagram message, then moved to email. Wants a 2 bedroom near the light rail.'],
      [94, 'email', 'Sent the 2 bedroom floor plans and sample lease terms.'],
      [70, 'call', 'Phone screen: two adults and one small dog, both work at the UW.', { durationMinutes: 11 }],
      [48, 'tour', 'elena', 'booked'],
      [48, 'status', 'Tour Scheduled'],
      [0, 'text', 'Sent a tour confirmation text with parking instructions.'],
    ],
    tasks: [{ title: 'Send tour confirmation with parking instructions', due: 0, createdAgoHours: 5 }],
  },
  {
    key: 'kevin',
    name: 'Kevin Park',
    email: 'kevin.park@example.net',
    phone: '(425) 555-0118',
    status: 'Tour Scheduled',
    moveIn: 33,
    unitType: '1 Bedroom',
    occupants: 1,
    pets: 'None',
    notes: 'Wants a higher floor away from the street.',
    address: '1120 108th Ave NE, Bellevue, WA 98004',
    employer: 'Microsoft',
    moveReason: 'Job Relocation',
    timing: contactUp(4),
    events: () => [
      [70, 'inquiry', 'Walk-in; asked for a 1 bedroom on a higher floor.'],
      [69, 'call', 'Called him after the visit to go over pricing and lease lengths.', { durationMinutes: 9 }],
      [30, 'tour', 'kevin', 'booked'],
      [30, 'status', 'Tour Scheduled'],
      [0, 'email', 'Sent the tour confirmation with directions and parking details.'],
    ],
  },
  {
    key: 'rachel',
    name: 'Rachel Goldberg',
    email: 'rachel.goldberg@example.com',
    phone: '(253) 555-0129',
    status: 'Tour Scheduled',
    moveIn: 55,
    unitType: 'Studio',
    occupants: 1,
    pets: 'None',
    notes: 'Relocating from Portland for a nursing job; has not seen the building in person.',
    address: '2901 S 38th St, Tacoma, WA 98409',
    employer: 'MultiCare Health System',
    moveReason: 'Job Relocation',
    timing: contactUp(7),
    events: () => [
      [90, 'inquiry', 'Online inquiry about studios; relocating from Portland for a nursing job.'],
      [88, 'email', 'Sent studio availability and the move-in cost breakdown.'],
      [40, 'call', 'Left a voicemail about booking a tour.', { durationMinutes: 1 }],
      [20, 'tour', 'rachel', 'booked'],
      [20, 'status', 'Tour Scheduled'],
      [0, 'text', 'Texted a reminder with the tour address and what to bring.'],
    ],
  },
  {
    key: 'omar',
    name: 'Omar Siddiqui',
    email: 'omar.siddiqui@example.net',
    phone: '(206) 555-0136',
    status: 'Tour Scheduled',
    moveIn: 62,
    unitType: '1 Bedroom',
    occupants: 1,
    pets: '1 cat',
    notes: 'Works remotely and wants a quiet unit. Tour time still unconfirmed.',
    address: '8832 Greenwood Ave N, Seattle, WA 98103',
    employer: 'Remote software engineer',
    moveReason: 'Other',
    timing: contactUp(3),
    events: () => [
      [110, 'inquiry', 'Referral from a coworker who lives in the building.'],
      [108, 'email', 'Sent availability for 1 bedrooms and the pet policy for his cat.'],
      [60, 'call', 'Phone screen: single occupant, works remotely, wants a quiet unit.', { durationMinutes: 12 }],
      [48, 'tour', 'omar', 'booked'],
      [48, 'status', 'Tour Scheduled'],
      [0, 'text', 'Texted to confirm the tour time; he has not replied yet.'],
    ],
    tasks: [{ title: 'Call to confirm the tour time', due: -1, createdAgoHours: 60 }],
  },

  // ---- Tour Completed -----------------------------------------------------
  {
    key: 'sarah',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@example.com',
    phone: '(206) 555-0142',
    status: 'Tour Completed',
    moveIn: 26,
    unitType: '2 Bedroom',
    occupants: 2,
    pets: '1 small dog (corgi)',
    notes: 'Very interested in a top floor unit. Works from home three days a week and needs good lighting.',
    address: '4521 Pine St, Seattle, WA 98101',
    employer: 'Microsoft',
    moveReason: 'Upsizing',
    // the anchor is the status change five minutes after her tour ended
    timing: atTime((c) => +c.end('sarah', 5)),
    events: (c) => [
      [c.start('sarah', 168), 'inquiry', 'Website inquiry: wants a 2 bedroom on a top floor with plenty of natural light.'],
      [c.start('sarah', 166), 'call', 'Works from home three days a week and needs a quiet second bedroom for an office. Has a corgi.', { durationMinutes: 18 }],
      [c.start('sarah', 120), 'tour', 'sarah', 'booked'],
      [c.start('sarah', 120), 'status', 'Tour Scheduled'],
      [c.start('sarah', 26), 'text', 'Texted a tour reminder: units 508 and 612.'],
      [c.end('sarah', 0), 'tour', 'sarah', 'completed'],
      [0, 'status', 'Tour Completed'],
      [c.end('sarah', 8), 'note', 'Toured 508 and 612. Preferred 612 for the light. Asked about pet rent for the corgi and covered parking.'],
    ],
    tasks: [
      { title: 'Send pet policy and pet rent details for the corgi', due: 0, createdAgoHours: 0.5 },
      { title: 'Check whether 612 is available for her move-in date', due: 1, createdAgoHours: 0.5 },
    ],
  },
  {
    key: 'daniel',
    name: 'Daniel Okonkwo',
    email: 'daniel.okonkwo@example.com',
    phone: '(425) 555-0151',
    status: 'Tour Completed',
    moveIn: 42,
    unitType: '1 Bedroom',
    occupants: 1,
    pets: 'None',
    notes: 'Remote developer. Concerned about street noise; wants a second look at the north side units.',
    address: '2210 156th Ave NE, Bellevue, WA 98007',
    employer: 'Software developer, remote',
    moveReason: 'Closer to Work',
    timing: contactUp(2),
    events: (c) => [
      [c.start('daniel', 120), 'inquiry', 'Email inquiry for a 1 bedroom; wants a unit away from the street.'],
      [c.start('daniel', 118), 'call', 'Phone screen: single occupant, remote developer, no pets.', { durationMinutes: 10 }],
      [c.start('daniel', 96), 'tour', 'daniel', 'booked'],
      [c.start('daniel', 96), 'status', 'Tour Scheduled'],
      [c.end('daniel', 0), 'tour', 'daniel', 'completed'],
      [c.end('daniel', 6), 'status', 'Tour Completed'],
      [0.1, 'tour', 'daniel2', 'booked'],
      [0, 'text', 'Thanked him for coming and offered a second self-guided look at the north side units.'],
    ],
    tasks: [{ title: 'Send the floor plan for the north side units', due: -1, done: true, createdAgoHours: 30, doneAgoHours: 20 }],
  },
  {
    key: 'grace',
    name: 'Grace Nakamura',
    email: 'grace.nakamura@example.net',
    phone: '(253) 555-0166',
    status: 'Tour Completed',
    moveIn: 68,
    unitType: '2 Bedroom',
    occupants: 2,
    pets: 'None',
    notes: 'Roommate could not make the tour. Wants an in-unit washer.',
    address: '1414 Pacific Ave, Tacoma, WA 98402',
    employer: 'Providence Swedish',
    moveReason: 'Downsizing',
    timing: contactUp(9),
    events: (c) => [
      [c.start('grace', 110), 'inquiry', 'Online inquiry for a 2 bedroom for herself and a roommate.'],
      [c.start('grace', 108), 'call', 'Phone screen: two occupants, both employed, no pets. Wants an in-unit washer.', { durationMinutes: 13 }],
      [c.start('grace', 72), 'tour', 'grace', 'booked'],
      [c.start('grace', 72), 'status', 'Tour Scheduled'],
      [c.end('grace', 0), 'tour', 'grace', 'completed'],
      [c.end('grace', 5), 'status', 'Tour Completed'],
      [c.end('grace', 12), 'note', 'Roommate could not attend. Grace will share the pricing with her and decide this week.'],
      [0, 'email', 'Sent the pricing sheet and lease terms for both of them to review.'],
    ],
    tasks: [{ title: 'Re-send pricing with the rent split between roommates', due: -3, createdAgoHours: 80 }],
  },
  {
    key: 'fraser',
    name: 'Liam and Zoe Fraser',
    email: 'liam.fraser@example.com',
    phone: '(206) 555-0177',
    status: 'Tour Completed',
    moveIn: 50,
    unitType: '3 Bedroom',
    occupants: 3,
    pets: '1 cat',
    notes: 'Relocating from Tacoma for the school district. Zoe works from home.',
    address: '308 Fir St, Edmonds, WA 98020',
    employer: 'Port of Seattle',
    moveReason: 'Upsizing',
    timing: contactUp(3),
    events: (c) => [
      [c.start('fraser', 100), 'inquiry', 'Website inquiry for a 3 bedroom; relocating from Tacoma for the school district.'],
      [c.start('fraser', 98), 'call', 'Phone screen: two adults and one child, one cat. Needs a lease start in about seven weeks.', { durationMinutes: 15 }],
      [c.start('fraser', 72), 'tour', 'fraser', 'booked'],
      [c.start('fraser', 72), 'status', 'Tour Scheduled'],
      [c.end('fraser', 0), 'tour', 'fraser', 'completed'],
      [c.end('fraser', 5), 'status', 'Tour Completed'],
      [c.end('fraser', 14), 'note', 'Liked the second bedroom for their daughter. Asked about renter insurance requirements.'],
      [0, 'text', 'Sent a thank-you text with the lease terms and the application link.'],
    ],
  },

  // ---- Application Submitted ------------------------------------------------
  {
    key: 'vic',
    name: 'Victoria Chen',
    email: 'victoria.chen@example.net',
    phone: '(425) 555-0184',
    status: 'Application Submitted',
    moveIn: 20,
    unitType: '2 Bedroom',
    occupants: 2,
    pets: 'None',
    notes: 'Current lease ends in three weeks. Waiting on an employer letter.',
    address: '9800 NE 4th St, Bellevue, WA 98004',
    employer: 'Amazon',
    moveReason: 'Closer to Work',
    timing: contactNow(45),
    events: (c) => [
      [c.start('vic', 100), 'inquiry', 'Website inquiry for a 2 bedroom; her lease ends in three weeks.'],
      [c.start('vic', 96), 'call', 'Phone screen: two occupants, steady income, no pets.', { durationMinutes: 14 }],
      [c.start('vic', 72), 'tour', 'vic', 'booked'],
      [c.start('vic', 72), 'status', 'Tour Scheduled'],
      [c.end('vic', 0), 'tour', 'vic', 'completed'],
      [c.end('vic', 5), 'status', 'Tour Completed'],
      [26, 'status', 'Application Submitted'],
      [0, 'call', 'Called to confirm we received her pay stubs and to request an employer letter.', { durationMinutes: 7 }],
    ],
    tasks: [
      { title: 'Request the employer letter', due: -1, createdAgoHours: 26 },
      { title: 'Run credit and background check', due: -2, done: true, createdAgoHours: 50, doneAgoHours: 20 },
    ],
  },
  {
    key: 'brandon',
    name: 'Brandon Walsh',
    email: 'brandon.walsh@example.com',
    phone: '(253) 555-0195',
    status: 'Application Submitted',
    moveIn: 36,
    unitType: '1 Bedroom',
    occupants: 1,
    pets: '1 cat',
    notes: 'Application is in; still owes the last two pay stubs.',
    address: '3010 S 272nd St, Kent, WA 98032',
    employer: 'Boeing',
    moveReason: 'Closer to Work',
    timing: contactUp(6),
    events: (c) => [
      [c.start('brandon', 90), 'inquiry', 'Facebook Marketplace message asking about 1 bedrooms that allow cats.'],
      [c.start('brandon', 88), 'call', 'Phone screen: single occupant, one cat, works at the Renton plant.', { durationMinutes: 8 }],
      [c.start('brandon', 60), 'tour', 'brandon', 'booked'],
      [c.start('brandon', 60), 'status', 'Tour Scheduled'],
      [c.end('brandon', 0), 'tour', 'brandon', 'completed'],
      [c.end('brandon', 5), 'status', 'Tour Completed'],
      [30, 'status', 'Application Submitted'],
      [0, 'follow-up', 'Reminded him to upload the last two pay stubs.'],
    ],
    tasks: [{ title: 'Chase the last two pay stubs', due: 1, createdAgoHours: 30 }],
  },
  {
    key: 'sofia',
    name: 'Sofia Marchetti',
    email: 'sofia.marchetti@example.net',
    phone: '(206) 555-0107',
    status: 'Application Submitted',
    moveIn: 48,
    unitType: 'Studio',
    occupants: 1,
    pets: 'None',
    notes: 'First apartment. Parents are co-signing.',
    address: '1505 Broadway, Seattle, WA 98122',
    employer: 'Seattle University',
    moveReason: 'First Time Renter',
    timing: contactUp(10),
    events: (c) => [
      [c.start('sofia', 70), 'inquiry', 'Referral from a friend who rents here; wants a studio near Capitol Hill.'],
      [c.start('sofia', 68), 'call', 'Phone screen: first-time renter, parents will co-sign.', { durationMinutes: 12 }],
      [c.start('sofia', 50), 'tour', 'sofia', 'booked'],
      [c.start('sofia', 50), 'status', 'Tour Scheduled'],
      [c.end('sofia', 0), 'tour', 'sofia', 'completed'],
      [c.end('sofia', 5), 'status', 'Tour Completed'],
      [28, 'status', 'Application Submitted'],
      [0, 'email', 'Sent the application receipt and what happens next.'],
    ],
  },

  // ---- Approved -----------------------------------------------------------
  {
    key: 'ethan',
    name: 'Ethan Brooks',
    email: 'ethan.brooks@example.com',
    phone: '(425) 555-0119',
    status: 'Approved',
    moveIn: 9,
    unitType: '1 Bedroom',
    occupants: 1,
    pets: 'None',
    notes: 'Approved. Wants a Friday move-in and needs the elevator reserved.',
    address: '14410 NE 24th St, Bellevue, WA 98007',
    employer: 'Costco Wholesale',
    moveReason: 'Job Relocation',
    timing: contactNow(20),
    events: (c) => [
      [c.start('ethan', 100), 'inquiry', 'Phone inquiry; relocating for work and needs a 1 bedroom quickly.'],
      [c.start('ethan', 70), 'tour', 'ethan', 'booked'],
      [c.start('ethan', 70), 'status', 'Tour Scheduled'],
      [c.end('ethan', 0), 'tour', 'ethan', 'completed'],
      [c.end('ethan', 5), 'status', 'Tour Completed'],
      [96, 'status', 'Application Submitted'],
      [60, 'status', 'Approved'],
      [0, 'call', 'Called to set up lease signing; he can come in Thursday evening.', { durationMinutes: 9 }],
    ],
    tasks: [
      { title: 'Prepare the lease for signature', due: 0, createdAgoHours: 40 },
      { title: 'Schedule the move-in walkthrough', due: 5, createdAgoHours: 40 },
    ],
  },
  {
    key: 'ingrid',
    name: 'Ingrid Solheim',
    email: 'ingrid.solheim@example.net',
    phone: '(206) 555-0128',
    status: 'Approved',
    moveIn: 16,
    unitType: '2 Bedroom',
    occupants: 2,
    pets: 'None',
    notes: 'Toured virtually while finishing her current lease. Holding deposit received.',
    address: '2711 Queen Anne Ave N, Seattle, WA 98109',
    employer: "Seattle Children's",
    moveReason: 'Upsizing',
    timing: contactLater(0.55),
    events: (c) => [
      [c.start('ingrid', 90), 'inquiry', 'Online inquiry for a 2 bedroom; traveling, so asked about a virtual tour.'],
      [c.start('ingrid', 60), 'tour', 'ingrid', 'booked'],
      [c.start('ingrid', 60), 'status', 'Tour Scheduled'],
      [c.end('ingrid', 0), 'tour', 'ingrid', 'completed'],
      [c.end('ingrid', 5), 'status', 'Tour Completed'],
      [90, 'status', 'Application Submitted'],
      [54, 'status', 'Approved'],
      [0, 'text', 'Texted the lease signing options for this week.'],
    ],
    tasks: [
      { title: 'Send the move-in checklist', due: 3, createdAgoHours: 50 },
      { title: 'Collect the holding deposit', due: -1, done: true, createdAgoHours: 70, doneAgoHours: 30 },
    ],
  },
  {
    key: 'marcus',
    name: 'Marcus Webb',
    email: 'marcus.webb@example.com',
    phone: '(253) 555-0139',
    status: 'Approved',
    moveIn: 27,
    unitType: '1 Bedroom',
    occupants: 1,
    pets: '1 dog (greyhound)',
    notes: 'Self-guided tour went well. Pet deposit paid.',
    address: '1802 Meridian Ave E, Puyallup, WA 98371',
    employer: 'Joint Base Lewis-McChord',
    moveReason: 'Job Relocation',
    timing: contactLater(0.8),
    events: (c) => [
      [c.start('marcus', 80), 'inquiry', 'Web inquiry for a 1 bedroom that allows large dogs.'],
      [c.start('marcus', 54), 'tour', 'marcus', 'booked'],
      [c.start('marcus', 54), 'status', 'Tour Scheduled'],
      [c.end('marcus', 0), 'tour', 'marcus', 'completed'],
      [c.end('marcus', 5), 'status', 'Tour Completed'],
      [80, 'status', 'Application Submitted'],
      [48, 'status', 'Approved'],
      [0, 'email', 'Sent the lease and the move-in checklist for review.'],
    ],
    tasks: [{ title: 'Reserve the elevator for move-in day', due: 20, createdAgoHours: 30 }],
  },

  // ---- Leased ---------------------------------------------------------------
  {
    key: 'aaron',
    name: 'Aaron Feldman',
    email: 'aaron.feldman@example.net',
    phone: '(425) 555-0152',
    status: 'Leased',
    moveIn: -22,
    unitType: '1 Bedroom',
    occupants: 1,
    pets: 'None',
    notes: 'Signed a 12 month lease. Moved in without issues.',
    address: '4000 Lake Washington Blvd NE, Kirkland, WA 98033',
    employer: 'Google',
    moveReason: 'Job Relocation',
    timing: freeDaysAgo(27),
    events: (c) => [
      [c.start('aaron', 100), 'inquiry', 'Web inquiry for a 1 bedroom; taking a new job in Kirkland.'],
      [c.start('aaron', 72), 'tour', 'aaron', 'booked'],
      [c.start('aaron', 72), 'status', 'Tour Scheduled'],
      [c.end('aaron', 0), 'tour', 'aaron', 'completed'],
      [c.end('aaron', 5), 'status', 'Tour Completed'],
      [96, 'status', 'Approved'],
      [24, 'email', 'Sent the lease and the move-in checklist.'],
      [0, 'status', 'Leased'],
    ],
  },
  {
    key: 'camila',
    name: 'Camila Reyes',
    email: 'camila.reyes@example.com',
    phone: '(206) 555-0161',
    status: 'Leased',
    moveIn: -11,
    unitType: '2 Bedroom',
    occupants: 2,
    pets: '1 cat',
    notes: 'Signed a 12 month lease. Asked for a parking spot near the elevator.',
    address: '1120 Summit Ave, Seattle, WA 98101',
    employer: 'Harborview Medical Center',
    moveReason: 'Upsizing',
    timing: freeDaysAgo(14),
    events: (c) => [
      [c.start('camila', 96), 'inquiry', 'Online inquiry for a 2 bedroom close to Harborview.'],
      [c.start('camila', 66), 'tour', 'camila', 'booked'],
      [c.start('camila', 66), 'status', 'Tour Scheduled'],
      [c.end('camila', 0), 'tour', 'camila', 'completed'],
      [c.end('camila', 5), 'status', 'Tour Completed'],
      [96, 'status', 'Approved'],
      [24, 'email', 'Sent the lease for signature along with the parking addendum.'],
      [0, 'status', 'Leased'],
    ],
  },
  {
    key: 'jonah',
    name: 'Jonah Pruitt',
    email: 'jonah.pruitt@example.net',
    phone: '(253) 555-0170',
    status: 'Leased',
    moveIn: 9,
    unitType: 'Studio',
    occupants: 1,
    pets: 'None',
    notes: 'First apartment. Lease signed; move-in keys are ready.',
    address: '4501 N 9th St, Tacoma, WA 98406',
    employer: 'University of Puget Sound',
    moveReason: 'First Time Renter',
    timing: freeDaysAgo(6),
    events: (c) => [
      [c.start('jonah', 90), 'inquiry', 'Web inquiry for a studio close to campus.'],
      [c.start('jonah', 60), 'tour', 'jonah', 'booked'],
      [c.start('jonah', 60), 'status', 'Tour Scheduled'],
      [c.end('jonah', 0), 'tour', 'jonah', 'completed'],
      [c.end('jonah', 5), 'status', 'Tour Completed'],
      [96, 'status', 'Approved'],
      [20, 'email', 'Sent the lease and a guide to renter insurance.'],
      [0, 'status', 'Leased'],
    ],
    tasks: [{ title: 'Send the keys and parking info packet', due: 3, createdAgoHours: 100 }],
  },
  {
    key: 'yuki',
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@example.com',
    phone: '(425) 555-0188',
    status: 'Leased',
    moveIn: 24,
    unitType: '1 Bedroom',
    occupants: 2,
    pets: 'None',
    notes: 'Lease signed for next month. Needs proof of renter insurance before move-in.',
    address: '6300 Lakeview Dr, Kirkland, WA 98033',
    employer: 'Nintendo of America',
    moveReason: 'Closer to Work',
    timing: freeDaysAgo(3),
    events: (c) => [
      [c.start('yuki', 80), 'inquiry', 'Web inquiry for a 1 bedroom; moving in with a partner next month.'],
      [c.start('yuki', 56), 'tour', 'yuki', 'booked'],
      [c.start('yuki', 56), 'status', 'Tour Scheduled'],
      [c.end('yuki', 0), 'tour', 'yuki', 'completed'],
      [c.end('yuki', 5), 'status', 'Tour Completed'],
      [72, 'status', 'Approved'],
      [18, 'email', 'Sent the lease with the renter insurance requirements.'],
      [0, 'status', 'Leased'],
    ],
    tasks: [
      { title: 'Collect proof of renter insurance', due: 10, createdAgoHours: 60 },
      { title: 'Send the utilities setup guide', due: 14, createdAgoHours: 60 },
    ],
  },

  // ---- Search Hold ------------------------------------------------------------
  {
    key: 'beth',
    name: 'Beth Calloway',
    email: 'beth.calloway@example.net',
    phone: '(206) 555-0191',
    status: 'Search Hold',
    moveIn: 95,
    unitType: 'Studio',
    occupants: 1,
    pets: 'None',
    notes: 'Lease runs through January. Interested in any move-in specials.',
    address: '2020 Alki Ave SW, Seattle, WA 98116',
    employer: 'Alaska Airlines',
    moveReason: 'Other',
    timing: contactUp(288),
    events: () => [
      [360, 'inquiry', 'Website inquiry for a studio; the lease at her current place runs through January.'],
      [358, 'email', 'Sent studio pricing and availability.'],
      [358, 'status', 'Contacted'],
      [200, 'call', 'Discussed timing; she cannot move until her lease ends.', { durationMinutes: 8 }],
      [150, 'status', 'Search Hold'],
      [150, 'note', 'Asked us to check back in the fall. Interested in any move-in specials.'],
      [0, 'email', 'Monthly check-in with the latest studio availability and specials.'],
    ],
    tasks: [{ title: 'Check in about her January lease end', due: 20, createdAgoHours: 140 }],
  },
  {
    key: 'theo',
    name: 'Theo Nguyen',
    email: 'theo.nguyen@example.com',
    phone: '(425) 555-0103',
    status: 'Search Hold',
    moveIn: 118,
    unitType: '1 Bedroom',
    occupants: 1,
    pets: 'None',
    notes: 'Transfer to the Seattle office is delayed until early next year.',
    address: '11800 NE 128th St, Kirkland, WA 98034',
    employer: 'Evergreen Health',
    moveReason: 'Job Relocation',
    timing: contactUp(504),
    events: () => [
      [400, 'inquiry', 'Phone inquiry; his transfer to the Seattle office is delayed.'],
      [398, 'email', 'Sent 1 bedroom pricing and the application checklist.'],
      [398, 'status', 'Contacted'],
      [250, 'call', 'Confirmed the transfer is pushed to early next year.', { durationMinutes: 6 }],
      [200, 'status', 'Search Hold'],
      [200, 'note', 'Wants updates on pricing once he has a firm start date.'],
      [0, 'email', 'Monthly check-in: shared current availability and rent ranges.'],
    ],
    tasks: [{ title: 'Send the spring availability update', due: null, createdAgoHours: 200 }],
  },

  // ---- Not Interested / Leased Elsewhere ------------------------------------------
  {
    key: 'carl',
    name: 'Carl Dempsey',
    email: 'carl.dempsey@example.net',
    phone: '(253) 555-0114',
    status: 'Not Interested',
    moveIn: 35,
    unitType: '1 Bedroom',
    occupants: 1,
    pets: 'None',
    notes: 'Missed his tour and said rents are above his budget.',
    address: '1100 S 3rd St, Renton, WA 98057',
    employer: 'Boeing',
    moveReason: 'Downsizing',
    timing: atTime((c) => +c.end('carl', 180)),
    events: (c) => [
      [c.start('carl', 96), 'inquiry', 'Walk-in; asked about 1 bedrooms under $2,000.'],
      [c.start('carl', 72), 'tour', 'carl', 'booked'],
      [c.start('carl', 72), 'status', 'Tour Scheduled'],
      [c.end('carl', 20), 'tour', 'carl', 'no-show'],
      [c.end('carl', 120), 'email', 'Emailed to ask whether he still wants to see the units and offered to reschedule.'],
      [c.end('carl', 170), 'note', 'He replied that the rents are above his budget and he is looking in Renton.'],
      [0, 'status', 'Not Interested'],
    ],
  },
  {
    key: 'lauren',
    name: 'Lauren Whitaker',
    email: 'lauren.whitaker@example.com',
    phone: '(206) 555-0125',
    status: 'Not Interested',
    moveIn: 60,
    unitType: '2 Bedroom',
    occupants: 2,
    pets: '1 cat',
    notes: 'Decided to stay put after her landlord offered a rent freeze.',
    address: '6015 Phinney Ave N, Seattle, WA 98103',
    employer: 'Seattle City Light',
    moveReason: 'Upsizing',
    timing: freeDaysAgo(5),
    events: () => [
      [200, 'inquiry', 'Online inquiry for a 2 bedroom; just exploring options for next year.'],
      [198, 'email', 'Sent 2 bedroom pricing and availability.'],
      [198, 'status', 'Contacted'],
      [120, 'call', 'Friendly call; she is leaning toward renewing her current lease.', { durationMinutes: 6 }],
      [1, 'note', 'She decided to stay put after her landlord offered a rent freeze.'],
      [0, 'status', 'Not Interested'],
    ],
  },
  {
    key: 'raj',
    name: 'Raj Menon',
    email: 'raj.menon@example.net',
    phone: '(425) 555-0138',
    status: 'Leased Elsewhere',
    moveIn: 45,
    unitType: '2 Bedroom',
    occupants: 2,
    pets: '1 dog (shepherd mix)',
    notes: 'Chose a place closer to his office.',
    address: '750 110th Ave NE, Bellevue, WA 98004',
    employer: 'Salesforce',
    moveReason: 'Closer to Work',
    timing: freeDaysAgo(2),
    events: () => [
      [300, 'inquiry', 'Referral from a coworker; wants a 2 bedroom close to the Bellevue transit center.'],
      [298, 'call', 'Phone screen: two occupants, one dog.', { durationMinutes: 12 }],
      [298, 'status', 'Contacted'],
      [150, 'email', 'Sent pricing and availability; no tour booked yet.'],
      [24, 'note', 'Told us he put a deposit down on a place nearer to his office.'],
      [0, 'status', 'Leased Elsewhere'],
    ],
  },
];

// ---------------------------------------------------------------------------
// Tours. Today's are placed around `now`; the rest are fixed day offsets.

const TOUR_NOTES = {
  sarah: 'Top floor 2 bedrooms: units 508 and 612. Bring pet info for the corgi.',
  elena: 'Wants to see the 2 bedroom closest to the light rail side.',
  kevin: 'Interested in a higher floor facing away from the street.',
  rachel: 'Out-of-town renter; walk her through the move-in costs.',
  omar: 'Quiet unit away from the elevator. Needs a reminder text the day before.',
  daniel: 'Check the north side units for street noise.',
  daniel2: 'Second look at the north side units, self-guided.',
  grace: 'Roommate could not attend; send photos afterward.',
  fraser: 'Wants the quietest 3 bedroom on the courtyard side.',
  vic: 'Needs to move within three weeks.',
  brandon: 'Cat owner; pointed out the pet rules.',
  sofia: 'First-time renter; parents joined the tour.',
  ethan: 'Relocating for work; decided the same day.',
  ingrid: 'Virtual walkthrough while she was traveling.',
  marcus: 'Self-guided tour with the door code; dog friendly floors.',
  alicia: 'Canceled the morning of the tour.',
  carl: 'Did not show and did not answer the follow-up call.',
  aaron: 'Wants a unit with a view of the lake.',
  camila: 'Asked about covered parking and cat policy.',
  jonah: 'Close to campus; parents joined the tour.',
  yuki: 'Moving in with a partner; compared two floor plans.',
};

const TOUR_TYPE_OVERRIDES = { ingrid: 'Virtual', marcus: 'Self-guided', daniel2: 'Self-guided' };

// Fixed tours placed after today's; past ones count backwards, future ones forwards.
const FIXED_TOURS = [
  { key: 'fraser', day: -1, time: '10:00', status: 'Completed' },
  { key: 'grace', day: -3, time: '15:00', status: 'Completed' },
  { key: 'alicia', day: -3, time: '13:00', status: 'Canceled' },
  { key: 'carl', day: -4, time: '11:00', status: 'No-show' },
  { key: 'sofia', day: -5, time: '16:00', status: 'Completed' },
  { key: 'brandon', day: -6, time: '14:00', status: 'Completed' },
  { key: 'marcus', day: -6, time: '16:30', status: 'Completed' },
  { key: 'vic', day: -7, time: '10:30', status: 'Completed' },
  { key: 'ingrid', day: -7, time: '11:30', status: 'Completed' },
  { key: 'ethan', day: -8, time: '15:30', status: 'Completed' },
  { key: 'yuki', day: -12, time: '11:00', status: 'Completed' },
  { key: 'jonah', day: -17, time: '14:30', status: 'Completed' },
  { key: 'camila', day: -24, time: '13:00', status: 'Completed' },
  { key: 'aaron', day: -35, time: '10:00', status: 'Completed' },
  { key: 'omar', day: 3, time: '10:30', status: 'Unconfirmed' },
  { key: 'daniel2', day: 9, time: '15:00', status: 'Confirmed' },
];

function planTours(now) {
  const calendar = createCalendar(now);
  const today = planToday(now, calendar);
  const starts = {};
  const statuses = {};

  starts.sarah = today.past[0] ?? calendar.place(-1, '11:00', -1);
  statuses.sarah = 'Completed';
  // Daniel's completed tour moves to today only when today would otherwise be too thin
  starts.daniel = today.past[1] ?? calendar.place(-2, '13:30', -1);
  statuses.daniel = 'Completed';

  // Tour Scheduled leads take today's upcoming slots, else tomorrow
  [
    ['elena', 'Confirmed', '10:00'],
    ['kevin', 'Confirmed', '11:30'],
    ['rachel', 'Unconfirmed', '14:00'],
  ].forEach(([key, status, time], i) => {
    starts[key] = today.future[i] ?? calendar.place(1, time, 1);
    statuses[key] = status;
  });

  FIXED_TOURS.forEach(({ key, day, time, status }) => {
    starts[key] = calendar.place(day, time, day < 0 ? -1 : 1);
    statuses[key] = status;
  });

  return { starts, statuses };
}

// ---------------------------------------------------------------------------

function defaultMakeId() {
  let n = 0;
  return () => `demo-${String(++n).padStart(4, '0')}`;
}

// now: the moment the dataset is "created"; every date is relative to it.
// makeId: returns a fresh document id each call.
export function buildDemoData(now = new Date(), makeId = defaultMakeId()) {
  const startToday = startOfDay(now);
  const endToday = addDays(startToday, 1);
  const { starts, statuses } = planTours(now);

  const leadIds = Object.fromEntries(LEAD_SPECS.map((spec) => [spec.key, makeId()]));
  const tourIds = Object.fromEntries(Object.keys(starts).map((key) => [key, makeId()]));
  const leadOfTour = {};

  const c = {
    now,
    startToday,
    endToday,
    start: (key, hoursBefore) => new Date(+starts[key] - hoursBefore * HOUR),
    end: (key, minutesAfter) => new Date(+starts[key] + (TOUR_DURATION_MINUTES + minutesAfter) * MIN),
  };

  const bookedAt = {};

  const leads = LEAD_SPECS.map((spec) => {
    const anchor = resolveAnchor(spec, c);
    const toMs = (t) => floorMinute(t instanceof Date ? +t : anchor - t * HOUR);

    const events = spec
      .events(c)
      .map((event, index) => ({ event, index, time: toMs(event[0]) }))
      .sort((a, b) => a.time - b.time || a.index - b.index);

    let current = 'New Inquiry';
    let statusChangedMs = null;
    let lastContactMs = null;

    const activities = events.map(({ event, time }) => {
      const [, type, a, b] = event;
      const createdAt = new Date(time).toISOString();
      let data;
      if (type === 'status') {
        data = { type, body: `Status changed from ${current} to ${a}`, createdAt, from: current, to: a };
        current = a;
        statusChangedMs = time;
      } else if (type === 'tour') {
        leadOfTour[a] = spec.key;
        const when = formatDateTime(toLocalDateTimeString(starts[a]));
        const body = {
          booked: `Tour scheduled for ${when}`,
          completed: `Tour completed (${when})`,
          canceled: `Tour canceled (${when})`,
          'no-show': `Tour marked no-show (${when})`,
        }[b];
        if (b === 'booked') bookedAt[a] = time;
        data = { type, body, createdAt, tourId: tourIds[a] };
      } else {
        data = { type, body: a, createdAt, ...b };
        if (CONTACT_ACTIVITY_TYPES.includes(type)) lastContactMs = time;
      }
      return { id: makeId(), data };
    });

    if (current !== spec.status) {
      throw new Error(`${spec.name}: story ends at ${current}, expected ${spec.status}`);
    }

    const createdMs = events[0].time;
    const leadData = {
      name: spec.name,
      email: spec.email,
      phone: spec.phone,
      status: spec.status,
      moveInDate: moveInDateOf(spec, now),
      unitType: spec.unitType,
      occupants: spec.occupants,
      pets: spec.pets,
      notes: spec.notes,
      address: spec.address,
      employer: spec.employer,
      moveReason: spec.moveReason,
      createdAt: new Date(createdMs).toISOString(),
      statusChangedAt: new Date(statusChangedMs ?? createdMs).toISOString(),
    };
    if (lastContactMs !== null) leadData.lastContactedAt = new Date(lastContactMs).toISOString();

    const tasks = (spec.tasks ?? []).map((task) => {
      const createdTaskMs = Math.min(
        Math.max(floorMinute(+now - task.createdAgoHours * HOUR), createdMs + MIN),
        floorMinute(+now) - MIN
      );
      const done = Boolean(task.done);
      const doneMs = done
        ? Math.min(Math.max(floorMinute(+now - task.doneAgoHours * HOUR), createdTaskMs + MIN), floorMinute(+now))
        : null;
      return {
        id: makeId(),
        data: {
          title: task.title,
          dueDate: task.due === null ? '' : toLocalDateString(addDays(now, task.due)),
          done,
          createdAt: new Date(createdTaskMs).toISOString(),
          doneAt: done ? new Date(doneMs).toISOString() : null,
        },
      };
    });

    return { id: leadIds[spec.key], data: leadData, activities, tasks };
  });

  const unitCursor = {};
  const pickUnits = (unitType, count) => {
    const pool = UNITS_BY_TYPE[unitType];
    const from = unitCursor[unitType] ?? 0;
    unitCursor[unitType] = from + count;
    return Array.from({ length: count }, (_, i) => pool[(from + i) % pool.length]);
  };

  const specByKey = Object.fromEntries(LEAD_SPECS.map((spec) => [spec.key, spec]));
  const tours = Object.keys(starts)
    .sort((a, b) => +starts[a] - +starts[b])
    .map((key) => {
      const spec = specByKey[leadOfTour[key]];
      if (!spec) throw new Error(`Tour ${key} is not linked to a lead`);
      const units = key === 'sarah' ? ['508', '612'] : pickUnits(spec.unitType, key === 'fraser' ? 2 : 1);
      return {
        id: tourIds[key],
        data: {
          leadId: leadIds[spec.key],
          leadName: spec.name,
          start: toLocalDateTimeString(starts[key]),
          durationMinutes: TOUR_DURATION_MINUTES,
          type: TOUR_TYPE_OVERRIDES[key] ?? 'In person',
          units,
          status: statuses[key],
          notes: TOUR_NOTES[key] ?? '',
          createdAt: new Date(bookedAt[key] ?? +starts[key] - 48 * HOUR).toISOString(),
        },
      };
    });

  return { leads, tours };
}
