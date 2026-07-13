import { ClipboardList } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { SearchForm } from "@/components/ui/search-form";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "All Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireRole(["admin"]);
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? "";

  let query = supabase
    .from("orders")
    .select(
      "*, buyer:profiles!orders_buyer_id_fkey(full_name), farmer:profiles!orders_farmer_id_fkey(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.ilike("product_name", `%${q}%`);

  const { data: orders } = await query;

  return (
    <div>
      <PageHeader
        title="All Orders"
        subtitle="Every order across the platform"
        action={<SearchForm placeholder="Search products…" defaultValue={q} />}
      />

      {(orders ?? []).length > 0 ? (
        <Card className="p-0">
          <div className="px-6 pt-6">
            <CardHeader
              title="Order log"
              subtitle={`Last ${orders!.length} orders`}
            />
          </div>
          <Table headers={["Date", "Product", "Buyer", "Farmer", "Qty", "Total", "Status"]}>
            {orders!.map((o) => (
              <tr key={o.id}>
                <Td>{formatDate(o.created_at)}</Td>
                <Td className="font-medium">{o.product_name}</Td>
                <Td>{o.buyer?.full_name ?? "—"}</Td>
                <Td>{o.farmer?.full_name ?? "—"}</Td>
                <Td>
                  {formatNumber(Number(o.quantity))} {o.unit}
                </Td>
                <Td>{formatCurrency(Number(o.total_price))}</Td>
                <Td>
                  <Badge status={o.status} />
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          message="Orders placed by buyers will be listed here."
        />
      )}
    </div>
  );
}
