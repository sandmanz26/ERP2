import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { usePeriod } from '../App';
import { Card, CardHead, Badge, Drawer, Empty, Field, UnitMark, Meter } from '../components/ui';
import { Sparkline } from '../components/charts';
import { Icon } from '../components/Icon';
import { dateLabel, pct, rupiah } from '../lib/format';
import { lastMonths, monthDate, propertyPnl, revenueIn } from '../lib/metrics';
import type { Property, PropertyStatus } from '../types';

const STATUS: Record<PropertyStatus, { label: string; tone: 'good' | 'warn' | 'neutral' }> = {
  active: { label: 'Active', tone: 'good' },
  maintenance: { label: 'Maintenance', tone: 'warn' },
  inactive: { label: 'Inactive', tone: 'neutral' },
};

export default function Properties() {
  const { state, updateProperty } = useStore();
  const { month } = usePeriod();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const cities = useMemo(() => [...new Set(state.properties.map((p) => p.city))].sort(), [state.properties]);
  const trailing = useMemo(() => lastMonths(6, monthDate(month)), [month]);

  const rows = state.properties
    .filter((p) => (city === 'all' ? true : p.city === city))
    .filter((p) => `${p.name} ${p.area} ${p.city}`.toLowerCase().includes(q.toLowerCase()))
    .map((p) => ({ p, pnl: propertyPnl(state, p, month) }))
    .sort((a, b) => b.pnl.net - a.pnl.net);

  const open = state.properties.find((p) => p.id === openId) ?? null;

  return (
    <>
      <Card>
        <CardHead title={`${rows.length} houses`} sub="Select a house to open its profile and configuration">
          <span className="search">
            <Icon name="search" size={14} />
            <input className="input" placeholder="Search house or location…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 210 }} />
          </span>
          <select className="select" value={city} onChange={(e) => setCity(e.target.value)} aria-label="Filter by city">
            <option value="all">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </CardHead>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>House</th><th>Status</th><th className="r">Base rate</th><th className="r">Occupancy</th>
                <th>6-mo trend</th><th className="r">Net income</th><th className="r">Margin</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, pnl }) => (
                <tr key={p.id} className="clickable" onClick={() => setOpenId(p.id)}>
                  <td>
                    <span className="row" style={{ gap: 9 }}>
                      <UnitMark name={p.name} accent={p.accent} />
                      <span className="col" style={{ gap: 0 }}>
                        <span className="strong">{p.name}</span>
                        <span className="tiny muted">{p.type} · {p.bedrooms} bd · {p.area}</span>
                      </span>
                    </span>
                  </td>
                  <td><Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge></td>
                  <td className="r num">{rupiah(p.basePrice, { compact: true })}</td>
                  <td className="r">
                    <span className="col" style={{ gap: 3, alignItems: 'flex-end' }}>
                      <span className="num small">{pct(pnl.occupancyPct)}</span>
                      <span style={{ width: 62 }}>
                        <Meter
                          value={pnl.occupancyPct}
                          tone={pnl.occupancyPct >= p.targetOccupancy ? 'var(--good)' : 'var(--warning)'}
                        />
                      </span>
                    </span>
                  </td>
                  <td>
                    <Sparkline
                      values={trailing.map((m) => revenueIn(state.bookings, m, p.id))}
                      color={`var(--s${p.accent})`}
                    />
                  </td>
                  <td className="r strong" style={{ color: pnl.net < 0 ? 'var(--critical-ink)' : undefined }}>
                    {rupiah(pnl.net, { compact: true })}
                  </td>
                  <td className="r num">{pct(pnl.marginPct)}</td>
                  <td className="r"><Icon name="chevron" size={14} className="muted" /></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8}><Empty>No houses match.</Empty></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <PropertyDrawer property={open} onClose={() => setOpenId(null)} onChange={updateProperty} />
    </>
  );
}

