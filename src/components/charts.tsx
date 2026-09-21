import { useState } from 'react';

/* ------------------------------------------------------------------
   Chart kit — SVG tangan, tanpa dependensi.
   Aturan yang dipegang: satu sumbu per chart, mark tipis, ujung data
   membulat 4px, jarak 2px antar-bar, grid resesif, legenda untuk >=2
   seri, dan tooltip hover di setiap bentuk.
   ------------------------------------------------------------------ */

export interface Series { name: string; color: string; }

interface TipState { x: number; y: number; title: string; rows: Array<{ name: string; color?: string; value: string }>; }

function useTip() {
  const [tip, setTip] = useState<TipState | null>(null);
  const layer = tip ? (
    <div
      className="tooltip"
      style={{
        left: Math.min(tip.x + 14, window.innerWidth - 190),
        top: Math.max(8, tip.y - 12),
      }}
    >
      <div className="tooltip-title">{tip.title}</div>
      {tip.rows.map((r) => (
        <div className="tooltip-row" key={r.name}>
          <span className="row" style={{ gap: 6 }}>
            {r.color && <i className="swatch" style={{ background: r.color }} />}
            <span className="muted">{r.name}</span>
          </span>
          <b>{r.value}</b>
        </div>
      ))}
    </div>
  ) : null;
  return { tip, setTip, layer };
}

export function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <div className="legend">
      {series.map((s) => (
        <span className="legend-item" key={s.name}>
          <i className="swatch" style={{ background: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / (mag / 2)) * (mag / 2);
}

function barPath(x: number, y: number, w: number, h: number, r = 4): string {
  const rr = Math.min(r, w / 2, Math.max(0, h));
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

/* ---------------- Grouped / stacked vertical bars ---------------- */

export function GroupedBars({
  data, series, height = 220, format, stacked = false,
}: {
  data: Array<{ label: string; values: number[] }>;
  series: Series[];
  height?: number;
  format: (v: number) => string;
  stacked?: boolean;
}) {
  const { setTip, layer } = useTip();
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = height, padL = 54, padR = 8, padT = 12, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;

  const max = niceMax(Math.max(
    1,
    ...data.map((d) => (stacked ? d.values.reduce((a, b) => a + b, 0) : Math.max(...d.values))),
  ));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
  const step = iw / Math.max(1, data.length);
  const groupW = Math.min(52, step * 0.62);
  const barW = stacked ? groupW : (groupW - 2 * (series.length - 1)) / series.length;
  const y = (v: number) => padT + ih - (v / max) * ih;

  return (
    <>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" preserveAspectRatio="xMidYMid meet">
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
            <text className="tick" x={padL - 8} y={y(t) + 3.5} textAnchor="end">{format(t)}</text>
          </g>
        ))}
        <line className="axis-line" x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} />

        {data.map((d, i) => {
          const gx = padL + i * step + (step - groupW) / 2;
          let acc = 0;
          return (
            <g key={d.label} opacity={hover == null || hover === i ? 1 : 0.45}>
              {d.values.map((v, si) => {
                if (stacked) {
                  const yTop = y(acc + v);
                  const h = Math.max(0, y(acc) - yTop - 2);
                  acc += v;
                  return <path key={si} d={barPath(gx, yTop, groupW, h)} fill={series[si].color} />;
                }
                const h = Math.max(0, y(0) - y(v));
                return <path key={si} d={barPath(gx + si * (barW + 2), y(v), barW, h)} fill={series[si].color} />;
              })}
              <rect
                className="hit" x={padL + i * step} y={padT} width={step} height={ih}
                onMouseMove={(e) => {
                  setHover(i);
                  setTip({
                    x: e.clientX, y: e.clientY, title: d.label,
                    rows: series.map((s, si) => ({ name: s.name, color: s.color, value: format(d.values[si]) })),
                  });
                }}
                onMouseLeave={() => { setHover(null); setTip(null); }}
              />
              <text className="tick" x={padL + i * step + step / 2} y={H - 8} textAnchor="middle">{d.label}</text>
            </g>
          );
        })}
      </svg>
      {layer}
    </>
  );
}

/* ---------------- Line trend with crosshair ---------------- */

