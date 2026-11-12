"use client";

import {
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { playKitchenTone } from "@/lib/kitchen-audio";
import { useKitchenStore } from "@/lib/kitchen-store";
import {
  ORDER_STATUS_META,
  SLA_META,
  STATION_META,
  STATUS_PIPELINE,
} from "@/lib/kitchen-ui";
import {
  formatClock,
  getCountdown,
  getFiveMinAlertState,
} from "@/lib/time-slot-utils";
import { cn } from "@/lib/utils";
import type { KitchenOrder } from "@/types/kitchen";

interface TableOrderCardProps {
  order: KitchenOrder;
  now: Date | null;
}

export function TableOrderCard({ order, now }: TableOrderCardProps) {
  const advanceOrderStatus = useKitchenStore((state) => state.advanceOrderStatus);
  const sendFiveMinAlert = useKitchenStore((state) => state.sendFiveMinAlert);
  const audioEnabled = useKitchenStore((state) => state.audioEnabled);

  const nowMs = now?.getTime() ?? Date.now();
  const countdown = now ? getCountdown(order.slotTime, nowMs) : null;
  const slaMeta = countdown ? SLA_META[countdown.sla] : SLA_META.CALM;
  const alertState = now ? getFiveMinAlertState(order, nowMs) : "UPCOMING";
  const statusMeta = ORDER_STATUS_META[order.status];

  const isServed = order.status === "SERVED";
  const isReady = order.status === "READY";
  const notifyDisabled =
    order.fiveMinAlertSent || isServed || isReady;

  const currentStatusIndex = STATUS_PIPELINE.indexOf(order.status);

  const notifyLabel = order.fiveMinAlertSent
    ? `Alert sent${
        order.fiveMinAlertSentAt
          ? ` · ${formatClock(new Date(order.fiveMinAlertSentAt))}`
          : ""
      }`
    : isReady
      ? "Ready push sent"
      : alertState === "DUE"
        ? "Notify now"
        : "Notify 5m before ready";

  const handleNotify = () => {
    const notification = sendFiveMinAlert(order.id);
    if (!notification) {
      toast("Alert already sent", {
        description:
          order.status === "READY"
            ? "The ready notification has already gone out."
            : "This student has already been notified for this order.",
      });
      return;
    }

    if (audioEnabled) playKitchenTone("alert");

    toast.success(`Student notified · ${order.studentName}`, {
      description: `${order.orderNumber} · ${
        order.tableNumber !== null ? `Table ${order.tableNumber}` : "Takeaway"
      } · 5-minute push delivered.`,
    });
  };

  const handleAdvance = () => {
    const nextStatus = advanceOrderStatus(order.id);
    if (!nextStatus) return;

    if (audioEnabled && nextStatus === "READY") {
      playKitchenTone("success");
    }

    toast.success(`${order.orderNumber} → ${ORDER_STATUS_META[nextStatus].label}`, {
      description: `${
        order.tableNumber !== null ? `Table ${order.tableNumber}` : "Takeaway"
      } · ticket updated on every screen.`,
      duration: 2500,
    });
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-l-4 border-border/60 bg-card/75 shadow-sm transition-colors hover:bg-card/90",
        slaMeta.borderClass,
        countdown?.sla === "CRITICAL" && !isServed && "bg-orange-500/[0.04]",
        countdown?.sla === "OVERDUE" && !isServed && "bg-rose-500/[0.04]",
        alertState === "DUE" &&
          !order.fiveMinAlertSent &&
          !isServed &&
          "animate-critical-pulse",
        isServed && "opacity-60",
      )}
      aria-label={`${order.orderNumber} for ${
        order.tableNumber !== null ? `Table ${order.tableNumber}` : "takeaway"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border leading-none",
                order.tableNumber !== null
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground",
              )}
            >
              {order.tableNumber !== null ? (
                <>
                  <span className="text-[8px] font-semibold uppercase tracking-[0.14em] opacity-70">
                    Tbl
                  </span>
                  <span className="mt-0.5 text-lg font-bold leading-none">
                    {order.tableNumber}
                  </span>
                </>
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {order.orderNumber}
                </span>
                <Badge
                  className={cn(
                    "px-1.5 py-0 text-[10px] font-semibold",
                    statusMeta.badgeClass,
                  )}
                >
                  {statusMeta.label}
                </Badge>
                {alertState === "DUE" && !order.fiveMinAlertSent && (
                  <Badge className="animate-soft-pulse border-orange-500/40 bg-orange-500/15 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide text-orange-200">
                    Notify due
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm font-semibold">
                {order.studentName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {order.tableNumber === null
                  ? "Takeaway"
                  : `${order.seatCount ?? 2} seats`}
                <span className="px-1 opacity-50">·</span>
                {order.studentPhone}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {order.slotLabel}
            </span>
            <p
              className={cn(
                "mt-0.5 font-mono text-2xl font-bold leading-none tabular-nums",
                isServed ? "text-muted-foreground" : slaMeta.textClass,
              )}
            >
              {countdown ? countdown.display : "--:--"}
            </p>
            <span
              className={cn(
                "mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                slaMeta.chipClass,
              )}
            >
              {countdown
                ? countdown.isOverdue
                  ? "Overdue"
                  : slaMeta.label
                : "Syncing"}
            </span>
          </div>
        </div>

        <div
          className="mt-3 flex items-center gap-1"
          aria-hidden="true"
          title={`Status: ${statusMeta.label}`}
        >
          {STATUS_PIPELINE.map((status, index) => (
            <span
              key={status}
              className={cn(
                "h-0.5 flex-1 rounded-full transition-colors",
                index <= currentStatusIndex ? "bg-primary/70" : "bg-secondary",
              )}
            />
          ))}
        </div>

        <ul className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-2"
            >
              <div className="flex min-w-0 items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] font-bold text-secondary-foreground">
                  {item.qty}×
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium leading-snug">
                    {item.name}
                  </p>
                  {item.notes && (
                    <p className="truncate text-[10px] italic text-amber-300/80">
                      “{item.notes}”
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                    STATION_META[item.station].chipClass,
                  )}
                >
                  <span
                    className={cn(
                      "h-1 w-1 rounded-full",
                      STATION_META[item.station].dotClass,
                    )}
                  />
                  {STATION_META[item.station].label}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {item.prepTimeMins}m
                </span>
              </div>
            </li>
          ))}
        </ul>

        {alertState === "DUE" && !order.fiveMinAlertSent && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1.5 text-[11px] text-orange-200">
            <BellRing className="h-3.5 w-3.5 shrink-0" />
            5-minute window open — notify the student now.
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            size="sm"
            variant={alertState === "DUE" && !notifyDisabled ? "warning" : "outline"}
            disabled={notifyDisabled}
            onClick={handleNotify}
            aria-label={`Notify ${order.studentName} five minutes before ready`}
            className={cn(
              "justify-start",
              alertState === "DUE" &&
                !notifyDisabled &&
                "animate-soft-pulse font-semibold",
            )}
          >
            {notifyDisabled ? (
              <CheckCheck className="h-3.5 w-3.5" />
            ) : (
              <BellRing className="h-3.5 w-3.5" />
            )}
            <span className="truncate">{notifyLabel}</span>
          </Button>

          {statusMeta.nextStatus ? (
            <Button
              size="sm"
              variant={isReady ? "success" : "default"}
              onClick={handleAdvance}
              className="justify-between"
            >
              <span>{statusMeta.nextLabel}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled
              className="justify-between"
            >
              <span>Order served</span>
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {order.fiveMinAlertSentAt && (
          <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <CheckCheck className="h-3 w-3 text-emerald-400" />
            5-min push delivered at{" "}
            {formatClock(new Date(order.fiveMinAlertSentAt))}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
