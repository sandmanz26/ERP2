import { makeRng } from './rng';
import { addDays, isoDate, nightsBetween } from './format';
import type {
  AppState, Booking, CamDevice, CamSession, Channel, Expense,
  ExpenseCategory, Property, Season, ServiceJob, Staff, ChecklistItem, JobType, StaffRole,
} from '../types';

const CHANNEL_FEE: Record<Channel, number> = { airbnb: 0.03, booking: 0.15, direct: 0 };

const PROPERTY_SEED: Array<Pick<Property, 'name' | 'area' | 'city' | 'type' | 'bedrooms'> & { base: number }> = [
  { name: 'Villa Senja',          area: 'Canggu',         city: 'Badung',        type: 'Villa',     bedrooms: 3, base: 2_150_000 },
  { name: 'Anjani House',         area: 'Ubud',           city: 'Gianyar',       type: 'House',     bedrooms: 2, base: 1_450_000 },
  { name: 'Villa Karang Biru',    area: 'Uluwatu',        city: 'Badung',        type: 'Villa',     bedrooms: 4, base: 3_400_000 },
  { name: 'Padi Bungalow',        area: 'Tegallalang',    city: 'Gianyar',       type: 'Bungalow',  bedrooms: 1, base: 850_000 },
  { name: 'Tirta House',          area: 'Sanur',          city: 'Denpasar',      type: 'House',     bedrooms: 3, base: 1_750_000 },
  { name: 'Villa Bulan Madu',     area: 'Seminyak',       city: 'Badung',        type: 'Villa',     bedrooms: 2, base: 2_600_000 },
  { name: 'Prawira Townhouse',    area: 'Prawirotaman',   city: 'Yogyakarta',    type: 'Townhouse', bedrooms: 3, base: 950_000 },
  { name: 'Kaliurang House',      area: 'Kaliurang',      city: 'Sleman',        type: 'House',     bedrooms: 4, base: 1_200_000 },
  { name: 'Villa Lembah Dago',    area: 'Dago Atas',      city: 'Bandung',       type: 'Villa',     bedrooms: 4, base: 1_900_000 },
  { name: 'Cigadung House',       area: 'Cigadung',       city: 'Bandung',       type: 'House',     bedrooms: 3, base: 1_150_000 },
  { name: 'Villa Gili Ombak',     area: 'Gili Trawangan', city: 'North Lombok',  type: 'Villa',     bedrooms: 2, base: 1_650_000 },
  { name: 'Kuta Mandalika House', area: 'Kuta',           city: 'Central Lombok', type: 'House',    bedrooms: 3, base: 1_350_000 },
];

const GUESTS = [
  'Andini P.', 'Marcus Lee', 'Sari Wulandari', 'Tom Brenner', 'Dewi Ayu', 'Kenji Watanabe',
  'Rizky Ramadhan', 'Claire Dubois', 'Putu Adnyana', 'Hannah Meyer', 'Bagas Pratama',
  'Yuki Tanaka', 'Nadia Salsabila', 'Liam Walsh', 'Gita Maharani', 'Oscar Nilsen',
];

/** Coverage roster: who is responsible for which houses. p8 is left uncovered on
 *  purpose so the product surfaces a real gap instead of a tidy fiction. */
const STAFF_SEED: Array<{ name: string; role: StaffRole; houses: number[]; rate: number }> = [
  { name: 'Ni Kadek Ayu', role: 'Cleaner',    houses: [1, 2, 3], rate: 150_000 },
  { name: 'Wayan Suarta', role: 'Cleaner',    houses: [4, 5, 6], rate: 150_000 },
  { name: 'Siti Rohmah',  role: 'Cleaner',    houses: [7, 10],   rate: 135_000 },
  { name: 'Ketut Sri',    role: 'Cleaner',    houses: [9, 11, 12], rate: 140_000 },
  { name: 'Joko Purnomo', role: 'Technician', houses: [7, 8, 9, 10], rate: 250_000 },
  { name: 'Made Artana',  role: 'Technician', houses: [1, 2, 3, 4, 5, 6, 11, 12], rate: 250_000 },
  { name: 'Lina Marlina', role: 'Laundry',    houses: [1, 2, 3, 4, 5, 6], rate: 90_000 },
  { name: 'Agus Setiawan', role: 'Supervisor', houses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], rate: 175_000 },
];

