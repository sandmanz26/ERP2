import React, { useEffect } from 'react';
import { Icon, type IconName } from './Icon';

export function Card({ children, className = '', ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`card ${className}`} {...rest}>{children}</div>;
}

export function CardHead({ title, sub, children }: { title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="card-head">
      <div className="col" style={{ gap: 2 }}>
        <h2>{title}</h2>
        {sub && <span className="sub">{sub}</span>}
      </div>
      {children && <div className="card-actions">{children}</div>}
    </div>
  );
}

export type Tone = 'neutral' | 'good' | 'warn' | 'serious' | 'crit' | 'info';

export function Badge({ tone = 'neutral', icon, children }: { tone?: Tone; icon?: IconName; children: React.ReactNode }) {
  return (
    <span className={`badge ${tone === 'neutral' ? '' : tone}`}>
      {icon ? <Icon name={icon} size={11} /> : tone !== 'neutral' ? <i className="dot" /> : null}
      {children}
    </span>
  );
}

export function StatTile({
  label, value, foot, delta, accent,
}: { label: string; value: React.ReactNode; foot?: React.ReactNode; delta?: number | null; accent?: string }) {
  return (
    <Card className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={accent ? { color: accent } : undefined}>{value}</span>
      <span className="stat-foot">
        {delta != null && Number.isFinite(delta) && (
          <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
            <Icon name={delta >= 0 ? 'up' : 'down'} size={12} />
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {foot}
      </span>
    </Card>
  );
}

export function Meter({ value, max = 100, tone }: { value: number; max?: number; tone?: string }) {
  const w = Math.max(0, Math.min(100, (value / max) * 100));
  return <div className="meter"><span style={{ width: `${w}%`, background: tone }} /></div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Drawer({
  open, title, sub, onClose, footer, children,
}: {
  open: boolean; title: React.ReactNode; sub?: React.ReactNode; onClose: () => void;
  footer?: React.ReactNode; children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Details'}>
        <div className="drawer-head">
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <h2 className="truncate">{title}</h2>
            {sub && <span className="small muted">{sub}</span>}
          </div>
          <button className="btn ghost icon-btn spacer" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </>
  );
}

export function Modal({
  open, title, onClose, footer, children,
}: { open: boolean; title: string; onClose: () => void; footer?: React.ReactNode; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="card-head">
          <h2>{title}</h2>
          <button className="btn ghost icon-btn card-actions" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="card-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function UnitMark({ name, accent }: { name: string; accent: number }) {
  const initials = name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase();
  return <div className="unit-mark" style={{ background: `var(--s${accent})` }}>{initials}</div>;
}

export function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return <div className="avatar">{initials}</div>;
}

export function Signal({ level }: { level: number }) {
  return (
    <span className="signal" title={`Signal ${level}/4`}>
      {[1, 2, 3, 4].map((i) => (
        <i key={i} className={i <= level ? 'on' : ''} style={{ height: 3 + i * 2 }} />
      ))}
    </span>
  );
}
