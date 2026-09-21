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

  const netSeries = [{ name: 'Laba bersih', color: 'var(--s1)' }];
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
    downloadCsv(`laba-rugi-${month}.csv`, rows.map((r) => ({
      unit: r.property.name,
      kota: r.property.city,
      malam_terjual: r.nights,
      okupansi_persen: r.occupancyPct.toFixed(1),
      adr: Math.round(r.adr),
      revpar: Math.round(r.revpar),
      pendapatan_bersih: r.revenue,
      biaya: r.expense,
      laba_bersih: r.net,
      margin_persen: r.marginPct.toFixed(1),
    })));

  const exportBookings = () =>
    downloadCsv(`booking-${month}.csv`, state.bookings
      .filter((b) => b.checkIn.slice(0, 7) === month)
      .map((b) => ({
        kode: b.code,
        unit: state.properties.find((p) => p.id === b.propertyId)?.name ?? '',
        tamu: b.guest, kanal: b.channel, check_in: b.checkIn, check_out: b.checkOut,
        malam: b.nights, bruto: b.gross, komisi: b.channelFee, payout: b.payout, status: b.status,
      })));

  const exportExpenses = () =>
    downloadCsv(`biaya-${month}.csv`, state.expenses
      .filter((e) => e.date.slice(0, 7) === month)
      .map((e) => ({
        tanggal: e.date,
        unit: state.properties.find((p) => p.id === e.propertyId)?.name ?? '',
        kategori: e.category, keterangan: e.label, vendor: e.vendor,
        jenis: e.recurring ? 'rutin' : 'insidental', jumlah: e.amount,
      })));

  return (
    <>
      <section className="grid g-4">
        <StatTile label="Pendapatan bersih" value={rupiah(summary.revenue, { compact: true })} foot={`${summary.nights} malam terjual`} />
        <StatTile label="Laba bersih" value={rupiah(summary.net, { compact: true })} foot={`margin ${pct(summary.marginPct)}`} />
        <StatTile label="Hilang ke komisi" value={rupiah(lostToFees, { compact: true })} foot="potensi hemat lewat direct booking" />
        <StatTile label="RevPAR" value={rupiah(summary.revpar, { compact: true })} foot={`${daysInMonth(monthDate(month))} hari × ${state.properties.length} unit`} />
      </section>

      <section className="grid g-main">
        <Card>
          <CardHead title="Laba bersih portofolio" sub="Enam bulan terakhir">
            <TableToggle open={showTable} onToggle={() => setShowTable((v) => !v)} />
          </CardHead>
          <div className="card-body col" style={{ gap: 12 }}>
            <GroupedBars data={netData} series={netSeries} format={(v) => compactNumber(v)} height={200} />
            {showTable && <SeriesTable data={netData} series={netSeries} format={(v) => rupiah(v)} />}
          </div>
        </Card>

        <Card>
          <CardHead title="Kanal penjualan" sub="Bulan berjalan" />
          <div className="card-body col" style={{ gap: 14 }}>
            {mix.length === 0 && <Empty>Belum ada booking bulan ini.</Empty>}
            {mix.map((m) => (
              <div className="col" key={m.channel} style={{ gap: 5 }}>
                <div className="row small">
                  <span className="strong">{CHANNEL_NAME[m.channel] ?? m.channel}</span>
                  <span className="spacer num">{rupiah(m.payout, { compact: true })}</span>
                </div>
                <div className="bar-track">
                  <span style={{ width: `${(m.payout / (mix[0]?.payout || 1)) * 100}%`, background: 'var(--s1)' }} />
                </div>
                <span className="tiny muted num">{m.count} booking · komisi {rupiah(m.fee, { compact: true })}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid g-2">
        <Card>
          <CardHead title="ADR portofolio" sub="Harga rata-rata per malam terjual" />
          <div className="card-body">
            <LineTrend data={adrData} series={[{ name: 'ADR', color: 'var(--s3)' }]} format={(v) => compactNumber(v)} height={190} />
          </div>
        </Card>
        <Card>
          <CardHead title="Okupansi per unit" sub="Bulan berjalan vs target masing-masing unit" />
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
        <CardHead title="Laba rugi per unit" sub={monthDate(month).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}>
          <button className="btn sm" onClick={exportPnl}><Icon name="download" size={13} /> Laba rugi</button>
          <button className="btn sm" onClick={exportBookings}><Icon name="download" size={13} /> Booking</button>
          <button className="btn sm" onClick={exportExpenses}><Icon name="download" size={13} /> Biaya</button>
        </CardHead>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Unit</th><th className="r">Malam</th><th className="r">Okupansi</th><th className="r">ADR</th><th className="r">RevPAR</th>
                <th className="r">Pendapatan</th><th className="r">Biaya</th><th className="r">Laba bersih</th><th className="r">Margin</th>
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
                <td className="strong">Total {rows.length} unit</td>
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
