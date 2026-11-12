import type { OrderStatus, SlaLevel, StationType } from "@/types/kitchen";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    nextStatus: OrderStatus | null;
    nextLabel: string | null;
  }
> = {
  RECEIVED: {
    label: "New Order",
    shortLabel: "New",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    nextStatus: "PREPARING",
    nextLabel: "Start Preparing",
  },
  PREPARING: {
    label: "Preparing",
    shortLabel: "Prep",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    nextStatus: "ALMOST_READY",
    nextLabel: "Mark Almost Ready",
  },
  ALMOST_READY: {
    label: "Almost Ready",
    shortLabel: "Almost",
    badgeClass: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    nextStatus: "READY",
    nextLabel: "Mark Ready",
  },
  READY: {
    label: "Ready to Serve",
    shortLabel: "Ready",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    nextStatus: "SERVED",
    nextLabel: "Mark Served",
  },
  SERVED: {
    label: "Served",
    shortLabel: "Served",
    badgeClass: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
    nextStatus: null,
    nextLabel: null,
  },
};

export const STATUS_PIPELINE: OrderStatus[] = [
  "RECEIVED",
  "PREPARING",
  "ALMOST_READY",
  "READY",
  "SERVED",
];

export const STATION_META: Record<
  StationType,
  { label: string; dotClass: string; textClass: string; chipClass: string }
> = {
  GRILL: {
    label: "Grill",
    dotClass: "bg-amber-400",
    textClass: "text-amber-300",
    chipClass: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  },
  FRYER: {
    label: "Fryer",
    dotClass: "bg-rose-400",
    textClass: "text-rose-300",
    chipClass: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  },
  BEVERAGE: {
    label: "Beverage",
    dotClass: "bg-cyan-400",
    textClass: "text-cyan-300",
    chipClass: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
  },
  ALL: {
    label: "All-Rounder",
    dotClass: "bg-violet-400",
    textClass: "text-violet-300",
    chipClass: "border-violet-500/25 bg-violet-500/10 text-violet-300",
  },
};

export const SLA_META: Record<
  SlaLevel,
  {
    label: string;
    borderClass: string;
    textClass: string;
    chipClass: string;
    barClass: string;
    pulse: boolean;
  }
> = {
  CALM: {
    label: "On track",
    borderClass: "border-l-emerald-500/70",
    textClass: "text-emerald-300",
    chipClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    barClass: "bg-emerald-400",
    pulse: false,
  },
  ATTENTION: {
    label: "Approaching",
    borderClass: "border-l-amber-500/80",
    textClass: "text-amber-300",
    chipClass: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    barClass: "bg-amber-400",
    pulse: false,
  },
  CRITICAL: {
    label: "5-min window",
    borderClass: "border-l-orange-500",
    textClass: "text-orange-300",
    chipClass: "border-orange-500/40 bg-orange-500/15 text-orange-200",
    barClass: "bg-orange-400",
    pulse: true,
  },
  OVERDUE: {
    label: "SLA breached",
    borderClass: "border-l-rose-500",
    textClass: "text-rose-300",
    chipClass: "border-rose-500/40 bg-rose-500/15 text-rose-200",
    barClass: "bg-rose-500",
    pulse: true,
  },
};

export const TABLE_STATUS_META = {
  AVAILABLE: {
    label: "Available",
    chipClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    dotClass: "bg-emerald-400",
  },
  RESERVED: {
    label: "Reserved",
    chipClass: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    dotClass: "bg-sky-400",
  },
  OCCUPIED: {
    label: "Occupied",
    chipClass: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dotClass: "bg-amber-400",
  },
  CLEANING: {
    label: "Cleaning",
    chipClass: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
    dotClass: "bg-zinc-400",
  },
} as const;