const CHECKLIST: Record<JobType, string[]> = {
  cleaning: [
    'Photograph every room on arrival',
    'Strip and change bed linen',
    'Clean bathrooms, restock towels',
    'Check and refill guest amenities',
    'Mop floors and terrace',
    'Verify inventory (remotes, hair dryer, keys)',
    'Photograph final state and lock up',
  ],
  laundry: ['Count and photograph soiled linen', 'Hand over to laundry vendor', 'Receive and inspect clean linen', 'Restock linen cabinet'],
  maintenance: ['Photograph the fault', 'Confirm cost estimate with owner', 'Carry out the repair', 'Function test', 'Photograph the result'],
  inspection: ['Check AC and electrics', 'Check pump and plumbing', 'Check pool / garden', 'Check cameras and door locks', 'File condition report'],
};

const EXPENSE_LABELS: Record<ExpenseCategory, string[]> = {
  utilities: ['Electricity', 'Water', 'Gas refill'],
  cleaning: ['Cleaning crew fees', 'Cleaning supplies'],
  laundry: ['Linen and towel laundry'],
  repairs: ['AC service', 'Water pump repair', 'Water heater replacement', 'Repainting', 'Roof leak repair'],
  supplies: ['Guest amenity restock', 'Linen and towel replacement', 'Kitchen supplies'],
  payroll: ['Staff and supervisor payroll'],
  internet: ['Internet and cable TV'],
  tax: ['Local lodging tax (PB1)'],
  ground_rent: ['Land / building lease'],
  marketing: ['Listing ads and photography', 'Content collaboration'],
};

