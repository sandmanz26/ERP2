import { createContext, useContext, useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Icon, type IconName } from './components/Icon';
import { useStore } from './store/useStore';
import { lastMonths, monthDate, monthKeyOf, type MonthKey } from './lib/metrics';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Pricing from './pages/Pricing';
import Expenses from './pages/Expenses';
import Services from './pages/Services';
import Monitoring from './pages/Monitoring';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

interface PeriodCtx { month: MonthKey; setMonth: (m: MonthKey) => void; options: MonthKey[]; }
const PeriodContext = createContext<PeriodCtx | null>(null);
export function usePeriod(): PeriodCtx {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error('usePeriod di luar provider');
  return ctx;
}

interface NavDef { to: string; label: string; icon: IconName; group: string; }

const NAV: NavDef[] = [
  { to: '/dashboard', label: 'Ringkasan', icon: 'dashboard', group: 'Portofolio' },
  { to: '/properties', label: 'Properti', icon: 'house', group: 'Portofolio' },
  { to: '/pricing', label: 'Harga & Musim', icon: 'tag', group: 'Pendapatan' },
  { to: '/expenses', label: 'Biaya', icon: 'receipt', group: 'Pendapatan' },
  { to: '/services', label: 'Layanan', icon: 'broom', group: 'Operasi' },
  { to: '/monitoring', label: 'Monitoring', icon: 'video', group: 'Operasi' },
  { to: '/reports', label: 'Laporan', icon: 'chart', group: 'Analitik' },
  { to: '/settings', label: 'Pengaturan', icon: 'settings', group: 'Analitik' },
];

const TITLES: Record<string, { title: string; sub: string; period?: boolean }> = {
  '/dashboard': { title: 'Ringkasan portofolio', sub: 'Kondisi seluruh unit dalam satu layar', period: true },
  '/properties': { title: 'Properti', sub: 'Profil unit, performa, dan konfigurasi biaya', period: true },
  '/pricing': { title: 'Harga & musim', sub: 'Harga dasar, aturan musim, dan simulasi margin per malam' },
  '/expenses': { title: 'Biaya operasional', sub: 'Pengeluaran rutin dan insidental per unit', period: true },
  '/services': { title: 'Layanan lapangan', sub: 'Cleaning, laundry, perbaikan, dan inspeksi' },
  '/monitoring': { title: 'Monitoring & body cam', sub: 'Perangkat portabel yang dibawa petugas kebersihan' },
  '/reports': { title: 'Laporan', sub: 'Laba rugi per unit, okupansi, dan ekspor data', period: true },
  '/settings': { title: 'Pengaturan', sub: 'Tim, perangkat, preferensi, dan data contoh' },
};

export default function App() {
  const { state, theme, toggleTheme } = useStore();
  const location = useLocation();
  const options = useMemo(() => lastMonths(6), []);
  const [month, setMonth] = useState<MonthKey>(monthKeyOf(new Date()));

  const meta = TITLES[location.pathname] ?? { title: 'Kanopi', sub: '' };
  const openJobs = state.jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress' || j.status === 'overdue').length;
  const camAlerts = state.devices.filter((d) => d.status === 'offline' || d.battery < 20).length;

  const counts: Record<string, number> = { '/services': openJobs, '/monitoring': camAlerts };
  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <PeriodContext.Provider value={{ month, setMonth, options }}>
      <div className="app">
        <nav className="sidebar">
          <div className="brand">
            <div className="brand-mark">K</div>
            <div>
              <div className="brand-name">Kanopi</div>
              <div className="brand-sub">Rental ops · {state.properties.length} unit</div>
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
              <span>Data contoh · lokal di browser</span>
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
                <select className="select" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Pilih periode">
                  {options.map((m) => (
                    <option key={m} value={m}>
                      {monthDate(m).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              )}
              <button
                className="btn ghost icon-btn"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
                title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
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
              <Route path="/monitoring" element={<Monitoring />} />
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
