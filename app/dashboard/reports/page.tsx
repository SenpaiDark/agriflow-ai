import { BarChart3 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildWeeklySeries } from "@/lib/forecasting";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  SimpleBarChart,
  SimpleLineChart,
  SimplePieChart,
} from "@/components/charts/charts";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Reports & Analytics" };

export default async function ReportsPage() {
  await requireRole(["admin"]);
  const supabase = createClient();

  const [{ data: orders }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select("created_at, product_name, quantity, total_price, status"),
    supabase.from("inventory_items").select("product_name, quantity, status"),
  ]);

  const valid = (orders ?? []).filter((o) => o.status !== "cancelled");

  if (valid.length === 0 && (items ?? []).length === 0) {
    return (
      <div>
        <PageHeader title="Reports & Analytics" />
        <EmptyState
          icon={BarChart3}
          title="No data to report yet"
          message="Reports build themselves as orders and inventory flow through the platform."
        />
      </div>
    );
  }

  // Weekly order volume and revenue over the last 8 weeks.
  const weeklyAll = buildWeeklySeries(
    valid.map((o) => ({
      created_at: o.created_at,
      product_name: "All products",
      quantity: Number(o.quantity),
    }))
  ).get("All products");

  const weeklyRevenue = buildWeeklySeries(
    valid.map((o) => ({
      created_at: o.created_at,
      product_name: "Revenue",
      quantity: Number(o.total_price),
    }))
  ).get("Revenue");

  const topProducts = new Map<string, number>();
  for (const o of valid) {
    topProducts.set(
      o.product_name,
      (topProducts.get(o.product_name) ?? 0) + Number(o.quantity)
    );
  }
  const topData = Array.from(topProducts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, qty]) => ({ name, quantity: Math.round(qty) }));

  const statusCounts = new Map<string, number>();
  for (const o of orders ?? []) {
    statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
  }
  const statusData = Array.from(statusCounts.entries()).map(
    ([name, value]) => ({ name: name.replace(/_/g, " "), value })
  );

  const totalRevenue = valid
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + Number(o.total_price), 0);

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle={`Delivered revenue to date: ${formatCurrency(totalRevenue)}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Weekly order volume"
            subtitle="Total units ordered per week (8 weeks)"
          />
          <SimpleBarChart
            data={(weeklyAll ?? []).map((p) => ({
              name: p.period,
              quantity: p.quantity,
            }))}
            bars={[{ key: "quantity", label: "Units" }]}
          />
        </Card>

        <Card>
          <CardHeader
            title="Weekly order value"
            subtitle="₦ ordered per week (8 weeks)"
          />
          <SimpleLineChart
            data={(weeklyRevenue ?? []).map((p) => ({
              name: p.period,
              value: p.quantity,
            }))}
            lines={[{ key: "value", label: "₦" }]}
          />
        </Card>

        <Card>
          <CardHeader title="Top products by volume" />
          {topData.length > 0 ? (
            <SimpleBarChart
              data={topData}
              bars={[{ key: "quantity", label: "Units" }]}
            />
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">
              No product data yet.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader title="Order pipeline" subtitle="All orders by status" />
          {statusData.length > 0 ? (
            <SimplePieChart data={statusData} />
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">
              No orders yet.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
