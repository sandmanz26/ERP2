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
          <CardHead title="Appearance" sub="Preferences are stored in this browser" />
          <div className="card-body col" style={{ gap: 14 }}>
            <Field label="Theme">
              <div className="row-wrap">
                <button className={`chip ${theme === 'light' ? 'on' : ''}`} onClick={() => theme !== 'light' && toggleTheme()}>
                  <Icon name="sun" size={13} /> Light
                </button>
                <button className={`chip ${theme === 'dark' ? 'on' : ''}`} onClick={() => theme !== 'dark' && toggleTheme()}>
                  <Icon name="moon" size={13} /> Dark
                </button>
              </div>
            </Field>
            <Field label="Currency & locale" hint="This build is fixed to Indonesian Rupiah with English formatting.">
              <input className="input" value="IDR — en-US" readOnly />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHead title="Data" sub="This app runs without a server" />
          <div className="card-body col" style={{ gap: 12 }}>
            <dl className="kv">
              <dt>Storage</dt><dd>localStorage · {storageKb} KB</dd>
              <dt>Houses</dt><dd>{state.properties.length}</dd>
              <dt>Bookings</dt><dd>{state.bookings.length}</dd>
              <dt>Expense entries</dt><dd>{state.expenses.length}</dd>
              <dt>Jobs</dt><dd>{state.jobs.length}</dd>
              <dt>Camera sessions</dt><dd>{state.sessions.length}</dd>
            </dl>
            <p className="small muted">
              Every change lives in this browser only. Clearing site data restores the sample dataset.
            </p>
            <button className="btn danger" onClick={() => setConfirming(true)}>
              <Icon name="refresh" size={14} /> Restore sample data
            </button>
          </div>
        </Card>
      </section>

      <Card>
        <CardHead title="Field team" sub={`${state.staff.length} people`} />
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Role</th><th>Contact</th><th className="r">Houses</th><th className="r">Jobs this month</th><th className="r">Rating</th><th>Body cam</th></tr></thead>
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
                    <td className="r num">{s.assignedPropertyIds.length}</td>
                    <td className="r num">{s.jobsThisMonth}</td>
                    <td className="r num">{s.rating.toFixed(1)}</td>
                    <td>
                      {device
                        ? <span className="row small" style={{ gap: 7 }}>
                            {device.label}
                            <button className="btn ghost sm" onClick={() => assignDevice(device.id, null)}>Unpair</button>
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
        <CardHead title="Registered devices" sub="Portable body cams carried by the crew" />
        <div className="grid g-3 card-body">
          {state.devices.map((d) => (
            <div className="col" key={d.id} style={{ gap: 7, padding: 12, border: '1px solid var(--line)', borderRadius: 10 }}>
              <div className="row">
                <span className="strong">{d.label}</span>
                <span className="spacer">
                  {d.status === 'online' ? <Badge tone="good">Online</Badge>
                    : d.status === 'charging' ? <Badge tone="warn">Charging</Badge>
                    : <Badge tone="crit">Offline</Badge>}
                </span>
              </div>
              <span className="tiny muted">{d.model} · fw {d.firmware}</span>
              <Meter value={d.battery} tone={d.battery < 25 ? 'var(--critical)' : 'var(--good)'} />
              <span className="tiny muted num">Battery {d.battery}% · seen {relativeTime(d.lastSeen)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead title="What this build does not do" sub="Stated plainly so nothing is oversold" />
        <div className="card-body col" style={{ gap: 8 }}>
          {[
            'No server: sample data is generated in the browser and kept in localStorage.',
            'No Airbnb, Booking.com, or channel-manager integration — channel is still just a label on a booking.',
            'Body-cam playback is simulated; a real integration needs an RTSP/WebRTC gateway and clip storage.',
            'No authentication, user roles, or audit trail.',
            'Payout reconciliation and full accounting are out of scope.',
          ].map((t) => (
            <div className="row small" key={t} style={{ gap: 8, alignItems: 'flex-start' }}>
              <Icon name="alert" size={14} className="muted" />
              <span className="dim">{t}</span>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={confirming} title="Restore sample data?" onClose={() => setConfirming(false)}
        footer={
          <>
            <button className="btn danger" onClick={() => { resetData(); setConfirming(false); }}>Yes, restore</button>
            <button className="btn ghost" onClick={() => setConfirming(false)}>Cancel</button>
          </>
        }
      >
        <p className="small dim">
          Everything you changed — logged expenses, season rules, job status, coverage, and device pairing —
          will be discarded and replaced by the original sample data.
        </p>
      </Modal>
    </>
  );
}
