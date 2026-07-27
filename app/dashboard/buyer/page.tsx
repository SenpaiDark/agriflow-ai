import Link from "next/link";
import {
  ShoppingCart,
  ClipboardList,
  Banknote,
  PackageCheck,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SimplePieChart } from "@/components/charts/charts";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "Buyer Overview" };

export default async function BuyerOverview() {
  const profile = await requireRole(["buyer"]);
  const supabase = createClient();

  const [{ data: orders }, { count: availableCount }] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("harvests")
      .select("*", { count: "exact", head: true })
      .eq("status", "available")
      .gt("quantity", 0),
  ]);

  const open = (orders ?? []).filter((o) =>
    ["pending", "confirmed", "scheduled", "in_transit"].includes(o.status)
  );
  const delivered = (orders ?? []).filter((o) => o.status === "delivered");
  const spent = delivered.reduce((sum, o) => sum + Number(o.total_price), 0);

  const spendByProduct = new Map<string, number>();
  for (const o of orders ?? []) {
    if (o.status === "cancelled") continue;
    spendByProduct.set(
      o.product_name,
      (spendByProduct.get(o.product_name) ?? 0) + Number(o.total_price)
    );
  }
  const pieData = Array.from(spendByProduct.entries()).map(
    ([name, value]) => ({ name, value: Math.round(value) })
  );

  return (
    <div>
      <PageHeader
        title="Buyer Overview"
        subtitle="Your orders and the marketplace at a glance"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Products available"
          value={availableCount ?? 0}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <StatCard label="Open orders" value={open.length} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard
          label="Delivered"
          value={delivered.length}
          icon={<PackageCheck className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Total spent"
          value={formatCurrency(spent)}
          icon={<Banknote className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Spending by product"
            subtitle="All non-cancelled orders"
          />
          {pieData.length > 0 ? (
            <SimplePieChart data={pieData} />
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">
              Place your first order to see spending here.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent orders"
            action={
              <Link
                href="/dashboard/buyer/orders"
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
              message="Browse the marketplace and place your first order."
              action={
                <Link
                  href="/dashboard/buyer/browse"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Browse produce
                </Link>
              }
            />
          )}
        </Card>
      </div>
    </div>
  );
}
