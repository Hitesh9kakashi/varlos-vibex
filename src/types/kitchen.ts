export type OrderStatus =
  | "RECEIVED"
  | "PREPARING"
  | "ALMOST_READY"
  | "READY"
  | "SERVED";

export type StationType = "GRILL" | "FRYER" | "BEVERAGE" | "ALL";

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  station: StationType;
  notes?: string;
  prepTimeMins: number;
}

export interface KitchenOrder {
  id: string;
  orderNumber: string; // e.g., "#ORD-402"
  studentName: string;
  studentPhone: string;
  tableNumber: number | null; // e.g., Table 4 (null if takeaway)
  seatCount?: number;
  slotTime: string; // ISO timestamp or "13:15" format
  slotLabel: string; // e.g., "1:15 PM - 1:30 PM"
  status: OrderStatus;
  items: OrderItem[];
  fiveMinAlertSent: boolean;
  fiveMinAlertSentAt?: string;
  createdAt: string;
}

export type TableZone = "WINDOW" | "HALL" | "PATIO" | "MEZZANINE";

export type TableStatus = "AVAILABLE" | "RESERVED" | "OCCUPIED" | "CLEANING";

export interface CanteenTable {
  id: string;
  tableNumber: number;
  seatCount: number;
  zone: TableZone;
  status: TableStatus;
  currentOrderId?: string;
  /** Position on the 2D floor matrix, expressed as a percentage (0-100). */
  x: number;
  y: number;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  capacity: number;
  booked: number;
  isPeak: boolean;
}

export interface SlotSummary {
  key: string;
  startTime: string;
  endTime: string;
  label: string;
  orderCount: number;
  itemCount: number;
  capacity: number;
  loadPct: number;
}

export type NotificationKind = "FIVE_MIN" | "READY" | "ORDER_CONFIRMED";

export type NotificationChannel = "PUSH" | "SMS" | "DISPLAY";

export type NotificationStatus = "SCHEDULED" | "SENT" | "DELIVERED" | "FAILED";

export interface StudentNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  studentName: string;
  studentPhone: string;
  tableNumber: number | null;
  title: string;
  message: string;
  kind: NotificationKind;
  channel: NotificationChannel;
  status: NotificationStatus;
  createdAt: string;
}

export interface StationCapacity {
  station: Exclude<StationType, "ALL">;
  label: string;
  capacityPerSlot: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  station: Exclude<StationType, "ALL">;
  unit: string;
  stockLevel: number;
  threshold: number;
  isKilled: boolean;
  updatedAt: string;
}

export type StationFilter = StationType;

export type FiveMinAlertState = "DUE" | "SENT" | "UPCOMING" | "NOT_APPLICABLE";

export type SlaLevel = "CALM" | "ATTENTION" | "CRITICAL" | "OVERDUE";

export interface Countdown {
  targetMs: number;
  msRemaining: number;
  minutesRemaining: number;
  isOverdue: boolean;
  display: string;
  sla: SlaLevel;
}

export interface KitchenSnapshot {
  orders: KitchenOrder[];
  tables: CanteenTable[];
  slots: TimeSlot[];
  inventory: InventoryItem[];
  notifications: StudentNotification[];
  stationCapacity: StationCapacity[];
  updatedAt: string;
}
