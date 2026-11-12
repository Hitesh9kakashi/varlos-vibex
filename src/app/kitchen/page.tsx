"use client";

import { useMemo } from "react";
import {
  BellRing,
  Clock,
  Flame,
  RefreshCw,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BatchPrepSidebar } from "@/components/kitchen/BatchPrepSidebar";
import { SlotFilterTabs } from "@/components/kitchen/SlotFilterTabs";
import { TableOrderCard } from "@/components/kitchen/TableOrderCard";
import { useNow } from "@/hooks/use-now";
import { useKitchenStore } from "@/lib/kitchen-store";
import { SLA_META, STATION_META } from "@/lib/kitchen-ui";
import {
  buildSlotSummaries,
  getCountdown,
  getCurrentSlotStart,
  getFiveMinAlertState,
  getSlotKey,
  groupOrdersBySlot,
} from "@/lib/time-slot-utils";
import { cn } from "@/lib/utils";

interface SummaryChipProps {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: "default" | "warning";
}

function SummaryChip({ icon: Icon, label, value, tone = "default" }: SummaryChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-card/50 px-3 py-2",
        tone === "warning"
          ? "border-orange-500/40 bg-orange-500/10"
          : "border-border/60",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          tone === "warning" ? "text-orange-300" : "text-muted-foreground",
        )}
      />
      <div className="leading-none">
        <p className="text-sm font-bold tabular-nums">{value}</p>
        <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const orders = useKitchenStore((state) => state.orders);
  const stationFilter = useKitchenStore((state) => state.stationFilter);
  const activeSlotKey = useKitchenStore((state) => state.activeSlotKey);
  const setActiveSlot = useKitchenStore((state) => state.setActiveSlot);
  const setStationFilter = useKitchenStore((state) => state.setStationFilter);

  const now = useNow(1000);
  const nowMs = now?.getTime() ?? Date.now();

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== "SERVED"),
    [orders],
  );

  const stationOrders = useMemo(
    () =>
      activeOrders.filter(
        (order) =>
          stationFilter === "ALL" ||
          order.items.some(
            (item) =>
              item.station === stationFilter || item.station === "ALL",
          ),
      ),
    [activeOrders, stationFilter],
  );

  const summaries = useMemo(
    () => buildSlotSummaries(stationOrders),
    [stationOrders],
  );

  const effectiveSlotKey =
    activeSlotKey && summaries.some((summary) => summary.key === activeSlotKey)
      ? activeSlotKey
      : null;

  const visibleOrders = useMemo(
    () =>
      effectiveSlotKey
        ? stationOrders.filter(
            (order) => getSlotKey(order.slotTime) === effectiveSlotKey,
          )
        : stationOrders,
    [stationOrders, effectiveSlotKey],
  );

  const groups = useMemo(
    () => groupOrdersBySlot(visibleOrders),
    [visibleOrders],
  );

  const summaryByKey = useMemo(
    () => new Map(summaries.map((summary) => [summary.key, summary])),
    [summaries],
  );

  const dueAlerts = useMemo(
    () =>
      visibleOrders.filter(
        (order) => getFiveMinAlertState(order, nowMs) === "DUE",
      ),
    [visibleOrders, nowMs],
  );

  const visibleItemCount = visibleOrders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.qty, 0),
    0,
  );

  const liveSlotKey = now
    ? getCurrentSlotStart(now.getTime()).toISOString()
    : null;

  const resetFilters = () => {
    setStationFilter("ALL");
    setActiveSlot(null);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-emerald-400" />
            Live service ·{" "}
            {stationFilter === "ALL"
              ? "All stations"
              : STATION_META[stationFilter].label}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Kitchen Display
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Orders grouped by reserved table and 15-minute slot. Send the
            student push five minutes before the ticket is due.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SummaryChip
            icon={Utensils}
            label="Live tickets"
            value={visibleOrders.length}
          />
          <SummaryChip
            icon={Flame}
            label="Items to cook"
            value={visibleItemCount}
          />
          <SummaryChip
            icon={BellRing}
            label="Alerts due"
            value={dueAlerts.length}
            tone={dueAlerts.length > 0 ? "warning" : "default"}
          />
        </div>
      </div>

      <div className="mt-5">
        <SlotFilterTabs
          summaries={summaries}
          activeSlotKey={effectiveSlotKey}
          onSelect={setActiveSlot}
          totalOrders={stationOrders.length}
          now={now}
        />
      </div>

      {dueAlerts.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-200">
          <BellRing className="h-4 w-4 animate-soft-pulse" />
          <span>
            <strong>{dueAlerts.length}</strong>{" "}
            {dueAlerts.length === 1 ? "ticket is" : "tickets are"} inside the
            5-minute window — send the student push now.
          </span>
          <Button
            variant="warning"
            size="sm"
            className="ml-auto"
            onClick={() => {
              const first = dueAlerts[0];
              if (!first) return;
              document
                .getElementById(`order-${first.id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            Jump to ticket
          </Button>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-7">
          {groups.size === 0 ? (
            <Card className="border-dashed border-border/60 bg-card/40">
              <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <Utensils className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">No tickets in this view</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try another slot or clear the station filter.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            Array.from(groups.entries()).map(([slotKey, slotOrders]) => {
              const summary = summaryByKey.get(slotKey);
              const countdown = now
                ? getCountdown(slotKey, now.getTime())
                : null;
              const isLive = slotKey === liveSlotKey;

              return (
                <section key={slotKey} aria-label={`Orders for ${slotKey}`}>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold tracking-tight">
                      {summary?.label ?? slotOrders[0]?.slotLabel ?? "Slot"}
                    </h2>
                    <Badge
                      variant="muted"
                      className="px-1.5 py-0 text-[10px] font-semibold"
                    >
                      {slotOrders.length}{" "}
                      {slotOrders.length === 1 ? "ticket" : "tickets"}
                    </Badge>
                    <Badge
                      variant="muted"
                      className="hidden px-1.5 py-0 text-[10px] font-semibold sm:inline-flex"
                    >
                      {summary?.itemCount ??
                        slotOrders.reduce(
                          (sum, order) =>
                            sum +
                            order.items.reduce(
                              (itemSum, item) => itemSum + item.qty,
                              0,
                            ),
                          0,
                        )}{" "}
                      items
                    </Badge>
                    {isLive && (
                      <Badge
                        variant="success"
                        className="animate-soft-pulse px-1.5 py-0 text-[10px]"
                      >
                        Live window
                      </Badge>
                    )}
                    <span
                      className={cn(
                        "ml-auto flex items-center gap-1 text-[10px]",
                        countdown
                          ? SLA_META[countdown.sla].textClass
                          : "text-muted-foreground",
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      {countdown
                        ? countdown.isOverdue
                          ? "Window open — fire now"
                          : `Starts in ${countdown.display}`
                        : "Syncing"}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {slotOrders.map((order) => (
                      <div key={order.id} id={`order-${order.id}`}>
                        <TableOrderCard order={order} now={now} />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>

        <div className="min-w-0">
          <BatchPrepSidebar orders={visibleOrders} now={now} />
        </div>
      </div>
    </div>
  );
}
