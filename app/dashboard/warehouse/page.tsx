import Link from "next/link";
import {
  Package,
  AlertTriangle,
  Trash2,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { shelfLifeInfo } from "@/lib/spoilage";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, Card, CardHeader } from "@/components/ui/card";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SimplePieChart } from "@/components/charts/charts";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "Warehouse Overview" };

export default async function WarehouseOverview() {
  await requireRole(["warehouse_manager"]);
  const supabase = createClient();

  const [{ data: items }, { data: movements }] = await Promise.all([
    supabase.from("inventory_items").select("*"),
    supabase
      .from("stock_movements")
      .select("*, inventory_items(product_name)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const inStorage = (items ?? []).filter((i) => i.status === "in_storage");
  const expiring = inStorage.filter(
    (i) => shelfLifeInfo(i.entry_date, i.shelf_life_days).state === "expiring"
  );
  const spoiled = (items ?? []).filter((i) => i.status === "spoiled");
  const totalQty = inStorage.reduce((s, i) => s + Number(i.quantity), 0);

  const freshCount = inStorage.length - expiring.length;
  const pieData = [
    { name: "Fresh", value: freshCount },
    { name: "Expiring soon", value: expiring.length },
    { name: "Spoiled", value: spoiled.length },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <PageHeader
        title="Warehouse Overview"
        subtitle="Storage health across all warehouses"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Items in storage" value={inStorage.length} icon={Package} />
        <StatCard
          label="Total stock"
          value={`${formatNumber(totalQty)} units`}
          icon={WarehouseIcon}
        />
        <StatCard
          label="Expiring ≤ 3 days"
          value={expiring.length}
          icon={AlertTriangle}
          tone={expiring.length > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Spoiled items"
          value={spoiled.length}
          icon={Trash2}
          tone={spoiled.length > 0 ? "danger" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Stock freshness"
            subtitle="Shelf-life state of stored items"
          />
          {pieData.length > 0 ? (
            <SimplePieChart data={pieData} />
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">
              Add inventory to see freshness data.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent stock movements"
            action={
              <Link
                href="/dashboard/warehouse/movements"
                className="text-sm font-medium text-emerald-600 hover:underline"
              >
                View all
              </Link>
            }
          />
          {(movements ?? []).length > 0 ? (
            <Table headers={["Product", "Type", "Qty", "Note", "Date"]}>
              {movements!.map((m) => (
                <tr key={m.id}>
                  <Td className="font-medium">
                    {m.inventory_items?.product_name ?? "Item"}
                  </Td>
                  <Td>
                    <span
                      className={
                        m.type === "in"
                          ? "font-medium text-green-600"
                          : "font-medium text-amber-600"
                      }
                    >
                      {m.type === "in" ? "In" : "Out"}
                    </span>
                  </Td>
                  <Td>{formatNumber(Number(m.quantity))}</Td>
                  <Td className="max-w-40 truncate">{m.note ?? "—"}</Td>
                  <Td>{formatDate(m.created_at)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState
              icon={Package}
              title="No movements yet"
              message="Stock received and dispatched will be logged here."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
