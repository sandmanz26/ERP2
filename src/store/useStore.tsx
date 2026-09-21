import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppState, CamSession, Expense, Property, Season, ServiceJob } from '../types';
import { buildSeedState } from '../lib/seed';

const STORAGE_KEY = 'kanopi.state.v1';
const THEME_KEY = 'kanopi.theme.v1';

type Theme = 'light' | 'dark';

interface StoreValue {
  state: AppState;
  theme: Theme;
  toggleTheme: () => void;
  resetData: () => void;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  addExpense: (e: Omit<Expense, 'id'>) => void;
  removeExpense: (id: string) => void;
  upsertSeason: (s: Season) => void;
  removeSeason: (id: string) => void;
  setJobStatus: (id: string, status: ServiceJob['status']) => void;
  toggleChecklist: (jobId: string, itemId: string) => void;
  assignDevice: (deviceId: string, staffId: string | null) => void;
  startSession: (deviceId: string, jobId: string | null, propertyId: string) => void;
  stopSession: (sessionId: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    /* storage bisa diblokir (private mode) — jatuh ke data contoh */
  }
  return buildSeedState();
}

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY) as Theme | null;
    if (raw === 'light' || raw === 'dark') return raw;
  } catch { /* abaikan */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* abaikan */ }
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* abaikan */ }
  }, [theme]);

  const patch = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);

  const value = useMemo<StoreValue>(() => ({
    state,
    theme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    resetData: () => setState(buildSeedState()),

    updateProperty: (id, p) =>
      patch((s) => ({ ...s, properties: s.properties.map((x) => (x.id === id ? { ...x, ...p } : x)) })),

    addExpense: (e) =>
      patch((s) => ({ ...s, expenses: [{ ...e, id: `e${Date.now().toString(36)}` }, ...s.expenses] })),

    removeExpense: (id) => patch((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) })),

    upsertSeason: (season) =>
      patch((s) => ({
        ...s,
        seasons: s.seasons.some((x) => x.id === season.id)
          ? s.seasons.map((x) => (x.id === season.id ? season : x))
          : [...s.seasons, season],
      })),

    removeSeason: (id) => patch((s) => ({ ...s, seasons: s.seasons.filter((x) => x.id !== id) })),

    setJobStatus: (id, status) =>
      patch((s) => ({
        ...s,
        jobs: s.jobs.map((j) =>
          j.id === id
            ? { ...j, status, checklist: status === 'done' ? j.checklist.map((c) => ({ ...c, done: true })) : j.checklist }
            : j,
        ),
      })),

    toggleChecklist: (jobId, itemId) =>
      patch((s) => ({
        ...s,
        jobs: s.jobs.map((j) =>
          j.id === jobId
            ? { ...j, checklist: j.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)) }
            : j,
        ),
      })),

    assignDevice: (deviceId, staffId) =>
      patch((s) => ({ ...s, devices: s.devices.map((d) => (d.id === deviceId ? { ...d, staffId } : d)) })),

    startSession: (deviceId, jobId, propertyId) =>
      patch((s) => {
        const session: CamSession = {
          id: `sess${Date.now().toString(36)}`,
          deviceId,
          jobId,
          propertyId,
          startedAt: new Date().toISOString(),
          durationMin: 0,
          clips: 0,
          flagged: false,
          events: [{ t: new Date().toISOString(), type: 'start', note: 'Sesi dimulai manual dari konsol' }],
        };
        return {
          ...s,
          sessions: [session, ...s.sessions],
          devices: s.devices.map((d) => (d.id === deviceId ? { ...d, status: 'online', propertyId } : d)),
          jobs: jobId ? s.jobs.map((j) => (j.id === jobId ? { ...j, sessionId: session.id } : j)) : s.jobs,
        };
      }),

    stopSession: (sessionId) =>
      patch((s) => ({
        ...s,
        sessions: s.sessions.map((x) =>
          x.id === sessionId
            ? {
                ...x,
                durationMin: Math.max(1, Math.round((Date.now() - new Date(x.startedAt).getTime()) / 60_000)),
                events: [...x.events, { t: new Date().toISOString(), type: 'stop', note: 'Sesi dihentikan dari konsol' }],
              }
            : x,
        ),
      })),
  }), [state, theme, patch]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore harus dipakai di dalam StoreProvider');
  return ctx;
}
