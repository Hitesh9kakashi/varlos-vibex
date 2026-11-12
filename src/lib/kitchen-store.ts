"use client";

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  createMockKitchenData,
  createSimulatedOrder,
} from "@/lib/mock-kitchen-data";
import type {
  CanteenTable,
  InventoryItem,
  KitchenOrder,
  KitchenSnapshot,
  OrderStatus,
  StationCapacity,
  StationFilter,
  StationType,
  StudentNotification,
  TimeSlot,
} from "@/types/kitchen";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const HAS_SUPABASE_CONFIG = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const CHANNEL_NAME = "varlos-kitchen-kds";
const SYNC_EVENT = "kitchen-sync";
const MINUTE_MS = 60 * 1000;

export type DemoOrderKind = "random" | "urgent";

type RealtimeTransport = "LOCAL" | "SUPABASE";

interface KitchenStore {
  orders: KitchenOrder[];
  tables: CanteenTable[];
  slots: TimeSlot[];
  inventory: InventoryItem[];
  notifications: StudentNotification[];
  stationCapacity: StationCapacity[];
  audioEnabled: boolean;
  activeSlotKey: string | null;
  stationFilter: StationFilter;
  showSimulator: boolean;
  demoDrawerOpen: boolean;
  lastSyncedAt: string | null;
  transport: RealtimeTransport;

  setActiveSlot: (slotKey: string | null) => void;
  setStationFilter: (filter: StationFilter) => void;
  toggleAudio: () => void;
  setShowSimulator: (open: boolean) => void;
  setDemoDrawerOpen: (open: boolean) => void;
  advanceOrderStatus: (orderId: string) => OrderStatus | null;
  sendFiveMinAlert: (orderId: string) => StudentNotification | null;
  toggleInventoryKill: (itemId: string) => boolean | null;
  restockItem: (itemId: string) => void;
  setStationCapacity: (station: Exclude<StationType, "ALL">, capacity: number) => void;
  addDemoOrder: (kind: DemoOrderKind) => KitchenOrder;
  resetDemo: () => void;
  applySnapshot: (snapshot: KitchenSnapshot) => void;
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  RECEIVED: "PREPARING",
  PREPARING: "ALMOST_READY",
  ALMOST_READY: "READY",
  READY: "SERVED",
  SERVED: null,
};

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function createNotificationId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function tableFor(order: KitchenOrder): CanteenTable["status"] {
  return Date.parse(order.slotTime) > Date.now() ? "RESERVED" : "OCCUPIED";
}

function readyNotification(order: KitchenOrder, createdAt: string): StudentNotification {
  const destination =
    order.tableNumber === null
      ? "the pickup counter"
      : `Table ${order.tableNumber}`;

  return {
    id: createNotificationId(),
    orderId: order.id,
    orderNumber: order.orderNumber,
    studentName: order.studentName,
    studentPhone: order.studentPhone,
    tableNumber: order.tableNumber,
    title: "Your order is ready",
    message: `${firstName(order.studentName)}, ${order.orderNumber} is ready at ${destination}. Enjoy your meal!`,
    kind: "READY",
    channel: "PUSH",
    status: "DELIVERED",
    createdAt,
  };
}

const initialData = createMockKitchenData();

/* ------------------------------------------------------------------ */
/* Realtime transport: Supabase Broadcast when configured, with a      */
/* BroadcastChannel fallback that keeps the demo working with no keys. */
/* ------------------------------------------------------------------ */

let localChannel: BroadcastChannel | null = null;
let supabaseClient: SupabaseClient | null = null;
let supabaseChannel: RealtimeChannel | null = null;
let realtimeBound = false;
let newestSnapshotAt = 0;

