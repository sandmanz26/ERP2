const LOCALE = 'en-US';

export function rupiah(v: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact) return 'Rp' + compactNumber(v);
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'IDR',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(Math.round(v));
}

export function compactNumber(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return sign + trim(abs / 1_000_000_000) + 'B';
  if (abs >= 1_000_000) return sign + trim(abs / 1_000_000) + 'M';
  if (abs >= 1_000) return sign + trim(abs / 1_000) + 'K';
  return sign + String(Math.round(abs));
}

function trim(v: number): string {
  return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2).replace(/0$/, '');
}

export function pct(v: number, digits = 0): string {
  return `${v.toFixed(digits)}%`;
}

export function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
}

export function dateLong(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

export function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { month: 'short', year: '2-digit' });
}

export function monthName(d: Date, style: 'short' | 'long' = 'long'): string {
  return d.toLocaleDateString(LOCALE, { month: style, year: 'numeric' });
}

export function monthShort(d: Date): string {
  return d.toLocaleDateString(LOCALE, { month: 'short' });
}

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = Math.round((new Date(iso).getTime() - now) / 60000);
  const abs = Math.abs(diff);
  if (abs < 1) return 'just now';
  if (abs < 60) return diff < 0 ? `${abs} min ago` : `in ${abs} min`;
  const h = Math.round(abs / 60);
  if (h < 24) return diff < 0 ? `${h} h ago` : `in ${h} h`;
  const d = Math.round(h / 24);
  return diff < 0 ? `${d} d ago` : `in ${d} d`;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function nightsBetween(a: string, b: string): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}
