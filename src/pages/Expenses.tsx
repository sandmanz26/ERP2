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
  { key: 'utilitas', label: 'Utilitas' },
  { key: 'kebersihan', label: 'Kebersihan' },
  { key: 'laundry', label: 'Laundry' },
  { key: 'perbaikan', label: 'Perbaikan' },
  { key: 'perlengkapan', label: 'Perlengkapan' },
  { key: 'gaji', label: 'Gaji' },
  { key: 'internet', label: 'Internet' },
  { key: 'pajak', label: 'Pajak' },
  { key: 'sewa_lahan', label: 'Sewa lahan' },
  { key: 'pemasaran', label: 'Pemasaran' },
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
    { name: 'Rutin', color: 'var(--s1)' },
    { name: 'Insidental', color: 'var(--s2)' },
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
        <StatTile label="Total biaya" value={rupiah(total, { compact: true })} foot={`${rows.length} catatan`} />
        <StatTile label="Rasio biaya" value={revenue ? `${((total / revenue) * 100).toFixed(0)}%` : '—'} foot="terhadap pendapatan bersih" />
        <StatTile label="Biaya per malam terjual" value={nights ? rupiah(total / nights, { compact: true }) : '—'} foot={`${nights} malam terjual`} />
        <StatTile label="Porsi biaya rutin" value={total ? `${((recurring / total) * 100).toFixed(0)}%` : '—'} foot="sisanya insidental" />
      </section>

      <section className="grid g-main">
        <Card>
          <CardHead title="Tren biaya" sub="Rutin vs insidental, enam bulan terakhir" />
          <div className="card-body col" style={{ gap: 12 }}>
            <Legend series={trendSeries} />
            <GroupedBars data={trend} series={trendSeries} format={(v) => compactNumber(v)} stacked height={200} />
          </div>
        </Card>
        <Card>
          <CardHead title="Kategori terbesar" sub="Bulan berjalan" />
          <div className="card-body">
            {breakdown.length === 0
              ? <Empty>Belum ada biaya pada periode ini.</Empty>
              : <RankBars rows={breakdown.map((b) => ({ label: catLabel(b.category), value: b.amount }))} format={(v) => rupiah(v, { compact: true })} />}
          </div>
        </Card>
      </section>

      <Card>
        <CardHead title="Biaya per unit" sub="Bulan berjalan" />
        <div className="card-body">
          <RankBars rows={perUnit} format={(v) => rupiah(v, { compact: true })} rowHeight={26} />
        </div>
      </Card>

      <Card>
        <CardHead title="Catatan biaya" sub={`${rows.length} baris`}>
          <select className="select" value={propFilter} onChange={(e) => setPropFilter(e.target.value)} aria-label="Filter unit">
            <option value="all">Semua unit</option>
            {state.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter kategori">
            <option value="all">Semua kategori</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <button className="btn primary sm" onClick={() => setAdding(true)}><Icon name="plus" size={14} /> Catat biaya</button>
        </CardHead>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Tanggal</th><th>Keterangan</th><th>Unit</th><th>Kategori</th><th>Vendor</th><th>Jenis</th><th className="r">Jumlah</th><th /></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={8}><Empty>Tidak ada catatan yang cocok.</Empty></td></tr>}
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="small num dim">{dateLabel(e.date)}</td>
                  <td className="strong">{e.label}</td>
                  <td className="small dim">{state.properties.find((p) => p.id === e.propertyId)?.name ?? '—'}</td>
                  <td><Badge>{catLabel(e.category)}</Badge></td>
                  <td className="small dim">{e.vendor}</td>
                  <td>{e.recurring ? <Badge tone="info">Rutin</Badge> : <Badge tone="warn">Insidental</Badge>}</td>
                  <td className="r num strong">{rupiah(e.amount)}</td>
                  <td className="r">
                    <button className="btn ghost sm danger" onClick={() => removeExpense(e.id)} aria-label="Hapus biaya">
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
  const [category, setCategory] = useState<ExpenseCategory>('perbaikan');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(isoDate(new Date()));
  const [vendor, setVendor] = useState('');
  const [recurring, setRecurring] = useState(false);

  const value = Number(amount.replace(/\D/g, '')) || 0;
  const valid = label.trim().length > 1 && value > 0;

  return (
    <Modal
      open={open} title="Catat biaya baru" onClose={onClose}
      footer={
        <>
          <button
            className="btn primary" disabled={!valid}
            onClick={() => {
              onSave({ propertyId, category, label: label.trim(), amount: value, date, vendor: vendor.trim() || 'Tanpa vendor', recurring });
              setLabel(''); setAmount(''); setVendor('');
            }}
          >Simpan</button>
          <button className="btn ghost" onClick={onClose}>Batal</button>
        </>
      }
    >
      <div className="grid g-2">
        <Field label="Unit">
          <select className="select" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            {state.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Kategori">
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Keterangan"><input className="input" value={label} placeholder="Servis AC kamar utama" onChange={(e) => setLabel(e.target.value)} /></Field>
        <Field label="Jumlah (Rp)" hint={value ? rupiah(value) : 'angka saja'}>
          <input className="input num" value={amount} placeholder="750000" onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Tanggal"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Vendor"><input className="input" value={vendor} placeholder="Bengkel Pak Ujang" onChange={(e) => setVendor(e.target.value)} /></Field>
      </div>
      <label className="row small" style={{ marginTop: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
        Biaya rutin bulanan
      </label>
    </Modal>
  );
}
