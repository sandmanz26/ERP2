import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { usePeriod } from '../App';
import { Card, CardHead, Badge, StatTile, Empty } from '../components/ui';
import { GroupedBars, LineTrend, RankBars, SeriesTable, TableToggle } from '../components/charts';
import { Icon } from '../components/Icon';
import { compactNumber, daysInMonth, pct, rupiah } from '../lib/format';
import {
  channelMix, expensesIn, lastMonths, monthDate, nightsSold,
  portfolioSummary, propertyPnl, revenueIn, sum,
} from '../lib/metrics';
import { downloadCsv } from '../lib/csv';

const CHANNEL_NAME: Record<string, string> = { airbnb: 'Airbnb', booking: 'Booking.com', direct: 'Direct' };

export default function Reports() {
  const { state } = useStore();
  const { month } = usePeriod();
  const [showTable, setShowTable] = useState(false);

  const months = useMemo(() => lastMonths(6, monthDate(month)), [month]);
  const summary = portfolioSummary(state, month);
  const rows = state.properties.map((p) => propertyPnl(state, p, month)).sort((a, b) => b.net - a.net);
  const mix = channelMix(state.bookings, month);
  const lostToFees = sum(mix.map((m) => m.fee));

  const netSeries = [{ name: 'Net income', color: 'var(--s1)' }];
  const netData = months.map((m) => ({
    label: monthDate(m).toLocaleDateString('id-ID', { month: 'short' }),
    values: [revenueIn(state.bookings, m) - expensesIn(state.expenses, m)],
  }));

  const adrData = months.map((m) => {
    const nights = nightsSold(state.bookings, m);
    return {
      label: monthDate(m).toLocaleDateString('id-ID', { month: 'short' }),
      values: [nights ? revenueIn(state.bookings, m) / nights : 0],
    };
  });

  const exportPnl = () =>
    downloadCsv(`pnl-by-house-${month}.csv`, rows.map((r) => ({
      house: r.property.name,
      city: r.property.city,
      nights_sold: r.nights,
      occupancy_pct: r.occupancyPct.toFixed(1),
      adr_idr: Math.round(r.adr),
      revpar_idr: Math.round(r.revpar),
      net_revenue_idr: r.revenue,
      expenses_idr: r.expense,
      net_income_idr: r.net,
      margin_pct: r.marginPct.toFixed(1),
    })));

  const exportBookings = () =>
    downloadCsv(`bookings-${month}.csv`, state.bookings
      .filter((b) => b.checkIn.slice(0, 7) === month)
      .map((b) => ({
        code: b.code,
        house: state.properties.find((p) => p.id === b.propertyId)?.name ?? '',
        guest: b.guest, channel: b.channel, check_in: b.checkIn, check_out: b.checkOut,
        nights: b.nights, gross_idr: b.gross, commission_idr: b.channelFee, payout_idr: b.payout, status: b.status,
      })));

  const exportExpenses = () =>
    downloadCsv(`expenses-${month}.csv`, state.expenses
      .filter((e) => e.date.slice(0, 7) === month)
      .map((e) => ({
        date: e.date,
        house: state.properties.find((p) => p.id === e.propertyId)?.name ?? '',
        category: e.category, description: e.label, vendor: e.vendor,
        type: e.recurring ? 'recurring' : 'one-off', amount_idr: e.amount,
      })));

  return (
    <>
      <section className="grid g-4">
        <StatTile label="Net revenue" value={rupiah(summary.revenue, { compact: true })} foot={`${summary.nights} nights sold`} />
        <StatTile label="Net income" value={rupiah(summary.net, { compact: true })} foot={`${pct(summary.marginPct)} margin`} />
        <StatTile label="Lost to commission" value={rupiah(lostToFees, { compact: true })} foot="what direct bookings would save" />
        <StatTile label="RevPAR" value={rupiah(summary.revpar, { compact: true })} foot={`${daysInMonth(monthDate(month))} days × ${state.properties.length} houses`} />
      </section>

      <section className="grid g-main">
        <Card>
          <CardHead title="Portfolio net income" sub="Last six months">
            <TableToggle open={showTable} onToggle={() => setShowTable((v) => !v)} />
          </CardHead>
          <div className="card-body col" style={{ gap: 12 }}>
            <GroupedBars data={netData} series={netSeries} format={(v) => compactNumber(v)} height={200} />
            {showTable && <SeriesTable data={netData} series={netSeries} format={(v) => rupiah(v)} />}
          </div>
        </Card>

        <Card>
          <CardHead title="Sales channels" sub="Current month" />
          <div className="card-body col" style={{ gap: 14 }}>
            {mix.length === 0 && <Empty>No bookings this month.</Empty>}
            {mix.map((m) => (
              <div className="col" key={m.channel} style={{ gap: 5 }}>
                <div className="row small">
                  <span className="strong">{CHANNEL_NAME[m.channel] ?? m.channel}</span>
                  <span className="spacer num">{rupiah(m.payout, { compact: true })}</span>
                </div>
                <div className="bar-track">
                  <span style={{ width: `${(m.payout / (mix[0]?.payout || 1)) * 100}%`, background: 'var(--s1)' }} />
                </div>
                <span className="tiny muted num">{m.count} bookings · {rupiah(m.fee, { compact: true })} commission</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid g-2">
        <Card>
          <CardHead title="Portfolio ADR" sub="Average rate per night sold" />
          <div className="card-body">
            <LineTrend data={adrData} series={[{ name: 'ADR', color: 'var(--s3)' }]} format={(v) => compactNumber(v)} height={190} />
          </div>
        </Card>
        <Card>
          <CardHead title="Occupancy by house" sub="Current month against each house’s own target" />
          <div className="card-body">
            <RankBars
              rows={rows
                .slice()
                .sort((a, b) => b.occupancyPct - a.occupancyPct)
                .map((r) => ({
                  label: r.property.name,
                  value: r.occupancyPct,
                  color: r.occupancyPct >= r.property.targetOccupancy ? 'var(--s3)' : 'var(--s4)',
                  note: `Target ${r.property.targetOccupancy}%`,
                }))}
              format={(v) => `${v.toFixed(0)}%`}
              rowHeight={26}
            />
          </div>
        </Card>
      </section>

      <Card>
        <CardHead title="Profit and loss by house" sub={monthDate(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}>
          <button className="btn sm" onClick={exportPnl}><Icon name="download" size={13} /> P&L</button>
          <button className="btn sm" onClick={exportBookings}><Icon name="download" size={13} /> Bookings</button>
          <button className="btn sm" onClick={exportExpenses}><Icon name="download" size={13} /> Expenses</button>
        </CardHead>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>House</th><th className="r">Nights</th><th className="r">Occupancy</th><th className="r">ADR</th><th className="r">RevPAR</th>
                <th className="r">Net revenue</th><th className="r">Expenses</th><th className="r">Net income</th><th className="r">Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.property.id}>
                  <td className="strong">{r.property.name}</td>
                  <td className="r num">{r.nights}</td>
                  <td className="r num">{pct(r.occupancyPct)}</td>
                  <td className="r num">{rupiah(r.adr, { compact: true })}</td>
                  <td className="r num">{rupiah(r.revpar, { compact: true })}</td>
                  <td className="r num">{rupiah(r.revenue, { compact: true })}</td>
                  <td className="r num">{rupiah(r.expense, { compact: true })}</td>
                  <td className="r num strong" style={{ color: r.net < 0 ? 'var(--critical-ink)' : undefined }}>{rupiah(r.net, { compact: true })}</td>
                  <td className="r">
                    {r.marginPct >= 40 ? <Badge tone="good">{pct(r.marginPct)}</Badge>
                      : r.marginPct >= 15 ? <Badge>{pct(r.marginPct)}</Badge>
                      : <Badge tone="crit">{pct(r.marginPct)}</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="strong">Total · {rows.length} houses</td>
                <td className="r num strong">{summary.nights}</td>
                <td className="r num strong">{pct(summary.occupancyPct)}</td>
                <td className="r num strong">{rupiah(summary.adr, { compact: true })}</td>
                <td className="r num strong">{rupiah(summary.revpar, { compact: true })}</td>
                <td className="r num strong">{rupiah(summary.revenue, { compact: true })}</td>
                <td className="r num strong">{rupiah(summary.expense, { compact: true })}</td>
                <td className="r num strong">{rupiah(summary.net, { compact: true })}</td>
                <td className="r num strong">{pct(summary.marginPct)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </>
  );
}
