"use client";

import { useMemo } from "react";
import {
  Boxes,
  Coffee,
  Flame,
  Layers,
  Minus,
  PackageCheck,
  PackageX,
  Plus,
  RotateCcw,
  ShieldAlert,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useNow } from "@/hooks/use-now";
import { playKitchenTone } from "@/lib/kitchen-audio";
import { useKitchenStore } from "@/lib/kitchen-store";
import { STATION_META } from "@/lib/kitchen-ui";
import { getCurrentSlotStart, getSlotKey } from "@/lib/time-slot-utils";
import { cn } from "@/lib/utils";
import type { InventoryItem, StationType } from "@/types/kitchen";

type RealStation = Exclude<StationType, "ALL">;

const STATION_ORDER: StationType[] = ["GRILL", "FRYER", "BEVERAGE", "ALL"];

const STATION_ICONS: Record<StationType, LucideIcon> = {
  GRILL: Flame,
  FRYER: Utensils,
  BEVERAGE: Coffee,
  ALL: Layers,
};

function stockPct(item: InventoryItem): number {
  const target = Math.max(item.threshold * 3, 1);
  return Math.min(100, Math.round((item.stockLevel / target) * 100));
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: "default" | "warning" | "critical";
}

function StatCard({ icon: Icon, label, value, tone = "default" }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border bg-card/50 px-3 py-2.5",
        tone === "critical"
          ? "border-rose-500/40 bg-rose-500/10"
          : tone === "warning"
            ? "border-amber-500/40 bg-amber-500/10"
            : "border-border/60",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          tone === "critical"
            ? "text-rose-300"
            : tone === "warning"
              ? "text-amber-300"
              : "text-muted-foreground",
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

export default function InventoryPage() {
  const inventory = useKitchenStore((state) => state.inventory);
  const stationCapacity = useKitchenStore((state) => state.stationCapacity);
  const orders = useKitchenStore((state) => state.orders);
  const setStationCapacity = useKitchenStore((state) => state.setStationCapacity);
  const toggleInventoryKill = useKitchenStore((state) => state.toggleInventoryKill);
  const restockItem = useKitchenStore((state) => state.restockItem);
  const audioEnabled = useKitchenStore((state) => state.audioEnabled);

  const now = useNow(1000);
  const currentSlotKey = now
    ? getCurrentSlotStart(now.getTime()).toISOString()
    : null;

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== "SERVED"),
    [orders],
  );

  const windowOrders = useMemo(
    () =>
      currentSlotKey
        ? activeOrders.filter(
            (order) => getSlotKey(order.slotTime) === currentSlotKey,
          )
        : [],
    [activeOrders, currentSlotKey],
  );

  const loadByStation = useMemo(() => {
    const result: Record<RealStation, number> = {
      GRILL: 0,
      FRYER: 0,
      BEVERAGE: 0,
    };

    for (const order of windowOrders) {
      for (const item of order.items) {
        if (item.station === "ALL") {
          result.GRILL += item.qty;
          result.FRYER += item.qty;
          result.BEVERAGE += item.qty;
        } else {
          result[item.station] += item.qty;
        }
      }
    }

    return result;
  }, [windowOrders]);

  const killedCount = inventory.filter((item) => item.isKilled).length;
  const availableCount = inventory.length - killedCount;
  const lowStockCount = inventory.filter(
    (item) => !item.isKilled && item.stockLevel <= item.threshold,
  ).length;

  const handleKill = (itemId: string, name: string, wasKilled: boolean) => {
    const nowKilled = toggleInventoryKill(itemId);
    if (nowKilled === null) return;

    if (audioEnabled) {
      playKitchenTone(nowKilled ? "error" : "success");
    }

    if (nowKilled) {
      toast.error(`${name} marked 86`, {
        description:
          "Kill-switch applied. New orders will skip this item; existing tickets stay on the board.",
      });
    } else {
      toast.success(`${name} back on the menu`, {
        description: wasKilled
          ? "Item is available for new orders again."
          : "Item availability restored.",
      });
    }
  };

  const handleRestock = (itemId: string, name: string) => {
    restockItem(itemId);
    if (audioEnabled) playKitchenTone("success");
    toast.success(`${name} restocked`, {
      description: "Stock topped up and the item is back in service.",
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <Boxes className="h-3.5 w-3.5" />
            Inventory control
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Stock & Station Capacity
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            One-click 86&apos;ing for the line, plus per-slot throughput limits
            for each station. Changes broadcast to every kitchen screen.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatCard icon={PackageCheck} label="Available" value={availableCount} />
          <StatCard
            icon={PackageX}
            label="86'd"
            value={killedCount}
            tone={killedCount > 0 ? "critical" : "default"}
          />
          <StatCard
            icon={ShieldAlert}
            label="Low stock"
            value={lowStockCount}
            tone={lowStockCount > 0 ? "warning" : "default"}
          />
          <StatCard icon={Boxes} label="Active tickets" value={activeOrders.length} />
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-sky-500/25 bg-sky-500/5 px-3 py-2.5 text-[11px] leading-relaxed text-sky-200/80">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
        <p>
          <span className="font-semibold text-sky-200">
            1-click stock kill-switch:
          </span>{" "}
          flip a switch to mark an item 86&apos;d. Live tickets keep their
          items; new student orders stop offering it. Station capacity is the
          number of item units that can be fired per 15-minute slot.
        </p>
      </div>

      <section className="mt-7" aria-labelledby="capacity-heading">
        <div className="mb-3">
          <h2 id="capacity-heading" className="text-sm font-semibold tracking-tight">
            Station capacity controls
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Tune throughput live — the batch sidebar and this dashboard update
            instantly.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stationCapacity.map((entry) => {
            const Icon = STATION_ICONS[entry.station];
            const activeQty = loadByStation[entry.station];
            const pct = Math.min(
              100,
              Math.round((activeQty / entry.capacityPerSlot) * 100),
            );

            return (
              <Card key={entry.station} className="border-border/60 bg-card/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg border",
                          STATION_META[entry.station].chipClass,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{entry.label}</p>
                        <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                          Units / 15-min slot
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        pct >= 90
                          ? "critical"
                          : pct >= 70
                            ? "warning"
                            : "success"
                      }
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {pct}%
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <p className="font-mono text-3xl font-bold leading-none tabular-nums">
                      {activeQty}
                      <span className="text-sm font-medium text-muted-foreground">
                        /{entry.capacityPerSlot}
                      </span>
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          setStationCapacity(
                            entry.station,
                            entry.capacityPerSlot - 1,
                          )
                        }
                        aria-label={`Decrease ${entry.label} capacity`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          setStationCapacity(
                            entry.station,
                            entry.capacityPerSlot + 1,
                          )
                        }
                        aria-label={`Increase ${entry.label} capacity`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <Progress
                    value={pct}
                    className="mt-3 h-1.5"
                    indicatorClassName={
                      pct >= 90
                        ? "bg-rose-500"
                        : pct >= 70
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                    }
                  />
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Current window · {windowOrders.length} tickets
                    <span className="px-1 opacity-50">·</span>
                    <span
                      className={
                        activeQty > entry.capacityPerSlot
                          ? "text-rose-300"
                          : "text-emerald-300"
                      }
                    >
                      {activeQty > entry.capacityPerSlot
                        ? `${activeQty - entry.capacityPerSlot} over capacity`
                        : "within capacity"}
                    </span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="stock-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="stock-heading" className="text-sm font-semibold tracking-tight">
              Stock kill-switch
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Grouped by station. Flip off to 86 an item instantly.
            </p>
          </div>
          <Badge variant="muted" className="px-2 py-0.5 text-[10px]">
            {inventory.length} SKUs
          </Badge>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {STATION_ORDER.map((station) => {
            const items = inventory.filter((item) => item.station === station);
            if (items.length === 0) return null;

            const Icon = STATION_ICONS[station];
            const killed = items.filter((item) => item.isKilled).length;

            return (
              <Card key={station} className="border-border/60 bg-card/60">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid h-7 w-7 place-items-center rounded-md border",
                          STATION_META[station].chipClass,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">
                          {STATION_META[station].label}
                        </p>
                        <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                          {items.length} SKUs
                        </p>
                      </div>
                    </div>
                    {killed > 0 && (
                      <Badge variant="critical" className="px-1.5 py-0 text-[9px]">
                        {killed} 86&apos;d
                      </Badge>
                    )}
                  </div>

                  <ul className="divide-y divide-border/50">
                    {items.map((item) => {
                      const pct = stockPct(item);
                      return (
                        <li
                          key={item.id}
                          className={cn(
                            "flex flex-wrap items-center gap-3 px-4 py-3",
                            item.isKilled && "bg-rose-500/[0.04]",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p
                                className={cn(
                                  "truncate text-sm font-medium",
                                  item.isKilled &&
                                    "text-muted-foreground line-through",
                                )}
                              >
                                {item.name}
                              </p>
                              {item.isKilled ? (
                                <Badge
                                  variant="critical"
                                  className="px-1.5 py-0 text-[9px]"
                                >
                                  86&apos;d
                                </Badge>
                              ) : item.stockLevel <= item.threshold ? (
                                <Badge
                                  variant="warning"
                                  className="px-1.5 py-0 text-[9px]"
                                >
                                  Low stock
                                </Badge>
                              ) : null}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <Progress
                                value={pct}
                                className="h-1 w-28"
                                indicatorClassName={
                                  item.isKilled
                                    ? "bg-rose-500"
                                    : pct <= 33
                                      ? "bg-amber-400"
                                      : "bg-emerald-400"
                                }
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {item.stockLevel} {item.unit}
                                <span className="px-1 opacity-50">·</span>
                                reorder at {item.threshold}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <label className="flex items-center gap-1.5">
                              <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                                {item.isKilled ? "Off menu" : "Available"}
                              </span>
                              <Switch
                                checked={!item.isKilled}
                                onCheckedChange={() =>
                                  handleKill(item.id, item.name, item.isKilled)
                                }
                                aria-label={`Toggle availability for ${item.name}`}
                              />
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[10px]"
                              onClick={() => handleRestock(item.id, item.name)}
                            >
                              <RotateCcw className="h-3 w-3" />
                              Restock
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