export function LineTrend({
  data, series, height = 200, format, targetLine,
}: {
  data: Array<{ label: string; values: number[] }>;
  series: Series[];
  height?: number;
  format: (v: number) => string;
  targetLine?: { value: number; label: string };
}) {
  const { setTip, layer } = useTip();
  const [idx, setIdx] = useState<number | null>(null);
  const W = 720, H = height, padL = 46, padR = 12, padT = 14, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  const max = niceMax(Math.max(1, ...data.flatMap((d) => d.values), targetLine?.value ?? 0));
  const x = (i: number) => padL + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => padT + ih - (v / max) * ih;
  const ticks = [0, 0.5, 1].map((f) => max * f);

  return (
    <>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" preserveAspectRatio="xMidYMid meet">
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
            <text className="tick" x={padL - 8} y={y(t) + 3.5} textAnchor="end">{format(t)}</text>
          </g>
        ))}
        {targetLine && (
          <g>
            <line
              x1={padL} x2={W - padR} y1={y(targetLine.value)} y2={y(targetLine.value)}
              stroke="var(--ink-muted)" strokeWidth={1} strokeDasharray="4 4"
            />
            <text className="tick" x={W - padR} y={y(targetLine.value) - 5} textAnchor="end">{targetLine.label}</text>
          </g>
        )}
        {series.map((s, si) => {
          const d = data.map((row, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(row.values[si])}`).join(' ');
          return <path key={s.name} d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />;
        })}
        {idx != null && (
          <g>
            <line className="axis-line" x1={x(idx)} x2={x(idx)} y1={padT} y2={padT + ih} />
            {series.map((s, si) => (
              <circle key={s.name} cx={x(idx)} cy={y(data[idx].values[si])} r={4.5} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
            ))}
          </g>
        )}
        {data.map((d, i) => (
          <g key={d.label}>
            <rect
              className="hit" x={padL + (i - 0.5) * (iw / Math.max(1, data.length - 1))}
              y={padT} width={iw / Math.max(1, data.length - 1)} height={ih}
              onMouseMove={(e) => {
                setIdx(i);
                setTip({
                  x: e.clientX, y: e.clientY, title: d.label,
                  rows: series.map((s, si) => ({ name: s.name, color: s.color, value: format(d.values[si]) })),
                });
              }}
              onMouseLeave={() => { setIdx(null); setTip(null); }}
            />
            <text className="tick" x={x(i)} y={H - 8} textAnchor="middle">{d.label}</text>
          </g>
        ))}
      </svg>
      {layer}
    </>
  );
}

/* ---------------- Ranked horizontal bars ---------------- */

export function RankBars({
  rows, format, diverging = false, rowHeight = 30,
}: {
  rows: Array<{ label: string; value: number; color?: string; note?: string }>;
  format: (v: number) => string;
  diverging?: boolean;
  rowHeight?: number;
}) {
  const { setTip, layer } = useTip();
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  const labelW = 150;
  const valueW = 92;

  return (
    <>
      <div className="col" style={{ gap: 2 }}>
        {rows.map((r) => {
          const w = (Math.abs(r.value) / maxAbs) * 100;
          const neg = r.value < 0;
          const color = r.color ?? (diverging ? (neg ? 'var(--critical)' : 'var(--s1)') : 'var(--s1)');
          return (
            <div
              key={r.label}
              className="row"
              style={{ height: rowHeight, gap: 10 }}
              onMouseMove={(e) => setTip({
                x: e.clientX, y: e.clientY, title: r.label,
                rows: [{ name: r.note ?? 'Nilai', color, value: format(r.value) }],
              })}
              onMouseLeave={() => setTip(null)}
            >
              <span className="small truncate" style={{ width: labelW, flex: 'none' }}>{r.label}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', height: 10, background: 'var(--surface-sunk)', borderRadius: 4 }}>
                  <span style={{
                    display: 'block', height: '100%', width: `${w}%`, background: color,
                    borderRadius: neg ? '4px 0 0 4px' : '0 4px 4px 0',
                  }} />
                </span>
              </span>
              <span className="small num strong" style={{ width: valueW, textAlign: 'right', flex: 'none' }}>
                {format(r.value)}
              </span>
            </div>
          );
        })}
      </div>
      {layer}
    </>
  );
}

/* ---------------- Sparkline (dense, no axis) ---------------- */

export function Sparkline({ values, color = 'var(--s1)', width = 92, height = 26 }: {
  values: number[]; color?: string; width?: number; height?: number;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const d = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / Math.max(1, values.length - 1)) * width},${height - ((v - min) / span) * height}`)
    .join(' ');
  return (
    <svg width={width} height={height} className="chart" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const SERIES_COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)', 'var(--s7)', 'var(--s8)'];

export function TableToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button className="btn ghost sm" onClick={onToggle} aria-expanded={open}>
      {open ? 'Sembunyikan tabel' : 'Lihat sebagai tabel'}
    </button>
  );
}

export function SeriesTable({
  data, series, format,
}: { data: Array<{ label: string; values: number[] }>; series: Series[]; format: (v: number) => string }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Periode</th>
            {series.map((s) => <th key={s.name} className="r">{s.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              {d.values.map((v, i) => <td key={i} className="r">{format(v)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type { TipState };
export { useTip };
export default GroupedBars;
