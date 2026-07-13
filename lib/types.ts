export type UserRole =
  | "farmer"
  | "buyer"
  | "transporter"
  | "warehouse_manager"
  | "admin";

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "farmer", label: "Farmer" },
  { value: "buyer", label: "Buyer" },
  { value: "transporter", label: "Transporter" },
  { value: "warehouse_manager", label: "Warehouse Manager" },
  { value: "admin", label: "Administrator" },
];

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  location: string | null;
  created_at: string;
}

export type CropStatus = "planted" | "growing" | "ready" | "harvested";

export interface Crop {
  id: string;
  farmer_id: string;
  name: string;
  category: string;
  planting_date: string;
  expected_harvest_date: string;
  quantity_estimate: number;
  unit: string;
  status: CropStatus;
  notes: string | null;
  created_at: string;
}

export type HarvestStatus = "available" | "reserved" | "sold" | "stored";

export interface Harvest {
  id: string;
  crop_id: string;
  farmer_id: string;
  product_name: string;
  harvest_date: string;
  quantity: number;
  unit: string;
  quality_grade: "A" | "B" | "C";
  price_per_unit: number;
  shelf_life_days: number;
  status: HarvestStatus;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  manager_id: string | null;
  location: string;
  lat: number;
  lng: number;
  capacity: number;
  created_at: string;
}

export type InventoryStatus = "in_storage" | "dispatched" | "spoiled";

export interface InventoryItem {
  id: string;
  warehouse_id: string;
  harvest_id: string | null;
  product_name: string;
  quantity: number;
  unit: string;
  entry_date: string;
  shelf_life_days: number;
  status: InventoryStatus;
  created_at: string;
}

export type MovementType = "in" | "out";

export interface StockMovement {
  id: string;
  warehouse_id: string;
  inventory_item_id: string;
  type: MovementType;
  quantity: number;
  note: string | null;
  created_at: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "scheduled"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  buyer_id: string;
  farmer_id: string;
  harvest_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  total_price: number;
  status: OrderStatus;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  created_at: string;
}

export type DeliveryStatus =
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered";

export interface Delivery {
  id: string;
  order_id: string;
  transporter_id: string | null;
  pickup_label: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_label: string;
  dropoff_lat: number;
  dropoff_lng: number;
  scheduled_date: string;
  distance_km: number | null;
  status: DeliveryStatus;
  created_at: string;
}

export type NotificationType = "info" | "warning" | "success" | "alert";

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}
