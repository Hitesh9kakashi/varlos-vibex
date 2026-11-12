"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  BellRing,
  Boxes,
  ChefHat,
  Clock,
  FlaskConical,
  LayoutGrid,
  MonitorPlay,
  Plus,
  Radio,
  RotateCcw,
  Smartphone,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useNow } from "@/hooks/use-now";
import { playKitchenTone } from "@/lib/kitchen-audio";
import { getRealtimeTransportLabel, useKitchenStore } from "@/lib/kitchen-store";
import { ORDER_STATUS_META, STATION_META } from "@/lib/kitchen-ui";
import {
  formatClockWithSeconds,
  getCurrentSlotStart,
  getFiveMinAlertState,
  getSlotKey,
} from "@/lib/time-slot-utils";
import { cn } from "@/lib/utils";
import type { DemoOrderKind } from "@/lib/kitchen-store";
import type { StationFilter } from "@/types/kitchen";

const NAV_ITEMS = [
  { href: "/kitchen", label: "KDS", icon: MonitorPlay },
  { href: "/kitchen/tables", label: "Floor", icon: LayoutGrid },
  { href: "/kitchen/inventory", label: "Inventory", icon: Boxes },
] as const;

const STATION_OPTIONS: StationFilter[] = ["ALL", "GRILL", "FRYER", "BEVERAGE"];
const SLOT_CAPACITY = 20;

