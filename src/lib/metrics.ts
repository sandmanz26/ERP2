import type { AppState, Booking, Expense, Property } from '../types';
import { daysInMonth } from './format';

export type MonthKey = string; // 'YYYY-MM'

export function monthKeyOf(d: Date): MonthKey {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function lastMonths(n: number, from = new Date()): MonthKey[] {
  const out: MonthKey[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(monthKeyOf(new Date(from.getFullYear(), from.getMonth() - i, 1)));
  return out;
}

export function monthDate(key: MonthKey): Date {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

/** Malam terjual pada bulan tertentu — dihitung per malam, bukan per booking. */
export function nightsSold(bookings: Booking[], key: MonthKey, propertyId?: string): number {
  let n = 0;
  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    if (propertyId && b.propertyId !== propertyId) continue;
    const start = new Date(b.checkIn);
    for (let i = 0; i < b.nights; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (monthKeyOf(d) === key) n++;
    }
  }
  return n;
}

export function revenueIn(bookings: Booking[], key: MonthKey, propertyId?: string): number {
  return bookings
    .filter((b) => b.status !== 'cancelled' && b.checkIn.slice(0, 7) === key && (!propertyId || b.propertyId === propertyId))
    .reduce((s, b) => s + b.payout, 0);
}

export function expensesIn(expenses: Expense[], key: MonthKey, propertyId?: string): number {
  return expenses
    .filter((e) => e.date.slice(0, 7) === key && (!propertyId || e.propertyId === propertyId))
    .reduce((s, e) => s + e.amount, 0);
}

export interface PropertyPnl {
  property: Property;
  revenue: number;
  expense: number;
  net: number;
  marginPct: number;
  nights: number;
  occupancyPct: number;
  adr: number;
  revpar: number;
  bookings: number;
}

export function propertyPnl(state: AppState, property: Property, key: MonthKey): PropertyPnl {
  const revenue = revenueIn(state.bookings, key, property.id);
  const expense = expensesIn(state.expenses, key, property.id);
  const nights = nightsSold(state.bookings, key, property.id);
  const days = daysInMonth(monthDate(key));
  const count = state.bookings.filter(
    (b) => b.propertyId === property.id && b.status !== 'cancelled' && b.checkIn.slice(0, 7) === key,
  ).length;
  const net = revenue - expense;
  return {
    property,
    revenue,
    expense,
    net,
    marginPct: revenue > 0 ? (net / revenue) * 100 : 0,
    nights,
    occupancyPct: (nights / days) * 100,
    adr: nights > 0 ? revenue / nights : 0,
    revpar: revenue / days,
    bookings: count,
  };
}

export interface PortfolioSummary {
  revenue: number;
  expense: number;
  net: number;
  marginPct: number;
  occupancyPct: number;
  adr: number;
  revpar: number;
  nights: number;
  activeUnits: number;
}

export function portfolioSummary(state: AppState, key: MonthKey): PortfolioSummary {
  const rows = state.properties.map((p) => propertyPnl(state, p, key));
  const revenue = sum(rows.map((r) => r.revenue));
  const expense = sum(rows.map((r) => r.expense));
  const nights = sum(rows.map((r) => r.nights));
  const days = daysInMonth(monthDate(key));
  const capacity = days * state.properties.length;
  return {
    revenue,
    expense,
    net: revenue - expense,
    marginPct: revenue > 0 ? ((revenue - expense) / revenue) * 100 : 0,
    occupancyPct: capacity > 0 ? (nights / capacity) * 100 : 0,
    adr: nights > 0 ? revenue / nights : 0,
    revpar: capacity > 0 ? revenue / capacity : 0,
    nights,
    activeUnits: state.properties.filter((p) => p.status === 'active').length,
  };
}

export function expenseByCategory(expenses: Expense[], key: MonthKey, propertyId?: string) {
  const map = new Map<string, number>();
  expenses
    .filter((e) => e.date.slice(0, 7) === key && (!propertyId || e.propertyId === propertyId))
    .forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function channelMix(bookings: Booking[], key: MonthKey) {
  const map = new Map<string, { payout: number; fee: number; count: number }>();
  bookings
    .filter((b) => b.status !== 'cancelled' && b.checkIn.slice(0, 7) === key)
    .forEach((b) => {
      const cur = map.get(b.channel) ?? { payout: 0, fee: 0, count: 0 };
      cur.payout += b.payout;
      cur.fee += b.channelFee;
      cur.count += 1;
      map.set(b.channel, cur);
    });
  return [...map.entries()].map(([channel, v]) => ({ channel, ...v })).sort((a, b) => b.payout - a.payout);
}

export function sum(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0);
}

export function deltaPct(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
