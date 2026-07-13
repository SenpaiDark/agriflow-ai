import Link from "next/link";
import { Sprout, Package, ClipboardList, Banknote } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SimpleBarChart } from "@/components/charts/charts";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "Farmer Overview" };

export default async function FarmerOverview() {
  const profile = await requireRole(["farmer"]);
  const supabase = createClient();

  const [{ data: crops }, { data: harvests }, { data: orders }] =
    await Promise.all([
      supabase.from("crops").select("*").eq("farmer_id", profile.id),
      supabase.from("harvests").select("*").eq("farmer_id", profile.id),
      supabase
        .from("orders")
        .select("*")
        .eq("farmer_id", profile.id)
        .order("created_at", { ascending: false }),
    ]);

  const activeCrops = (crops ?? []).filter((c) => c.status !== "harvested");
  const availableHarvests = (harvests ?? []).filter(
    (h) => h.status === "available"
  );
  const pendingOrders = (orders ?? []).filter((o) => o.status === "pending");
  const revenue = (orders ?? [])
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.total_price), 0);

  const byProduct = new Map<string, number>();
  for (const h of harvests ?? []) {
    byProduct.set(
      h.product_name,
      (byProduct.get(h.product_name) ?? 0) + Number(h.quantity)
    );
  }
  const chartData = Array.from(byProduct.entries()).map(([name, qty]) => ({
    name,
    quantity: qty,
  }));

  return (
    <div>
      <PageHeader
        title="Farm Overview"
        subtitle="Your crops, harvests and orders at a glance"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active crops" value={activeCrops.length} icon={Sprout} />
        <StatCard
          label="Harvest listings"
          value={availableHarvests.length}
          icon={Package}
        />
        <StatCard
          label="Pending orders"
          value={pendingOrders.length}
          icon={ClipboardList}
          tone={pendingOrders.length > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Revenue (delivered)"
          value={formatCurrency(revenue)}
          icon={Banknote}
          tone="success"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Harvest stock by product"
            subtitle="Current listed quantities"
          />
          {chartData.length > 0 ? (
            <SimpleBarChart
              data={chartData}
              bars={[{ key: "quantity", label: "Quantity" }]}
            />
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">
              Record a harvest to see stock here.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent orders"
            subtitle="Latest orders from buyers"
            action={
              <Link
                href="/dashboard/farmer/orders"
                className="text-sm font-medium text-emerald-600 hover:underline"
              >
                View all
              </Link>
            }
          />
          {(orders ?? []).length > 0 ? (
            <Table headers={["Product", "Qty", "Total", "Status", "Date"]}>
              {(orders ?? []).slice(0, 6).map((o) => (
                <tr key={o.id}>
                  <Td className="font-medium">{o.product_name}</Td>
                  <Td>
                    {formatNumber(Number(o.quantity))} {o.unit}
                  </Td>
                  <Td>{formatCurrency(Number(o.total_price))}</Td>
                  <Td>
                    <Badge status={o.status} />
                  </Td>
                  <Td>{formatDate(o.created_at)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No orders yet"
              message="Orders from buyers will appear here once your harvests are listed."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
