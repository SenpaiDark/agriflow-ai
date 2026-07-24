import { describe, it, expect, vi, afterEach } from "vitest";
import {
  shelfLifeRemaining,
  nearestWarehouse,
  scheduleOrders,
  MAX_DELIVERIES_PER_DAY,
  type SchedulableOrder,
  type WarehousePoint,
} from "@/lib/scheduling";

const NOW = new Date("2026-06-17T00:00:00Z");

const warehouses: WarehousePoint[] = [
  { id: "lag", name: "Lagos WH", lat: 6.5244, lng: 3.3792 },
  { id: "abj", name: "Abuja WH", lat: 9.0765, lng: 7.3986 },
  { id: "phc", name: "Port Harcourt WH", lat: 4.8156, lng: 7.0498 },
];

function order(overrides: Partial<SchedulableOrder>): SchedulableOrder {
  return {
    id: "o1",
    created_at: "2026-06-10T00:00:00Z",
    shelf_life_days: 10,
    harvest_date: "2026-06-15T00:00:00Z",
    delivery_lat: 6.5244,
    delivery_lng: 3.3792,
    delivery_address: "Lagos",
    ...overrides,
  };
}

describe("shelfLifeRemaining", () => {
  afterEach(() => vi.useRealTimers());

  it("subtracts elapsed days since harvest from shelf life", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    // harvested 2 days ago, 10-day shelf life => ~8 left
    const remaining = shelfLifeRemaining(
      order({ harvest_date: "2026-06-15T00:00:00Z", shelf_life_days: 10 })
    );
    expect(remaining).toBeCloseTo(8, 5);
  });

  it("is negative once shelf life is fully elapsed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const remaining = shelfLifeRemaining(
      order({ harvest_date: "2026-06-01T00:00:00Z", shelf_life_days: 5 })
    );
    expect(remaining).toBeLessThan(0);
  });
});

describe("nearestWarehouse", () => {
  it("returns the closest warehouse by straight-line distance", () => {
    const w = nearestWarehouse(9.05, 7.4, warehouses);
    expect(w.id).toBe("abj");
  });

  it("returns the closest warehouse for a southern point", () => {
    const w = nearestWarehouse(4.8, 7.0, warehouses);
    expect(w.id).toBe("phc");
  });
});

describe("scheduleOrders", () => {
  afterEach(() => vi.useRealTimers());

  it("returns an empty array when there are no orders", () => {
    expect(scheduleOrders([], warehouses)).toEqual([]);
  });

  it("returns an empty array when there are no warehouses", () => {
    expect(scheduleOrders([order({})], [])).toEqual([]);
  });

  it("prioritises the most-perishable order first", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const fresh = order({ id: "fresh", shelf_life_days: 30 });
    const perishing = order({ id: "perishing", shelf_life_days: 3 });

    const result = scheduleOrders([fresh, perishing], warehouses);
    expect(result[0].order_id).toBe("perishing");
    expect(result[0].priority).toBe(1);
    expect(result[1].order_id).toBe("fresh");
    expect(result[1].priority).toBe(2);
  });

  it("breaks ties on equal shelf life by oldest order first", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const older = order({ id: "older", created_at: "2026-06-01T00:00:00Z" });
    const newer = order({ id: "newer", created_at: "2026-06-09T00:00:00Z" });

    const result = scheduleOrders([newer, older], warehouses);
    expect(result.map((r) => r.order_id)).toEqual(["older", "newer"]);
  });

  it("packs at most MAX_DELIVERIES_PER_DAY per day, rolling over the rest", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const count = MAX_DELIVERIES_PER_DAY + 2;
    const orders = Array.from({ length: count }, (_, i) =>
      order({ id: `o${i}`, shelf_life_days: 10, created_at: `2026-06-${String(i + 1).padStart(2, "0")}T00:00:00Z` })
    );

    const result = scheduleOrders(orders, warehouses);
    const dates = result.map((r) => r.scheduled_date);
    const firstDay = dates.slice(0, MAX_DELIVERIES_PER_DAY);
    const overflow = dates.slice(MAX_DELIVERIES_PER_DAY);

    expect(new Set(firstDay).size).toBe(1);
    expect(overflow.every((d) => d !== firstDay[0])).toBe(true);
  });

  it("schedules the first delivery for tomorrow (never today)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const result = scheduleOrders([order({})], warehouses);
    const today = NOW.toISOString().slice(0, 10);
    expect(result[0].scheduled_date > today).toBe(true);
  });

  it("assigns the nearest warehouse as the pickup point", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const result = scheduleOrders(
      [order({ delivery_lat: 9.05, delivery_lng: 7.4 })],
      warehouses
    );
    expect(result[0].pickup_label).toBe("Abuja WH");
  });

  it("falls back to the default Lagos drop-off when coordinates are missing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const result = scheduleOrders(
      [order({ delivery_lat: null, delivery_lng: null })],
      warehouses
    );
    expect(result[0].dropoff_lat).toBeCloseTo(6.5244);
    expect(result[0].dropoff_lng).toBeCloseTo(3.3792);
    expect(result[0].pickup_label).toBe("Lagos WH");
  });

  it("rounds the distance to one decimal place", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const result = scheduleOrders(
      [order({ delivery_lat: 9.05, delivery_lng: 7.4 })],
      warehouses
    );
    const d = result[0].distance_km;
    expect(Math.round(d * 10) / 10).toBe(d);
  });
});
