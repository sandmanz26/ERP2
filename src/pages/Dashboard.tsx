import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { usePeriod } from '../App';
import { Card, CardHead, StatTile, Badge, Empty, UnitMark, Avatar } from '../components/ui';
import { GroupedBars, LineTrend, RankBars, Legend, SeriesTable, TableToggle } from '../components/charts';
import { Icon } from '../components/Icon';
import { compactNumber, pct, rupiah, timeLabel } from '../lib/format';
import {
  deltaPct, expenseByCategory, lastMonths, monthDate, monthKeyOf,
  portfolioSummary, propertyPnl, revenueIn, expensesIn, nightsSold,
} from '../lib/metrics';
import { daysInMonth } from '../lib/format';

const JOB_LABEL: Record<string, string> = {
  cleaning: 'Cleaning', laundry: 'Laundry', maintenance: 'Perbaikan', inspection: 'Inspeksi',
};

export default function Dashboard() {
  const { state } = useStore();
  const { month } = usePeriod();
  const [showTable, setShowTable] = useState(false);

  const months = useMemo(() => lastMonths(6, monthDate(month)), [month]);
  const summary = portfolioSummary(state, month);
  const prevKey = months[months.length - 2];
  const prev = portfolioSummary(state, prevKey);

  const moneySeries = [
    { name: 'Pendapatan bersih', color: 'var(--s1)' },
    { name: 'Biaya operasional', color: 'var(--s2)' },
  ];
  const moneyData = months.map((m) => ({
    label: monthDate(m).toLocaleDateString('id-ID', { month: 'short' }),
    values: [revenueIn(state.bookings, m), expensesIn(state.expenses, m)],
  }));

  const occData = months.map((m) => {
    const capacity = daysInMonth(monthDate(m)) * state.properties.length;
    return {
      label: monthDate(m).toLocaleDateString('id-ID', { month: 'short' }),
      values: [capacity ? (nightsSold(state.bookings, m) / capacity) * 100 : 0],
    };
  });
  const avgTarget = state.properties.reduce((s, p) => s + p.targetOccupancy, 0) / state.properties.length;

  const pnl = state.properties.map((p) => propertyPnl(state, p, month)).sort((a, b) => b.net - a.net);
  const topCost = expenseByCategory(state.expenses, month).slice(0, 6);

  const todayKey = new Date().toDateString();
  const todayJobs = state.jobs
    .filter((j) => new Date(j.scheduledAt).toDateString() === todayKey)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const alerts = useMemo(() => {
    const out: Array<{ tone: 'crit' | 'warn' | 'info'; icon: 'alert' | 'video' | 'battery' | 'chart'; text: string; to: string }> = [];
    state.jobs.filter((j) => j.status === 'overdue').forEach((j) => {
      const p = state.properties.find((x) => x.id === j.propertyId);
      out.push({ tone: 'crit', icon: 'alert', text: `${JOB_LABEL[j.type]} terlewat di ${p?.name ?? '-'}`, to: '/services' });
    });
    state.devices.filter((d) => d.status === 'offline').forEach((d) =>
      out.push({ tone: 'crit', icon: 'video', text: `${d.label} offline — tidak ada rekaman masuk`, to: '/monitoring' }));
    state.devices.filter((d) => d.status !== 'offline' && d.battery < 25).forEach((d) =>
      out.push({ tone: 'warn', icon: 'battery', text: `Baterai ${d.label} tinggal ${d.battery}%`, to: '/monitoring' }));
    state.sessions.filter((s) => s.flagged).slice(0, 2).forEach((s) => {
      const p = state.properties.find((x) => x.id === s.propertyId);
      out.push({ tone: 'warn', icon: 'video', text: `Sesi kamera ditandai di ${p?.name ?? '-'}`, to: '/monitoring' });
    });
    pnl.filter((r) => r.net < 0).forEach((r) =>
      out.push({ tone: 'crit', icon: 'chart', text: `${r.property.name} rugi ${rupiah(Math.abs(r.net), { compact: true })} bulan ini`, to: '/reports' }));
    pnl.filter((r) => r.net >= 0 && r.occupancyPct < r.property.targetOccupancy - 15).slice(0, 3).forEach((r) =>
      out.push({ tone: 'warn', icon: 'chart', text: `Okupansi ${r.property.name} ${pct(r.occupancyPct)} di bawah target ${r.property.targetOccupancy}%`, to: '/pricing' }));
    return out.slice(0, 8);
  }, [state, pnl]);

  return (
    <>
      <section className="grid g-4">
        <StatTile
          label="Pendapatan bersih"
          value={rupiah(summary.revenue, { compact: true })}
          delta={deltaPct(summary.revenue, prev.revenue)}
          foot="setelah komisi kanal"
        />
        <StatTile
          label="Biaya operasional"
          value={rupiah(summary.expense, { compact: true })}
          delta={deltaPct(prev.expense, summary.expense)}
          foot="rutin + insidental"
        />
        <StatTile
          label="Laba bersih"
          value={rupiah(summary.net, { compact: true })}
          delta={deltaPct(summary.net, prev.net)}
          foot={`margin ${pct(summary.marginPct)}`}
          accent={summary.net < 0 ? 'var(--critical-ink)' : undefined}
        />
        <StatTile
          label="Okupansi portofolio"
          value={pct(summary.occupancyPct)}
          delta={deltaPct(summary.occupancyPct, prev.occupancyPct)}
          foot={`ADR ${rupiah(summary.adr, { compact: true })} · RevPAR ${rupiah(summary.revpar, { compact: true })}`}
        />
      </section>

      <section className="grid g-main">
        <Card>
          <CardHead title="Pendapatan vs biaya" sub="Enam bulan terakhir, seluruh unit">
            <TableToggle open={showTable} onToggle={() => setShowTable((v) => !v)} />
          </CardHead>
          <div className="card-body col" style={{ gap: 12 }}>
            <Legend series={moneySeries} />
            <GroupedBars data={moneyData} series={moneySeries} format={(v) => compactNumber(v)} />
            {showTable && <SeriesTable data={moneyData} series={moneySeries} format={(v) => rupiah(v)} />}
          </div>
        </Card>

        <Card>
          <CardHead title="Perlu perhatian" sub={`${alerts.length} item`} />
          <div className="list">
            {alerts.length === 0 && <Empty>Tidak ada isu terbuka. Semua unit aman.</Empty>}
            {alerts.map((a, i) => (
              <Link to={a.to} key={i} className="list-item clickable">
                <Badge tone={a.tone} icon={a.icon}>{a.tone === 'crit' ? 'Kritis' : 'Perhatian'}</Badge>
                <span className="small truncate">{a.text}</span>
                <Icon name="chevron" size={14} className="spacer muted" />
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid g-main">
        <Card>
          <CardHead title="Okupansi bulanan" sub="Persentase malam terjual dari total malam tersedia" />
          <div className="card-body">
            <LineTrend
              data={occData}
              series={[{ name: 'Okupansi', color: 'var(--s1)' }]}
              format={(v) => `${Math.round(v)}%`}
              targetLine={{ value: avgTarget, label: `target rata-rata ${Math.round(avgTarget)}%` }}
            />
          </div>
        </Card>

        <Card>
          <CardHead title="Jadwal hari ini" sub={`${todayJobs.length} pekerjaan lapangan`}>
            <Link className="btn ghost sm" to="/services">Buka papan</Link>
          </CardHead>
          <div className="list">
            {todayJobs.length === 0 && <Empty>Tidak ada jadwal hari ini.</Empty>}
            {todayJobs.slice(0, 6).map((j) => {
              const p = state.properties.find((x) => x.id === j.propertyId);
              const s = state.staff.find((x) => x.id === j.staffId);
              return (
                <div className="list-item" key={j.id}>
                  <span className="small num muted" style={{ width: 42 }}>{timeLabel(j.scheduledAt)}</span>
                  <div className="col" style={{ gap: 0, minWidth: 0 }}>
                    <span className="small strong truncate">{JOB_LABEL[j.type]} · {p?.name}</span>
                    <span className="tiny muted truncate">{s?.name}</span>
                  </div>
                  <span className="spacer">
                    {j.status === 'done' ? <Badge tone="good">Selesai</Badge>
                      : j.status === 'in_progress' ? <Badge tone="info">Berjalan</Badge>
                      : j.status === 'overdue' ? <Badge tone="crit">Terlewat</Badge>
                      : <Badge>Terjadwal</Badge>}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="grid g-2">
        <Card>
          <CardHead title="Laba bersih per unit" sub="Bulan berjalan — merah berarti unit membakar uang" />
          <div className="card-body">
            <RankBars
              rows={pnl.map((r) => ({ label: r.property.name, value: r.net, note: 'Laba bersih' }))}
              format={(v) => rupiah(v, { compact: true })}
              diverging
            />
          </div>
        </Card>

        <Card>
          <CardHead title="Ke mana biaya pergi" sub="Kategori terbesar bulan ini">
            <Link className="btn ghost sm" to="/expenses">Rincian</Link>
          </CardHead>
          <div className="card-body">
            <RankBars
              rows={topCost.map((c) => ({ label: labelize(c.category), value: c.amount, note: 'Total biaya' }))}
              format={(v) => rupiah(v, { compact: true })}
            />
          </div>
        </Card>
      </section>

      <Card>
        <CardHead title="Performa unit" sub={monthDate(month).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}>
          <Link className="btn ghost sm" to="/properties">Semua properti</Link>
        </CardHead>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Unit</th><th>Lokasi</th><th className="r">Okupansi</th><th className="r">ADR</th>
                <th className="r">Pendapatan</th><th className="r">Biaya</th><th className="r">Laba bersih</th><th className="r">Margin</th>
              </tr>
            </thead>
            <tbody>
              {pnl.map((r) => (
                <tr key={r.property.id}>
                  <td>
                    <span className="row" style={{ gap: 9 }}>
                      <UnitMark name={r.property.name} accent={r.property.accent} />
                      <span className="col" style={{ gap: 0 }}>
                        <span className="strong">{r.property.name}</span>
                        <span className="tiny muted">{r.property.bedrooms} kamar · {r.bookings} booking</span>
                      </span>
                    </span>
                  </td>
                  <td className="small dim">{r.property.area}, {r.property.city}</td>
                  <td className="r">{pct(r.occupancyPct)}</td>
                  <td className="r">{rupiah(r.adr, { compact: true })}</td>
                  <td className="r">{rupiah(r.revenue, { compact: true })}</td>
                  <td className="r">{rupiah(r.expense, { compact: true })}</td>
                  <td className="r strong" style={{ color: r.net < 0 ? 'var(--critical-ink)' : undefined }}>
                    {rupiah(r.net, { compact: true })}
                  </td>
                  <td className="r">
                    {r.marginPct >= 40 ? <Badge tone="good">{pct(r.marginPct)}</Badge>
                      : r.marginPct >= 15 ? <Badge>{pct(r.marginPct)}</Badge>
                      : <Badge tone="crit">{pct(r.marginPct)}</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="Tim lapangan" sub="Beban kerja bulan ini" />
        <div className="grid g-4 card-body">
          {state.staff.map((s) => {
            const device = state.devices.find((d) => d.staffId === s.id);
            return (
              <div className="row" key={s.id} style={{ gap: 10 }}>
                <Avatar name={s.name} />
                <div className="col" style={{ gap: 0, minWidth: 0 }}>
                  <span className="small strong truncate">{s.name}</span>
                  <span className="tiny muted truncate">
                    {s.role} · {s.jobsThisMonth} tugas{device ? ` · ${device.label}` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

export function labelize(key: string): string {
  return key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

export { monthKeyOf };
