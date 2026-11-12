"use client";

import { useMemo } from "react";
import {
  BellRing,
  CheckCheck,
  ChefHat,
  Clock,
  Plus,
  Smartphone,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { playKitchenTone } from "@/lib/kitchen-audio";
import { useKitchenStore } from "@/lib/kitchen-store";
import { ORDER_STATUS_META, SLA_META, STATUS_PIPELINE } from "@/lib/kitchen-ui";
import {
  formatClock,
  getCountdown,
  getFiveMinAlertState,
} from "@/lib/time-slot-utils";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

export function StudentPhoneSimulator() {
  const now = useNow(1000);

  const showSimulator = useKitchenStore((state) => state.showSimulator);
  const setShowSimulator = useKitchenStore((state) => state.setShowSimulator);
  const notifications = useKitchenStore((state) => state.notifications);
  const orders = useKitchenStore((state) => state.orders);
  const addDemoOrder = useKitchenStore((state) => state.addDemoOrder);
  const sendFiveMinAlert = useKitchenStore((state) => state.sendFiveMinAlert);
  const audioEnabled = useKitchenStore((state) => state.audioEnabled);

  const nowMs = now?.getTime() ?? Date.now();
  const latestNotification = notifications[0];

  const focusedOrder = useMemo(() => {
    if (latestNotification) {
      const matching = orders.find(
        (order) => order.id === latestNotification.orderId,
      );
      if (matching) return matching;
    }

    return [...orders].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    )[0];
  }, [latestNotification, orders]);

  const countdown = focusedOrder
    ? getCountdown(focusedOrder.slotTime, nowMs)
    : null;
  const slaMeta = countdown ? SLA_META[countdown.sla] : SLA_META.CALM;

  const statusBarTime = now
    ? new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now)
    : "--:--";

  const handleSimulateOrder = () => {
    const order = addDemoOrder("random");
    if (audioEnabled) playKitchenTone("success");
    toast.success("New order pushed to kitchen", {
      description: `${order.orderNumber} · ${order.studentName} · ${
        order.tableNumber !== null ? `Table ${order.tableNumber}` : "Takeaway"
      }`,
    });
  };

  const handleSimulateAlert = () => {
    const isEligible = (order: (typeof orders)[number]) =>
      !order.fiveMinAlertSent &&
      order.status !== "SERVED" &&
      order.status !== "READY";

    const dueCandidate = orders.find(
      (order) => getFiveMinAlertState(order, nowMs) === "DUE",
    );
    const candidate =
      dueCandidate ??
      (focusedOrder && isEligible(focusedOrder) ? focusedOrder : undefined) ??
      orders.find(isEligible);

    if (!candidate) {
      toast("No eligible order", {
        description: "Spawn a new order first, then trigger the alert.",
      });
      return;
    }

    const notification = sendFiveMinAlert(candidate.id);
    if (!notification) {
      toast("Alert already sent", {
        description: `${candidate.studentName} has already been notified.`,
      });
      return;
    }

    if (audioEnabled) playKitchenTone("alert");
    toast.success(`Push delivered · ${candidate.studentName}`, {
      description: `${candidate.orderNumber} · 5-minute notice sent to the student app.`,
    });
  };

  if (!showSimulator) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[344px] max-w-[calc(100vw-2rem)] animate-phone-pop">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
              <Smartphone className="h-3.5 w-3.5" />
            </span>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold">Student Phone</p>
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                Live push preview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-emerald-300">
              <span className="h-1 w-1 animate-soft-pulse rounded-full bg-emerald-400" />
              live
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowSimulator(false)}
              aria-label="Close student phone preview"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin p-3">
          <div className="rounded-[1.75rem] border border-zinc-700/70 bg-gradient-to-b from-zinc-900 to-black p-2 shadow-inner">
            <div className="mb-1 flex items-center justify-between px-2 text-[9px] font-medium text-zinc-400">
              <span>{statusBarTime}</span>
              <span className="flex items-center gap-1">
                <span>LTE</span>
                <span className="h-1.5 w-3 rounded-sm border border-zinc-500 p-px">
                  <span className="block h-full w-2 rounded-[1px] bg-emerald-400" />
                </span>
              </span>
            </div>

            <div className="rounded-[1.4rem] bg-zinc-950 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-500/20 text-emerald-300">
                    <ChefHat className="h-3.5 w-3.5" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[10px] font-semibold text-zinc-100">
                      VARLOS Canteen
                    </p>
                    <p className="text-[8px] text-zinc-500">
                      Smart canteen · student app
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[8px] text-zinc-400">
                  Student
                </span>
              </div>

              {latestNotification ? (
                <div
                  key={latestNotification.id}
                  className="mt-2 animate-slide-up rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5"
                >
                  <div className="flex items-start gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
                      <BellRing className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-emerald-100">
                        {latestNotification.title}
                      </p>
                      <p className="mt-0.5 text-[9px] leading-relaxed text-emerald-100/70">
                        {latestNotification.message}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[8px] uppercase tracking-wide text-emerald-300/70">
                        {latestNotification.status === "DELIVERED" ? (
                          <CheckCheck className="h-2.5 w-2.5" />
                        ) : (
                          <Clock className="h-2.5 w-2.5" />
                        )}
                        {latestNotification.status.toLowerCase()} ·{" "}
                        {formatClock(new Date(latestNotification.createdAt))}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-3 text-center text-[9px] text-zinc-500">
                  No alerts yet. Send a 5-minute alert from a ticket to see the
                  live push.
                </div>
              )}

              {focusedOrder && (
                <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] text-zinc-400">
                      {focusedOrder.orderNumber}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-1.5 py-0.5 text-[8px] font-semibold",
                        ORDER_STATUS_META[focusedOrder.status].badgeClass,
                      )}
                    >
                      {ORDER_STATUS_META[focusedOrder.status].label}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-zinc-100">
                    {focusedOrder.studentName}
                    <span className="font-normal text-zinc-500">
                      {focusedOrder.tableNumber !== null
                        ? ` · Table ${focusedOrder.tableNumber}`
                        : " · Takeaway"}
                    </span>
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[9px] text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {focusedOrder.slotLabel}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[10px] font-bold tabular-nums",
                        slaMeta.textClass,
                      )}
                    >
                      {countdown?.display ?? "--:--"}
                    </span>
                  </div>

                  <ul className="mt-2 space-y-1 border-t border-zinc-800 pt-2">
                    {focusedOrder.items.slice(0, 3).map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 text-[9px] text-zinc-300"
                      >
                        <span className="truncate">
                          <span className="font-mono font-bold text-emerald-400">
                            {item.qty}×
                          </span>{" "}
                          {item.name}
                        </span>
                        <span className="shrink-0 text-zinc-500">
                          {item.prepTimeMins}m
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-2 flex gap-1" aria-hidden="true">
                    {STATUS_PIPELINE.map((status, index) => (
                      <span
                        key={status}
                        className={cn(
                          "h-0.5 flex-1 rounded-full",
                          index <= STATUS_PIPELINE.indexOf(focusedOrder.status)
                            ? "bg-emerald-400"
                            : "bg-zinc-700",
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2">
                <p className="text-[8px] uppercase tracking-wider text-zinc-500">
                  Recent alerts
                </p>
                {notifications.length === 0 ? (
                  <p className="mt-1 text-[9px] text-zinc-600">Nothing yet.</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {notifications.slice(0, 3).map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[9px] font-medium text-zinc-300">
                            {entry.title}
                          </span>
                          <span className="shrink-0 text-[8px] text-zinc-600">
                            {formatClock(new Date(entry.createdAt))}
                          </span>
                        </div>
                        <p className="truncate text-[8px] text-zinc-500">
                          {entry.orderNumber} · {entry.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSimulateOrder}
              className="text-[11px]"
            >
              <Plus className="h-3.5 w-3.5" />
              New order
            </Button>
            <Button
              size="sm"
              variant="warning"
              onClick={handleSimulateAlert}
              className="text-[11px]"
            >
              <Zap className="h-3.5 w-3.5" />
              5-min alert
            </Button>
          </div>
          <p className="mt-2 text-center text-[9px] text-muted-foreground">
            Alerts appear here the moment the kitchen sends them.
          </p>
        </div>
      </div>
    </div>
  );
}
