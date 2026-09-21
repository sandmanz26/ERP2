import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { usePeriod } from '../App';
import { Card, CardHead, Badge, StatTile, Empty } from '../components/ui';
import { GroupedBars, Legend, RankBars } from '../components/charts';
import { Icon } from '../components/Icon';
import { compactNumber, monthName, monthShort, pct, rupiah } from '../lib/format';
import {
  incomeStatement, lastMonths, monthDate, propertyPnl, statementLines, sum,
} from '../lib/metrics';
import { downloadCsv } from '../lib/csv';

export default function Financials() {
  const { state } = useStore();
  const { month } = usePeriod();
  const [scope, setScope] = useState<'all' | string>('all');

  const propertyId = scope === 'all' ? undefined : scope;
  const months = useMemo(() => lastMonths(6, monthDate(month)), [month]);
  const stmt = incomeStatement(state, month, propertyId);
  const prevKey = months[months.length - 2];
  const prevStmt = incomeStatement(state, prevKey, propertyId);
  const lines = statementLines(stmt);
  const prevLines = statementLines(prevStmt);
  const prevByKey = new Map(prevLines.map((l) => [l.key, l.amount]));

  const trendSeries = [
    { name: 'Net revenue', color: 'var(--s1)' },
    { name: 'Operating expenses', color: 'var(--s2)' },
    { name: 'Net income', color: 'var(--s3)' },
  ];
  const trend = months.map((m) => {
    const s = incomeStatement(state, m, propertyId);
    return { label: monthShort(monthDate(m)), values: [s.netRevenue, s.operatingExpenses + s.tax, s.netIncome] };
  });

  const contribution = state.properties
    .map((p) => propertyPnl(state, p, month))
    .sort((a, b) => b.net - a.net);
  const totalNet = sum(contribution.map((c) => Math.max(0, c.net))) || 1;

  const exportStatement = () =>
    downloadCsv(`income-statement-${month}${propertyId ? `-${propertyId}` : ''}.csv`, lines.map((l) => ({
      line: l.label,
      type: l.kind,
      amount_idr: Math.round(l.amount),
      previous_month_idr: Math.round(prevByKey.get(l.key) ?? 0),
    })));

  const exportByHouse = () =>
    downloadCsv(`net-income-by-house-${month}.csv`, contribution.map((c) => ({
      house: c.property.name,
      city: c.property.city,
      nights_sold: c.nights,
      occupancy_pct: c.occupancyPct.toFixed(1),
      adr_idr: Math.round(c.adr),
      net_revenue_idr: c.revenue,
      expenses_idr: c.expense,
      net_income_idr: c.net,
      margin_pct: c.marginPct.toFixed(1),
    })));

  return (
    <>
      <section className="grid g-4">
        <StatTile label="Gross booking value" value={rupiah(stmt.grossBookingValue, { compact: true })} foot={`${stmt.nights} nights sold`} />
        <StatTile
          label="Net revenue"
          value={rupiah(stmt.netRevenue, { compact: true })}
          foot={`${rupiah(stmt.channelCommission, { compact: true })} lost to commission`}
        />
        <StatTile label="Operating expenses" value={rupiah(stmt.operatingExpenses, { compact: true })} foot={`plus ${rupiah(stmt.tax, { compact: true })} lodging tax`} />
        <StatTile
          label="Net income"
          value={rupiah(stmt.netIncome, { compact: true })}
          foot={`${pct(stmt.netMarginPct)} net margin`}
          accent={stmt.netIncome < 0 ? 'var(--critical-ink)' : undefined}
        />
      </section>

      <Card>
        <CardHead
          title="Income statement"
          sub={`${monthName(monthDate(month))} · ${scope === 'all' ? 'all houses' : state.properties.find((p) => p.id === scope)?.name}`}
        >
          <select className="select" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Scope">
            <option value="all">All houses</option>
            {state.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="btn sm" onClick={exportStatement}><Icon name="download" size={13} /> Export</button>
        </CardHead>
        <div className="table-wrap">
          <table className="stmt">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '9px 14px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-muted)', borderBottom: '1px solid var(--line)' }}>Line</th>
                <th style={{ textAlign: 'right', padding: '9px 14px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-muted)', borderBottom: '1px solid var(--line)' }}>
                  {monthName(monthDate(month), 'short')}
                </th>
                <th style={{ textAlign: 'right', padding: '9px 14px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-muted)', borderBottom: '1px solid var(--line)' }}>
                  {monthName(monthDate(prevKey), 'short')}
                </th>
                <th style={{ textAlign: 'right', padding: '9px 14px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-muted)', borderBottom: '1px solid var(--line)' }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const before = prevByKey.get(l.key) ?? 0;
                const change = before ? ((l.amount - before) / Math.abs(before)) * 100 : null;
                return (
                  <tr key={l.key} className={`${l.kind === 'subtotal' ? 'subtotal' : ''} ${l.kind === 'total' ? 'total' : ''} ${l.kind === 'deduction' ? 'deduction' : ''} ${l.indent ? 'indent' : ''}`}>
                    <td>{l.label}</td>
                    <td className="amount">{rupiah(l.amount)}</td>
                    <td className="amount muted">{rupiah(before)}</td>
                    <td className="amount">
                      {change == null ? <span className="muted">—</span> : (
                        <span className={`delta ${change >= 0 ? 'up' : 'down'}`} style={{ justifyContent: 'flex-end' }}>
                          <Icon name={change >= 0 ? 'up' : 'down'} size={11} />
                          {Math.abs(change).toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="card-body">
          <p className="tiny muted">
            Revenue is recognised on the check-in month. Channel commission is deducted from gross booking value;
            local lodging tax is shown after operating income so the operating line stays comparable between houses.
          </p>
        </div>
      </Card>

      <section className="grid g-main">
        <Card>
          <CardHead title="Six-month trend" sub="Net revenue, total cost, and what is left" />
          <div className="card-body col" style={{ gap: 12 }}>
            <Legend series={trendSeries} />
            <GroupedBars data={trend} series={trendSeries} format={(v) => compactNumber(v)} height={230} />
          </div>
        </Card>

        <Card>
          <CardHead title="Revenue composition" sub={monthName(monthDate(month))} />
          <div className="card-body col" style={{ gap: 14 }}>
            <dl className="kv">
              <dt>Room revenue</dt><dd className="num">{rupiah(stmt.roomRevenue)}</dd>
              <dt>Cleaning fees</dt><dd className="num">{rupiah(stmt.cleaningFees)}</dd>
              <dt className="strong">Gross booking value</dt><dd className="num strong">{rupiah(stmt.grossBookingValue)}</dd>
              <dt>Channel commission</dt><dd className="num" style={{ color: 'var(--critical-ink)' }}>−{rupiah(stmt.channelCommission)}</dd>
              <dt className="strong">Net revenue</dt><dd className="num strong">{rupiah(stmt.netRevenue)}</dd>
            </dl>
            <div className="col" style={{ gap: 6 }}>
              <span className="small strong">Cost structure</span>
              <RankBars
                rows={[
                  { label: 'Direct operating', value: stmt.direct },
                  { label: 'Payroll', value: stmt.staff },
                  { label: 'Property cost', value: stmt.propertyCost },
                  { label: 'Lodging tax', value: stmt.tax },
                  { label: 'Marketing', value: stmt.marketing },
                ].filter((r) => r.value > 0)}
                format={(v) => rupiah(v, { compact: true })}
                rowHeight={26}
              />
            </div>
          </div>
        </Card>
      </section>

      <Card>
        <CardHead title="Net income by house" sub="Who carries the portfolio and who drags it">
          <button className="btn sm" onClick={exportByHouse}><Icon name="download" size={13} /> Export</button>
        </CardHead>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>House</th><th className="r">Nights</th><th className="r">Net revenue</th><th className="r">Expenses</th>
                <th className="r">Net income</th><th className="r">Margin</th><th className="r">Share of profit</th>
              </tr>
            </thead>
            <tbody>
              {contribution.length === 0 && <tr><td colSpan={7}><Empty>No data for this period.</Empty></td></tr>}
              {contribution.map((c) => (
                <tr key={c.property.id}>
                  <td className="strong">{c.property.name}</td>
                  <td className="r num">{c.nights}</td>
                  <td className="r num">{rupiah(c.revenue, { compact: true })}</td>
                  <td className="r num">{rupiah(c.expense, { compact: true })}</td>
                  <td className="r num strong" style={{ color: c.net < 0 ? 'var(--critical-ink)' : undefined }}>
                    {rupiah(c.net, { compact: true })}
                  </td>
                  <td className="r">
                    {c.marginPct >= 40 ? <Badge tone="good">{pct(c.marginPct)}</Badge>
                      : c.marginPct >= 15 ? <Badge>{pct(c.marginPct)}</Badge>
                      : <Badge tone="crit">{pct(c.marginPct)}</Badge>}
                  </td>
                  <td className="r num">{c.net > 0 ? pct((c.net / totalNet) * 100) : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="strong">Total</td>
                <td className="r num strong">{sum(contribution.map((c) => c.nights))}</td>
                <td className="r num strong">{rupiah(sum(contribution.map((c) => c.revenue)), { compact: true })}</td>
                <td className="r num strong">{rupiah(sum(contribution.map((c) => c.expense)), { compact: true })}</td>
                <td className="r num strong">{rupiah(sum(contribution.map((c) => c.net)), { compact: true })}</td>
                <td className="r num strong">{pct(stmt.netMarginPct)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </>
  );
}
