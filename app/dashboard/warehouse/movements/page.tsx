import { ArrowLeftRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "Stock Movements" };

export default async function MovementsPage() {
  await requireRole(["warehouse_manager"]);
  const supabase = createClient();

  const { data: movements } = await supabase
    .from("stock_movements")
    .select("*, inventory_items(product_name, unit), warehouses(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        subtitle="Every receipt and dispatch across your warehouses"
      />

      {(movements ?? []).length > 0 ? (
        <Card className="p-0">
          <div className="px-6 pt-6">
            <CardHeader
              title="Movement log"
              subtitle={`Last ${movements!.length} movements`}
            />
          </div>
          <Table headers={["Date", "Product", "Warehouse", "Type", "Qty", "Note"]}>
            {movements!.map((m) => (
              <tr key={m.id}>
                <Td>{formatDate(m.created_at)}</Td>
                <Td className="font-medium">
                  {m.inventory_items?.product_name ?? "Item"}
                </Td>
                <Td>{m.warehouses?.name ?? "—"}</Td>
                <Td>
                  <span
                    className={
                      m.type === "in"
                        ? "font-medium text-green-600"
                        : "font-medium text-amber-600"
                    }
                  >
                    {m.type === "in" ? "Stock in" : "Stock out"}
                  </span>
                </Td>
                <Td>
                  {formatNumber(Number(m.quantity))}{" "}
                  {m.inventory_items?.unit ?? ""}
                </Td>
                <Td className="max-w-56 truncate">{m.note ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={ArrowLeftRight}
          title="No movements yet"
          message="Receiving or dispatching inventory writes an entry to this log."
        />
      )}
    </div>
  );
}
