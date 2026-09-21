import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { usePeriod } from '../App';
import { Card, CardHead, Badge, Empty, Field, Modal, StatTile } from '../components/ui';
import { GroupedBars, Legend, RankBars } from '../components/charts';
import { Icon } from '../components/Icon';
import { compactNumber, dateLabel, isoDate, rupiah } from '../lib/format';
import { expenseByCategory, expensesIn, lastMonths, monthDate, nightsSold, revenueIn } from '../lib/metrics';
import type { ExpenseCategory } from '../types';

const CATEGORIES: Array<{ key: ExpenseCategory; label: string }> = [
  { key: 'utilities', label: 'Utilities' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'laundry', label: 'Laundry' },
  { key: 'repairs', label: 'Repairs' },
  { key: 'supplies', label: 'Guest supplies' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'internet', label: 'Internet' },
  { key: 'tax', label: 'Lodging tax' },
  { key: 'ground_rent', label: 'Ground rent' },
  { key: 'marketing', label: 'Marketing' },
];

const catLabel = (k: string) => CATEGORIES.find((c) => c.key === k)?.label ?? k;

export default function Expenses() {
  const { state, addExpense, removeExpense } = useStore();
  const { month } = usePeriod();
  const [propFilter, setPropFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [adding, setAdding] = useState(false);

  const months = useMemo(() => lastMonths(6, monthDate(month)), [month]);
  const total = expensesIn(state.expenses, month, propFilter === 'all' ? undefined : propFilter);
  const revenue = revenueIn(state.bookings, month, propFilter === 'all' ? undefined : propFilter);
  const nights = nightsSold(state.bookings, month, propFilter === 'all' ? undefined : propFilter);
  const recurring = state.expenses
    .filter((e) => e.date.slice(0, 7) === month && e.recurring && (propFilter === 'all' || e.propertyId === propFilter))
    .reduce((s, e) => s + e.amount, 0);

  const breakdown = expenseByCategory(state.expenses, month, propFilter === 'all' ? undefined : propFilter);

  const trendSeries = [
    { name: 'Recurring', color: 'var(--s1)' },
    { name: 'One-off', color: 'var(--s2)' },
  ];
  const trend = months.map((m) => {
    const rows = state.expenses.filter((e) => e.date.slice(0, 7) === m && (propFilter === 'all' || e.propertyId === propFilter));
    return {
      label: monthDate(m).toLocaleDateString('id-ID', { month: 'short' }),
      values: [
        rows.filter((e) => e.recurring).reduce((s, e) => s + e.amount, 0),
        rows.filter((e) => !e.recurring).reduce((s, e) => s + e.amount, 0),
      ],
    };
  });

  const rows = state.expenses
    .filter((e) => e.date.slice(0, 7) === month)
    .filter((e) => propFilter === 'all' || e.propertyId === propFilter)
    .filter((e) => catFilter === 'all' || e.category === catFilter)
    .sort((a, b) => b.amount - a.amount);

  const perUnit = state.properties
    .map((p) => ({ label: p.name, value: expensesIn(state.expenses, month, p.id) }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <section className="grid g-4">
        <StatTile label="Total expenses" value={rupiah(total, { compact: true })} foot={`${rows.length} entries`} />
        <StatTile label="Cost ratio" value={revenue ? `${((total / revenue) * 100).toFixed(0)}%` : '—'} foot="of net revenue" />
        <StatTile label="Cost per night sold" value={nights ? rupiah(total / nights, { compact: true }) : '—'} foot={`${nights} nights sold`} />
        <StatTile label="Recurring share" value={total ? `${((recurring / total) * 100).toFixed(0)}%` : '—'} foot="the rest is one-off" />
      </section>

      <section className="grid g-main">
        <Card>
          <CardHead title="Expense trend" sub="Recurring vs one-off, last six months" />
          <div className="card-body col" style={{ gap: 12 }}>
            <Legend series={trendSeries} />
            <GroupedBars data={trend} series={trendSeries} format={(v) => compactNumber(v)} stacked height={200} />
          </div>
        </Card>
        <Card>
          <CardHead title="Largest categories" sub="Current month" />
          <div className="card-body">
            {breakdown.length === 0
              ? <Empty>No expenses in this period.</Empty>
              : <RankBars rows={breakdown.map((b) => ({ label: catLabel(b.category), value: b.amount }))} format={(v) => rupiah(v, { compact: true })} />}
          </div>
        </Card>
      </section>

      <Card>
        <CardHead title="Expenses by house" sub="Current month" />
        <div className="card-body">
          <RankBars rows={perUnit} format={(v) => rupiah(v, { compact: true })} rowHeight={26} />
        </div>
      </Card>

      <Card>
        <CardHead title="Expense log" sub={`${rows.length} rows`}>
          <select className="select" value={propFilter} onChange={(e) => setPropFilter(e.target.value)} aria-label="Filter by house">
            <option value="all">All houses</option>
            {state.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <button className="btn primary sm" onClick={() => setAdding(true)}><Icon name="plus" size={14} /> Log expense</button>
        </CardHead>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Description</th><th>House</th><th>Category</th><th>Vendor</th><th>Type</th><th className="r">Amount</th><th /></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={8}><Empty>No entries match.</Empty></td></tr>}
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="small num dim">{dateLabel(e.date)}</td>
                  <td className="strong">{e.label}</td>
                  <td className="small dim">{state.properties.find((p) => p.id === e.propertyId)?.name ?? '—'}</td>
                  <td><Badge>{catLabel(e.category)}</Badge></td>
                  <td className="small dim">{e.vendor}</td>
                  <td>{e.recurring ? <Badge tone="info">Recurring</Badge> : <Badge tone="warn">One-off</Badge>}</td>
                  <td className="r num strong">{rupiah(e.amount)}</td>
                  <td className="r">
                    <button className="btn ghost sm danger" onClick={() => removeExpense(e.id)} aria-label="Delete expense">
                      <Icon name="trash" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AddExpense open={adding} onClose={() => setAdding(false)} onSave={(e) => { addExpense(e); setAdding(false); }} />
    </>
  );
}

function AddExpense({
  open, onClose, onSave,
}: { open: boolean; onClose: () => void; onSave: (e: Parameters<ReturnType<typeof useStore>['addExpense']>[0]) => void }) {
  const { state } = useStore();
  const [propertyId, setPropertyId] = useState(state.properties[0]?.id ?? '');
  const [category, setCategory] = useState<ExpenseCategory>('repairs');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(isoDate(new Date()));
  const [vendor, setVendor] = useState('');
  const [recurring, setRecurring] = useState(false);

  const value = Number(amount.replace(/\D/g, '')) || 0;
  const valid = label.trim().length > 1 && value > 0;

  return (
    <Modal
      open={open} title="Log a new expense" onClose={onClose}
      footer={
        <>
          <button
            className="btn primary" disabled={!valid}
            onClick={() => {
              onSave({ propertyId, category, label: label.trim(), amount: value, date, vendor: vendor.trim() || 'No vendor', recurring });
              setLabel(''); setAmount(''); setVendor('');
            }}
          >Save</button>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
        </>
      }
    >
      <div className="grid g-2">
        <Field label="House">
          <select className="select" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            {state.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Description"><input className="input" value={label} placeholder="Master bedroom AC service" onChange={(e) => setLabel(e.target.value)} /></Field>
        <Field label="Amount (IDR)" hint={value ? rupiah(value) : 'digits only'}>
          <input className="input num" value={amount} placeholder="750000" onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Date"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Vendor"><input className="input" value={vendor} placeholder="Ujang Workshop" onChange={(e) => setVendor(e.target.value)} /></Field>
      </div>
      <label className="row small" style={{ marginTop: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
        Recurring monthly expense
      </label>
    </Modal>
  );
}
