import { ClipboardList, Check, X } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { confirmOrder, cancelOrder } from "@/lib/actions/orders";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "Farm Orders" };

export default async function FarmerOrdersPage() {
  const profile = await requireRole(["farmer"]);
  const supabase = createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles!orders_buyer_id_fkey(full_name)")
    .eq("farmer_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Confirm incoming orders so they can be scheduled for delivery"
      />

      {(orders ?? []).length > 0 ? (
        <Card className="p-0">
          <div className="px-6 pt-6">
            <CardHeader
              title="All orders"
              subtitle={`${orders!.length} order${orders!.length === 1 ? "" : "s"}`}
            />
          </div>
          <Table headers={["Buyer", "Product", "Qty", "Total", "Deliver to", "Date", "Status", "Actions"]}>
            {orders!.map((o) => (
              <tr key={o.id}>
                <Td className="font-medium">
                  {o.profiles?.full_name ?? "Buyer"}
                </Td>
                <Td>{o.product_name}</Td>
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
                  {o.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <form action={confirmOrder}>
                        <input type="hidden" name="order_id" value={o.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" /> Confirm
                        </button>
                      </form>
                      <form action={cancelOrder}>
                        <input type="hidden" name="order_id" value={o.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          <X className="h-3.5 w-3.5" /> Decline
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          message="When buyers order your produce, the orders appear here for confirmation."
        />
      )}
    </div>
  );
}
