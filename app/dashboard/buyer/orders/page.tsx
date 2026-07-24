import { ClipboardList, X } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cancelOrder } from "@/lib/actions/orders";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, formatNumber, pluralize } from "@/lib/utils";

export const metadata = { title: "My Orders" };

export default async function BuyerOrdersPage() {
  const profile = await requireRole(["buyer"]);
  const supabase = createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles!orders_farmer_id_fkey(full_name)")
    .eq("buyer_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="My Orders"
        subtitle="Track every order from confirmation to delivery"
      />

      {(orders ?? []).length > 0 ? (
        <Card className="p-0">
          <div className="px-6 pt-6">
            <CardHeader
              title="All orders"
              subtitle={pluralize(orders!.length, "order")}
            />
          </div>
          <Table headers={["Product", "Farmer", "Qty", "Total", "Deliver to", "Date", "Status", ""]}>
            {orders!.map((o) => (
              <tr key={o.id}>
                <Td className="font-medium">{o.product_name}</Td>
                <Td>{o.profiles?.full_name ?? "Farmer"}</Td>
                <Td>
                  {formatNumber(Number(o.quantity))} {o.unit}
                </Td>
                <Td>{formatCurrency(Number(o.total_price))}</Td>
                <Td className="max-w-40 truncate">{o.delivery_address}</Td>
                <Td>{formatDate(o.created_at)}</Td>
                <Td>
                  <Badge status={o.status} />
                </Td>
                <Td>
                  {["pending", "confirmed"].includes(o.status) ? (
                    <form action={cancelOrder}>
                      <input type="hidden" name="order_id" value={o.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </form>
                  ) : null}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          message="Orders you place in the marketplace will show up here with live status."
        />
      )}
    </div>
  );
}
