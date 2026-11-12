"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentSlotStart } from "@/lib/time-slot-utils";
import { cn } from "@/lib/utils";
import type { SlotSummary } from "@/types/kitchen";

interface SlotFilterTabsProps {
  summaries: SlotSummary[];
  activeSlotKey: string | null;
  onSelect: (slotKey: string | null) => void;
  totalOrders: number;
  now: Date | null;
}

export function SlotFilterTabs({
  summaries,
  activeSlotKey,
  onSelect,
  totalOrders,
  now,
}: SlotFilterTabsProps) {
  const liveSlotKey = now
    ? getCurrentSlotStart(now.getTime()).toISOString()
    : null;

  return (
    <Tabs
      value={activeSlotKey ?? "all"}
      onValueChange={(value) => onSelect(value === "all" ? null : value)}
      className="w-full"
    >
      <TabsList
        aria-label="Filter orders by time slot"
        className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border/50 bg-card/40 p-1.5"
      >
        <TabsTrigger
          value="all"
          className="group h-8 gap-1.5 rounded-lg px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          All slots
          <span className="rounded-full bg-secondary/80 px-1.5 font-mono text-[10px] text-muted-foreground group-data-[state=active]:bg-primary-foreground/20 group-data-[state=active]:text-primary-foreground">
            {totalOrders}
          </span>
        </TabsTrigger>

        {summaries.map((summary) => {
          const isLive = summary.key === liveSlotKey;
          return (
            <TabsTrigger
              key={summary.key}
              value={summary.key}
              className="group h-8 gap-1.5 rounded-lg px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {isLive && (
                <span
                  className={cn(
                    "h-1.5 w-1.5 animate-soft-pulse rounded-full bg-orange-400",
                    activeSlotKey === summary.key && "bg-orange-300",
                  )}
                  aria-label="Current slot"
                />
              )}
              <span>{summary.label}</span>
              <span className="rounded-full bg-secondary/80 px-1.5 font-mono text-[10px] text-muted-foreground group-data-[state=active]:bg-primary-foreground/20 group-data-[state=active]:text-primary-foreground">
                {summary.orderCount}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
