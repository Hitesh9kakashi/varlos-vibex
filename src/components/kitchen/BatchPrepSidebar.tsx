"use client";

import { useMemo } from "react";
import { ChefHat, Layers } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useKitchenStore } from "@/lib/kitchen-store";
import { SLA_META, STATION_META } from "@/lib/kitchen-ui";
import {
  getCountdown,
  getCurrentSlotStart,
  getSlotKey,
} from "@/lib/time-slot-utils";
import { cn } from "@/lib/utils";
import type { KitchenOrder, StationType } from "@/types/kitchen";

interface BatchPrepSidebarProps {
  orders: KitchenOrder[];
  now: Date | null;
}

interface BatchItem {
  name: string;
  station: StationType;
  qty: number;
}

interface BatchGroup {
  key: string;
  label: string;
  startTime: string;
  items: BatchItem[];
  totalQty: number;
}

export function BatchPrepSidebar({ orders, now }: BatchPrepSidebarProps) {
  const stationCapacity = useKitchenStore((state) => state.stationCapacity);

  const groups = useMemo<BatchGroup[]>(() => {
    const slotMap = new Map<
      string,
      { label: string; items: Map<string, BatchItem> }
    >();

    for (const order of orders) {
      if (order.status === "SERVED") continue;

      const slotKey = getSlotKey(order.slotTime);
      let group = slotMap.get(slotKey);

      if (!group) {
        group = { label: order.slotLabel, items: new Map() };
        slotMap.set(slotKey, group);
      }

      for (const item of order.items) {
        const key = `${item.station}:${item.name}`;
        const existing = group.items.get(key);
        if (existing) {
          existing.qty += item.qty;
        } else {
          group.items.set(key, {
            name: item.name,
            station: item.station,
            qty: item.qty,
          });
        }
      }
    }

    return Array.from(slotMap.entries())
      .sort((a, b) => Date.parse(a[0]) - Date.parse(b[0]))
      .map(([key, group]) => {
        const items = Array.from(group.items.values()).sort(
          (a, b) => b.qty - a.qty || a.name.localeCompare(b.name),
        );

        return {
          key,
          label: group.label,
          startTime: key,
          items,
          totalQty: items.reduce((sum, item) => sum + item.qty, 0),
        };
      });
  }, [orders]);

  const stationLoad = useMemo(() => {
    const currentSlotKey = now
      ? getCurrentSlotStart(now.getTime()).toISOString()
      : null;

    const loadOrders = orders.filter(
      (order) =>
        order.status !== "SERVED" &&
        (!currentSlotKey || getSlotKey(order.slotTime) === currentSlotKey),
    );

    return stationCapacity.map((entry) => {
      let qty = 0;
      for (const order of loadOrders) {
        for (const item of order.items) {
          if (item.station === entry.station || item.station === "ALL") {
            qty += item.qty;
          }
        }
      }
      return {
        ...entry,
        qty,
        pct: Math.min(
          100,
          Math.round((qty / entry.capacityPerSlot) * 100),
        ),
      };
    });
  }, [orders, stationCapacity, now]);

  const totalQty = groups.reduce((sum, group) => sum + group.totalQty, 0);
  const distinctDishes = new Set(
    groups.flatMap((group) => group.items.map((item) => item.name)),
  ).size;

  return (
    <Card
      className="border-border/60 bg-card/60 shadow-sm xl:sticky xl:top-32"
      aria-label="Batch preparation summary"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <ChefHat className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Batch Prep</p>
              <p className="text-[10px] text-muted-foreground">
                Aggregated across visible tickets
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-bold leading-none tabular-nums text-primary">
              {totalQty}
            </p>
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
              items
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <Layers className="h-3 w-3" />
          {distinctDishes} distinct dishes · {groups.length} active slots
        </div>

        <p className="mt-4 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          Current 15-min station load
        </p>

        <div className="mt-1.5 space-y-2">
          {stationLoad.map((entry) => (
            <div
              key={entry.station}
              className="rounded-lg border border-border/50 bg-background/40 p-2.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-medium">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      STATION_META[entry.station].dotClass,
                    )}
                  />
                  {entry.label}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {entry.qty}/{entry.capacityPerSlot}
                </span>
              </div>
              <Progress
                value={entry.pct}
                className="mt-1.5 h-1"
                indicatorClassName={
                  entry.pct >= 90
                    ? "bg-rose-500"
                    : entry.pct >= 70
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                }
              />
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {groups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-[11px] text-muted-foreground">
              No active tickets in this view.
            </div>
          ) : (
            groups.map((group) => {
              const countdown = now
                ? getCountdown(group.startTime, now.getTime())
                : null;

              return (
                <div
                  key={group.key}
                  className="rounded-lg border border-border/50 bg-background/30 p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] font-semibold">
                      {group.label}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[10px] tabular-nums",
                        countdown
                          ? SLA_META[countdown.sla].textClass
                          : "text-muted-foreground",
                      )}
                    >
                      {countdown
                        ? countdown.isOverdue
                          ? "Open"
                          : countdown.display
                        : "--:--"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                    {group.totalQty} items to fire
                  </p>
                  <ul className="mt-2 space-y-1">
                    {group.items.map((item) => (
                      <li
                        key={`${item.station}-${item.name}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-background/40 px-2 py-1"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="shrink-0 font-mono text-[11px] font-bold text-primary">
                            {item.qty}×
                          </span>
                          <span className="truncate text-[11px]">
                            {item.name}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded border px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide",
                            STATION_META[item.station].chipClass,
                          )}
                        >
                          {STATION_META[item.station].label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
