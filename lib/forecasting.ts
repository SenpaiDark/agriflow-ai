/**
 * Deterministic demand forecasting.
 *
 * Two classic techniques over a historical demand series (e.g. weekly order
 * quantities for a product): simple moving average and weighted moving
 * average. No AI involved — Gemini only explains these numbers elsewhere.
 */

export interface DemandPoint {
  /** Period label, e.g. "2026-W24" or "Jun 2026". */
  period: string;
  quantity: number;
}

export interface ForecastResult {
  history: DemandPoint[];
  movingAverage: number | null;
  weightedMovingAverage: number | null;
  /** Percent change of the forecast vs the last observed period. */
  trendPct: number | null;
}

/** Simple moving average of the last `window` points. */
export function movingAverage(series: number[], window = 3): number | null {
  if (series.length === 0) return null;
  const slice = series.slice(-window);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

/**
 * Weighted moving average of the last `window` points, most recent period
 * weighted highest (weights 1..n).
 */
export function weightedMovingAverage(
  series: number[],
  window = 3
): number | null {
  if (series.length === 0) return null;
  const slice = series.slice(-window);
  let weightSum = 0;
  let total = 0;
  slice.forEach((value, i) => {
    const weight = i + 1;
    weightSum += weight;
    total += value * weight;
  });
  return total / weightSum;
}

export function forecastDemand(history: DemandPoint[]): ForecastResult {
  const series = history.map((p) => p.quantity);
  const ma = movingAverage(series);
  const wma = weightedMovingAverage(series);
  const last = series.length > 0 ? series[series.length - 1] : null;
  const trendPct =
    last != null && last > 0 && wma != null
      ? ((wma - last) / last) * 100
      : null;
  return { history, movingAverage: ma, weightedMovingAverage: wma, trendPct };
}

/**
 * Group order rows into a weekly demand series per product.
 * Rows only need a created_at, product_name and quantity.
 */
export function buildWeeklySeries(
  rows: { created_at: string; product_name: string; quantity: number }[],
  weeks = 8
): Map<string, DemandPoint[]> {
  const now = new Date();
  const byProduct = new Map<string, DemandPoint[]>();

  const weekStarts: Date[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() - i * 7); // Sunday of each week
    d.setHours(0, 0, 0, 0);
    weekStarts.push(d);
  }

  const label = (d: Date) =>
    `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const products = Array.from(new Set(rows.map((r) => r.product_name)));
  for (const product of products) {
    const points: DemandPoint[] = weekStarts.map((start) => {
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const total = rows
        .filter(
          (r) =>
            r.product_name === product &&
            new Date(r.created_at) >= start &&
            new Date(r.created_at) < end
        )
        .reduce((sum, r) => sum + Number(r.quantity), 0);
      return { period: label(start), quantity: total };
    });
    byProduct.set(product, points);
  }

  return byProduct;
}
