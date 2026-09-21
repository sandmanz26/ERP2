export type Channel = 'airbnb' | 'booking' | 'direct';

export type PropertyStatus = 'active' | 'maintenance' | 'inactive';

export interface Property {
  id: string;
  name: string;
  area: string;
  city: string;
  type: 'Villa' | 'Rumah' | 'Townhouse' | 'Bungalow';
  bedrooms: number;
  capacity: number;
  status: PropertyStatus;
  accent: number; // categorical slot 1-8
  /** Harga dasar per malam (IDR) */
  basePrice: number;
  /** Persentase kenaikan akhir pekan (Jum-Sab) */
  weekendUpliftPct: number;
  cleaningFee: number;
  extraGuestFee: number;
  minStay: number;
  channels: Channel[];
  /** Target okupansi bulanan yang dipatok owner (%) */
  targetOccupancy: number;
}

export interface Season {
  id: string;
  name: string;
  propertyId: string | 'all';
  startDate: string;
  endDate: string;
  /** Pengali terhadap harga dasar, mis. 1.35 = +35% */
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
  /** Total yang dibayar tamu sebelum potongan kanal */
  gross: number;
  channelFee: number;
  cleaningFee: number;
  /** gross - channelFee, yang benar-benar masuk ke rekening owner */
  payout: number;
  status: BookingStatus;
}

export type ExpenseCategory =
  | 'utilitas'
  | 'kebersihan'
  | 'laundry'
  | 'perbaikan'
  | 'perlengkapan'
  | 'gaji'
  | 'internet'
  | 'pajak'
  | 'sewa_lahan'
  | 'pemasaran';

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
  /** menandai langkah yang wajib diverifikasi lewat body cam */
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
  role: 'Cleaning' | 'Laundry' | 'Teknisi' | 'Supervisor';
  phone: string;
  rating: number;
  jobsThisMonth: number;
}

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