export function buildSeedState(now = new Date()): AppState {
  const rng = makeRng(20260921);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const properties: Property[] = PROPERTY_SEED.map((p, i) => {
    const channels: Channel[] = i % 5 === 0 ? ['airbnb', 'direct'] : i % 3 === 0 ? ['airbnb', 'booking', 'direct'] : ['airbnb', 'booking'];
    return {
      id: `p${i + 1}`,
      name: p.name,
      area: p.area,
      city: p.city,
      type: p.type,
      bedrooms: p.bedrooms,
      capacity: p.bedrooms * 2,
      status: i === 7 ? 'maintenance' : 'active',
      accent: (i % 8) + 1,
      basePrice: p.base,
      weekendUpliftPct: rng.pick([15, 20, 25, 30]),
      cleaningFee: rng.round(p.base * 0.12, 25_000),
      extraGuestFee: rng.round(p.base * 0.08, 25_000),
      minStay: p.base > 2_000_000 ? 2 : 1,
      channels,
      targetOccupancy: rng.int(68, 82),
    };
  });

  const y = today.getFullYear();
  const seasons: Season[] = [
    { id: 's1', name: 'High season Jun–Aug', propertyId: 'all', startDate: `${y}-06-01`, endDate: `${y}-08-31`, multiplier: 1.35, minStay: 3, active: true },
    { id: 's2', name: 'Christmas & New Year', propertyId: 'all', startDate: `${y}-12-20`, endDate: `${y + 1}-01-05`, multiplier: 1.6, minStay: 4, active: true },
    { id: 's3', name: 'Eid holiday', propertyId: 'all', startDate: `${y}-03-25`, endDate: `${y}-04-10`, multiplier: 1.4, minStay: 2, active: true },
    { id: 's4', name: 'Low season February', propertyId: 'all', startDate: `${y}-02-01`, endDate: `${y}-02-28`, multiplier: 0.82, minStay: 1, active: true },
    { id: 's5', name: 'Uluwatu surf season', propertyId: 'p3', startDate: `${y}-05-01`, endDate: `${y}-09-30`, multiplier: 1.25, minStay: 3, active: true },
  ];

  const staff: Staff[] = STAFF_SEED.map((s, i) => ({
    id: `st${i + 1}`,
    name: s.name,
    role: s.role,
    phone: `08${rng.int(11, 59)}-${rng.int(1000, 9999)}-${rng.int(1000, 9999)}`,
    rating: Number((3.9 + rng.next() * 1.05).toFixed(1)),
    jobsThisMonth: 0,
    assignedPropertyIds: s.houses.map((h) => `p${h}`),
    ratePerJob: s.rate,
    onTimePct: rng.int(78, 99),
  }));

  const crewFor = (propertyId: string, role: StaffRole): Staff[] => {
    const assigned = staff.filter((s) => s.role === role && s.assignedPropertyIds.includes(propertyId));
    return assigned.length ? assigned : staff.filter((s) => s.role === role);
  };

  const bookings: Booking[] = [];
  const jobs: ServiceJob[] = [];

  const rangeStart = addDays(today, -180);
  const rangeEnd = addDays(today, 45);

  properties.forEach((prop, pi) => {
    let cursor = new Date(rangeStart);
    const occ = prop.targetOccupancy / 100;
    while (cursor < rangeEnd) {
      if (!rng.chance(occ)) {
        cursor = addDays(cursor, 1);
        continue;
      }
      const nights = Math.max(prop.minStay, rng.int(2, prop.basePrice > 2_000_000 ? 6 : 4));
      const checkIn = new Date(cursor);
      const checkOut = addDays(checkIn, nights);
      if (checkOut > rangeEnd) break;

      let nightly = 0;
      for (let d = 0; d < nights; d++) nightly += priceForNight(prop, seasons, addDays(checkIn, d));

      const guests = rng.int(2, prop.capacity);
      const extra = Math.max(0, guests - prop.bedrooms * 1.5) * prop.extraGuestFee;
      const channel = rng.pick(prop.channels);
      const roomRevenue = Math.round(nightly + extra);
      const gross = roomRevenue + prop.cleaningFee;
      const channelFee = Math.round(gross * CHANNEL_FEE[channel]);

      const status: Booking['status'] =
        checkOut <= today ? (rng.chance(0.04) ? 'cancelled' : 'completed')
          : checkIn <= today ? 'in_stay'
          : 'confirmed';

      bookings.push({
        id: `b${pi}-${bookings.length}`,
        code: `KNP-${String(bookings.length + 1042).padStart(4, '0')}`,
        propertyId: prop.id,
        guest: rng.pick(GUESTS),
        channel,
        checkIn: isoDate(checkIn),
        checkOut: isoDate(checkOut),
        nights,
        guests,
        gross,
        channelFee,
        cleaningFee: prop.cleaningFee,
        payout: gross - channelFee,
        status,
      });

      const gapToToday = Math.round((checkOut.getTime() - today.getTime()) / 86400000);
      if (gapToToday >= -12 && gapToToday <= 7 && status !== 'cancelled') {
        jobs.push(makeJob(rng, 'cleaning', prop, checkOut, 11, today, crewFor(prop.id, 'Cleaner')));
      }
      cursor = addDays(checkOut, rng.int(0, 2));
    }
  });

  properties.forEach((prop, i) => {
    if (i % 3 === 0) jobs.push(makeJob(rng, 'inspection', prop, addDays(today, rng.int(-6, 6)), 9, today, crewFor(prop.id, 'Supervisor')));
    if (i % 4 === 1) jobs.push(makeJob(rng, 'maintenance', prop, addDays(today, rng.int(-5, 5)), 13, today, crewFor(prop.id, 'Technician')));
    if (i % 2 === 0) jobs.push(makeJob(rng, 'laundry', prop, addDays(today, rng.int(-4, 4)), 15, today, crewFor(prop.id, 'Laundry')));
  });
  jobs.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  // Always leave two jobs running today so the board and the camera wall have
  // a live session to show.
  const cleaningJobs = jobs.filter((j) => j.type === 'cleaning').slice(0, 24);
  const usedStaff = new Set<string>();
  let forced = 0;
  for (const job of cleaningJobs) {
    if (forced >= 2) break;
    if (usedStaff.has(job.staffId)) continue;
    usedStaff.add(job.staffId);
    job.scheduledAt = new Date(now.getTime() - (35 + forced * 20) * 60_000).toISOString();
    job.status = 'in_progress';
    job.checklist = job.checklist.map((c, i) => ({ ...c, done: i < 3 }));
    forced += 1;
  }

  jobs.forEach((j) => {
    const s = staff.find((x) => x.id === j.staffId);
    if (s && j.scheduledAt.slice(0, 7) === isoDate(today).slice(0, 7)) s.jobsThisMonth += 1;
  });

  const expenses = buildExpenses(rng, properties, bookings, today);
  const devices = buildDevices(rng, staff, properties, now);
  const sessions = buildSessions(rng, devices, jobs, now);
  sessions.forEach((s) => {
    if (!s.jobId) return;
    const job = jobs.find((j) => j.id === s.jobId);
    if (job) job.sessionId = s.id;
  });

  return { properties, seasons, bookings, expenses, jobs, staff, devices, sessions };
}

