import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildWeeklySeries, forecastDemand } from "@/lib/forecasting";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SimpleLineChart } from "@/components/charts/charts";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Demand Forecasting" };

export default async function ForecastingPage() {
  await requireProfile();
  const supabase = createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("created_at, product_name, quantity, status")
    .neq("status", "cancelled")
    .order("created_at", { ascending: true });

  const series = buildWeeklySeries(
    (orders ?? []).map((o) => ({
      created_at: o.created_at,
      product_name: o.product_name,
      quantity: Number(o.quantity),
    }))
  );

  const products = Array.from(series.entries())
    .map(([product, points]) => ({
      product,
      points,
      forecast: forecastDemand(points),
      total: points.reduce((s, p) => s + p.quantity, 0),
    }))
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <PageHeader
        title="Demand Forecasting"
        subtitle="Deterministic moving-average and weighted moving-average forecasts from the last 8 weeks of orders"
      />

      {products.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {products.map(({ product, points, forecast }) => {
            const trend = forecast.trendPct ?? 0;
            const TrendIcon =
              trend > 2 ? TrendingUp : trend < -2 ? TrendingDown : Minus;
            const trendColor =
              trend > 2
                ? "text-green-600"
                : trend < -2
                  ? "text-red-600"
                  : "text-gray-500";

            return (
              <Card key={product}>
                <CardHeader
                  title={product}
                  subtitle="Weekly ordered quantity"
                  action={
                    <span
                      className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}
                    >
                      <TrendIcon className="h-4 w-4" />
                      {forecast.trendPct != null
                        ? `${forecast.trendPct > 0 ? "+" : ""}${forecast.trendPct.toFixed(0)}%`
                        : "—"}
                    </span>
                  }
                />
                <SimpleLineChart
                  data={points.map((p) => ({
                    name: p.period,
                    demand: p.quantity,
                  }))}
                  lines={[{ key: "demand", label: "Demand" }]}
                  height={220}
                />
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
                  <div>
                    <p className="text-gray-500">Moving average (3 wk)</p>
                    <p className="text-lg font-bold">
                      {forecast.movingAverage != null
                        ? formatNumber(
                            Math.round(forecast.movingAverage * 10) / 10
                          )
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Weighted moving average</p>
                    <p className="text-lg font-bold">
                      {forecast.weightedMovingAverage != null
                        ? formatNumber(
                            Math.round(forecast.weightedMovingAverage * 10) /
                              10
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Next-week demand estimate:{" "}
                  <span className="font-medium text-gray-700">
                    ~
                    {formatNumber(
                      Math.round(forecast.weightedMovingAverage ?? 0)
                    )}{" "}
                    units
                  </span>{" "}
                  (weighted average favours recent weeks)
                </p>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="Not enough order data"
          message="Forecasts appear once orders start flowing. Place a few orders to see weekly demand trends per product."
        />
      )}
    </div>
  );
}