export function TopCommandBar() {
  const pathname = usePathname();
  const now = useNow(1000);

  const orders = useKitchenStore((state) => state.orders);
  const tables = useKitchenStore((state) => state.tables);
  const stationFilter = useKitchenStore((state) => state.stationFilter);
  const setStationFilter = useKitchenStore((state) => state.setStationFilter);
  const audioEnabled = useKitchenStore((state) => state.audioEnabled);
  const toggleAudio = useKitchenStore((state) => state.toggleAudio);
  const showSimulator = useKitchenStore((state) => state.showSimulator);
  const setShowSimulator = useKitchenStore((state) => state.setShowSimulator);
  const demoDrawerOpen = useKitchenStore((state) => state.demoDrawerOpen);
  const setDemoDrawerOpen = useKitchenStore((state) => state.setDemoDrawerOpen);
  const addDemoOrder = useKitchenStore((state) => state.addDemoOrder);
  const resetDemo = useKitchenStore((state) => state.resetDemo);
  const transport = useKitchenStore((state) => state.transport);

  const nowMs = now?.getTime() ?? Date.now();

  const metrics = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "SERVED");
    const preparing = activeOrders.filter(
      (order) => order.status === "PREPARING" || order.status === "ALMOST_READY",
    ).length;
    const dueAlerts = activeOrders.filter(
      (order) => getFiveMinAlertState(order, nowMs) === "DUE",
    ).length;
    const busyTables = tables.filter(
      (table) => table.status === "OCCUPIED" || table.status === "RESERVED",
    ).length;
    const currentSlotKey = getCurrentSlotStart(nowMs).toISOString();
    const currentSlotOrders = activeOrders.filter(
      (order) => getSlotKey(order.slotTime) === currentSlotKey,
    ).length;

    return {
      live: activeOrders.length,
      preparing,
      dueAlerts,
      busyTables,
      currentSlotOrders,
      slotLoadPct: Math.min(
        100,
        Math.round((currentSlotOrders / SLOT_CAPACITY) * 100),
      ),
    };
  }, [orders, tables, nowMs]);

  const handleSpawn = (kind: DemoOrderKind) => {
    const order = addDemoOrder(kind);
    if (audioEnabled) playKitchenTone(kind === "urgent" ? "alert" : "success");
    toast.success(
      kind === "urgent" ? "Urgent order injected" : "New student order received",
      {
        description: `${order.orderNumber} · ${order.studentName} · ${
          order.tableNumber !== null ? `Table ${order.tableNumber}` : "Takeaway"
        } · ${order.slotLabel}`,
      },
    );
  };

  const handleReset = () => {
    resetDemo();
    toast.success("Demo data reset", {
      description: "Fresh table-slot orders loaded for a clean run-through.",
    });
  };

  const handleAudioToggle = () => {
    toggleAudio();
    if (!audioEnabled) {
      playKitchenTone("success");
      toast.success("Audio alerts enabled");
    } else {
      toast("Audio alerts muted");
    }
  };

  const handleTestSound = () => {
    playKitchenTone("alert");
    toast("Alert tone playing", {
      description: "This is the sound played when an order enters the 5-min window.",
    });
  };

  const isActive = (href: string) =>
    href === "/kitchen" ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3">
          <Link href="/kitchen" className="group flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25 transition-colors group-hover:bg-primary/20">
              <ChefHat className="h-5 w-5" />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-semibold tracking-[0.18em]">
                VARLOS
              </span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Kitchen Ops
              </span>
            </span>
          </Link>

          <nav
            aria-label="Kitchen sections"
            className="ml-1 flex items-center gap-1 rounded-xl border border-border/60 bg-card/40 p-1"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="mr-1 hidden flex-col items-end leading-tight lg:flex">
              <span className="font-mono text-sm font-semibold tabular-nums">
                {now ? formatClockWithSeconds(now) : "--:--:--"}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {now
                  ? new Intl.DateTimeFormat("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    }).format(now)
                  : "Loading"}
              </span>
            </div>

            {metrics.dueAlerts > 0 && (
              <Badge
                variant="critical"
                className="hidden animate-soft-pulse items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] sm:inline-flex"
              >
                <BellRing className="h-3.5 w-3.5" />
                {metrics.dueAlerts} due
              </Badge>
            )}

            <Button
              variant={showSimulator ? "secondary" : "outline"}
              size="sm"
              aria-label={
                showSimulator
                  ? "Hide student phone preview"
                  : "Show student phone preview"
              }
              aria-pressed={showSimulator}
              onClick={() => setShowSimulator(!showSimulator)}
              className="gap-1.5"
            >
              <Smartphone className="h-4 w-4" />
              <span className="hidden md:inline">
                {showSimulator ? "Hide phone" : "Student view"}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label={audioEnabled ? "Mute audio alerts" : "Enable audio alerts"}
              aria-pressed={audioEnabled}
              onClick={handleAudioToggle}
            >
              {audioEnabled ? <Volume2 /> : <VolumeX />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setDemoDrawerOpen(true)}
              className="gap-1.5"
            >
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Demo</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/40 py-2.5">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-semibold text-foreground">{metrics.live}</span>
              live orders
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="hidden items-center gap-1 sm:inline-flex">
              <span className="font-semibold text-foreground">{metrics.preparing}</span>
              on the line
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="hidden items-center gap-1 md:inline-flex">
              <span className="font-semibold text-foreground">{metrics.busyTables}</span>/
              {tables.length} tables engaged
            </span>
          </div>

          <div className="ml-auto flex min-w-[230px] flex-1 items-center gap-2 sm:max-w-xs">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Slot load
            </span>
            <Progress
              value={metrics.slotLoadPct}
              className="h-1.5 flex-1"
              indicatorClassName={
                metrics.slotLoadPct >= 85
                  ? "bg-rose-500"
                  : metrics.slotLoadPct >= 60
                    ? "bg-amber-400"
                    : "bg-emerald-400"
              }
            />
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {metrics.currentSlotOrders}/{SLOT_CAPACITY}
            </span>
          </div>

          <div
            role="group"
            aria-label="Filter by station"
            className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-1"
          >
            {STATION_OPTIONS.map((station) => {
              const active = stationFilter === station;
              const meta = STATION_META[station];
              return (
                <button
                  key={station}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStationFilter(station)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                    active
                      ? "bg-secondary text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} />
                  <span className="hidden sm:inline">
                    {station === "ALL" ? "All" : meta.label}
                  </span>
                  <span className="sm:hidden">
                    {station === "ALL" ? "All" : station.slice(0, 3)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Sheet open={demoDrawerOpen} onOpenChange={setDemoDrawerOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-y-auto scrollbar-thin sm:max-w-md"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Demo Simulator
            </SheetTitle>
            <SheetDescription>
              Inject live events and walk judges through the full KDS workflow
              without waiting for real orders.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-2.5">
            <Button
              variant="default"
              className="w-full justify-start"
              onClick={() => handleSpawn("random")}
            >
              <Plus />
              Spawn random student order
            </Button>
            <Button
              variant="warning"
              className="w-full justify-start"
              onClick={() => handleSpawn("urgent")}
            >
              <Zap />
              Spawn urgent order (5-min window)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleTestSound}
            >
              <Volume2 />
              Test alert sound
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleReset}
            >
              <RotateCcw />
              Reset demo data
            </Button>
          </div>

          <div className="mt-6 rounded-xl border border-border/60 bg-card/50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Audio alerts</p>
                <p className="text-xs text-muted-foreground">
                  Web Audio beeps on new tickets and 5-minute alerts.
                </p>
              </div>
              <Switch
                checked={audioEnabled}
                onCheckedChange={handleAudioToggle}
                aria-label="Toggle audio alerts"
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-card/50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Radio className="h-4 w-4 text-emerald-400" />
              Realtime transport
            </div>
            <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {getRealtimeTransportLabel(transport)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Open this page in a second tab. Order status, alerts and stock
              changes sync instantly in both directions — no API keys required.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-card/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Current ticket statuses</span>
              <span className="text-xs text-muted-foreground">
                {metrics.live} live
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(ORDER_STATUS_META).map(([status, meta]) => (
                <span
                  key={status}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    meta.badgeClass,
                  )}
                >
                  {meta.shortLabel} ·{" "}
                  {orders.filter((order) => order.status === status).length}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Judge walkthrough</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4">
              <li>Point out the current slot&apos;s overdue tickets.</li>
              <li>
                Hit{" "}
                <span className="text-orange-300">Notify 5m before ready</span>{" "}
                and show the phone preview + toast.
              </li>
              <li>
                Advance a ticket to Ready, check the Floor tab, then kill an item
                in Inventory.
              </li>
            </ol>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
