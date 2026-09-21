import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardHead, Badge, Field, Modal, Avatar, Meter } from '../components/ui';
import { Icon } from '../components/Icon';
import { relativeTime } from '../lib/format';

export default function Settings() {
  const { state, theme, toggleTheme, resetData, assignDevice } = useStore();
  const [confirming, setConfirming] = useState(false);

  const storageKb = Math.round(new Blob([JSON.stringify(state)]).size / 1024);

  return (
    <>
      <section className="grid g-2">
        <Card>
          <CardHead title="Tampilan" sub="Preferensi tersimpan di browser ini" />
          <div className="card-body col" style={{ gap: 14 }}>
            <Field label="Tema">
              <div className="row-wrap">
                <button className={`chip ${theme === 'light' ? 'on' : ''}`} onClick={() => theme !== 'light' && toggleTheme()}>
                  <Icon name="sun" size={13} /> Terang
                </button>
                <button className={`chip ${theme === 'dark' ? 'on' : ''}`} onClick={() => theme !== 'dark' && toggleTheme()}>
                  <Icon name="moon" size={13} /> Gelap
                </button>
              </div>
            </Field>
            <Field label="Mata uang & lokal" hint="Versi ini dikunci ke Rupiah dan format Indonesia.">
              <input className="input" value="IDR — id-ID" readOnly />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHead title="Data" sub="Aplikasi ini berjalan tanpa server" />
          <div className="card-body col" style={{ gap: 12 }}>
            <dl className="kv">
              <dt>Penyimpanan</dt><dd>localStorage · {storageKb} KB</dd>
              <dt>Unit</dt><dd>{state.properties.length}</dd>
              <dt>Booking</dt><dd>{state.bookings.length}</dd>
              <dt>Catatan biaya</dt><dd>{state.expenses.length}</dd>
              <dt>Pekerjaan</dt><dd>{state.jobs.length}</dd>
              <dt>Sesi kamera</dt><dd>{state.sessions.length}</dd>
            </dl>
            <p className="small muted">
              Semua perubahan hanya tersimpan di browser ini. Menghapus data situs akan mengembalikan data contoh.
            </p>
            <button className="btn danger" onClick={() => setConfirming(true)}>
              <Icon name="refresh" size={14} /> Kembalikan ke data contoh
            </button>
          </div>
        </Card>
      </section>

      <Card>
        <CardHead title="Tim lapangan" sub={`${state.staff.length} orang`} />
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Nama</th><th>Peran</th><th>Kontak</th><th className="r">Tugas bulan ini</th><th className="r">Rating</th><th>Body cam</th></tr></thead>
            <tbody>
              {state.staff.map((s) => {
                const device = state.devices.find((d) => d.staffId === s.id);
                return (
                  <tr key={s.id}>
                    <td>
                      <span className="row" style={{ gap: 9 }}>
                        <Avatar name={s.name} />
                        <span className="strong">{s.name}</span>
                      </span>
                    </td>
                    <td><Badge>{s.role}</Badge></td>
                    <td className="small num dim">{s.phone}</td>
                    <td className="r num">{s.jobsThisMonth}</td>
                    <td className="r num">{s.rating.toFixed(1)}</td>
                    <td>
                      {device
                        ? <span className="row small" style={{ gap: 7 }}>
                            {device.label}
                            <button className="btn ghost sm" onClick={() => assignDevice(device.id, null)}>Lepas</button>
                          </span>
                        : <span className="small muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="Perangkat terdaftar" sub="Body cam portabel yang dibawa petugas" />
        <div className="grid g-3 card-body">
          {state.devices.map((d) => (
            <div className="col" key={d.id} style={{ gap: 7, padding: 12, border: '1px solid var(--line)', borderRadius: 10 }}>
              <div className="row">
                <span className="strong">{d.label}</span>
                <span className="spacer">
                  {d.status === 'online' ? <Badge tone="good">Online</Badge>
                    : d.status === 'charging' ? <Badge tone="warn">Mengisi</Badge>
                    : <Badge tone="crit">Offline</Badge>}
                </span>
              </div>
              <span className="tiny muted">{d.model} · fw {d.firmware}</span>
              <Meter value={d.battery} tone={d.battery < 25 ? 'var(--critical)' : 'var(--good)'} />
              <span className="tiny muted num">Baterai {d.battery}% · terlihat {relativeTime(d.lastSeen)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead title="Batasan versi ini" sub="Jujur soal apa yang belum ada" />
        <div className="card-body col" style={{ gap: 8 }}>
          {[
            'Tidak ada server: semua data contoh dibangkitkan di browser dan disimpan di localStorage.',
            'Belum ada integrasi ke Airbnb, Booking.com, atau channel manager — kanal masih berupa label pada booking.',
            'Tayangan body cam disimulasikan; integrasi nyata perlu gateway RTSP/WebRTC dan penyimpanan klip.',
            'Belum ada autentikasi, peran pengguna, maupun jejak audit.',
            'Rekonsiliasi payout, pajak, dan akuntansi penuh belum termasuk.',
          ].map((t) => (
            <div className="row small" key={t} style={{ gap: 8, alignItems: 'flex-start' }}>
              <Icon name="alert" size={14} className="muted" />
              <span className="dim">{t}</span>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={confirming} title="Kembalikan data contoh?" onClose={() => setConfirming(false)}
        footer={
          <>
            <button className="btn danger" onClick={() => { resetData(); setConfirming(false); }}>Ya, kembalikan</button>
            <button className="btn ghost" onClick={() => setConfirming(false)}>Batal</button>
          </>
        }
      >
        <p className="small dim">
          Semua perubahan yang Anda buat — biaya yang dicatat, aturan musim, status pekerjaan, dan penugasan perangkat —
          akan hilang dan diganti data contoh awal.
        </p>
      </Modal>
    </>
  );
}
