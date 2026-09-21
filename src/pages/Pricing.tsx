import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardHead, Badge, Field, Empty, Modal } from '../components/ui';
import { Icon } from '../components/Icon';
import { addDays, isoDate, rupiah, pct } from '../lib/format';
import { priceForNight } from '../lib/seed';
import { CHANNEL_FEE } from '../lib/seed';
import type { Channel, Season } from '../types';

const DOW = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
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
        <CardHead title="Unit yang diatur" sub="Harga dihitung dari harga dasar × akhir pekan × aturan musim">
          <select className="select" value={property.id} onChange={(e) => setPropId(e.target.value)} aria-label="Pilih unit">
            {state.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </CardHead>
        <div className="grid g-4 card-body">
          <Field label="Harga dasar / malam">
            <input className="input num" value={property.basePrice.toLocaleString('id-ID')}
              onChange={(e) => updateProperty(property.id, { basePrice: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
          </Field>
          <Field label="Akhir pekan (+%)" hint="Berlaku Jumat & Sabtu">
            <input className="input num" type="number" value={property.weekendUpliftPct}
              onChange={(e) => updateProperty(property.id, { weekendUpliftPct: Number(e.target.value) })} />
          </Field>
          <Field label="Biaya kebersihan / booking">
            <input className="input num" value={property.cleaningFee.toLocaleString('id-ID')}
              onChange={(e) => updateProperty(property.id, { cleaningFee: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
          </Field>
          <Field label="Minimum menginap">
            <input className="input num" type="number" min={1} value={property.minStay}
              onChange={(e) => updateProperty(property.id, { minStay: Number(e.target.value) })} />
          </Field>
        </div>
      </Card>

      <section className="grid g-main">
        <Card>
          <CardHead
            title="Kalender harga"
            sub={`Rata-rata ${rupiah(avgPrice, { compact: true })}/malam · ${cursor.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`}
          >
            <button className="btn ghost icon-btn" aria-label="Bulan sebelumnya"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <Icon name="chevron" size={15} className="flip" />
            </button>
            <button className="btn ghost icon-btn" aria-label="Bulan berikutnya"
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
                    {booked && <span className="tiny muted">terisi</span>}
                  </div>
                );
              })}
            </div>
            <div className="legend">
              <span className="legend-item"><i className="swatch" style={{ background: 'var(--surface-sunk)' }} /> malam terisi</span>
              <span className="legend-item"><i className="swatch" style={{ background: 'var(--accent-wash)' }} /> aturan musim aktif</span>
            </div>
          </div>
        </Card>

        <Simulator propertyId={property.id} />
      </section>

      <Card>
        <CardHead title="Aturan musim" sub="Pengali harga untuk periode tertentu — berlaku sebelum komisi kanal">
          <button className="btn primary sm" onClick={() => setEditing(blankSeason(property.id))}>
            <Icon name="plus" size={14} /> Aturan baru
          </button>
        </CardHead>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Nama</th><th>Cakupan</th><th>Periode</th><th className="r">Pengali</th><th className="r">Min. malam</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {seasons.length === 0 && <tr><td colSpan={7}><Empty>Belum ada aturan musim.</Empty></td></tr>}
              {seasons.map((s) => (
                <tr key={s.id}>
                  <td className="strong">{s.name}</td>
                  <td className="small dim">{s.propertyId === 'all' ? 'Semua unit' : state.properties.find((p) => p.id === s.propertyId)?.name}</td>
                  <td className="small num dim">{s.startDate} → {s.endDate}</td>
                  <td className="r num strong" style={{ color: s.multiplier < 1 ? 'var(--critical-ink)' : 'var(--good-ink)' }}>
                    ×{s.multiplier.toFixed(2)}
                  </td>
                  <td className="r num">{s.minStay}</td>
                  <td>{s.active ? <Badge tone="good">Aktif</Badge> : <Badge>Nonaktif</Badge>}</td>
                  <td className="r">
                    <span className="row" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn ghost sm" onClick={() => setEditing(s)}>Ubah</button>
                      <button className="btn ghost sm" onClick={() => upsertSeason({ ...s, active: !s.active })}>
                        {s.active ? 'Matikan' : 'Aktifkan'}
                      </button>
                      <button className="btn ghost sm danger" onClick={() => removeSeason(s.id)} aria-label="Hapus">
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
      open title={season.name ? 'Ubah aturan musim' : 'Aturan musim baru'} onClose={onClose}
      footer={
        <>
          <button className="btn primary" onClick={() => onSave({ ...draft, name: draft.name || 'Aturan tanpa nama' })}>Simpan</button>
          <button className="btn ghost" onClick={onClose}>Batal</button>
        </>
      }
    >
      <div className="grid g-2">
        <Field label="Nama aturan"><input className="input" value={draft.name} placeholder="High season Juni–Agustus"
          onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Cakupan">
          <select className="select" value={draft.propertyId} onChange={(e) => setDraft({ ...draft, propertyId: e.target.value })}>
            <option value="all">Semua unit</option>
            {state.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Mulai"><input className="input" type="date" value={draft.startDate}
          onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></Field>
        <Field label="Selesai"><input className="input" type="date" value={draft.endDate}
          onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} /></Field>
        <Field label={`Pengali harga ×${draft.multiplier.toFixed(2)}`} hint="0,50 – 2,00 dari harga dasar">
          <input type="range" min={0.5} max={2} step={0.05} value={draft.multiplier}
            onChange={(e) => setDraft({ ...draft, multiplier: Number(e.target.value) })} />
        </Field>
        <Field label="Minimum menginap"><input className="input num" type="number" min={1} value={draft.minStay}
          onChange={(e) => setDraft({ ...draft, minStay: Number(e.target.value) })} /></Field>
      </div>
    </Modal>
  );
}

/* ---------------- Simulator harga & biaya ---------------- */

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

  // Biaya variabel yang benar-benar keluar saat unit dipakai.
  const cost = {
    cleaning: Math.round(property.cleaningFee * 0.55),
    laundry: property.bedrooms * 85_000,
    amenities: guests * 35_000,
    utilitas: property.bedrooms * 45_000 * nights,
    pajak: Math.round(payout * 0.1),
  };
  const costTotal = Object.values(cost).reduce((a, b) => a + b, 0);
  const net = payout - costTotal;
  const margin = payout > 0 ? (net / payout) * 100 : 0;
  const perNight = net / Math.max(1, nights);

  return (
    <Card>
      <CardHead title="Simulasi harga & biaya" sub="Sisa dari satu booking setelah komisi dan biaya variabel" />
      <div className="card-body col" style={{ gap: 14 }}>
        <div className="grid g-2">
          <Field label="Check-in"><input className="input" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></Field>
          <Field label="Malam"><input className="input num" type="number" min={1} max={30} value={nights}
            onChange={(e) => setNights(Math.max(1, Number(e.target.value)))} /></Field>
          <Field label="Tamu"><input className="input num" type="number" min={1} max={property.capacity} value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))} /></Field>
          <Field label="Kanal">
            <select className="select" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>)}
            </select>
          </Field>
        </div>
        <Field label={`Diskon promo ${discount}%`}>
          <input type="range" min={0} max={40} step={5} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
        </Field>

        {nights < property.minStay && (
          <div className="row small" style={{ color: 'var(--warning-ink)' }}>
            <Icon name="alert" size={14} /> Di bawah minimum {property.minStay} malam untuk unit ini.
          </div>
        )}

        <dl className="kv">
          <dt>Tarif {nights} malam</dt><dd className="num">{rupiah(nightly)}</dd>
          {discount > 0 && <><dt>Diskon promo</dt><dd className="num" style={{ color: 'var(--critical-ink)' }}>−{rupiah(nightly - afterDiscount)}</dd></>}
          <dt>Biaya kebersihan</dt><dd className="num">{rupiah(property.cleaningFee)}</dd>
          {extraGuest > 0 && <><dt>Tamu tambahan</dt><dd className="num">{rupiah(extraGuest)}</dd></>}
          <dt className="strong">Dibayar tamu</dt><dd className="num strong">{rupiah(gross)}</dd>
          <dt>Komisi kanal</dt><dd className="num" style={{ color: 'var(--critical-ink)' }}>−{rupiah(fee)}</dd>
          <dt className="strong">Masuk rekening</dt><dd className="num strong">{rupiah(payout)}</dd>
        </dl>

        <div>
          <div className="section-title" style={{ marginBottom: 8 }}><Icon name="receipt" size={14} /> Biaya variabel per booking</div>
          <dl className="kv">
            <dt>Upah cleaning</dt><dd className="num">{rupiah(cost.cleaning)}</dd>
            <dt>Laundry linen</dt><dd className="num">{rupiah(cost.laundry)}</dd>
            <dt>Amenities tamu</dt><dd className="num">{rupiah(cost.amenities)}</dd>
            <dt>Listrik & air</dt><dd className="num">{rupiah(cost.utilitas)}</dd>
            <dt>Pajak daerah 10%</dt><dd className="num">{rupiah(cost.pajak)}</dd>
            <dt className="strong">Total biaya variabel</dt><dd className="num strong" style={{ color: 'var(--critical-ink)' }}>−{rupiah(costTotal)}</dd>
          </dl>
        </div>

        <div className="row" style={{ gap: 10, padding: '12px 14px', background: 'var(--surface-sunk)', borderRadius: 10 }}>
          <div className="col" style={{ gap: 2 }}>
            <span className="stat-label">Laba bersih booking</span>
            <span className="stat-value" style={{ fontSize: 20, color: net < 0 ? 'var(--critical-ink)' : 'var(--good-ink)' }}>
              {rupiah(net)}
            </span>
          </div>
          <div className="col spacer" style={{ gap: 2, alignItems: 'flex-end' }}>
            <Badge tone={margin >= 40 ? 'good' : margin >= 20 ? 'warn' : 'crit'}>margin {pct(margin)}</Badge>
            <span className="tiny muted">{rupiah(perNight, { compact: true })} bersih / malam</span>
          </div>
        </div>
        <p className="tiny muted">
          Belum termasuk biaya tetap bulanan (gaji, sewa lahan, internet) yang tidak bergerak mengikuti booking.
        </p>
      </div>
    </Card>
  );
}
