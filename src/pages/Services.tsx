import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, CardHead, Badge, Drawer, Empty, StatTile, Avatar, Meter } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { dateLabel, relativeTime, rupiah, timeLabel } from '../lib/format';
import type { JobStatus, JobType, ServiceJob } from '../types';

const TYPE: Record<JobType, { label: string; icon: IconName; color: string }> = {
  cleaning: { label: 'Cleaning', icon: 'broom', color: 'var(--s1)' },
  laundry: { label: 'Laundry', icon: 'list', color: 'var(--s3)' },
  maintenance: { label: 'Repair', icon: 'wrench', color: 'var(--s2)' },
  inspection: { label: 'Inspection', icon: 'shield', color: 'var(--s7)' },
};

const COLUMNS: Array<{ key: JobStatus; label: string; tone: 'neutral' | 'info' | 'good' | 'crit' }> = [
  { key: 'scheduled', label: 'Scheduled', tone: 'neutral' },
  { key: 'in_progress', label: 'Running', tone: 'info' },
  { key: 'done', label: 'Done', tone: 'good' },
  { key: 'overdue', label: 'Missed', tone: 'crit' },
];

export default function Services() {
  const { state, setJobStatus, toggleChecklist } = useStore();
  const [typeFilter, setTypeFilter] = useState<'all' | JobType>('all');
  const [propFilter, setPropFilter] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const jobs = state.jobs
    .filter((j) => typeFilter === 'all' || j.type === typeFilter)
    .filter((j) => propFilter === 'all' || j.propertyId === propFilter);

  const week = useMemo(() => {
    const from = Date.now() - 7 * 86400_000;
    return state.jobs.filter((j) => new Date(j.scheduledAt).getTime() >= from);
  }, [state.jobs]);
  const doneRate = week.length ? (week.filter((j) => j.status === 'done').length / week.length) * 100 : 0;
  const weekCost = week.reduce((s, j) => s + j.cost, 0);
  const recorded = week.filter((j) => j.sessionId).length;

  const open = state.jobs.find((j) => j.id === openId) ?? null;

  return (
    <>
      <section className="grid g-4">
        <StatTile label="Jobs in 7 days" value={week.length} foot={`${week.filter((j) => j.status === 'done').length} completed`} />
        <StatTile label="Completion rate" value={`${doneRate.toFixed(0)}%`} foot="last 7 days" />
        <StatTile label="Service cost" value={rupiah(weekCost, { compact: true })} foot="labour + materials" />
        <StatTile
          label="Body-cam coverage"
          value={week.length ? `${Math.round((recorded / week.length) * 100)}%` : '—'}
          foot={`${recorded} of ${week.length} jobs`}
        />
      </section>

      <Card>
        <CardHead title="Job board" sub="Start with the missed column, then work left to right">
          <select className="select" value={propFilter} onChange={(e) => setPropFilter(e.target.value)} aria-label="Filter by house">
            <option value="all">All houses</option>
            {state.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="row-wrap">
            <button className={`chip ${typeFilter === 'all' ? 'on' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
            {(Object.keys(TYPE) as JobType[]).map((t) => (
              <button key={t} className={`chip ${typeFilter === t ? 'on' : ''}`} onClick={() => setTypeFilter(t)}>
                <i className="swatch" style={{ background: TYPE[t].color }} />{TYPE[t].label}
              </button>
            ))}
          </div>
        </CardHead>

        <div className="card-body">
          <div className="board">
            {COLUMNS.map((col) => {
              const items = jobs
                .filter((j) => j.status === col.key)
                .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
              return (
                <div className="board-col" key={col.key}>
                  <div className="board-head">
                    <Badge tone={col.tone}>{col.label}</Badge>
                    <span className="spacer tiny muted num">{items.length}</span>
                  </div>
                  {items.length === 0 && <p className="tiny muted" style={{ padding: '6px 4px' }}>Empty</p>}
                  {items.slice(0, 14).map((j) => {
                    const p = state.properties.find((x) => x.id === j.propertyId);
                    const s = state.staff.find((x) => x.id === j.staffId);
                    const done = j.checklist.filter((c) => c.done).length;
                    return (
                      <div className="job-card" key={j.id} onClick={() => setOpenId(j.id)}>
                        <div className="row" style={{ gap: 7 }}>
                          <Icon name={TYPE[j.type].icon} size={14} />
                          <span className="small strong truncate">{TYPE[j.type].label}</span>
                          {j.sessionId && <Icon name="video" size={13} className="spacer" />}
                        </div>
                        <span className="tiny muted truncate">{p?.name}</span>
                        <div className="row tiny muted" style={{ gap: 6 }}>
                          <Icon name="clock" size={12} />
                          <span className="num">{dateLabel(j.scheduledAt)} · {timeLabel(j.scheduledAt)}</span>
                        </div>
                        <Meter value={done} max={j.checklist.length} tone={done === j.checklist.length ? 'var(--good)' : undefined} />
                        <div className="row tiny muted" style={{ gap: 6 }}>
                          <Avatar name={s?.name ?? '?'} />
                          <span className="truncate">{s?.name}</span>
                          <span className="spacer num">{rupiah(j.cost, { compact: true })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <JobDrawer
        job={open}
        onClose={() => setOpenId(null)}
        onStatus={setJobStatus}
        onToggle={toggleChecklist}
      />
    </>
  );
}

function JobDrawer({
  job, onClose, onStatus, onToggle,
}: {
  job: ServiceJob | null; onClose: () => void;
  onStatus: (id: string, s: JobStatus) => void; onToggle: (jobId: string, itemId: string) => void;
}) {
  const { state } = useStore();
  const navigate = useNavigate();
  if (!job) return null;

  const property = state.properties.find((p) => p.id === job.propertyId);
  const staff = state.staff.find((s) => s.id === job.staffId);
  const session = state.sessions.find((s) => s.id === job.sessionId);
  const device = state.devices.find((d) => d.staffId === job.staffId);
  const done = job.checklist.filter((c) => c.done).length;

  return (
    <Drawer
      open
      title={`${TYPE[job.type].label} · ${property?.name ?? ''}`}
      sub={`${dateLabel(job.scheduledAt)} ${timeLabel(job.scheduledAt)} · ${job.durationMin} min · ${relativeTime(job.scheduledAt)}`}
      onClose={onClose}
      footer={
        <>
          {job.status !== 'done' && (
            <button className="btn primary" onClick={() => { onStatus(job.id, 'done'); onClose(); }}>
              <Icon name="check" size={14} /> Mark done
            </button>
          )}
          {job.status === 'scheduled' && (
            <button className="btn" onClick={() => onStatus(job.id, 'in_progress')}><Icon name="play" size={13} /> Start</button>
          )}
          {job.status === 'done' && (
            <button className="btn" onClick={() => onStatus(job.id, 'scheduled')}><Icon name="refresh" size={13} /> Reopen</button>
          )}
        </>
      }
    >
      <div className="grid g-2">
        <Card className="stat">
          <span className="stat-label">Checklist progress</span>
          <span className="stat-value">{done}/{job.checklist.length}</span>
          <span className="stat-foot">{job.checklist.filter((c) => c.camVerified).length} steps need camera proof</span>
        </Card>
        <Card className="stat">
          <span className="stat-label">Job cost</span>
          <span className="stat-value">{rupiah(job.cost, { compact: true })}</span>
          <span className="stat-foot">{staff?.name} · {staff?.role}</span>
        </Card>
      </div>

      {job.note && (
        <div className="row small" style={{ gap: 8, padding: '10px 12px', background: 'var(--surface-sunk)', borderRadius: 10 }}>
          <Icon name="alert" size={14} /> {job.note}
        </div>
      )}

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}><Icon name="list" size={14} /> Checklist</div>
        <Card>
          <div className="list">
            {job.checklist.map((c) => (
              <label className="list-item clickable" key={c.id}>
                <input type="checkbox" checked={c.done} onChange={() => onToggle(job.id, c.id)} />
                <span className={`small ${c.done ? 'muted' : ''}`} style={{ textDecoration: c.done ? 'line-through' : undefined }}>
                  {c.label}
                </span>
                {c.camVerified && <Badge tone="info" icon="video">Camera proof</Badge>}
              </label>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}><Icon name="video" size={14} /> Body-cam footage</div>
        <Card>
          {session ? (
            <div className="card-body col" style={{ gap: 10 }}>
              <div className="row">
                <Badge tone={session.flagged ? 'warn' : 'good'} icon={session.flagged ? 'alert' : 'check'}>
                  {session.flagged ? 'Anomaly found' : 'Clean'}
                </Badge>
                <span className="small muted spacer num">{session.clips} clips · {session.durationMin} min</span>
              </div>
              <div className="timeline">
                {session.events.map((e, i) => (
                  <div className={`timeline-item ${e.type === 'tamper' ? 'alert' : e.type === 'stop' ? 'ok' : ''}`} key={i}>
                    <span className="num muted tiny">{timeLabel(e.t)}</span>
                    <div>{e.note}</div>
                  </div>
                ))}
              </div>
              <button className="btn" onClick={() => navigate('/monitoring')}>
                <Icon name="video" size={14} /> Open in monitoring
              </button>
            </div>
          ) : (
            <div className="card-body col" style={{ gap: 10 }}>
              <Empty>No recorded session for this job yet.</Empty>
              <span className="small muted row" style={{ gap: 6 }}>
                <Icon name="video" size={14} />
                {device ? `${device.label} is paired with ${staff?.name}.` : 'This person has no body cam paired.'}
              </span>
              <button className="btn" onClick={() => navigate('/monitoring')}>Manage devices</button>
            </div>
          )}
        </Card>
      </div>
    </Drawer>
  );
}
