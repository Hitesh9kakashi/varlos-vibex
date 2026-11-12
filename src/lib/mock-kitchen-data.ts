import type {
  CanteenTable,
  InventoryItem,
  KitchenOrder,
  OrderItem,
  StationCapacity,
  StationType,
  StudentNotification,
  TableZone,
  TimeSlot,
} from "@/types/kitchen";
import {
  SLOT_MINUTES,
  formatSlotLabel,
  getCurrentSlotStart,
  getSlotStart,
} from "@/lib/time-slot-utils";

const MINUTE_MS = 60 * 1000;

interface MockKitchenData {
  orders: KitchenOrder[];
  tables: CanteenTable[];
  slots: TimeSlot[];
  inventory: InventoryItem[];
  notifications: StudentNotification[];
  stationCapacity: StationCapacity[];
}

interface TableSeed {
  tableNumber: number;
  seatCount: number;
  zone: TableZone;
  x: number;
  y: number;
}

const TABLE_SEEDS: TableSeed[] = [
  { tableNumber: 1, seatCount: 4, zone: "WINDOW", x: 8, y: 20 },
  { tableNumber: 2, seatCount: 2, zone: "WINDOW", x: 31, y: 20 },
  { tableNumber: 3, seatCount: 2, zone: "WINDOW", x: 55, y: 20 },
  { tableNumber: 4, seatCount: 4, zone: "WINDOW", x: 79, y: 20 },
  { tableNumber: 5, seatCount: 2, zone: "HALL", x: 8, y: 50 },
  { tableNumber: 6, seatCount: 4, zone: "HALL", x: 31, y: 50 },
  { tableNumber: 7, seatCount: 2, zone: "HALL", x: 55, y: 50 },
  { tableNumber: 8, seatCount: 4, zone: "HALL", x: 79, y: 50 },
  { tableNumber: 9, seatCount: 6, zone: "PATIO", x: 8, y: 80 },
  { tableNumber: 10, seatCount: 4, zone: "PATIO", x: 31, y: 80 },
  { tableNumber: 11, seatCount: 4, zone: "MEZZANINE", x: 55, y: 80 },
  { tableNumber: 12, seatCount: 6, zone: "MEZZANINE", x: 79, y: 80 },
];

const MENU_POOL: Array<{
  name: string;
  station: StationType;
  prepTimeMins: number;
  notes?: string;
}> = [
  { name: "Masala Dosa", station: "GRILL", prepTimeMins: 8 },
  { name: "Mysore Masala Dosa", station: "GRILL", prepTimeMins: 9, notes: "Less spicy" },
  { name: "Pav Bhaji", station: "GRILL", prepTimeMins: 10, notes: "Extra butter" },
  { name: "Veg Grilled Sandwich", station: "GRILL", prepTimeMins: 6 },
  { name: "Paneer Tikka", station: "GRILL", prepTimeMins: 12 },
  { name: "Aloo Paratha", station: "GRILL", prepTimeMins: 10, notes: "Curd on the side" },
  { name: "Butter Naan", station: "GRILL", prepTimeMins: 4 },
  { name: "Idli Vada", station: "FRYER", prepTimeMins: 7 },
  { name: "Medu Vada", station: "FRYER", prepTimeMins: 5 },
  { name: "Samosa", station: "FRYER", prepTimeMins: 4 },
  { name: "French Fries", station: "FRYER", prepTimeMins: 5 },
  { name: "Filter Coffee", station: "BEVERAGE", prepTimeMins: 3 },
  { name: "Masala Chai", station: "BEVERAGE", prepTimeMins: 3 },
  { name: "Cold Coffee", station: "BEVERAGE", prepTimeMins: 4 },
  { name: "Lime Soda", station: "BEVERAGE", prepTimeMins: 2 },
  { name: "Poha", station: "ALL", prepTimeMins: 5 },
  { name: "Veg Fried Rice", station: "ALL", prepTimeMins: 9 },
];

const STUDENT_NAMES = [
  "Ananya Sharma",
  "Rohan Mehta",
  "Ishita Rao",
  "Kabir Nair",
  "Meera Iyer",
  "Arjun Patel",
  "Sana Khan",
  "Dev Sharma",
  "Tara Menon",
  "Nikhil Reddy",
  "Priya Desai",
  "Aditya Joshi",
  "Neha Gupta",
  "Vikram Singh",
  "Zoya Ali",
  "Harsh Vardhan",
];