export function priceForNight(prop: Property, seasons: Season[], day: Date): number {
  const dow = day.getDay();
  const weekend = dow === 5 || dow === 6;
  const season = seasons.find(
    (s) => s.active && (s.propertyId === 'all' || s.propertyId === prop.id) &&
      isoDate(day) >= s.startDate && isoDate(day) <= s.endDate,
  );
  const base = prop.basePrice * (weekend ? 1 + prop.weekendUpliftPct / 100 : 1);
  return Math.round((base * (season ? season.multiplier : 1)) / 1000) * 1000;
}

function makeJob(
  rng: ReturnType<typeof makeRng>, type: JobType, prop: Property,
  day: Date, hour: number, today: Date, pool: Staff[],
): ServiceJob {
  const at = new Date(day);
  at.setHours(hour, rng.pick([0, 15, 30]), 0, 0);
  const past = at.getTime() < today.getTime() + 12 * 3600_000;
  const status: ServiceJob['status'] = past
    ? rng.chance(0.88) ? 'done' : 'overdue'
    : at.getTime() < Date.now() + 3600_000 ? 'in_progress' : 'scheduled';
  const checklist: ChecklistItem[] = CHECKLIST[type].map((label, i) => ({
    id: `c${i}`,
    label,
    done: status === 'done' ? true : status === 'in_progress' ? i < 3 : false,
    camVerified: type === 'cleaning' && (i === 0 || i === 5 || i === 6),
  }));
  const assignee = pool.length ? rng.pick(pool) : null;
  const cost = type === 'cleaning' ? (assignee?.ratePerJob ?? rng.round(prop.cleaningFee * 0.55, 5_000))
    : type === 'maintenance' ? rng.round(250_000 + rng.next() * 1_500_000, 25_000)
    : type === 'laundry' ? rng.round(prop.bedrooms * 85_000, 5_000)
    : 100_000;
  return {
    id: `j${Math.floor(rng.next() * 1e9).toString(36)}`,
    propertyId: prop.id,
    type,
    staffId: assignee?.id ?? '',
    scheduledAt: at.toISOString(),
    durationMin: type === 'cleaning' ? rng.pick([90, 120, 150]) : type === 'maintenance' ? rng.pick([60, 180, 240]) : 60,
    status,
    cost,
    checklist,
    note: type === 'maintenance'
      ? rng.pick(['Master bedroom AC not cooling', 'Leaking sink tap', 'Garden lights out', 'Bathroom door jammed'])
      : '',
    sessionId: null,
  };
}