function getSupabaseClient(): SupabaseClient | null {
  if (!HAS_SUPABASE_CONFIG || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

function broadcastSnapshot(snapshot: KitchenSnapshot): void {
  newestSnapshotAt = Math.max(newestSnapshotAt, Date.parse(snapshot.updatedAt));

  if (localChannel) {
    localChannel.postMessage({ type: SYNC_EVENT, payload: snapshot });
  }

  if (supabaseChannel) {
    void supabaseChannel.send({
      type: "broadcast",
      event: SYNC_EVENT,
      payload: snapshot,
    });
  }
}

function bindRealtime(): void {
  if (typeof window === "undefined" || realtimeBound) return;
  realtimeBound = true;

  if (typeof BroadcastChannel !== "undefined") {
    localChannel = new BroadcastChannel(CHANNEL_NAME);
    localChannel.addEventListener("message", (event: MessageEvent) => {
      const data = event.data as { type?: string; payload?: KitchenSnapshot } | null;
      if (data?.type === SYNC_EVENT && data.payload) {
        useKitchenStore.getState().applySnapshot(data.payload);
      }
    });
  }

  const client = getSupabaseClient();
  if (client) {
    supabaseChannel = client.channel(CHANNEL_NAME, {
      config: { broadcast: { self: false } },
    });
    supabaseChannel
      .on("broadcast", { event: SYNC_EVENT }, (message) => {
        const snapshot = (message as unknown as { payload?: KitchenSnapshot })
          .payload;
        if (snapshot) {
          useKitchenStore.getState().applySnapshot(snapshot);
        }
      })
      .subscribe();
  }
}

export const useKitchenStore = create<KitchenStore>()((set, get) => {
  const publish = (): void => {
    const state = get();
    const snapshot: KitchenSnapshot = {
      orders: state.orders,
      tables: state.tables,
      slots: state.slots,
      inventory: state.inventory,
      notifications: state.notifications,
      stationCapacity: state.stationCapacity,
      updatedAt: new Date().toISOString(),
    };
    broadcastSnapshot(snapshot);
  };

  return {
    orders: initialData.orders,
    tables: initialData.tables,
    slots: initialData.slots,
    inventory: initialData.inventory,
    notifications: initialData.notifications,
    stationCapacity: initialData.stationCapacity,
    audioEnabled: true,
    activeSlotKey: null,
    stationFilter: "ALL",
    showSimulator: false,
    demoDrawerOpen: false,
    lastSyncedAt: null,
    transport: HAS_SUPABASE_CONFIG ? "SUPABASE" : "LOCAL",

    setActiveSlot: (slotKey) => set({ activeSlotKey: slotKey }),
    setStationFilter: (filter) => set({ stationFilter: filter }),
    toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
    setShowSimulator: (open) => set({ showSimulator: open }),
    setDemoDrawerOpen: (open) => set({ demoDrawerOpen: open }),

    advanceOrderStatus: (orderId) => {
      const order = get().orders.find((candidate) => candidate.id === orderId);
      if (!order) return null;

      const nextStatus = NEXT_STATUS[order.status];
      if (!nextStatus) return null;

      const nowIso = new Date().toISOString();
      const orders = get().orders.map((candidate) =>
        candidate.id === orderId ? { ...candidate, status: nextStatus } : candidate,
      );

      const tables = get().tables.map((table) => {
        if (order.tableNumber === null || table.tableNumber !== order.tableNumber) {
          return table;
        }
        if (nextStatus === "SERVED") {
          return {
            ...table,
            status: "CLEANING" as const,
            currentOrderId: undefined,
          };
        }
        return {
          ...table,
          status: "OCCUPIED" as const,
          currentOrderId: orderId,
        };
      });

      const notifications =
        nextStatus === "READY"
          ? [readyNotification(order, nowIso), ...get().notifications]
          : get().notifications;

      set({ orders, tables, notifications });
      publish();
      return nextStatus;
    },

    sendFiveMinAlert: (orderId) => {
      const order = get().orders.find((candidate) => candidate.id === orderId);
      if (!order || order.fiveMinAlertSent) return null;
      if (order.status === "SERVED" || order.status === "READY") return null;

      const nowIso = new Date().toISOString();
      const destination =
        order.tableNumber === null ? "the pickup counter" : `Table ${order.tableNumber}`;

      const notification: StudentNotification = {
        id: createNotificationId(),
        orderId: order.id,
        orderNumber: order.orderNumber,
        studentName: order.studentName,
        studentPhone: order.studentPhone,
        tableNumber: order.tableNumber,
        title: "Your order is 5 minutes away",
        message: `${firstName(order.studentName)}, ${order.orderNumber} will be ready in ~5 minutes at ${destination}. Please head over now.`,
        kind: "FIVE_MIN",
        channel: "PUSH",
        status: "SENT",
        createdAt: nowIso,
      };

      const orders = get().orders.map((candidate) => {
        if (candidate.id !== orderId) return candidate;
        const mustAdvance =
          candidate.status === "RECEIVED" || candidate.status === "PREPARING";
        return {
          ...candidate,
          fiveMinAlertSent: true,
          fiveMinAlertSentAt: nowIso,
          status: mustAdvance ? ("ALMOST_READY" as const) : candidate.status,
        };
      });

      set({
        orders,
        notifications: [notification, ...get().notifications],
      });
      publish();

      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.map((entry) =>
              entry.id === notification.id
                ? { ...entry, status: "DELIVERED" as const }
                : entry,
            ),
          }));
          publish();
        }, 2200);
      }

      return notification;
    },

    toggleInventoryKill: (itemId) => {
      const item = get().inventory.find((candidate) => candidate.id === itemId);
      if (!item) return null;

      const isKilled = !item.isKilled;
      const inventory = get().inventory.map((candidate) =>
        candidate.id === itemId
          ? { ...candidate, isKilled, updatedAt: new Date().toISOString() }
          : candidate,
      );

      set({ inventory });
      publish();
      return isKilled;
    },

    restockItem: (itemId) => {
      const inventory = get().inventory.map((item) =>
        item.id === itemId
          ? {
              ...item,
              isKilled: false,
              stockLevel: Math.max(item.stockLevel, item.threshold * 2),
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      set({ inventory });
      publish();
    },

    setStationCapacity: (station, capacity) => {
      const clamped = Math.min(40, Math.max(1, Math.round(capacity)));
      const stationCapacity = get().stationCapacity.map((entry) =>
        entry.station === station ? { ...entry, capacityPerSlot: clamped } : entry,
      );
      set({ stationCapacity });
      publish();
    },

    addDemoOrder: (kind) => {
      const now = new Date();
      const order = createSimulatedOrder(
        now,
        get().orders,
        get().tables,
        { urgent: kind === "urgent" },
      );

      const tables = get().tables.map((table) =>
        order.tableNumber !== null && table.tableNumber === order.tableNumber
          ? {
              ...table,
              status: tableFor(order),
              currentOrderId: order.id,
            }
          : table,
      );

      set({ orders: [order, ...get().orders], tables });
      publish();
      return order;
    },

    resetDemo: () => {
      const data = createMockKitchenData(new Date());
      set({
        ...data,
        activeSlotKey: null,
        stationFilter: "ALL",
        lastSyncedAt: null,
      });
      publish();
    },

    applySnapshot: (snapshot) => {
      if (!snapshot || !Array.isArray(snapshot.orders)) return;

      const incomingAt = Date.parse(snapshot.updatedAt);
      if (!Number.isNaN(incomingAt) && incomingAt < newestSnapshotAt) return;
      newestSnapshotAt = Math.max(newestSnapshotAt, incomingAt || 0);

      set({
        orders: snapshot.orders,
        tables: snapshot.tables,
        slots: snapshot.slots,
        inventory: snapshot.inventory,
        notifications: snapshot.notifications,
        stationCapacity: snapshot.stationCapacity,
        lastSyncedAt: snapshot.updatedAt,
      });
    },
  };
});

bindRealtime();

export function getRealtimeTransportLabel(transport: RealtimeTransport): string {
  return transport === "SUPABASE" ? "Supabase Realtime" : "Local BroadcastChannel";
}
