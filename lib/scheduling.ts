/**
 * Rule-based delivery scheduling. Deterministic — no AI.
 *
 * Rules:
 *  1. Perishability first: orders whose product has the least shelf life
 *     remaining are scheduled earliest.
 *  2. Ties broken by order age (oldest order first).
 *  3. At most MAX_DELIVERIES_PER_DAY deliveries are placed on one day;
 *     overflow rolls to the next day, starting tomorrow.
 *  4. Pickup point is the warehouse nearest to the drop-off location
 *     (straight-line nearest-distance rule, shown on the Leaflet map).
 */

import { distanceKm } from "@/lib/utils";

export const MAX_DELIVERIES_PER_DAY = 5;

export interface SchedulableOrder {
  id: string;
  created_at: string;
  shelf_life_days: number;
  harvest_date: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_address: string;
}

export interface WarehousePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface ScheduledDelivery {
  order_id: string;
  scheduled_date: string; // yyyy-mm-dd
  pickup_label: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_label: string;
  dropoff_lat: number;
  dropoff_lng: number;
  distance_km: number;
  priority: number;
}

/** Days of shelf life left, counted from harvest date. */
export function shelfLifeRemaining(order: SchedulableOrder): number {
  const harvested = new Date(order.harvest_date).getTime();
  const elapsedDays = (Date.now() - harvested) / 86_400_000;
  return order.shelf_life_days - elapsedDays;
}

export function nearestWarehouse(
  lat: number,
  lng: number,
  warehouses: WarehousePoint[]
): WarehousePoint {
  let best = warehouses[0];
  let bestDist = Infinity;
  for (const w of warehouses) {
    const d = distanceKm(lat, lng, w.lat, w.lng);
    if (d < bestDist) {
      bestDist = d;
      best = w;
    }
  }
  return best;
}

const DEFAULT_DROPOFF = { lat: 6.5244, lng: 3.3792 }; // Lagos fallback

export function scheduleOrders(
  orders: SchedulableOrder[],
  warehouses: WarehousePoint[]
): ScheduledDelivery[] {
  if (orders.length === 0 || warehouses.length === 0) return [];

  const prioritised = [...orders].sort((a, b) => {
    const shelfDiff = shelfLifeRemaining(a) - shelfLifeRemaining(b);
    if (Math.abs(shelfDiff) > 0.01) return shelfDiff;
    return (
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  });

  const results: ScheduledDelivery[] = [];
  prioritised.forEach((order, index) => {
    const dayOffset = 1 + Math.floor(index / MAX_DELIVERIES_PER_DAY);
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);

    const dropLat = order.delivery_lat ?? DEFAULT_DROPOFF.lat;
    const dropLng = order.delivery_lng ?? DEFAULT_DROPOFF.lng;
    const pickup = nearestWarehouse(dropLat, dropLng, warehouses);

    results.push({
      order_id: order.id,
      scheduled_date: date.toISOString().slice(0, 10),
      pickup_label: pickup.name,
      pickup_lat: pickup.lat,
      pickup_lng: pickup.lng,
      dropoff_label: order.delivery_address,
      dropoff_lat: dropLat,
      dropoff_lng: dropLng,
      distance_km:
        Math.round(distanceKm(pickup.lat, pickup.lng, dropLat, dropLng) * 10) /
        10,
      priority: index + 1,
    });
  });

  return results;
}
