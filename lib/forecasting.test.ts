import { describe, it, expect, vi, afterEach } from "vitest";
import {
  movingAverage,
  weightedMovingAverage,
  forecastDemand,
  buildWeeklySeries,
  type DemandPoint,
} from "@/lib/forecasting";

describe("movingAverage", () => {
  it("returns null for an empty series", () => {
    expect(movingAverage([])).toBeNull();
  });

  it("averages the last `window` points (default 3)", () => {
    expect(movingAverage([1, 2, 3, 4, 5])).toBeCloseTo(4);
  });

  it("averages all points when series is shorter than the window", () => {
    expect(movingAverage([2, 4])).toBeCloseTo(3);
  });

  it("respects a custom window", () => {
    expect(movingAverage([1, 2, 3, 4, 5], 5)).toBeCloseTo(3);
  });
});

describe("weightedMovingAverage", () => {
  it("returns null for an empty series", () => {
    expect(weightedMovingAverage([])).toBeNull();
  });

  it("weights the most recent point highest", () => {
    // last 3 of [1,2,3]: (1*1 + 2*2 + 3*3) / (1+2+3) = 14/6
    expect(weightedMovingAverage([1, 2, 3])).toBeCloseTo(14 / 6);
  });

  it("only considers the last `window` points", () => {
    // window 3 over [10,1,2,3] -> uses [1,2,3]
    expect(weightedMovingAverage([10, 1, 2, 3])).toBeCloseTo(14 / 6);
  });

  it("equals the value for a single-element series", () => {
    expect(weightedMovingAverage([7])).toBeCloseTo(7);
  });
});

describe("forecastDemand", () => {
  const mk = (quantities: number[]): DemandPoint[] =>
    quantities.map((q, i) => ({ period: `W${i}`, quantity: q }));

  it("returns null forecasts and trend for empty history", () => {
    const r = forecastDemand([]);
    expect(r.movingAverage).toBeNull();
    expect(r.weightedMovingAverage).toBeNull();
    expect(r.trendPct).toBeNull();
    expect(r.history).toEqual([]);
  });

  it("computes moving and weighted averages", () => {
    const r = forecastDemand(mk([2, 4, 6]));
    expect(r.movingAverage).toBeCloseTo(4);
    expect(r.weightedMovingAverage).toBeCloseTo((2 * 1 + 4 * 2 + 6 * 3) / 6);
  });

  it("computes trend as percent change of wma vs last period", () => {
    const r = forecastDemand(mk([2, 4, 6]));
    const wma = (2 * 1 + 4 * 2 + 6 * 3) / 6; // ~4.667
    expect(r.trendPct).toBeCloseTo(((wma - 6) / 6) * 100);
    expect(r.trendPct).toBeLessThan(0); // forecast below last => downtrend
  });

  it("returns null trend when the last observed value is zero", () => {
    const r = forecastDemand(mk([5, 5, 0]));
    expect(r.trendPct).toBeNull();
  });

  it("preserves the history passed in", () => {
    const history = mk([1, 2]);
    expect(forecastDemand(history).history).toBe(history);
  });
});

describe("buildWeeklySeries", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an empty map for no rows", () => {
    expect(buildWeeklySeries([]).size).toBe(0);
  });

  it("creates one entry per distinct product, each with `weeks` points", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T12:00:00Z")); // a Wednesday

    const rows = [
      { created_at: "2026-06-15T09:00:00Z", product_name: "Tomato", quantity: 10 },
      { created_at: "2026-06-16T09:00:00Z", product_name: "Tomato", quantity: 5 },
      { created_at: "2026-06-15T09:00:00Z", product_name: "Yam", quantity: 3 },
    ];

    const series = buildWeeklySeries(rows, 8);
    expect(new Set(series.keys())).toEqual(new Set(["Tomato", "Yam"]));
    expect(series.get("Tomato")).toHaveLength(8);
    expect(series.get("Yam")).toHaveLength(8);
  });

  it("sums quantities that fall in the current week and ignores older ones", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T12:00:00Z"));

    const rows = [
      { created_at: "2026-06-15T09:00:00Z", product_name: "Tomato", quantity: 10 },
      { created_at: "2026-06-16T09:00:00Z", product_name: "Tomato", quantity: 5 },
      // well outside the 8-week window
      { created_at: "2026-01-01T09:00:00Z", product_name: "Tomato", quantity: 999 },
    ];

    const points = buildWeeklySeries(rows, 8).get("Tomato")!;
    const total = points.reduce((s, p) => s + p.quantity, 0);
    expect(total).toBe(15);
    // the newest week (last point) holds this week's orders
    expect(points[points.length - 1].quantity).toBe(15);
  });

  it("coerces string quantities to numbers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T12:00:00Z"));

    const rows = [
      {
        created_at: "2026-06-16T09:00:00Z",
        product_name: "Tomato",
        quantity: "7" as unknown as number,
      },
    ];
    const points = buildWeeklySeries(rows, 8).get("Tomato")!;
    expect(points[points.length - 1].quantity).toBe(7);
  });
});