function buildExpenses(rng: ReturnType<typeof makeRng>, properties: Property[], bookings: Booking[], today: Date): Expense[] {
  const out: Expense[] = [];
  for (let m = 5; m >= 0; m--) {
    const month = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const key = isoDate(month).slice(0, 7);
    properties.forEach((prop) => {
      const revenue = bookings
        .filter((b) => b.propertyId === prop.id && b.status !== 'cancelled' && b.checkIn.slice(0, 7) === key)
        .reduce((s, b) => s + b.payout, 0);
      const fixed: Array<[ExpenseCategory, number]> = [
        ['internet', 380_000],
        ['utilities', rng.round(prop.bedrooms * 420_000 + rng.next() * 600_000, 10_000)],
        ['payroll', rng.round(prop.bedrooms * 950_000, 50_000)],
        ['laundry', rng.round(prop.bedrooms * 310_000, 10_000)],
        ['cleaning', rng.round(prop.cleaningFee * 4.5, 10_000)],
        ['tax', Math.round(revenue * 0.1)],
      ];
      if (prop.type === 'Villa') fixed.push(['ground_rent', rng.round(prop.basePrice * 2.4, 100_000)]);
      fixed.forEach(([category, amount], i) => {
        if (amount <= 0) return;
        out.push({
          id: `e${out.length}`,
          propertyId: prop.id,
          category,
          label: EXPENSE_LABELS[category][0],
          amount,
          date: isoDate(new Date(month.getFullYear(), month.getMonth(), Math.min(3 + i * 2, 27))),
          recurring: true,
          vendor: category === 'payroll' ? 'Internal' : rng.pick(['CV Bali Sejahtera', 'Anugerah Store', 'PT Sinar Jaya', 'Local vendor']),
        });
      });
      const adhoc = rng.int(0, 2);
      for (let k = 0; k < adhoc; k++) {
        const category = rng.pick(['repairs', 'supplies', 'marketing'] as ExpenseCategory[]);
        out.push({
          id: `e${out.length}`,
          propertyId: prop.id,
          category,
          label: rng.pick(EXPENSE_LABELS[category]),
          amount: rng.round(200_000 + rng.next() * 2_400_000, 25_000),
          date: isoDate(new Date(month.getFullYear(), month.getMonth(), rng.int(4, 27))),
          recurring: false,
          vendor: rng.pick(['CV Bali Sejahtera', 'Anugerah Store', 'Ujang Workshop', 'Marketplace']),
        });
      }
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

function buildDevices(rng: ReturnType<typeof makeRng>, staff: Staff[], properties: Property[], now: Date): CamDevice[] {
  const field = staff.filter((s) => s.role !== 'Supervisor');
  return field.map((s, i) => {
    const status: CamDevice['status'] = i === 2 ? 'offline' : i === 4 ? 'charging' : 'online';
    const covered = s.assignedPropertyIds.length
      ? rng.pick(s.assignedPropertyIds)
      : rng.pick(properties).id;
    return {
      id: `cam${i + 1}`,
      label: `CAM-${String(i + 1).padStart(2, '0')}`,
      model: i % 2 === 0 ? 'BodyCam X3 LTE' : 'BodyCam Lite 4G',
      staffId: s.id,
      status,
      battery: status === 'charging' ? rng.int(30, 60) : status === 'offline' ? rng.int(2, 12) : rng.int(45, 98),
      signal: status === 'offline' ? 0 : rng.int(2, 4),
      storageUsedPct: rng.int(18, 86),
      lastSeen: new Date(now.getTime() - (status === 'offline' ? rng.int(120, 700) : rng.int(1, 25)) * 60_000).toISOString(),
      propertyId: status === 'online' ? covered : null,
      firmware: `2.${rng.int(1, 9)}.${rng.int(0, 5)}`,
    };
  });
}

function buildSessions(rng: ReturnType<typeof makeRng>, devices: CamDevice[], jobs: ServiceJob[], now: Date): CamSession[] {
  const recent = jobs
    .filter((j) => j.status === 'done' || j.status === 'in_progress')
    .filter((j) => new Date(j.scheduledAt).getTime() > now.getTime() - 9 * 86400_000)
    .slice(0, 26);
  return recent.map((job, i) => {
    const device = devices.find((d) => d.staffId === job.staffId) ?? devices[i % devices.length];
    const start = new Date(new Date(job.scheduledAt).getTime() + rng.int(1, 9) * 60_000);
    const duration = job.status === 'in_progress'
      ? Math.max(3, Math.round((now.getTime() - start.getTime()) / 60_000))
      : job.durationMin + rng.int(-12, 18);
    const flagged = rng.chance(0.16);
    const events: CamSession['events'] = [
      { t: start.toISOString(), type: 'start', note: `Session started on ${device.label}` },
      { t: new Date(start.getTime() + 4 * 60_000).toISOString(), type: 'geofence', note: 'Device entered property geofence' },
      { t: new Date(start.getTime() + 18 * 60_000).toISOString(), type: 'checklist', note: 'Arrival photos verified' },
    ];
    if (flagged) events.push({ t: new Date(start.getTime() + 27 * 60_000).toISOString(), type: 'tamper', note: 'Lens covered for more than 90 seconds' });
    if (job.status === 'done') events.push({ t: new Date(start.getTime() + duration * 60_000).toISOString(), type: 'stop', note: 'Session ended, footage uploaded' });
    return {
      id: `sess${i + 1}`,
      deviceId: device.id,
      jobId: job.id,
      propertyId: job.propertyId,
      startedAt: start.toISOString(),
      durationMin: Math.max(5, duration),
      clips: rng.int(3, 11),
      flagged,
      events,
    };
  });
}

export { CHANNEL_FEE, nightsBetween };
