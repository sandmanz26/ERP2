import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardHead, Badge, Field, Empty, Modal } from '../components/ui';
import { Icon } from '../components/Icon';
import { addDays, isoDate, rupiah, pct } from '../lib/format';
import { priceForNight } from '../lib/seed';
import { CHANNEL_FEE } from '../lib/seed';
import type { Channel, Season } from '../types';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHANNEL_LABEL: Record<Channel, string> = { airbnb: 'Airbnb (3%)', booking: 'Booking.com (15%)', direct: 'Direct (0%)' };

export default function Pricing() {
  const { state, upsertSeason, removeSeason, updateProperty } = useStore();
  const [propId, setPropId] = useState(state.properties[0]?.id ?? '');
  const [cursor, setCursor] = useState(() => new Date());
  const [editing, setEditing] = useState<Season | null>(null);

  const property = state.properties.find((p) => p.id === propId) ?? state.properties[0];
  const seasons = state.seasons.filter((s) => s.propertyId === 'all' || s.propertyId === property.id);

  const bookedDates = useMemo(() => {
    const set = new Set<string>();
    state.bookings
      .filter((b) => b.propertyId === property.id && b.status !== 'cancelled')
      .forEach((b) => {
        for (let i = 0; i < b.nights; i++) set.add(isoDate(addDays(new Date(b.checkIn), i)));
      });
    return set;
  }, [state.bookings, property.id]);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const monthPrices = days
    .filter((d) => d.getMonth() === cursor.getMonth())
    .map((d) => priceForNight(property, state.seasons, d));
  const avgPrice = monthPrices.reduce((a, b) => a + b, 0) / Math.max(1, monthPrices.length);

  return (
    <>
      <Card>
        <CardHead title="House being priced" sub="Nightly rate = base rate × weekend uplift × season rule">
          <select className="select" value={property.id} onChange={(e) => setPropId(e.target.value)} aria-label="Select house">
            {state.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </CardHead>
        <div className="grid g-4 card-body">
          <Field label="Base rate / night">
            <input className="input num" value={property.basePrice.toLocaleString('id-ID')}
              onChange={(e) => updateProperty(property.id, { basePrice: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
          </Field>
          <Field label="Weekend uplift (+%)" hint="Applies Friday and Saturday">
            <input className="input num" type="number" value={property.weekendUpliftPct}
              onChange={(e) => updateProperty(property.id, { weekendUpliftPct: Number(e.target.value) })} />
          </Field>
          <Field label="Cleaning fee / booking">
            <input className="input num" value={property.cleaningFee.toLocaleString('id-ID')}
              onChange={(e) => updateProperty(property.id, { cleaningFee: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
          </Field>
          <Field label="Minimum stay">
            <input className="input num" type="number" min={1} value={property.minStay}
              onChange={(e) => updateProperty(property.id, { minStay: Number(e.target.value) })} />
          </Field>
        </div>
      </Card>

      <section className="grid g-main">
        <Card>
          <CardHead
            title="Rate calendar"
            sub={`Average ${rupiah(avgPrice, { compact: true })}/night · ${cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
          >
            <button className="btn ghost icon-btn" aria-label="Previous month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <Icon name="chevron" size={15} className="flip" />
            </button>
            <button className="btn ghost icon-btn" aria-label="Next month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <Icon name="chevron" size={15} />
            </button>
          </CardHead>
          <div className="card-body col" style={{ gap: 8 }}>
            <div className="cal">
              {DOW.map((d) => <div className="cal-dow" key={d}>{d}</div>)}
              {days.map((d) => {
                const out = d.getMonth() !== cursor.getMonth();
                const key = isoDate(d);
                const price = priceForNight(property, state.seasons, d);
                const season = state.seasons.find(
                  (s) => s.active && (s.propertyId === 'all' || s.propertyId === property.id) && key >= s.startDate && key <= s.endDate,
                );
                const booked = bookedDates.has(key);
                const isToday = key === isoDate(new Date());
                return (
                  <div key={key} className={`cal-cell ${out ? 'out' : ''} ${isToday ? 'today' : ''} ${booked ? 'booked' : ''}`}>
                    <span className="cal-day">{d.getDate()}</span>
                    <span className="cal-price">{rupiah(price, { compact: true })}</span>
                    {season && <span className="cal-tag">{season.multiplier > 1 ? `+${Math.round((season.multiplier - 1) * 100)}%` : `${Math.round((season.multiplier - 1) * 100)}%`}</span>}
                    {booked && <span className="tiny muted">booked</span>}
                  </div>
                );
              })}
            </div>
            <div className="legend">
              <span className="legend-item"><i className="swatch" style={{ background: 'var(--surface-sunk)' }} /> night booked</span>
              <span className="legend-item"><i className="swatch" style={{ background: 'var(--accent-wash)' }} /> season rule active</span>
            </div>
          </div>
        </Card>

        <Simulator propertyId={property.id} />
      </section>

      <Card>
        <CardHead title="Season rules" sub="Rate multipliers for a date range — applied before channel commission">
          <button className="btn primary sm" onClick={() => setEditing(blankSeason(property.id))}>
            <Icon name="plus" size={14} /> New rule
          </button>
        </CardHead>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Scope</th><th>Period</th><th className="r">Multiplier</th><th className="r">Min. nights</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {seasons.length === 0 && <tr><td colSpan={7}><Empty>No season rules yet.</Empty></td></tr>}
              {seasons.map((s) => (
                <tr key={s.id}>
                  <td className="strong">{s.name}</td>
                  <td className="small dim">{s.propertyId === 'all' ? 'All houses' : state.properties.find((p) => p.id === s.propertyId)?.name}</td>
                  <td className="small num dim">{s.startDate} → {s.endDate}</td>
                  <td className="r num strong" style={{ color: s.multiplier < 1 ? 'var(--critical-ink)' : 'var(--good-ink)' }}>
                    ×{s.multiplier.toFixed(2)}
                  </td>
                  <td className="r num">{s.minStay}</td>
                  <td>{s.active ? <Badge tone="good">Active</Badge> : <Badge>Inactive</Badge>}</td>
                  <td className="r">
                    <span className="row" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn ghost sm" onClick={() => setEditing(s)}>Edit</button>
                      <button className="btn ghost sm" onClick={() => upsertSeason({ ...s, active: !s.active })}>
                        {s.active ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn ghost sm danger" onClick={() => removeSeason(s.id)} aria-label="Delete rule">
                        <Icon name="trash" size={14} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <SeasonModal season={editing} onClose={() => setEditing(null)} onSave={(s) => { upsertSeason(s); setEditing(null); }} />
    </>
  );
}

function blankSeason(propertyId: string): Season {
  const y = new Date().getFullYear();
  return { id: `s${Date.now().toString(36)}`, name: '', propertyId, startDate: `${y}-01-01`, endDate: `${y}-01-31`, multiplier: 1.2, minStay: 2, active: true };
}

function SeasonModal({ season, onClose, onSave }: { season: Season | null; onClose: () => void; onSave: (s: Season) => void }) {
  const { state } = useStore();
  const [draft, setDraft] = useState<Season | null>(season);
  if (season && draft?.id !== season.id) setDraft(season);
  if (!season || !draft) return null;

  return (
    <Modal
      open title={season.name ? 'Edit season rule' : 'New season rule'} onClose={onClose}
      footer={
        <>
          <button className="btn primary" onClick={() => onSave({ ...draft, name: draft.name || 'Untitled rule' })}>Save</button>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
        </>
      }
    >
      <div className="grid g-2">
        <Field label="Rule name"><input className="input" value={draft.name} placeholder="High season Jun–Aug"
          onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Scope">
          <select className="select" value={draft.propertyId} onChange={(e) => setDraft({ ...draft, propertyId: e.target.value })}>
            <option value="all">All houses</option>
            {state.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Starts"><input className="input" type="date" value={draft.startDate}
          onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></Field>
        <Field label="Ends"><input className="input" type="date" value={draft.endDate}
          onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} /></Field>
        <Field label={`Rate multiplier ×${draft.multiplier.toFixed(2)}`} hint="0.50 – 2.00 of the base rate">
          <input type="range" min={0.5} max={2} step={0.05} value={draft.multiplier}
            onChange={(e) => setDraft({ ...draft, multiplier: Number(e.target.value) })} />
        </Field>
        <Field label="Minimum stay"><input className="input num" type="number" min={1} value={draft.minStay}
          onChange={(e) => setDraft({ ...draft, minStay: Number(e.target.value) })} /></Field>
      </div>
    </Modal>
  );
}

/* ---------------- Price and cost simulator ---------------- */

function Simulator({ propertyId }: { propertyId: string }) {
  const { state } = useStore();
  const property = state.properties.find((p) => p.id === propertyId)!;
  const [checkIn, setCheckIn] = useState(() => isoDate(addDays(new Date(), 7)));
  const [nights, setNights] = useState(3);
  const [guests, setGuests] = useState(2);
  const [channel, setChannel] = useState<Channel>('airbnb');
  const [discount, setDiscount] = useState(0);

  const nightly = useMemo(() => {
    let total = 0;
    for (let i = 0; i < nights; i++) total += priceForNight(property, state.seasons, addDays(new Date(checkIn), i));
    return total;
  }, [property, state.seasons, checkIn, nights]);

  const extraGuest = Math.max(0, guests - property.bedrooms * 1.5) * property.extraGuestFee;
  const afterDiscount = nightly * (1 - discount / 100);
  const gross = Math.round(afterDiscount + property.cleaningFee + extraGuest);
  const fee = Math.round(gross * CHANNEL_FEE[channel]);
  const payout = gross - fee;

  // Cash that actually leaves when the house is used.
  const cost = {
    cleaning: Math.round(property.cleaningFee * 0.55),
    laundry: property.bedrooms * 85_000,
    amenities: guests * 35_000,
    utilities: property.bedrooms * 45_000 * nights,
    tax: Math.round(payout * 0.1),
  };
  const costTotal = Object.values(cost).reduce((a, b) => a + b, 0);
  const net = payout - costTotal;
  const margin = payout > 0 ? (net / payout) * 100 : 0;
  const perNight = net / Math.max(1, nights);

  return (
    <Card>
      <CardHead title="Price and cost simulator" sub="What one booking leaves behind after commission and variable cost" />
      <div className="card-body col" style={{ gap: 14 }}>
        <div className="grid g-2">
          <Field label="Check-in"><input className="input" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></Field>
          <Field label="Nights"><input className="input num" type="number" min={1} max={30} value={nights}
            onChange={(e) => setNights(Math.max(1, Number(e.target.value)))} /></Field>
          <Field label="Guests"><input className="input num" type="number" min={1} max={property.capacity} value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))} /></Field>
          <Field label="Channel">
            <select className="select" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>)}
            </select>
          </Field>
        </div>
        <Field label={`Promo discount ${discount}%`}>
          <input type="range" min={0} max={40} step={5} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
        </Field>

        {nights < property.minStay && (
          <div className="row small" style={{ color: 'var(--warning-ink)' }}>
            <Icon name="alert" size={14} /> Below this house’s {property.minStay}-night minimum.
          </div>
        )}

        <dl className="kv">
          <dt>{nights} nights at rate</dt><dd className="num">{rupiah(nightly)}</dd>
          {discount > 0 && <><dt>Promo discount</dt><dd className="num" style={{ color: 'var(--critical-ink)' }}>−{rupiah(nightly - afterDiscount)}</dd></>}
          <dt>Cleaning fee</dt><dd className="num">{rupiah(property.cleaningFee)}</dd>
          {extraGuest > 0 && <><dt>Extra guests</dt><dd className="num">{rupiah(extraGuest)}</dd></>}
          <dt className="strong">Guest pays</dt><dd className="num strong">{rupiah(gross)}</dd>
          <dt>Channel commission</dt><dd className="num" style={{ color: 'var(--critical-ink)' }}>−{rupiah(fee)}</dd>
          <dt className="strong">Lands in your account</dt><dd className="num strong">{rupiah(payout)}</dd>
        </dl>

        <div>
          <div className="section-title" style={{ marginBottom: 8 }}><Icon name="receipt" size={14} /> Variable cost per booking</div>
          <dl className="kv">
            <dt>Cleaning fee paid out</dt><dd className="num">{rupiah(cost.cleaning)}</dd>
            <dt>Linen laundry</dt><dd className="num">{rupiah(cost.laundry)}</dd>
            <dt>Guest amenities</dt><dd className="num">{rupiah(cost.amenities)}</dd>
            <dt>Electricity & water</dt><dd className="num">{rupiah(cost.utilities)}</dd>
            <dt>Lodging tax 10%</dt><dd className="num">{rupiah(cost.tax)}</dd>
            <dt className="strong">Total variable cost</dt><dd className="num strong" style={{ color: 'var(--critical-ink)' }}>−{rupiah(costTotal)}</dd>
          </dl>
        </div>

        <div className="row" style={{ gap: 10, padding: '12px 14px', background: 'var(--surface-sunk)', borderRadius: 10 }}>
          <div className="col" style={{ gap: 2 }}>
            <span className="stat-label">Net income from this booking</span>
            <span className="stat-value" style={{ fontSize: 20, color: net < 0 ? 'var(--critical-ink)' : 'var(--good-ink)' }}>
              {rupiah(net)}
            </span>
          </div>
          <div className="col spacer" style={{ gap: 2, alignItems: 'flex-end' }}>
            <Badge tone={margin >= 40 ? 'good' : margin >= 20 ? 'warn' : 'crit'}>{pct(margin)} margin</Badge>
            <span className="tiny muted">{rupiah(perNight, { compact: true })} net per night</span>
          </div>
        </div>
        <p className="tiny muted">
          Excludes fixed monthly cost (payroll, ground rent, internet) that does not move with a booking.
        </p>
      </div>
    </Card>
  );
}
