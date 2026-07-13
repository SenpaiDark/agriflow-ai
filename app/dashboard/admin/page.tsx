import { Users, ClipboardList, Banknote, Truck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SimplePieChart, SimpleBarChart } from "@/components/charts/charts";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "Admin Overview" };

export default async function AdminOverview() {
  await requireRole(["admin"]);
  const supabase = createClient();

  const [{ data: profiles }, { data: orders }, { count: deliveryCount }] =
    await Promise.all([
      supabase.from("profiles").select("role"),
      supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("deliveries").select("*", { count: "exact", head: true }),
    ]);

  const revenue = (orders ?? [])
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + Number(o.total_price), 0);

  const byStatus = new Map<string, number>();
  for (const o of orders ?? []) {
    byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);
  }
  const statusData = Array.from(byStatus.entries()).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  const byRole = new Map<string, number>();
  for (const p of profiles ?? []) {
    byRole.set(p.role, (byRole.get(p.role) ?? 0) + 1);
  }
  const roleData = Array.from(byRole.entries()).map(([name, count]) => ({
    name: name.replace(/_/g, " "),
    users: count,
  }));

  return (
    <div>
      <PageHeader
        title="Admin Overview"
        subtitle="Platform-wide activity across all roles"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered users"
          value={(profiles ?? []).length}
          icon={Users}
        />
        <StatCard
          label="Total orders"
          value={(orders ?? []).length}
          icon={ClipboardList}
        />
        <StatCard
          label="Deliveries created"
          value={deliveryCount ?? 0}
          icon={Truck}
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
          <CardHeader title="Orders by status" />
          {statusData.length > 0 ? (
            <SimplePieChart data={statusData} />
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">
              No orders yet.
            </p>
          )}
        </Card>
        <Card>
          <CardHeader title="Users by role" />
          {roleData.length > 0 ? (
            <SimpleBarChart
              data={roleData}
              bars={[{ key: "users", label: "Users" }]}
            />
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">
              No users yet.
            </p>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-0">
        <div className="px-6 pt-6">
          <CardHeader title="Latest orders" />
        </div>
        {(orders ?? []).length > 0 ? (
          <Table headers={["Product", "Qty", "Total", "Status", "Date"]}>
            {(orders ?? []).slice(0, 8).map((o) => (
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
          <div className="p-6 pt-0">
            <EmptyState
              icon={ClipboardList}
              title="No orders yet"
              message="Marketplace orders will show up here."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