function PropertyDrawer({
  property, onClose, onChange,
}: { property: Property | null; onClose: () => void; onChange: (id: string, patch: Partial<Property>) => void }) {
  const { state } = useStore();
  const { month } = usePeriod();
  if (!property) return null;

  const pnl = propertyPnl(state, property, month);
  const bookings = state.bookings
    .filter((b) => b.propertyId === property.id && b.status !== 'cancelled')
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
    .slice(0, 6);
  const jobs = state.jobs
    .filter((j) => j.propertyId === property.id)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, 5);

  const num = (v: string) => Number(v.replace(/\D/g, '')) || 0;

  return (
    <Drawer
      open
      title={property.name}
      sub={`${property.type} · ${property.bedrooms} bd · ${property.area}, ${property.city}`}
      onClose={onClose}
      footer={<span className="small muted">Changes are saved automatically in this browser.</span>}
    >
      <div className="grid g-2">
        <Card className="stat">
          <span className="stat-label">Net income this month</span>
          <span className="stat-value" style={{ color: pnl.net < 0 ? 'var(--critical-ink)' : undefined }}>
            {rupiah(pnl.net, { compact: true })}
          </span>
          <span className="stat-foot">{pct(pnl.marginPct)} margin</span>
        </Card>
        <Card className="stat">
          <span className="stat-label">Occupancy</span>
          <span className="stat-value">{pct(pnl.occupancyPct)}</span>
          <span className="stat-foot">target {property.targetOccupancy}% · {pnl.nights} nights</span>
        </Card>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 10 }}><Icon name="tag" size={14} /> Rates & fees</div>
        <div className="grid g-2">
          <Field label="Base rate / night">
            <input className="input num" value={property.basePrice.toLocaleString('id-ID')}
              onChange={(e) => onChange(property.id, { basePrice: num(e.target.value) })} />
          </Field>
          <Field label="Weekend uplift (%)">
            <input className="input num" type="number" value={property.weekendUpliftPct}
              onChange={(e) => onChange(property.id, { weekendUpliftPct: Number(e.target.value) })} />
          </Field>
          <Field label="Cleaning fee">
            <input className="input num" value={property.cleaningFee.toLocaleString('id-ID')}
              onChange={(e) => onChange(property.id, { cleaningFee: num(e.target.value) })} />
          </Field>
          <Field label="Extra guest fee">
            <input className="input num" value={property.extraGuestFee.toLocaleString('id-ID')}
              onChange={(e) => onChange(property.id, { extraGuestFee: num(e.target.value) })} />
          </Field>
          <Field label="Minimum stay (nights)">
            <input className="input num" type="number" min={1} value={property.minStay}
              onChange={(e) => onChange(property.id, { minStay: Number(e.target.value) })} />
          </Field>
          <Field label="Occupancy target (%)">
            <input className="input num" type="number" min={0} max={100} value={property.targetOccupancy}
              onChange={(e) => onChange(property.id, { targetOccupancy: Number(e.target.value) })} />
          </Field>
          <Field label="House status">
            <select className="select" value={property.status}
              onChange={(e) => onChange(property.id, { status: e.target.value as PropertyStatus })}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Active channels">
            <div className="row-wrap">
              {(['airbnb', 'booking', 'direct'] as const).map((c) => {
                const on = property.channels.includes(c);
                return (
                  <button
                    key={c} className={`chip ${on ? 'on' : ''}`}
                    onClick={() => onChange(property.id, {
                      channels: on ? property.channels.filter((x) => x !== c) : [...property.channels, c],
                    })}
                  >
                    {c === 'direct' ? 'Direct' : c === 'airbnb' ? 'Airbnb' : 'Booking'}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}><Icon name="calendar" size={14} /> Recent bookings</div>
        <Card>
          <div className="list">
            {bookings.length === 0 && <Empty>No bookings yet.</Empty>}
            {bookings.map((b) => (
              <div className="list-item" key={b.id}>
                <div className="col" style={{ gap: 0, minWidth: 0 }}>
                  <span className="small strong truncate">{b.guest}</span>
                  <span className="tiny muted">
                    {dateLabel(b.checkIn)} – {dateLabel(b.checkOut)} · {b.nights} nights · {b.channel}
                  </span>
                </div>
                <span className="spacer small num strong">{rupiah(b.payout, { compact: true })}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}><Icon name="broom" size={14} /> Recent jobs</div>
        <Card>
          <div className="list">
            {jobs.length === 0 && <Empty>No jobs recorded.</Empty>}
            {jobs.map((j) => (
              <div className="list-item" key={j.id}>
                <div className="col" style={{ gap: 0, minWidth: 0 }}>
                  <span className="small strong">{j.type}</span>
                  <span className="tiny muted">{dateLabel(j.scheduledAt)} · {state.staff.find((s) => s.id === j.staffId)?.name}</span>
                </div>
                <span className="spacer small num">{rupiah(j.cost, { compact: true })}</span>
                {j.sessionId && <Badge tone="info" icon="video">Recorded</Badge>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Drawer>
  );
}