function mockId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(3, "0")}`;
}

function item(
  orderIndex: number,
  itemIndex: number,
  name: string,
  qty: number,
  station: StationType,
  prepTimeMins: number,
  notes?: string,
): OrderItem {
  return {
    id: mockId(`itm-${orderIndex}`, itemIndex),
    name,
    qty,
    station,
    prepTimeMins,
    ...(notes ? { notes } : {}),
  };
}

function slotIso(base: Date, slotOffset: number): string {
  return new Date(base.getTime() + slotOffset * SLOT_MINUTES * MINUTE_MS).toISOString();
}

export function createMockKitchenData(now: Date = new Date()): MockKitchenData {
  const nowMs = now.getTime();
  const baseSlot = getCurrentSlotStart(nowMs);

  const orders: KitchenOrder[] = [
    {
      id: "ord-402",
      orderNumber: "#ORD-402",
      studentName: "Ananya Sharma",
      studentPhone: "+91 98200 11402",
      tableNumber: 4,
      seatCount: 4,
      slotTime: slotIso(baseSlot, 0),
      slotLabel: formatSlotLabel(slotIso(baseSlot, 0)),
      status: "PREPARING",
      items: [
        item(402, 1, "Masala Dosa", 2, "GRILL", 8, "Extra chutney, no sambar"),
        item(402, 2, "Filter Coffee", 2, "BEVERAGE", 3),
      ],
      fiveMinAlertSent: false,
      createdAt: new Date(nowMs - 24 * MINUTE_MS).toISOString(),
    },
    {
      id: "ord-403",
      orderNumber: "#ORD-403",
      studentName: "Rohan Mehta",
      studentPhone: "+91 98200 11403",
      tableNumber: 7,
      seatCount: 2,
      slotTime: slotIso(baseSlot, 0),
      slotLabel: formatSlotLabel(slotIso(baseSlot, 0)),
      status: "ALMOST_READY",
      items: [
        item(403, 1, "Pav Bhaji", 1, "GRILL", 10, "Extra butter"),
        item(403, 2, "Lime Soda", 1, "BEVERAGE", 2),
      ],
      fiveMinAlertSent: true,
      fiveMinAlertSentAt: new Date(nowMs - 6 * MINUTE_MS).toISOString(),
      createdAt: new Date(nowMs - 21 * MINUTE_MS).toISOString(),
    },
    {
      id: "ord-404",
      orderNumber: "#ORD-404",
      studentName: "Ishita Rao",
      studentPhone: "+91 98200 11404",
      tableNumber: 2,
      seatCount: 2,
      slotTime: slotIso(baseSlot, 1),
      slotLabel: formatSlotLabel(slotIso(baseSlot, 1)),
      status: "PREPARING",
      items: [
        item(404, 1, "Mysore Masala Dosa", 1, "GRILL", 9, "Less spicy"),
        item(404, 2, "Masala Chai", 1, "BEVERAGE", 3),
      ],
      fiveMinAlertSent: false,
      createdAt: new Date(nowMs - 12 * MINUTE_MS).toISOString(),
    },
    {
      id: "ord-405",
      orderNumber: "#ORD-405",
      studentName: "Kabir Nair",
      studentPhone: "+91 98200 11405",
      tableNumber: null,
      slotTime: slotIso(baseSlot, 1),
      slotLabel: formatSlotLabel(slotIso(baseSlot, 1)),
      status: "RECEIVED",
      items: [
        item(405, 1, "Veg Grilled Sandwich", 2, "GRILL", 6),
        item(405, 2, "Cold Coffee", 2, "BEVERAGE", 4),
      ],
      fiveMinAlertSent: false,
      createdAt: new Date(nowMs - 10 * MINUTE_MS).toISOString(),
    },
    {
      id: "ord-406",
      orderNumber: "#ORD-406",
      studentName: "Meera Iyer",
      studentPhone: "+91 98200 11406",
      tableNumber: 9,
      seatCount: 6,
      slotTime: slotIso(baseSlot, 2),
      slotLabel: formatSlotLabel(slotIso(baseSlot, 2)),
      status: "RECEIVED",
      items: [
        item(406, 1, "Idli Vada", 3, "FRYER", 7),
        item(406, 2, "Filter Coffee", 3, "BEVERAGE", 3),
      ],
      fiveMinAlertSent: false,
      createdAt: new Date(nowMs - 8 * MINUTE_MS).toISOString(),
    },
    {
      id: "ord-407",
      orderNumber: "#ORD-407",
      studentName: "Arjun Patel",
      studentPhone: "+91 98200 11407",
      tableNumber: 11,
      seatCount: 4,
      slotTime: slotIso(baseSlot, 2),
      slotLabel: formatSlotLabel(slotIso(baseSlot, 2)),
      status: "RECEIVED",
      items: [
        item(407, 1, "Paneer Tikka", 1, "GRILL", 12),
        item(407, 2, "Butter Naan", 2, "GRILL", 4),
        item(407, 3, "Lime Soda", 2, "BEVERAGE", 2),
      ],
      fiveMinAlertSent: false,
      createdAt: new Date(nowMs - 7 * MINUTE_MS).toISOString(),
    },
    {
      id: "ord-408",
      orderNumber: "#ORD-408",
      studentName: "Sana Khan",
      studentPhone: "+91 98200 11408",
      tableNumber: 5,
      seatCount: 2,
      slotTime: slotIso(baseSlot, 3),
      slotLabel: formatSlotLabel(slotIso(baseSlot, 3)),
      status: "RECEIVED",
      items: [
        item(408, 1, "Aloo Paratha", 2, "GRILL", 10, "Curd on the side"),
        item(408, 2, "Masala Chai", 2, "BEVERAGE", 3),
      ],
      fiveMinAlertSent: false,
      createdAt: new Date(nowMs - 5 * MINUTE_MS).toISOString(),
    },
    {
      id: "ord-409",
      orderNumber: "#ORD-409",
      studentName: "Dev Sharma",
      studentPhone: "+91 98200 11409",
      tableNumber: 1,
      seatCount: 4,
      slotTime: slotIso(baseSlot, 3),
      slotLabel: formatSlotLabel(slotIso(baseSlot, 3)),
      status: "PREPARING",
      items: [
        item(409, 1, "Veg Fried Rice", 1, "ALL", 9),
        item(409, 2, "French Fries", 1, "FRYER", 5),
      ],
      fiveMinAlertSent: false,
      createdAt: new Date(nowMs - 4 * MINUTE_MS).toISOString(),
    },
    {
      id: "ord-410",
      orderNumber: "#ORD-410",
      studentName: "Tara Menon",
      studentPhone: "+91 98200 11410",
      tableNumber: 8,
      seatCount: 4,
      slotTime: slotIso(baseSlot, 4),
      slotLabel: formatSlotLabel(slotIso(baseSlot, 4)),
      status: "RECEIVED",
      items: [
        item(410, 1, "Samosa", 4, "FRYER", 4),
        item(410, 2, "Masala Chai", 4, "BEVERAGE", 3),
      ],
      fiveMinAlertSent: false,
      createdAt: new Date(nowMs - 2 * MINUTE_MS).toISOString(),
    },
    {
      id: "ord-411",
      orderNumber: "#ORD-411",
      studentName: "Nikhil Reddy",
      studentPhone: "+91 98200 11411",
      tableNumber: 12,
      seatCount: 6,
      slotTime: slotIso(baseSlot, 4),
      slotLabel: formatSlotLabel(slotIso(baseSlot, 4)),
      status: "READY",
      items: [
        item(411, 1, "Cheese Grilled Sandwich", 2, "GRILL", 6),
        item(411, 2, "Cold Coffee", 2, "BEVERAGE", 4),
      ],
      fiveMinAlertSent: true,
      fiveMinAlertSentAt: new Date(nowMs - 11 * MINUTE_MS).toISOString(),
      createdAt: new Date(nowMs - 26 * MINUTE_MS).toISOString(),
    },
    {
      id: "ord-412",
      orderNumber: "#ORD-412",
      studentName: "Priya Desai",
      studentPhone: "+91 98200 11412",
      tableNumber: 6,
      seatCount: 4,
      slotTime: slotIso(baseSlot, 5),
      slotLabel: formatSlotLabel(slotIso(baseSlot, 5)),
      status: "RECEIVED",
      items: [
        item(412, 1, "Poha", 1, "ALL", 5),
        item(412, 2, "Filter Coffee", 1, "BEVERAGE", 3),
      ],
      fiveMinAlertSent: false,
      createdAt: new Date(nowMs - 1 * MINUTE_MS).toISOString(),
    },
  ];

  const notifications: StudentNotification[] = [
    {
      id: "notif-403",
      orderId: "ord-403",
      orderNumber: "#ORD-403",
      studentName: "Rohan Mehta",
      studentPhone: "+91 98200 11403",
      tableNumber: 7,
      title: "Your table is almost ready",
      message:
        "Rohan, your Pav Bhaji will be ready in ~5 minutes. Please head to Table 7.",
      kind: "FIVE_MIN",
      channel: "PUSH",
      status: "DELIVERED",
      createdAt: new Date(nowMs - 6 * MINUTE_MS).toISOString(),
    },
    {
      id: "notif-411",
      orderId: "ord-411",
      orderNumber: "#ORD-411",
      studentName: "Nikhil Reddy",
      studentPhone: "+91 98200 11411",
      tableNumber: 12,
      title: "Order ready for pickup",
      message: "Nikhil, #ORD-411 is ready and waiting at the pass. Table 12.",
      kind: "READY",
      channel: "PUSH",
      status: "DELIVERED",
      createdAt: new Date(nowMs - 11 * MINUTE_MS).toISOString(),
    },
  ];

  const tables: CanteenTable[] = TABLE_SEEDS.map((seed) => {
    const order = orders.find(
      (candidate) =>
        candidate.tableNumber === seed.tableNumber && candidate.status !== "SERVED",
    );

    if (!order) {
      return {
        id: `table-${seed.tableNumber}`,
        ...seed,
        status: "AVAILABLE" as const,
      };
    }

    const isFutureReservation =
      order.status === "RECEIVED" && Date.parse(order.slotTime) > nowMs;

    return {
      id: `table-${seed.tableNumber}`,
      ...seed,
      status: isFutureReservation ? "RESERVED" : "OCCUPIED",
      currentOrderId: order.id,
    };
  });

  const slots: TimeSlot[] = Array.from({ length: 7 }, (_, index) => {
    const offset = index - 1;
    const start = new Date(baseSlot.getTime() + offset * SLOT_MINUTES * MINUTE_MS);
    const end = new Date(start.getTime() + SLOT_MINUTES * MINUTE_MS);
    const startIso = start.toISOString();

    return {
      id: `slot-${offset}`,
      startTime: startIso,
      endTime: end.toISOString(),
      label: formatSlotLabel(startIso),
      capacity: 20,
      booked: orders.filter(
        (order) =>
          order.status !== "SERVED" &&
          Math.floor((Date.parse(order.slotTime) - baseSlot.getTime()) / (SLOT_MINUTES * MINUTE_MS)) ===
            offset,
      ).length,
      isPeak: offset === 0 || offset === 1,
    };
  });

  const inventory: InventoryItem[] = [
    { id: "inv-dosa", name: "Dosa Batter", station: "GRILL", unit: "kg", stockLevel: 14, threshold: 5, isKilled: false },
    { id: "inv-paneer", name: "Paneer", station: "GRILL", unit: "kg", stockLevel: 0, threshold: 3, isKilled: true },
    { id: "inv-pavbhaji", name: "Pav Bhaji Mix", station: "GRILL", unit: "kg", stockLevel: 8, threshold: 4, isKilled: false },
    { id: "inv-bread", name: "Sandwich Bread", station: "GRILL", unit: "packs", stockLevel: 12, threshold: 6, isKilled: false },
    { id: "inv-paratha", name: "Paratha Dough", station: "GRILL", unit: "kg", stockLevel: 6, threshold: 3, isKilled: false },
    { id: "inv-idli", name: "Idli Batter", station: "FRYER", unit: "kg", stockLevel: 11, threshold: 5, isKilled: false },
    { id: "inv-vada", name: "Vada Batter", station: "FRYER", unit: "kg", stockLevel: 4, threshold: 4, isKilled: false },
    { id: "inv-samosa", name: "Samosa (frozen)", station: "FRYER", unit: "pcs", stockLevel: 48, threshold: 20, isKilled: false },
    { id: "inv-fries", name: "French Fries", station: "FRYER", unit: "kg", stockLevel: 9, threshold: 4, isKilled: false },
    { id: "inv-decoction", name: "Filter Coffee Decoction", station: "BEVERAGE", unit: "L", stockLevel: 7, threshold: 3, isKilled: false },
    { id: "inv-chai", name: "Masala Chai Mix", station: "BEVERAGE", unit: "L", stockLevel: 10, threshold: 4, isKilled: false },
    { id: "inv-coldcoffee", name: "Cold Coffee Mix", station: "BEVERAGE", unit: "L", stockLevel: 2, threshold: 3, isKilled: false },
    { id: "inv-lime", name: "Lime Soda Syrup", station: "BEVERAGE", unit: "L", stockLevel: 6, threshold: 2, isKilled: false },
    { id: "inv-poha", name: "Poha Mix", station: "ALL", unit: "kg", stockLevel: 5, threshold: 2, isKilled: false },
    { id: "inv-rice", name: "Fried Rice Base", station: "ALL", unit: "kg", stockLevel: 7, threshold: 3, isKilled: false },
  ].map((entry) => ({
    ...entry,
    station: entry.station as Exclude<StationType, "ALL">,
    updatedAt: now.toISOString(),
  }));

  const stationCapacity: StationCapacity[] = [
    { station: "GRILL", label: "Grill Station", capacityPerSlot: 12 },
    { station: "FRYER", label: "Fryer Station", capacityPerSlot: 10 },
    { station: "BEVERAGE", label: "Beverage Station", capacityPerSlot: 16 },
  ];

  return { orders, tables, slots, inventory, notifications, stationCapacity };
}

function nextOrderNumber(orders: KitchenOrder[]): string {
  const highest = orders.reduce((max, order) => {
    const parsed = Number.parseInt(order.orderNumber.replace(/\D/g, ""), 10);
    return Number.isNaN(parsed) ? max : Math.max(max, parsed);
  }, 400);
  return `#ORD-${highest + 1}`;
}

