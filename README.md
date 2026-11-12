# VARLOS · Kitchen Manager & Live KDS

Production-ready Kitchen Display System for the VARLOS Smart Canteen. Student orders are grouped by **reserved table** and **15-minute time slot**, with a live countdown, SLA color states, batch preparation aggregation, and a one-click **"Notify User (5 Mins Before Ready)"** push workflow.

## Stack

- **Next.js 14** App Router + TypeScript (strict)
- **Tailwind CSS** + shadcn/ui primitives + **Lucide** icons
- **Zustand** store with **Supabase Realtime Broadcast** and a **BroadcastChannel** offline fallback
- **Web Audio API** beep generator + **Sonner** toasts
- No database required for the demo — seeded mock data is anchored to the current clock

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it redirects straight to `/kitchen`.

Production check:

```bash
npm run typecheck
npm run build
npm run start
```

## Screens

| Route | Purpose |
| --- | --- |
| `/kitchen` | Slot-sorted table order grid, live countdowns, 5-min notify action, batch prep sidebar |
| `/kitchen/tables` | 2D floor matrix with assigned orders and per-table slot timers |
| `/kitchen/inventory` | One-click stock kill-switch (86'ing) and station capacity controls |

## Demo flow (judges)

1. The seeded **current slot** contains overdue/slipping tickets — point out the SLA border colors and negative countdowns.
2. Press **Notify now (5-min)** on a due ticket. A toast fires, a Web Audio alert plays, the ticket becomes *Almost Ready*, and the student phone preview updates instantly.
3. Open **Demo → Spawn urgent order (5-min window)** to create a fresh ticket with a live `04:59` countdown.
4. Advance a ticket to **Ready** — the student phone receives a ready push, and the floor table frees up after **Mark Served**.
5. Toggle an item off in **Inventory** to 86 it, and adjust station capacity with the steppers.

## Realtime

The store broadcasts snapshots on every mutation over:

1. **Supabase Realtime Broadcast** when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
2. **BroadcastChannel** (`varlos-kitchen-kds`) always, so the demo syncs across tabs with zero configuration.

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in a local
`.env.local` file to enable Supabase. Environment files are intentionally not
committed.

## Architecture

```
src/
├── types/kitchen.ts                 Strict Order / Table / Slot / Notification models
├── lib/
│   ├── kitchen-store.ts             Zustand store + BroadcastChannel/Supabase sync
│   ├── time-slot-utils.ts           Countdown, T-5 detector, SLA + slot aggregation
│   ├── mock-kitchen-data.ts         Live seeded orders, floor, stock, alert history
│   ├── kitchen-ui.ts                Status/station/SLA presentation metadata
│   ├── kitchen-audio.ts             Web Audio alert tones
│   └── utils.ts                     cn()
├── app/kitchen/                     Layout, KDS, floor, inventory routes
└── components/kitchen/              Command bar, order card, slot tabs,
                                     batch sidebar, student phone simulator
```
