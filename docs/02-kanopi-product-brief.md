# Kanopi — Product Brief

> A rental management system for Airbnb owners running **more than 10 houses**.
> This build: web, frontend only, sample data in the browser.

---

## 1. Who it is for

**Owner-operators with 10–40 houses.** Not the single-villa host (not hurting yet), not a hotel chain (already has a PMS). The profile:

- Listings spread across channels; Airbnb dominant, the rest Booking.com and direct.
- Three to eight people in the field: cleaners, laundry, technicians, one supervisor.
- Knows revenue, **does not know profit per house**. Cost is scattered across WhatsApp, paper receipts, and three spreadsheets.
- Not on site. Visibility into what actually happens inside the house is zero.

Past ten houses two things break at once: **the money no longer fits in your head**, and **quality can no longer be checked by showing up**. Kanopi attacks exactly those two.

## 2. The problems it works on

| # | Problem | How it shows up in the product |
|---|---|---|
| 1 | Rates are set once and forgotten; weekends and peak seasons are left on the table | Base rate + weekend uplift + season rules, shown as a nightly rate calendar |
| 2 | The owner knows revenue, not **profit** | A real income statement: gross booking value → commission → operating cost → tax → net income, per house and consolidated |
| 3 | Cost leaks without a trail | Recurring vs one-off expense log, cost ratio, cost per night sold, ranked by category and by house |
| 4 | A single booking can lose money without anyone noticing | Simulator: from what the guest pays down to net income, with commission and variable cost laid out |
| 5 | Nobody knows who is responsible for which house | Coverage matrix of crew against houses, coverage gaps surfaced as critical alerts, workload balance, per-person payable, job reassignment |
| 6 | Field work is unverified, and there are no eyes inside the house | Job checklists where key steps require camera proof, plus portable body cams recording one session per job |
| 7 | Occupancy is a portfolio-level number, so weak houses hide behind strong ones | Occupancy per house against each house's own target, plus a six-month occupancy trail across the portfolio |

## 3. Why portable body cams, not fixed CCTV

Permanent cameras inside a rental are **a legal and trust problem** — Airbnb bans cameras in interior spaces. So the camera must not live in the house; it **arrives with the cleaner and leaves with the cleaner**.

Design consequences:

- The camera belongs to the operation, not the property. The registry maps device → person, not device → room.
- Footage is bound to a **work session**, not to a 24-hour window. One session equals one job.
- The value is not continuous surveillance but **evidence**: arrival condition, critical steps, final condition, door locked — exactly what is needed when a guest claims a missing item or a dirty house.
- Anomalies (lens covered, device leaving the property geofence, a session ending abruptly) are flagged for review **before the job is paid**.

## 4. Scope of this build

**Included:** the ten modules listed in the README. All of them are interactive: change rates, add season rules, log expenses, move jobs across the board, tick checklists, assign a cleaner to a house, reassign a job, pair a device, start and stop sessions, export CSV.

**Deliberately excluded:** server, authentication, channel integration, real camera streaming, payout reconciliation, full accounting, crew mobile app. All of it is listed openly in Settings so nothing is oversold in a demo.

## 5. Design principles held

1. **Numbers that get decided on, not numbers that exist.** Each screen answers one owner question: which house loses money, which cost is swelling, which job was missed, who covers which house.
2. **Losses are shown, not hidden.** Negative net income is coloured critical, thin margins get a badge, occupancy below target raises a warning, and an uncovered house is a critical alert.
3. **Status is never colour alone.** Every badge carries an icon and a word — required for colour-blind readers and for print.
4. **One axis per chart.** Rupiah and percent never share a scale.
5. **Dense but quiet.** Tight tables with right-aligned tabular figures; grid lines and axes stay recessive so the data reads first.

## 6. Build order from here

```
Phase 1 (this build) : local read-write console — pricing, cost, financials, coverage, monitoring
Phase 2              : backend, auth, roles (owner, supervisor, crew)
                       crew mobile app: checklist, photos, start/stop camera session
Phase 3              : channel integration (Airbnb/Booking via a channel manager),
                       payout reconciliation against bookings and commission
Phase 4              : real camera gateway (WebRTC/RTSP), time-bounded clip storage,
                       retention and access policy
Phase 5              : owner statements (for third-party-owned houses), local tax, full accounting
```

What comes first is not the most impressive piece but the one that stops the bleeding soonest: **pricing and cost first, cameras after, as the quality guard.**

## 7. What success looks like

- The owner can answer "which house lost money last month" in under 30 seconds without opening a spreadsheet.
- Every house has a named cleaner, and every cleaning job has visual proof of arrival and departure condition.
- The gap between recorded cost and actual cost falls below 10% within two months of use.
