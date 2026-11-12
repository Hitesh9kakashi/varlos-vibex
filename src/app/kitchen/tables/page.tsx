"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  LayoutGrid,
  MapPin,
  ShoppingBag,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TableOrderCard } from "@/components/kitchen/TableOrderCard";
import { useNow } from "@/hooks/use-now";
import { useKitchenStore } from "@/lib/kitchen-store";
import { SLA_META, TABLE_STATUS_META } from "@/lib/kitchen-ui";
import { getCountdown } from "@/lib/time-slot-utils";
import { cn } from "@/lib/utils";

function zoneLabel(zone: string): string {
  return zone.charAt(0) + zone.slice(1).toLowerCase();
}

export default function TablesPage() {
  const tables = useKitchenStore((state) => state.tables);
  const orders = useKitchenStore((state) => state.orders);
  const now = useNow(1000);
  const nowMs = now?.getTime() ?? Date.now();

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const defaultTable = useMemo(() => {
    const earliestActiveTableOrder = orders
      .filter(
        (order) => order.tableNumber !== null && order.status !== "SERVED",
      )
      .sort(
        (a, b) =>
          Date.parse(a.slotTime) - Date.parse(b.slotTime) ||
          a.orderNumber.localeCompare(b.orderNumber),
      )[0];

    const matchingTable = earliestActiveTableOrder
      ? tables.find(
          (table) => table.currentOrderId === earliestActiveTableOrder.id,
        )
      : undefined;

    return (
      matchingTable ??
      tables.find((table) => table.currentOrderId) ??
      tables[0]
    );
  }, [orders, tables]);

  const selectedTable =
    tables.find((table) => table.id === selectedTableId) ?? defaultTable;

  const selectedOrderId = selectedTable?.currentOrderId;
  const selectedOrder = selectedOrderId
    ? orders.find(
        (order) => order.id === selectedOrderId && order.status !== "SERVED",
      )
    : undefined;

  const takeawayOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.tableNumber === null && order.status !== "SERVED",
      ),
    [orders],
  );

  const counts = useMemo(
    () => ({
      OCCUPIED: tables.filter((table) => table.status === "OCCUPIED").length,
      RESERVED: tables.filter((table) => table.status === "RESERVED").length,
      AVAILABLE: tables.filter((table) => table.status === "AVAILABLE").length,
      CLEANING: tables.filter((table) => table.status === "CLEANING").length,
    }),
    [tables],
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <LayoutGrid className="h-3.5 w-3.5" />
            Floor operations
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Dining Floor Matrix
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Every reserved table, its assigned ticket and live slot countdown.
            Tap a table to inspect or action its order.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            Object.keys(TABLE_STATUS_META) as Array<
              keyof typeof TABLE_STATUS_META
            >
          ).map((status) => {
            const meta = TABLE_STATUS_META[status];
            return (
              <span
                key={status}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                  meta.chipClass,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} />
                {meta.label} · {counts[status]}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/40 scrollbar-thin">
            <div className="relative h-[540px] min-w-[780px] kds-grid">
              <div className="absolute inset-x-4 top-3 flex h-8 items-center justify-center rounded-lg border border-dashed border-amber-500/25 bg-amber-500/5 text-[9px] font-semibold uppercase tracking-[0.24em] text-amber-300/80">
                Kitchen pass · dispatch window
              </div>

              {tables.map((table) => {
                const currentOrderId = table.currentOrderId;
                const tableOrder = currentOrderId
                  ? orders.find(
                      (order) =>
                        order.id === currentOrderId &&
                        order.status !== "SERVED",
                    )
                  : undefined;
                const countdown =
                  tableOrder && now
                    ? getCountdown(tableOrder.slotTime, nowMs)
                    : null;
                const slaMeta = countdown ? SLA_META[countdown.sla] : null;
                const statusMeta = TABLE_STATUS_META[table.status];
                const isSelected = selectedTable?.id === table.id;

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => setSelectedTableId(table.id)}
                    aria-pressed={isSelected}
                    aria-label={`Table ${table.tableNumber}, ${
                      statusMeta.label
                    }, ${table.seatCount} seats${
                      tableOrder ? `, order ${tableOrder.orderNumber}` : ""
                    }`}
                    style={{ left: `${table.x}%`, top: `${table.y}%` }}
                    className={cn(
                      "absolute z-10 w-[124px] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 bg-card/95 p-2 text-left shadow-lg shadow-black/20 transition-all hover:z-20 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "border-primary ring-2 ring-primary/25"
                        : "border-border/70",
                      slaMeta &&
                        (countdown?.sla === "CRITICAL" ||
                          countdown?.sla === "OVERDUE") &&
                        "border-orange-500/60",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Table
                      </span>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          statusMeta.dotClass,
                        )}
                      />
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-xl font-bold leading-none">
                        {table.tableNumber}
                      </span>
                      <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                        <Users className="h-2.5 w-2.5" />
                        {table.seatCount}
                      </span>
                    </div>

                    {tableOrder ? (
                      <div className="mt-1.5 border-t border-border/50 pt-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-mono text-[9px] text-muted-foreground">
                            {tableOrder.orderNumber}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-[10px] font-bold tabular-nums",
                              slaMeta?.textClass,
                            )}
                          >
                            {countdown?.display ?? "--:--"}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[9px] font-medium">
                          {tableOrder.studentName}
                        </p>
                        <span
                          className={cn(
                            "mt-1 inline-flex rounded-full border px-1 py-0 text-[8px] font-semibold uppercase tracking-wide",
                            slaMeta?.chipClass,
                          )}
                        >
                          {slaMeta?.label}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1.5 flex items-center gap-1 border-t border-border/50 pt-1.5 text-[8px] uppercase tracking-wide text-muted-foreground">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {statusMeta.label}
                      </div>
                    )}
                  </button>
                );
              })}

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border/60 bg-card/90 px-4 py-1 text-[8px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Entrance
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Countdown targets the reserved slot
              start
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              Orange border = 5-minute window / overdue
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <Card className="border-border/60 bg-card/60 xl:sticky xl:top-32">
            <CardContent className="p-4">
              {selectedTable ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Selected table
                      </p>
                      <h2 className="mt-0.5 text-3xl font-bold tracking-tight">
                        Table {selectedTable.tableNumber}
                      </h2>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {zoneLabel(selectedTable.zone)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {selectedTable.seatCount} seats
                        </span>
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "shrink-0 px-2 py-0.5 text-[10px] font-semibold",
                        TABLE_STATUS_META[selectedTable.status].chipClass,
                      )}
                    >
                      {TABLE_STATUS_META[selectedTable.status].label}
                    </Badge>
                  </div>

                  <Separator className="my-4" />

                  {selectedOrder ? (
                    <TableOrderCard order={selectedOrder} now={now} />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/60 bg-background/30 px-4 py-10 text-center">
                      <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-300">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                      <p className="mt-3 text-sm font-semibold">
                        No active ticket
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {selectedTable.status === "CLEANING"
                          ? "Table is being reset for the next reservation."
                          : "This table is ready for the next reservation."}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a table on the floor map.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="mt-8" aria-labelledby="takeaway-heading">
        <div className="mb-3 flex items-center gap-2">
          <h2
            id="takeaway-heading"
            className="text-sm font-semibold tracking-tight"
          >
            Takeaway / unassigned
          </h2>
          <Badge variant="muted" className="px-1.5 py-0 text-[10px]">
            {takeawayOrders.length}
          </Badge>
        </div>

        {takeawayOrders.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-card/40">
            <CardContent className="flex items-center gap-3 p-4 text-xs text-muted-foreground">
              <ShoppingBag className="h-4 w-4" />
              No takeaway tickets in the live queue.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {takeawayOrders.map((order) => (
              <TableOrderCard key={order.id} order={order} now={now} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
