import type {
  Countdown,
  FiveMinAlertState,
  KitchenOrder,
  SlotSummary,
  SlaLevel,
} from "@/types/kitchen";

export const SLOT_MINUTES = 15;
export const FIVE_MIN_MS = 5 * 60 * 1000;
export const MINUTE_MS = 60 * 1000;

/**
 * Parses an ISO timestamp (or a bare "HH:mm" / "HH:mm:ss" clock value).
 * Bare clock values resolve against the current day.
 */
export function parseSlotTime(value: string): number {
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
    const [hours, minutes, seconds = "0"] = value.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), Number(seconds), 0);
    return date.getTime();
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid slot time: ${value}`);
  }
  return parsed;
}

export function getSlotStart(slotTime: string): Date {
  const date = new Date(parseSlotTime(slotTime));
  date.setSeconds(0, 0);
  const flooredMinutes = Math.floor(date.getMinutes() / SLOT_MINUTES) * SLOT_MINUTES;
  date.setMinutes(flooredMinutes, 0, 0);
  return date;
}

export function getSlotKey(slotTime: string): string {
  return getSlotStart(slotTime).toISOString();
}

export function getSlotEnd(slotTime: string): Date {
  return new Date(parseSlotTime(slotTime) + SLOT_MINUTES * MINUTE_MS);
}

export function formatClock(date: Date | number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatClockWithSeconds(date: Date | number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatSlotLabel(slotTime: string): string {
  const start = parseSlotTime(slotTime);
  const end = start + SLOT_MINUTES * MINUTE_MS;
  return `${formatClock(start)} - ${formatClock(end)}`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Formats a signed countdown: "12:40", or "-02:10" when overdue. */
export function formatCountdown(msRemaining: number): string {
  const prefix = msRemaining < 0 ? "-" : "";
  return `${prefix}${formatDuration(Math.abs(msRemaining))}`;
}

export function getSlaLevel(minutesRemaining: number): SlaLevel {
  if (minutesRemaining < 0) return "OVERDUE";
  if (minutesRemaining <= 5) return "CRITICAL";
  if (minutesRemaining <= 15) return "ATTENTION";
  return "CALM";
}

/**
 * Live countdown to the reserved slot start (the moment the order must be ready).
 */
export function getCountdown(slotTime: string, now: number): Countdown {
  const targetMs = parseSlotTime(slotTime);
  const msRemaining = targetMs - now;
  const minutesRemaining = msRemaining / MINUTE_MS;

  return {
    targetMs,
    msRemaining,
    minutesRemaining,
    isOverdue: msRemaining < 0,
    display: formatCountdown(msRemaining),
    sla: getSlaLevel(minutesRemaining),
  };
}

/** True once the order's slot is five minutes away (or already late). */
export function isWithinFiveMinWindow(slotTime: string, now: number): boolean {
  return parseSlotTime(slotTime) - now <= FIVE_MIN_MS;
}

/**
 * T-minus 5-minute detector: decides whether the "Notify User" action is due.
 */
export function getFiveMinAlertState(
  order: Pick<KitchenOrder, "slotTime" | "fiveMinAlertSent" | "status">,
  now: number,
): FiveMinAlertState {
  if (order.fiveMinAlertSent) return "SENT";
  if (order.status === "SERVED" || order.status === "READY") return "NOT_APPLICABLE";
  return isWithinFiveMinWindow(order.slotTime, now) ? "DUE" : "UPCOMING";
}

export function getMinutesUntilReady(order: Pick<KitchenOrder, "slotTime">, now: number): number {
  return Math.round((parseSlotTime(order.slotTime) - now) / MINUTE_MS);
}

export function sortOrdersBySlotAndTable(a: KitchenOrder, b: KitchenOrder): number {
  const slotDelta = parseSlotTime(a.slotTime) - parseSlotTime(b.slotTime);
  if (slotDelta !== 0) return slotDelta;

  const aTable = a.tableNumber ?? Number.MAX_SAFE_INTEGER;
  const bTable = b.tableNumber ?? Number.MAX_SAFE_INTEGER;
  if (aTable !== bTable) return aTable - bTable;

  return a.orderNumber.localeCompare(b.orderNumber);
}

export function buildSlotSummaries(
  orders: KitchenOrder[],
  capacityPerSlot = 20,
): SlotSummary[] {
  const buckets = new Map<
    string,
    { startTime: string; endTime: string; orderCount: number; itemCount: number }
  >();

  for (const order of orders) {
    if (order.status === "SERVED") continue;
    const start = getSlotStart(order.slotTime);
    const key = start.toISOString();
    const bucket = buckets.get(key);

    if (bucket) {
      bucket.orderCount += 1;
      bucket.itemCount += order.items.reduce((sum, item) => sum + item.qty, 0);
    } else {
      const end = new Date(start.getTime() + SLOT_MINUTES * MINUTE_MS);
      buckets.set(key, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        orderCount: 1,
        itemCount: order.items.reduce((sum, item) => sum + item.qty, 0),
      });
    }
  }

  return Array.from(buckets.entries())
    .map(([key, bucket]) => ({
      key,
      startTime: bucket.startTime,
      endTime: bucket.endTime,
      label: formatSlotLabel(bucket.startTime),
      orderCount: bucket.orderCount,
      itemCount: bucket.itemCount,
      capacity: capacityPerSlot,
      loadPct: Math.min(100, Math.round((bucket.orderCount / capacityPerSlot) * 100)),
    }))
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}

export function groupOrdersBySlot(orders: KitchenOrder[]): Map<string, KitchenOrder[]> {
  const groups = new Map<string, KitchenOrder[]>();
  for (const order of [...orders].sort(sortOrdersBySlotAndTable)) {
    const key = getSlotKey(order.slotTime);
    const group = groups.get(key);
    if (group) group.push(order);
    else groups.set(key, [order]);
  }
  return groups;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MINUTE_MS);
}

export function addMinutesIso(date: Date, minutes: number): string {
  return addMinutes(date, minutes).toISOString();
}

export function isSameSlot(a: string, b: string): boolean {
  return getSlotKey(a) === getSlotKey(b);
}

/** The 15-minute window containing `now`, used by the slot load meter. */
export function getCurrentSlotStart(now: number): Date {
  const date = new Date(now);
  date.setSeconds(0, 0);
  date.setMinutes(Math.floor(date.getMinutes() / SLOT_MINUTES) * SLOT_MINUTES, 0, 0);
  return date;
}
