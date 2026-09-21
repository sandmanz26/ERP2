export type Channel = 'airbnb' | 'booking' | 'direct';

export type PropertyStatus = 'active' | 'maintenance' | 'inactive';

export interface Property {
  id: string;
  name: string;
  area: string;
  city: string;
  type: 'Villa' | 'House' | 'Townhouse' | 'Bungalow';
  bedrooms: number;
  capacity: number;
  status: PropertyStatus;
  accent: number; // categorical slot 1-8
  /** Base nightly rate (IDR) */
  basePrice: number;
  /** Weekend uplift in percent (Fri–Sat) */
  weekendUpliftPct: number;
  cleaningFee: number;
  extraGuestFee: number;
  minStay: number;
  channels: Channel[];
  /** Monthly occupancy target set by the owner (%) */
  targetOccupancy: number;
}

export interface Season {
  id: string;
  name: string;
  propertyId: string | 'all';
  startDate: string;
  endDate: string;
  /** Multiplier on the base rate, e.g. 1.35 = +35% */
  multiplier: number;
  minStay: number;
  active: boolean;
}

export type BookingStatus = 'confirmed' | 'in_stay' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  code: string;
  propertyId: string;
  guest: string;
  channel: Channel;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  /** Total the guest pays before channel commission */
  gross: number;
  channelFee: number;
  cleaningFee: number;
  /** gross - channelFee: what actually lands in the owner account */
  payout: number;
  status: BookingStatus;
}

export type ExpenseCategory =
  | 'utilities'
  | 'cleaning'
  | 'laundry'
  | 'repairs'
  | 'supplies'
  | 'payroll'
  | 'internet'
  | 'tax'
  | 'ground_rent'
  | 'marketing';

export interface Expense {
  id: string;
  propertyId: string;
  category: ExpenseCategory;
  label: string;
  amount: number;
  date: string;
  recurring: boolean;
  vendor: string;
}

export type JobType = 'cleaning' | 'laundry' | 'maintenance' | 'inspection';
export type JobStatus = 'scheduled' | 'in_progress' | 'done' | 'overdue';

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  /** step that must be backed by body-cam footage */
  camVerified?: boolean;
}

export interface ServiceJob {
  id: string;
  propertyId: string;
  type: JobType;
  staffId: string;
  scheduledAt: string;
  durationMin: number;
  status: JobStatus;
  cost: number;
  checklist: ChecklistItem[];
  note: string;
  sessionId: string | null;
}

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  rating: number;
  jobsThisMonth: number;
  /** Houses this person is responsible for — the coverage roster. */
  assignedPropertyIds: string[];
  /** Flat fee paid per completed cleaning job (IDR). */
  ratePerJob: number;
  onTimePct: number;
}

export type StaffRole = 'Cleaner' | 'Laundry' | 'Technician' | 'Supervisor';

export type DeviceStatus = 'online' | 'offline' | 'charging';

export interface CamDevice {
  id: string;
  label: string;
  model: string;
  staffId: string | null;
  status: DeviceStatus;
  battery: number;
  signal: number; // 0-4
  storageUsedPct: number;
  lastSeen: string;
  propertyId: string | null;
  firmware: string;
}

export type CamEventType = 'start' | 'stop' | 'motion' | 'offline' | 'tamper' | 'geofence' | 'checklist';

export interface CamEvent {
  t: string;
  type: CamEventType;
  note: string;
}

export interface CamSession {
  id: string;
  deviceId: string;
  jobId: string | null;
  propertyId: string;
  startedAt: string;
  durationMin: number;
  clips: number;
  flagged: boolean;
  events: CamEvent[];
}

export interface AppState {
  properties: Property[];
  seasons: Season[];
  bookings: Booking[];
  expenses: Expense[];
  jobs: ServiceJob[];
  staff: Staff[];
  devices: CamDevice[];
  sessions: CamSession[];
}
