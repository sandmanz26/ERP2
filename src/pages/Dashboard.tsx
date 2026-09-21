import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { usePeriod } from '../App';
import { Card, CardHead, StatTile, Badge, Empty, UnitMark, Avatar } from '../components/ui';
import { GroupedBars, LineTrend, RankBars, Legend, SeriesTable, TableToggle, Heatmap } from '../components/charts';
import { Icon } from '../components/Icon';
import { compactNumber, daysInMonth, monthShort, pct, rupiah, timeLabel } from '../lib/format';
import {
  deltaPct, expenseByCategory, lastMonths, monthDate,
  portfolioSummary, propertyPnl, revenueIn, expensesIn, nightsSold,
} from '../lib/metrics';

const JOB_LABEL: Record<string, string> = {
  cleaning: 'Cleaning', laundry: 'Laundry', maintenance: 'Repair', inspection: 'Inspection',
};

const CATEGORY_LABEL: Record<string, string> = {
  utilities: 'Utilities', cleaning: 'Cleaning', laundry: 'Laundry', repairs: 'Repairs',
  supplies: 'Supplies', payroll: 'Payroll', internet: 'Internet', tax: 'Lodging tax',
  ground_rent: 'Ground rent', marketing: 'Marketing',
};

export default function Dashboard() {
  const { state } = useStore();
  const { month } = usePeriod();
  const [showTable, setShowTable] = useState(false);

  const months = useMemo(() => lastMonths(6, monthDate(month)), [month]);
  const summary = portfolioSummary(state, month);
  const prev = portfolioSummary(state, months[months.length - 2]);

  const moneySeries = [
    { name: 'Net revenue', color: 'var(--s1)' },
    { name: 'Operating expenses', color: 'var(--s2)' },
  ];
  const moneyData = months.map((m) => ({
    label: monthShort(monthDate(m)),
    values: [revenueIn(state.bookings, m), expensesIn(state.expenses, m)],
  }));

  const occData = months.map((m) => {
    const capacity = daysInMonth(monthDate(m)) * state.properties.length;
    return {
      label: monthShort(monthDate(m)),
      values: [capacity ? (nightsSold(state.bookings, m) / capacity) * 100 : 0],
    };
  });
  const avgTarget = state.properties.reduce((s, p) => s + p.targetOccupancy, 0) / state.properties.length;

  const pnl = state.properties.map((p) => propertyPnl(state, p, month)).sort((a, b) => b.net - a.net);
  const byOccupancy = [...pnl].sort((a, b) => b.occupancyPct - a.occupancyPct);
  const topCost = expenseByCategory(state.expenses, month).slice(0, 6);

  const occHeat = useMemo(() => ({
    columns: months.map((m) => monthShort(monthDate(m))),
    rows: state.properties.map((p) => ({
      label: p.name,
      values: months.map((m) => {
        const days = daysInMonth(monthDate(m));
        return (nightsSold(state.bookings, m, p.id) / days) * 100;
      }),
    })),
  }), [state.properties, state.bookings, months]);

  const todayKey = new Date().toDateString();
  const todayJobs = state.jobs
    .filter((j) => new Date(j.scheduledAt).toDateString() === todayKey)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const alerts = useMemo(() => {
    const out: Array<{ tone: 'crit' | 'warn'; icon: 'alert' | 'video' | 'battery' | 'chart' | 'users'; text: string; to: string }> = [];
    state.properties
      .filter((p) => !state.staff.some((s) => s.role === 'Cleaner' && s.assignedPropertyIds.includes(p.id)))
      .forEach((p) => out.push({ tone: 'crit', icon: 'users', text: `${p.name} has no cleaner assigned`, to: '/team' }));
    state.jobs.filter((j) => j.status === 'overdue').forEach((j) => {
      const p = state.properties.find((x) => x.id === j.propertyId);
      out.push({ tone: 'crit', icon: 'alert', text: `${JOB_LABEL[j.type]} missed at ${p?.name ?? '-'}`, to: '/services' });
    });
    state.devices.filter((d) => d.status === 'offline').forEach((d) =>
      out.push({ tone: 'crit', icon: 'video', text: `${d.label} offline — no footage arriving`, to: '/monitoring' }));
    state.devices.filter((d) => d.status !== 'offline' && d.battery < 25).forEach((d) =>
      out.push({ tone: 'warn', icon: 'battery', text: `${d.label} battery at ${d.battery}%`, to: '/monitoring' }));
    state.sessions.filter((s) => s.flagged).slice(0, 2).forEach((s) => {
      const p = state.properties.find((x) => x.id === s.propertyId);
      out.push({ tone: 'warn', icon: 'video', text: `Camera session flagged at ${p?.name ?? '-'}`, to: '/monitoring' });
    });
    pnl.filter((r) => r.net < 0).forEach((r) =>
      out.push({ tone: 'crit', icon: 'chart', text: `${r.property.name} lost ${rupiah(Math.abs(r.net), { compact: true })} this month`, to: '/financials' }));
    pnl.filter((r) => r.net >= 0 && r.occupancyPct < r.property.targetOccupancy - 15).slice(0, 3).forEach((r) =>
      out.push({ tone: 'warn', icon: 'chart', text: `${r.property.name} at ${pct(r.occupancyPct)} occupancy vs ${r.property.targetOccupancy}% target`, to: '/pricing' }));
    return out.slice(0, 8);
  }, [state, pnl]);

  return (
    <>
      <section className="grid g-4">
        <StatTile
          label="Net revenue"
          value={rupiah(summary.revenue, { compact: true })}
          delta={deltaPct(summary.revenue, prev.revenue)}
          foot="after channel commission"
        />
        <StatTile
          label="Operating expenses"
          value={rupiah(summary.expense, { compact: true })}
          delta={deltaPct(prev.expense, summary.expense)}
          foot="recurring + one-off"
        />
        <StatTile
          label="Net income"
          value={rupiah(summary.net, { compact: true })}
          delta={deltaPct(summary.net, prev.net)}
          foot={`${pct(summary.marginPct)} margin`}
          accent={summary.net < 0 ? 'var(--critical-ink)' : undefined}
        />
        <StatTile
          label="Portfolio occupancy"
          value={pct(summary.occupancyPct)}
          delta={deltaPct(summary.occupancyPct, prev.occupancyPct)}
          foot={`ADR ${rupiah(summary.adr, { compact: true })} · RevPAR ${rupiah(summary.revpar, { compact: true })}`}
        />
      </section>

      <section className="grid g-main">
        <Card>
          <CardHead title="Occupancy by house" sub="This month against each house's own target">
            <Link className="btn ghost sm" to="/reports">Performance</Link>
          </CardHead>
          <div className="card-body col" style={{ gap: 12 }}>
            <RankBars
              rows={byOccupancy.map((r) => ({
                label: r.property.name,
                value: r.occupancyPct,
                color: r.occupancyPct >= r.property.targetOccupancy ? 'var(--s3)' : 'var(--s4)',
                note: `Target ${r.property.targetOccupancy}% · ${r.nights} nights`,
              }))}
              format={(v) => `${v.toFixed(0)}%`}
              rowHeight={27}
            />
            <div className="legend">
              <span className="legend-item"><i className="swatch" style={{ background: 'var(--s3)' }} /> at or above target</span>
              <span className="legend-item"><i className="swatch" style={{ background: 'var(--s4)' }} /> below target</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead title="Needs attention" sub={`${alerts.length} items`} />
          <div className="list">
            {alerts.length === 0 && <Empty>Nothing open. Every house is clear.</Empty>}
            {alerts.map((a, i) => (
              <Link to={a.to} key={i} className="list-item clickable">
                <Badge tone={a.tone} icon={a.icon}>{a.tone === 'crit' ? 'Critical' : 'Watch'}</Badge>
                <span className="small truncate">{a.text}</span>
                <Icon name="chevron" size={14} className="spacer muted" />
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <CardHead title="Occupancy trail" sub="Each house across the last six months, in percent of nights sold" />
        <div className="card-body" style={{ ['--heat-cols' as string]: occHeat.columns.length }}>
          <Heatmap
            rows={occHeat.rows}
            columns={occHeat.columns}
            format={(v) => `${v.toFixed(0)}`}
            unit="Occupancy %"
          />
        </div>
      </Card>

      <section className="grid g-main">
        <Card>
          <CardHead title="Revenue vs expenses" sub="Last six months, all houses">
            <TableToggle open={showTable} onToggle={() => setShowTable((v) => !v)} />
          </CardHead>
          <div className="card-body col" style={{ gap: 12 }}>
            <Legend series={moneySeries} />
            <GroupedBars data={moneyData} series={moneySeries} format={(v) => compactNumber(v)} />
            {showTable && <SeriesTable data={moneyData} series={moneySeries} format={(v) => rupiah(v)} />}
          </div>
        </Card>

        <Card>
          <CardHead title="Today's schedule" sub={`${todayJobs.length} field jobs`}>
            <Link className="btn ghost sm" to="/services">Open board</Link>
          </CardHead>
          <div className="list">
            {todayJobs.length === 0 && <Empty>Nothing scheduled today.</Empty>}
            {todayJobs.slice(0, 7).map((j) => {
              const p = state.properties.find((x) => x.id === j.propertyId);
              const s = state.staff.find((x) => x.id === j.staffId);
              return (
                <div className="list-item" key={j.id}>
                  <span className="small num muted" style={{ width: 52 }}>{timeLabel(j.scheduledAt)}</span>
                  <div className="col" style={{ gap: 0, minWidth: 0 }}>
                    <span className="small strong truncate">{JOB_LABEL[j.type]} · {p?.name}</span>
                    <span className="tiny muted truncate">{s?.name ?? 'Unassigned'}</span>
                  </div>
                  <span className="spacer">
                    {j.status === 'done' ? <Badge tone="good">Done</Badge>
                      : j.status === 'in_progress' ? <Badge tone="info">Running</Badge>
                      : j.status === 'overdue' ? <Badge tone="crit">Missed</Badge>
                      : <Badge>Scheduled</Badge>}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="grid g-main">
        <Card>
          <CardHead title="Portfolio occupancy trend" sub="Share of available nights sold" />
          <div className="card-body">
            <LineTrend
              data={occData}
              series={[{ name: 'Occupancy', color: 'var(--s1)' }]}
              format={(v) => `${Math.round(v)}%`}
              targetLine={{ value: avgTarget, label: `avg target ${Math.round(avgTarget)}%` }}
            />
          </div>
        </Card>

        <Card>
          <CardHead title="Where the money goes" sub="Largest categories this month">
            <Link className="btn ghost sm" to="/expenses">Detail</Link>
          </CardHead>
          <div className="card-body">
            <RankBars
              rows={topCost.map((c) => ({ label: CATEGORY_LABEL[c.category] ?? c.category, value: c.amount, note: 'Total spend' }))}
              format={(v) => rupiah(v, { compact: true })}
              rowHeight={26}
            />
          </div>
        </Card>
      </section>

      <Card>
        <CardHead title="House performance" sub={monthDate(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}>
          <Link className="btn ghost sm" to="/properties">All houses</Link>
        </CardHead>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>House</th><th>Location</th><th>Cleaner</th><th className="r">Occupancy</th><th className="r">ADR</th>
                <th className="r">Net revenue</th><th className="r">Expenses</th><th className="r">Net income</th><th className="r">Margin</th>
              </tr>
            </thead>
            <tbody>
              {pnl.map((r) => {
                const cleaners = state.staff.filter((s) => s.role === 'Cleaner' && s.assignedPropertyIds.includes(r.property.id));
                return (
                  <tr key={r.property.id}>
                    <td>
                      <span className="row" style={{ gap: 9 }}>
                        <UnitMark name={r.property.name} accent={r.property.accent} />
                        <span className="col" style={{ gap: 0 }}>
                          <span className="strong">{r.property.name}</span>
                          <span className="tiny muted">{r.property.bedrooms} bd · {r.bookings} bookings</span>
                        </span>
                      </span>
                    </td>
                    <td className="small dim">{r.property.area}, {r.property.city}</td>
                    <td className="small">
                      {cleaners.length
                        ? cleaners.map((c) => c.name).join(', ')
                        : <Badge tone="crit" icon="alert">Unassigned</Badge>}
                    </td>
                    <td className="r num">{pct(r.occupancyPct)}</td>
                    <td className="r num">{rupiah(r.adr, { compact: true })}</td>
                    <td className="r num">{rupiah(r.revenue, { compact: true })}</td>
                    <td className="r num">{rupiah(r.expense, { compact: true })}</td>
                    <td className="r num strong" style={{ color: r.net < 0 ? 'var(--critical-ink)' : undefined }}>
                      {rupiah(r.net, { compact: true })}
                    </td>
                    <td className="r">
                      {r.marginPct >= 40 ? <Badge tone="good">{pct(r.marginPct)}</Badge>
                        : r.marginPct >= 15 ? <Badge>{pct(r.marginPct)}</Badge>
                        : <Badge tone="crit">{pct(r.marginPct)}</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="Field team" sub="Workload this month">
          <Link className="btn ghost sm" to="/team">Manage coverage</Link>
        </CardHead>
        <div className="grid g-4 card-body">
          {state.staff.map((s) => {
            const device = state.devices.find((d) => d.staffId === s.id);
            return (
              <div className="row" key={s.id} style={{ gap: 10 }}>
                <Avatar name={s.name} />
                <div className="col" style={{ gap: 0, minWidth: 0 }}>
                  <span className="small strong truncate">{s.name}</span>
                  <span className="tiny muted truncate">
                    {s.role} · {s.assignedPropertyIds.length} houses · {s.jobsThisMonth} jobs{device ? ` · ${device.label}` : ''}
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

export { CATEGORY_LABEL, JOB_LABEL };
