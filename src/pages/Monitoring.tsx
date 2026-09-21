import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardHead, Badge, Drawer, Empty, StatTile, Signal, Meter, Avatar } from '../components/ui';
import { Icon } from '../components/Icon';
import { dateLabel, relativeTime, timeLabel } from '../lib/format';
import type { CamDevice, CamSession } from '../types';

export default function Monitoring() {
  const { state, assignDevice, startSession, stopSession } = useStore();
  const [now, setNow] = useState(() => new Date());
  const [openSession, setOpenSession] = useState<string | null>(null);
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const online = state.devices.filter((d) => d.status === 'online');
  const todaySessions = state.sessions.filter((s) => new Date(s.startedAt).toDateString() === now.toDateString());
  const flagged = state.sessions.filter((s) => s.flagged);
  const avgDuration = state.sessions.length
    ? state.sessions.reduce((s, x) => s + x.durationMin, 0) / state.sessions.length
    : 0;

  const liveSessionByDevice = useMemo(() => {
    const map = new Map<string, CamSession>();
    state.sessions.forEach((s) => {
      const active = !s.events.some((e) => e.type === 'stop');
      if (active && !map.has(s.deviceId)) map.set(s.deviceId, s);
    });
    return map;
  }, [state.sessions]);

  const sessions = state.sessions
    .filter((s) => !onlyFlagged || s.flagged)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const open = state.sessions.find((s) => s.id === openSession) ?? null;

  return (
    <>
      <section className="grid g-4">
        <StatTile label="Devices online" value={`${online.length}/${state.devices.length}`} foot="portable crew body cams" />
        <StatTile label="Sessions today" value={todaySessions.length} foot={`${state.sessions.length} sessions stored`} />
        <StatTile label="Flagged sessions" value={flagged.length} foot="anomalies to review" accent={flagged.length ? 'var(--critical-ink)' : undefined} />
        <StatTile label="Average duration" value={`${Math.round(avgDuration)} min`} foot="per cleaning session" />
      </section>

      <Card>
        <CardHead
          title="Camera wall"
          sub="Simulated feed — devices stream only while the crew is on site"
        >
          <span className="small muted num">{now.toLocaleTimeString('en-US')}</span>
        </CardHead>
        <div className="grid g-4 card-body">
          {state.devices.map((d) => {
            const staff = state.staff.find((s) => s.id === d.staffId);
            const property = state.properties.find((p) => p.id === d.propertyId);
            const live = liveSessionByDevice.get(d.id);
            const isLive = d.status === 'online' && !!live;
            return (
              <div className="col" key={d.id} style={{ gap: 8 }}>
                <div
                  className={`cam-tile ${d.status === 'online' ? '' : 'off'}`}
                  onClick={() => live && setOpenSession(live.id)}
                  style={{ cursor: live ? 'pointer' : 'default' }}
                >
                  <div className="cam-overlay">
                    <div className="row" style={{ gap: 6 }}>
                      {isLive ? <><i className="rec-dot" /><span>REC</span></> : <span>{d.status === 'charging' ? 'CHARGING' : d.status === 'offline' ? 'DISCONNECTED' : 'STANDBY'}</span>}
                      <span className="spacer">{d.label}</span>
                    </div>
                    <div className="col" style={{ gap: 2 }}>
                      <span className="truncate">{property ? property.name : 'Location unknown'}</span>
                      <div className="row" style={{ gap: 8 }}>
                        <span className="truncate">{staff?.name ?? 'Unassigned'}</span>
                        <span className="spacer">{now.toLocaleTimeString('en-US')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row tiny muted" style={{ gap: 8 }}>
                  <Icon name="battery" size={13} />
                  <span className="num">{d.battery}%</span>
                  <Signal level={d.signal} />
                  <span className="spacer">{relativeTime(d.lastSeen, now.getTime())}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHead title="Body-cam devices" sub="Pair a device with a person, then start a session on arrival" />
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Device</th><th>Assigned to</th><th>Status</th><th className="r">Battery</th><th>Signal</th><th style={{ width: 150 }}>Storage</th><th>Last seen</th><th /></tr>
            </thead>
            <tbody>
              {state.devices.map((d) => {
                const live = liveSessionByDevice.get(d.id);
                return (
                  <tr key={d.id}>
                    <td>
                      <span className="col" style={{ gap: 0 }}>
                        <span className="strong">{d.label}</span>
                        <span className="tiny muted">{d.model} · fw {d.firmware}</span>
                      </span>
                    </td>
                    <td>
                      <select
                        className="select" value={d.staffId ?? ''} style={{ minWidth: 150 }}
                        onChange={(e) => assignDevice(d.id, e.target.value || null)} aria-label={`Assignee for ${d.label}`}
                      >
                        <option value="">— unassigned —</option>
                        {state.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </td>
                    <td><DeviceBadge device={d} /></td>
                    <td className="r">
                      <span className="col" style={{ gap: 3, alignItems: 'flex-end' }}>
                        <span className="num small">{d.battery}%</span>
                        <span style={{ width: 54 }}>
                          <Meter value={d.battery} tone={d.battery < 25 ? 'var(--critical)' : d.battery < 50 ? 'var(--warning)' : 'var(--good)'} />
                        </span>
                      </span>
                    </td>
                    <td><Signal level={d.signal} /></td>
                    <td>
                      <span className="col" style={{ gap: 3 }}>
                        <span className="tiny muted num">{d.storageUsedPct}% used</span>
                        <Meter value={d.storageUsedPct} tone={d.storageUsedPct > 85 ? 'var(--warning)' : undefined} />
                      </span>
                    </td>
                    <td className="small dim">{relativeTime(d.lastSeen)}</td>
                    <td className="r">
                      {live ? (
                        <button className="btn sm danger" onClick={() => stopSession(live.id)}><Icon name="stop" size={12} /> Stop</button>
                      ) : (
                        <button
                          className="btn sm" disabled={d.status === 'offline' || !d.staffId}
                          onClick={() => startSession(d.id, null, d.propertyId ?? state.properties[0].id)}
                        >
                          <Icon name="play" size={12} /> Start session
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="Session history" sub={`${sessions.length} sessions`}>
          <button className={`chip ${onlyFlagged ? 'on' : ''}`} onClick={() => setOnlyFlagged((v) => !v)}>
            <Icon name="alert" size={13} /> Flagged only
          </button>
        </CardHead>
        <div className="list">
          {sessions.length === 0 && <Empty>No recorded sessions yet.</Empty>}
          {sessions.slice(0, 18).map((s) => {
            const device = state.devices.find((d) => d.id === s.deviceId);
            const property = state.properties.find((p) => p.id === s.propertyId);
            const staff = state.staff.find((x) => x.id === device?.staffId);
            const job = state.jobs.find((j) => j.id === s.jobId);
            return (
              <div className="list-item clickable" key={s.id} onClick={() => setOpenSession(s.id)}>
                <Avatar name={staff?.name ?? '??'} />
                <div className="col" style={{ gap: 0, minWidth: 0 }}>
                  <span className="small strong truncate">{property?.name} · {device?.label}</span>
                  <span className="tiny muted truncate">
                    {dateLabel(s.startedAt)} {timeLabel(s.startedAt)} · {s.durationMin} min · {s.clips} clips
                    {job ? ` · ${job.type}` : ''}
                  </span>
                </div>
                <span className="spacer row" style={{ gap: 6 }}>
                  {s.flagged ? <Badge tone="warn" icon="alert">Flagged</Badge> : <Badge tone="good" icon="check">Clean</Badge>}
                  <Icon name="chevron" size={14} className="muted" />
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <SessionDrawer session={open} onClose={() => setOpenSession(null)} />
    </>
  );
}

function DeviceBadge({ device }: { device: CamDevice }) {
  if (device.status === 'online') return <Badge tone="good" icon="check">Online</Badge>;
  if (device.status === 'charging') return <Badge tone="warn" icon="battery">Charging</Badge>;
  return <Badge tone="crit" icon="alert">Offline</Badge>;
}

function SessionDrawer({ session, onClose }: { session: CamSession | null; onClose: () => void }) {
  const { state } = useStore();
  if (!session) return null;

  const device = state.devices.find((d) => d.id === session.deviceId);
  const property = state.properties.find((p) => p.id === session.propertyId);
  const job = state.jobs.find((j) => j.id === session.jobId);
  const staff = state.staff.find((s) => s.id === device?.staffId);
  const verified = job ? job.checklist.filter((c) => c.camVerified && c.done).length : 0;
  const required = job ? job.checklist.filter((c) => c.camVerified).length : 0;

  return (
    <Drawer
      open
      title={`Session ${device?.label ?? ''} · ${property?.name ?? ''}`}
      sub={`${dateLabel(session.startedAt)} ${timeLabel(session.startedAt)} · ${session.durationMin} min`}
      onClose={onClose}
      footer={<span className="small muted">Playback is simulated; production pulls clips from the device.</span>}
    >
      <div className="cam-tile">
        <div className="cam-overlay">
          <div className="row" style={{ gap: 6 }}>
            <i className="rec-dot" /><span>REPLAY</span>
            <span className="spacer">{device?.label}</span>
          </div>
          <div className="col" style={{ gap: 2 }}>
            <span>{property?.name}</span>
            <span>{staff?.name} · {timeLabel(session.startedAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid g-3">
        <Card className="stat"><span className="stat-label">Clips</span><span className="stat-value">{session.clips}</span></Card>
        <Card className="stat"><span className="stat-label">Duration</span><span className="stat-value">{session.durationMin}<span className="small muted"> min</span></span></Card>
        <Card className="stat">
          <span className="stat-label">Verified</span>
          <span className="stat-value">{required ? `${verified}/${required}` : '—'}</span>
          <span className="stat-foot">steps with proof</span>
        </Card>
      </div>

      {session.flagged && (
        <div className="row small" style={{ gap: 8, padding: '10px 12px', borderRadius: 10, background: 'color-mix(in srgb, var(--warning) 14%, transparent)', color: 'var(--warning-ink)' }}>
          <Icon name="alert" size={15} />
          The lens was covered for more than 90 seconds during this session. Review the clips before approving payment.
        </div>
      )}

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}><Icon name="clock" size={14} /> Timeline</div>
        <div className="timeline">
          {session.events.map((e, i) => (
            <div className={`timeline-item ${e.type === 'tamper' || e.type === 'offline' ? 'alert' : e.type === 'stop' ? 'ok' : ''}`} key={i}>
              <span className="num muted tiny">{timeLabel(e.t)}</span>
              <div>{e.note}</div>
            </div>
          ))}
        </div>
      </div>

      {job && (
        <div>
          <div className="section-title" style={{ marginBottom: 8 }}><Icon name="list" size={14} /> Linked job checklist</div>
          <Card>
            <div className="list">
              {job.checklist.map((c) => (
                <div className="list-item" key={c.id}>
                  <Icon name={c.done ? 'check' : 'x'} size={14} className={c.done ? '' : 'muted'} />
                  <span className="small">{c.label}</span>
                  {c.camVerified && <Badge tone="info" icon="video">Proof</Badge>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </Drawer>
  );
}
