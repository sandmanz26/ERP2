import { createContext, useContext, useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Icon, type IconName } from './components/Icon';
import { useStore } from './store/useStore';
import { lastMonths, monthDate, monthKeyOf, type MonthKey } from './lib/metrics';
import { monthName } from './lib/format';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Pricing from './pages/Pricing';
import Expenses from './pages/Expenses';
import Services from './pages/Services';
import Team from './pages/Team';
import Monitoring from './pages/Monitoring';
import Financials from './pages/Financials';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

interface PeriodCtx { month: MonthKey; setMonth: (m: MonthKey) => void; options: MonthKey[]; }
const PeriodContext = createContext<PeriodCtx | null>(null);
export function usePeriod(): PeriodCtx {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error('usePeriod used outside its provider');
  return ctx;
}

interface NavDef { to: string; label: string; icon: IconName; group: string; }

const NAV: NavDef[] = [
  { to: '/dashboard', label: 'Overview', icon: 'dashboard', group: 'Portfolio' },
  { to: '/properties', label: 'Houses', icon: 'house', group: 'Portfolio' },
  { to: '/pricing', label: 'Pricing & seasons', icon: 'tag', group: 'Revenue' },
  { to: '/expenses', label: 'Expenses', icon: 'receipt', group: 'Revenue' },
  { to: '/services', label: 'Jobs', icon: 'broom', group: 'Operations' },
  { to: '/team', label: 'Cleaning team', icon: 'users', group: 'Operations' },
  { to: '/monitoring', label: 'Monitoring', icon: 'video', group: 'Operations' },
  { to: '/financials', label: 'Financials', icon: 'receipt', group: 'Analytics' },
  { to: '/reports', label: 'Performance', icon: 'chart', group: 'Analytics' },
  { to: '/settings', label: 'Settings', icon: 'settings', group: 'Analytics' },
];

const TITLES: Record<string, { title: string; sub: string; period?: boolean }> = {
  '/dashboard': { title: 'Portfolio overview', sub: 'Every house, one screen', period: true },
  '/properties': { title: 'Houses', sub: 'Unit profile, performance, and cost configuration', period: true },
  '/pricing': { title: 'Pricing & seasons', sub: 'Base rates, season rules, and per-booking margin simulation' },
  '/expenses': { title: 'Operating expenses', sub: 'Recurring and one-off spend per house', period: true },
  '/services': { title: 'Field jobs', sub: 'Cleaning, laundry, repairs, and inspections' },
  '/team': { title: 'Cleaning team', sub: 'Who covers which house, workload, and coverage gaps', period: true },
  '/monitoring': { title: 'Monitoring & body cam', sub: 'Portable cameras carried by the cleaning crew' },
  '/financials': { title: 'Financial statement', sub: 'Income statement from gross booking value to net income', period: true },
  '/reports': { title: 'Performance', sub: 'Occupancy, ADR, channel mix, and data export', period: true },
  '/settings': { title: 'Settings', sub: 'Team, devices, preferences, and sample data' },
};

export default function App() {
  const { state, theme, toggleTheme } = useStore();
  const location = useLocation();
  const options = useMemo(() => lastMonths(6), []);
  const [month, setMonth] = useState<MonthKey>(monthKeyOf(new Date()));

  const meta = TITLES[location.pathname] ?? { title: 'Kanopi', sub: '' };
  const openJobs = state.jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress' || j.status === 'overdue').length;
  const camAlerts = state.devices.filter((d) => d.status === 'offline' || d.battery < 20).length;
  const uncovered = state.properties.filter(
    (p) => !state.staff.some((s) => s.role === 'Cleaner' && s.assignedPropertyIds.includes(p.id)),
  ).length;

  const counts: Record<string, number> = { '/services': openJobs, '/monitoring': camAlerts, '/team': uncovered };
  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <PeriodContext.Provider value={{ month, setMonth, options }}>
      <div className="app">
        <nav className="sidebar">
          <div className="brand">
            <div className="brand-mark">K</div>
            <div>
              <div className="brand-name">Kanopi</div>
              <div className="brand-sub">Rental ops · {state.properties.length} houses</div>
            </div>
          </div>

          {groups.map((g) => (
            <div key={g}>
              <div className="nav-label">{g}</div>
              {NAV.filter((n) => n.group === g).map((n) => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Icon name={n.icon} />
                  <span>{n.label}</span>
                  {counts[n.to] ? <span className="nav-count">{counts[n.to]}</span> : null}
                </NavLink>
              ))}
            </div>
          ))}

          <div className="sidebar-foot">
            <div className="row tiny muted" style={{ padding: '2px 10px' }}>
              <Icon name="shield" size={13} />
              <span>Sample data · local to this browser</span>
            </div>
          </div>
        </nav>

        <div className="main">
          <header className="topbar">
            <div className="topbar-title">
              <h1>{meta.title}</h1>
              <span className="topbar-sub">{meta.sub}</span>
            </div>
            <div className="topbar-actions">
              {meta.period && (
                <select className="select" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Select period">
                  {options.map((m) => <option key={m} value={m}>{monthName(monthDate(m))}</option>)}
                </select>
              )}
              <button
                className="btn ghost icon-btn"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
              </button>
            </div>
          </header>

          <main className="page">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/services" element={<Services />} />
              <Route path="/team" element={<Team />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/financials" element={<Financials />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </PeriodContext.Provider>
  );
}
