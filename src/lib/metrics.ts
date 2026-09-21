import type { AppState, Booking, Expense, ExpenseCategory, Property } from '../types';
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

/** Nights sold in a month — counted night by night, not per booking. */
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

/* ------------------------------------------------------------------
   Financial statement
   A real P&L rather than a pile of totals: gross booking value down to
   net income, with operating costs grouped the way an owner reads them.
   ------------------------------------------------------------------ */


export const EXPENSE_GROUP: Record<ExpenseCategory, 'direct' | 'staff' | 'property' | 'marketing' | 'tax'> = {
  cleaning: 'direct',
  laundry: 'direct',
  supplies: 'direct',
  utilities: 'direct',
  payroll: 'staff',
  ground_rent: 'property',
  internet: 'property',
  repairs: 'property',
  marketing: 'marketing',
  tax: 'tax',
};

export interface StatementLine {
  key: string;
  label: string;
  amount: number;
  kind: 'revenue' | 'deduction' | 'expense' | 'subtotal' | 'total';
  indent?: boolean;
}

export interface IncomeStatement {
  roomRevenue: number;
  cleaningFees: number;
  grossBookingValue: number;
  channelCommission: number;
  netRevenue: number;
  byCategory: Array<{ category: ExpenseCategory; amount: number }>;
  direct: number;
  staff: number;
  propertyCost: number;
  marketing: number;
  operatingExpenses: number;
  operatingIncome: number;
  tax: number;
  netIncome: number;
  netMarginPct: number;
  nights: number;
}

export function incomeStatement(state: AppState, key: MonthKey, propertyId?: string): IncomeStatement {
  const booked = state.bookings.filter(
    (b) => b.status !== 'cancelled' && b.checkIn.slice(0, 7) === key && (!propertyId || b.propertyId === propertyId),
  );
  const cleaningFees = sum(booked.map((b) => b.cleaningFee));
  const grossBookingValue = sum(booked.map((b) => b.gross));
  const channelCommission = sum(booked.map((b) => b.channelFee));
  const roomRevenue = grossBookingValue - cleaningFees;
  const netRevenue = grossBookingValue - channelCommission;

  const rows = expenseByCategory(state.expenses, key, propertyId) as Array<{ category: ExpenseCategory; amount: number }>;
  const group = (g: string) => sum(rows.filter((r) => EXPENSE_GROUP[r.category] === g).map((r) => r.amount));

  const direct = group('direct');
  const staff = group('staff');
  const propertyCost = group('property');
  const marketing = group('marketing');
  const tax = group('tax');
  const operatingExpenses = direct + staff + propertyCost + marketing;
  const operatingIncome = netRevenue - operatingExpenses;
  const netIncome = operatingIncome - tax;

  return {
    roomRevenue,
    cleaningFees,
    grossBookingValue,
    channelCommission,
    netRevenue,
    byCategory: rows,
    direct,
    staff,
    propertyCost,
    marketing,
    operatingExpenses,
    operatingIncome,
    tax,
    netIncome,
    netMarginPct: netRevenue > 0 ? (netIncome / netRevenue) * 100 : 0,
    nights: nightsSold(state.bookings, key, propertyId),
  };
}

export function statementLines(s: IncomeStatement): StatementLine[] {
  const cat = (c: ExpenseCategory) => s.byCategory.find((r) => r.category === c)?.amount ?? 0;
  return [
    { key: 'room', label: 'Room revenue', amount: s.roomRevenue, kind: 'revenue', indent: true },
    { key: 'fees', label: 'Cleaning fees charged', amount: s.cleaningFees, kind: 'revenue', indent: true },
    { key: 'gbv', label: 'Gross booking value', amount: s.grossBookingValue, kind: 'subtotal' },
    { key: 'comm', label: 'Channel commission', amount: -s.channelCommission, kind: 'deduction', indent: true },
    { key: 'net', label: 'Net revenue', amount: s.netRevenue, kind: 'subtotal' },
    { key: 'g-direct', label: 'Direct operating cost', amount: -s.direct, kind: 'expense' },
    { key: 'cleaning', label: 'Cleaning crew', amount: -cat('cleaning'), kind: 'expense', indent: true },
    { key: 'laundry', label: 'Laundry', amount: -cat('laundry'), kind: 'expense', indent: true },
    { key: 'supplies', label: 'Guest supplies', amount: -cat('supplies'), kind: 'expense', indent: true },
    { key: 'utilities', label: 'Utilities', amount: -cat('utilities'), kind: 'expense', indent: true },
    { key: 'g-staff', label: 'Payroll', amount: -s.staff, kind: 'expense' },
    { key: 'g-prop', label: 'Property cost', amount: -s.propertyCost, kind: 'expense' },
    { key: 'rent', label: 'Ground rent', amount: -cat('ground_rent'), kind: 'expense', indent: true },
    { key: 'internet', label: 'Internet', amount: -cat('internet'), kind: 'expense', indent: true },
    { key: 'repairs', label: 'Repairs', amount: -cat('repairs'), kind: 'expense', indent: true },
    { key: 'g-mkt', label: 'Marketing', amount: -s.marketing, kind: 'expense' },
    { key: 'opex', label: 'Total operating expenses', amount: -s.operatingExpenses, kind: 'subtotal' },
    { key: 'opinc', label: 'Operating income', amount: s.operatingIncome, kind: 'subtotal' },
    { key: 'tax', label: 'Local lodging tax', amount: -s.tax, kind: 'deduction', indent: true },
    { key: 'netinc', label: 'Net income', amount: s.netIncome, kind: 'total' },
  ];
}