function randomOf<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

/**
 * Generates a realistic inbound student order for the demo simulator.
 * `urgent` places the slot inside the live 5-minute notification window.
 */
export function createSimulatedOrder(
  now: Date,
  existingOrders: KitchenOrder[],
  tables: CanteenTable[],
  options: { urgent?: boolean } = {},
): KitchenOrder {
  const nowMs = now.getTime();
  const baseSlot = getCurrentSlotStart(nowMs);

  const openTables = tables.filter(
    (table) =>
      table.status !== "CLEANING" &&
      !table.currentOrderId &&
      !existingOrders.some(
        (order) =>
          order.tableNumber === table.tableNumber && order.status !== "SERVED",
      ),
  );

  const assignedTable =
    openTables.length > 0 ? randomOf(openTables) : null;

  const slotDate = options.urgent
    ? new Date(nowMs + 4 * MINUTE_MS)
    : new Date(
        baseSlot.getTime() +
          (2 + Math.floor(Math.random() * 3)) * SLOT_MINUTES * MINUTE_MS,
      );

  const slotIsoValue = slotDate.toISOString();
  const slotWindowLabel = formatSlotLabel(
    getSlotStart(slotIsoValue).toISOString(),
  );

  const itemCount = 1 + Math.floor(Math.random() * 2);
  const chosenItems: OrderItem[] = [];
  const usedNames = new Set<string>();

  for (let index = 0; index < itemCount; index += 1) {
    let menuItem = randomOf(MENU_POOL);
    let attempts = 0;
    while (usedNames.has(menuItem.name) && attempts < 8) {
      menuItem = randomOf(MENU_POOL);
      attempts += 1;
    }
    if (usedNames.has(menuItem.name)) continue;
    usedNames.add(menuItem.name);

    chosenItems.push({
      id: createId("itm"),
      name: menuItem.name,
      qty: 1 + Math.floor(Math.random() * 3),
      station: menuItem.station,
      prepTimeMins: menuItem.prepTimeMins,
      ...(Math.random() > 0.78 ? { notes: "No onion, please" } : {}),
    });
  }

  const studentName = randomOf(STUDENT_NAMES);

  return {
    id: createId("ord"),
    orderNumber: nextOrderNumber(existingOrders),
    studentName,
    studentPhone: `+91 98${String(Math.floor(10000000 + Math.random() * 89999999))}`,
    tableNumber: assignedTable ? assignedTable.tableNumber : null,
    ...(assignedTable ? { seatCount: assignedTable.seatCount } : {}),
    slotTime: slotIsoValue,
    slotLabel: slotWindowLabel,
    status: "RECEIVED",
    items: chosenItems,
    fiveMinAlertSent: false,
    createdAt: now.toISOString(),
  };
}
