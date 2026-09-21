import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { usePeriod } from '../App';
import { Card, CardHead, Badge, StatTile, Empty, Avatar, Meter, UnitMark } from '../components/ui';
import { RankBars } from '../components/charts';
import { Icon } from '../components/Icon';
import { dateLabel, pct, rupiah, timeLabel } from '../lib/format';
import type { StaffRole } from '../types';

const ROLES: StaffRole[] = ['Cleaner', 'Technician', 'Laundry', 'Supervisor'];

const JOB_LABEL: Record<string, string> = {
  cleaning: 'Cleaning', laundry: 'Laundry', maintenance: 'Repair', inspection: 'Inspection',
};

export default function Team() {
  const { state, toggleCoverage, reassignJob } = useStore();
  const { month } = usePeriod();
  const [role, setRole] = useState<StaffRole>('Cleaner');

  const crew = state.staff.filter((s) => s.role === role);
  const cleaners = state.staff.filter((s) => s.role === 'Cleaner');

  const uncovered = state.properties.filter(
    (p) => !cleaners.some((s) => s.assignedPropertyIds.includes(p.id)),
  );

  const monthJobs = state.jobs.filter((j) => j.scheduledAt.slice(0, 7) === month);
  const perStaff = useMemo(() => state.staff.map((s) => {
    const jobs = monthJobs.filter((j) => j.staffId === s.id);
    const done = jobs.filter((j) => j.status === 'done').length;
    const missed = jobs.filter((j) => j.status === 'overdue').length;
    const sessions = state.sessions.filter((x) => {
      const device = state.devices.find((d) => d.id === x.deviceId);
      return device?.staffId === s.id;
    });
    return {
      staff: s,
      jobs: jobs.length,
      done,
      missed,
      flagged: sessions.filter((x) => x.flagged).length,
      payout: jobs.filter((j) => j.status === 'done').length * s.ratePerJob,
    };
  }), [state.staff, state.sessions, state.devices, monthJobs]);

  const upcoming = state.jobs
    .filter((j) => j.status === 'scheduled' || j.status === 'overdue')
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    .slice(0, 12);

  const totalJobs = monthJobs.length;
  const avgPerCleaner = cleaners.length ? monthJobs.filter((j) => j.type === 'cleaning').length / cleaners.length : 0;
  const onTime = state.staff.length
    ? state.staff.reduce((s, x) => s + x.onTimePct, 0) / state.staff.length
    : 0;

  return (
    <>
      <section className="grid g-4">
        <StatTile label="Field crew" value={state.staff.length} foot={`${cleaners.length} cleaners`} />
        <StatTile
          label="Houses covered"
          value={`${state.properties.length - uncovered.length}/${state.properties.length}`}
          foot={uncovered.length ? `${uncovered.length} without a cleaner` : 'full coverage'}
          accent={uncovered.length ? 'var(--critical-ink)' : undefined}
        />
        <StatTile label="Cleaning jobs per cleaner" value={avgPerCleaner.toFixed(1)} foot={`${totalJobs} jobs this month`} />
        <StatTile label="Average on-time rate" value={pct(onTime)} foot="across the whole crew" />
      </section>

      {uncovered.length > 0 && (
        <Card>
          <CardHead title="Coverage gaps" sub="These houses have no cleaner on the roster — every turnover is improvised" />
          <div className="list">
            {uncovered.map((p) => (
              <div className="list-item" key={p.id}>
                <UnitMark name={p.name} accent={p.accent} />
                <div className="col" style={{ gap: 0 }}>
                  <span className="small strong">{p.name}</span>
                  <span className="tiny muted">{p.area}, {p.city} · {p.bedrooms} bedrooms</span>
                </div>
                <Badge tone="crit" icon="alert">No cleaner assigned</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHead title="Coverage matrix" sub="Tap a cell to assign or unassign a house. Changes apply immediately.">
          <div className="row-wrap">
            {ROLES.map((r) => (
              <button key={r} className={`chip ${role === r ? 'on' : ''}`} onClick={() => setRole(r)}>{r}</button>
            ))}
          </div>
        </CardHead>
        <div className="table-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th className="house">House</th>
                {crew.map((s) => <th className="person" key={s.id}>{s.name.split(' ').slice(0, 2).join(' ')}</th>)}
              </tr>
            </thead>
            <tbody>
              {state.properties.map((p) => {
                const covered = crew.filter((s) => s.assignedPropertyIds.includes(p.id)).length;
                return (
                  <tr key={p.id}>
                    <td className="house">
                      <span className="row" style={{ gap: 9 }}>
                        <UnitMark name={p.name} accent={p.accent} />
                        <span className="col" style={{ gap: 0 }}>
                          <span className="strong">{p.name}</span>
                          <span className="tiny muted">{p.city}</span>
                        </span>
                        {covered === 0 && role === 'Cleaner' && <Badge tone="crit" icon="alert">Gap</Badge>}
                      </span>
                    </td>
                    {crew.map((s) => {
                      const on = s.assignedPropertyIds.includes(p.id);
                      return (
                        <td key={s.id}>
                          <button
                            className={`cover-dot ${on ? 'on' : ''}`}
                            onClick={() => toggleCoverage(s.id, p.id)}
                            aria-label={`${on ? 'Unassign' : 'Assign'} ${s.name} from ${p.name}`}
                            aria-pressed={on}
                          >
                            <Icon name="check" size={13} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid g-main">
        <Card>
          <CardHead title="Crew" sub="Assigned houses, workload, and payable this month" />
          <div className="list">
            {perStaff.map((r) => {
              const device = state.devices.find((d) => d.staffId === r.staff.id);
              return (
                <div className="list-item" key={r.staff.id} style={{ alignItems: 'flex-start' }}>
                  <Avatar name={r.staff.name} />
                  <div className="col" style={{ gap: 6, minWidth: 0, flex: 1 }}>
                    <div className="row">
                      <span className="small strong">{r.staff.name}</span>
                      <Badge>{r.staff.role}</Badge>
                      {r.missed > 0 && <Badge tone="crit" icon="alert">{r.missed} missed</Badge>}
                      {r.flagged > 0 && <Badge tone="warn" icon="video">{r.flagged} flagged</Badge>}
                      <span className="spacer small num strong">{rupiah(r.payout, { compact: true })}</span>
                    </div>
                    <div className="row-wrap" style={{ gap: 5 }}>
                      {r.staff.assignedPropertyIds.length === 0 && <span className="tiny muted">No houses assigned</span>}
                      {r.staff.assignedPropertyIds.map((id) => {
                        const p = state.properties.find((x) => x.id === id);
                        if (!p) return null;
                        return <span className="badge" key={id}><i className="swatch" style={{ background: `var(--s${p.accent})` }} />{p.name}</span>;
                      })}
                    </div>
                    <div className="row tiny muted" style={{ gap: 10 }}>
                      <span>{r.done}/{r.jobs} jobs done</span>
                      <span>{pct(r.staff.onTimePct)} on time</span>
                      <span>★ {r.staff.rating.toFixed(1)}</span>
                      <span>{rupiah(r.staff.ratePerJob, { compact: true })}/job</span>
                      {device && <span>{device.label}</span>}
                    </div>
                    <Meter value={r.done} max={Math.max(1, r.jobs)} tone={r.missed ? 'var(--warning)' : 'var(--good)'} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHead title="Workload balance" sub="Jobs this month per crew member" />
          <div className="card-body">
            <RankBars
              rows={perStaff
                .slice()
                .sort((a, b) => b.jobs - a.jobs)
                .map((r) => ({ label: r.staff.name, value: r.jobs, note: 'Jobs assigned' }))}
              format={(v) => String(v)}
              rowHeight={28}
            />
          </div>
        </Card>
      </section>

      <Card>
        <CardHead title="Upcoming jobs" sub="Reassign here when someone is off or a house changes hands" />
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>When</th><th>House</th><th>Job</th><th>Assigned to</th><th>Status</th><th className="r">Cost</th></tr>
            </thead>
            <tbody>
              {upcoming.length === 0 && <tr><td colSpan={6}><Empty>Nothing upcoming.</Empty></td></tr>}
              {upcoming.map((j) => {
                const p = state.properties.find((x) => x.id === j.propertyId);
                const eligible = state.staff.filter(
                  (s) => s.assignedPropertyIds.includes(j.propertyId) || s.id === j.staffId,
                );
                return (
                  <tr key={j.id}>
                    <td className="small num dim">{dateLabel(j.scheduledAt)} · {timeLabel(j.scheduledAt)}</td>
                    <td className="strong">{p?.name}</td>
                    <td><Badge>{JOB_LABEL[j.type]}</Badge></td>
                    <td>
                      <select
                        className="select" value={j.staffId} style={{ minWidth: 160 }}
                        onChange={(e) => reassignJob(j.id, e.target.value)}
                        aria-label={`Assignee for ${p?.name}`}
                      >
                        <option value="">— unassigned —</option>
                        {eligible.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        <optgroup label="Outside the roster">
                          {state.staff.filter((s) => !eligible.includes(s)).map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </optgroup>
                      </select>
                    </td>
                    <td>{j.status === 'overdue' ? <Badge tone="crit">Missed</Badge> : <Badge>Scheduled</Badge>}</td>
                    <td className="r num">{rupiah(j.cost, { compact: true })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
