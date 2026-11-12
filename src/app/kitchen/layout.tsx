"use client";

import { ChefHat } from "lucide-react";
import { TopCommandBar } from "@/components/kitchen/TopCommandBar";
import { StudentPhoneSimulator } from "@/components/kitchen/StudentPhoneSimulator";
import { useMounted } from "@/hooks/use-now";

function KitchenBootSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="h-2 w-20 animate-pulse rounded bg-muted/70" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6">
        <div className="h-7 w-56 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-80 max-w-full animate-pulse rounded bg-muted/70" />
        <div className="mt-6 flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-28 animate-pulse rounded-md bg-muted"
            />
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-xl border border-border/60 bg-card/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mounted = useMounted();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 kds-grid opacity-50" />
      <div className="pointer-events-none fixed inset-0 kds-glow" />
      <div className="relative z-10 flex min-h-screen flex-col">
        {mounted ? (
          <>
            <TopCommandBar />
            <main className="flex-1 pb-24">{children}</main>
            <StudentPhoneSimulator />
          </>
        ) : (
          <KitchenBootSkeleton />
        )}
      </div>
    </div>
  );
}
