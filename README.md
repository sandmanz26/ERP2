# Kanopi — Rental Ops for Airbnb Owners with 10+ Houses

An operations console for short-term rental owners: **pricing, cost, financial statements, field jobs, cleaning coverage, and the portable body cams the cleaning crew carries** — on one screen.

> **Frontend only.** No backend. All data is sample data generated deterministically in the browser and kept in `localStorage`. No network calls, no authentication, no OTA integration.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
npm run preview  # serve the build
```

Node 18+. No environment variables, no external services.

## Modules

| Route | What it holds |
|---|---|
| `/dashboard` | Portfolio KPIs, **occupancy per house** (vs each house's target, plus a six-month occupancy trail), revenue vs expenses, attention list, today's schedule, per-house performance with the assigned cleaner |
| `/properties` | House list and detail panel: performance, rate and fee configuration, active channels, recent bookings and jobs |
| `/pricing` | Base rate, weekend uplift, season rules (CRUD), nightly rate calendar, and a price→net-income simulator per booking |
| `/expenses` | Recurring and one-off spend, cost ratio, cost per night sold, breakdown by category and by house, expense entry |
| `/services` | Job board for cleaning, laundry, repairs, and inspections, with checklists whose key steps require camera proof |
| `/team` | **Cleaning coverage**: who covers which house, a clickable coverage matrix, gaps, workload balance, payable per person, and job reassignment |
| `/monitoring` | Camera wall, device registry, pairing devices to people, start/stop sessions, session timeline and anomalies |
| `/financials` | **Income statement** from gross booking value to net income, month-over-month change, six-month trend, cost structure, net income by house, CSV export |
| `/reports` | Occupancy, ADR, RevPAR, channel mix, P&L by house, CSV export |
| `/settings` | Theme, field team, registered devices, data reset, and a plain list of what this build does not do |

## Architecture

```
src/
  types.ts              domain model (house, booking, expense, job, staff, device, camera session)
  lib/
    rng.ts              deterministic PRNG — the sample data is identical on every load
    seed.ts             sample data generator, coverage roster, and the nightly rate formula
    metrics.ts          occupancy, ADR, RevPAR, per-house P&L, and the income statement
    format.ts           currency, dates, relative time
    csv.ts              client-side CSV export
  store/useStore.tsx    global state and localStorage persistence
  components/           UI primitives, icons, and an SVG chart kit (no chart library)
  pages/                the ten module pages
  styles.css            design tokens and layout
```

**Technical decisions**

- No chart library. Charts are hand-built SVG so marks, bar spacing, and tooltips follow one set of rules in both light and dark mode.
- The categorical series palette is validated for colour-vision deficiency; status (good / warning / critical) always ships with an icon and a label, never colour alone.
- The occupancy heatmap scales across the observed range rather than from zero — occupancy lives in a narrow band and a zero-anchored ramp would flatten it.
- `localStorage` access is wrapped in `try/catch`, so the app still runs when storage is blocked (private mode).
- Theme follows the OS preference and can be overridden from the top bar.

## What it does not do

See **Settings → What this build does not do**. In short: no server, no Airbnb/Booking.com integration, no real camera streaming, no authentication, no payout reconciliation.

Product background and build order: [`docs/02-kanopi-product-brief.md`](docs/02-kanopi-product-brief.md).
