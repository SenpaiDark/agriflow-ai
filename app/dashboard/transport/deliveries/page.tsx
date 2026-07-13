import { Truck, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { advanceDelivery } from "@/lib/actions/deliveries";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "Deliveries" };

const NEXT_LABEL: Record<string, string> = {
  assigned: "Mark picked up",
  picked_up: "Start transit",
  in_transit: "Mark delivered",
};

export default async function DeliveriesPage() {
  const profile = await requireRole(["transporter"]);
  const supabase = createClient();

  const { data: deliveries } = await supabase
    .from("deliveries")
    .select("*, orders(product_name, quantity, unit, delivery_address)")
    .eq("transporter_id", profile.id)
    .order("scheduled_date", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Deliveries"
        subtitle="Advance each delivery through pickup, transit and drop-off"
      />

      {(deliveries ?? []).length > 0 ? (
        <Card className="p-0">
          <div className="px-6 pt-6">
            <CardHeader
              title="All deliveries"
              subtitle={`${deliveries!.length} assigned to you`}
            />
          </div>
          <Table headers={["Scheduled", "Product", "Pickup", "Drop-off", "Distance", "Status", "Action"]}>
            {deliveries!.map((d) => (
              <tr key={d.id}>
                <Td>{formatDate(d.scheduled_date)}</Td>
                <Td className="font-medium">
                  {d.orders?.product_name ?? "Order"}{" "}
                  <span className="text-gray-400">
                    ({formatNumber(Number(d.orders?.quantity ?? 0))}{" "}
                    {d.orders?.unit ?? ""})
                  </span>
                </Td>
                <Td className="max-w-44 truncate">{d.pickup_label}</Td>
                <Td className="max-w-44 truncate">{d.dropoff_label}</Td>
                <Td>{d.distance_km ? `${d.distance_km} km` : "—"}</Td>
                <Td>
                  <Badge status={d.status} />
                </Td>
                <Td>
                  {NEXT_LABEL[d.status] ? (
                    <form action={advanceDelivery}>
                      <input type="hidden" name="delivery_id" value={d.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        {NEXT_LABEL[d.status]}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-gray-400">Completed</span>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={Truck}
          title="No deliveries assigned"
          message="When the scheduling engine assigns you deliveries, manage them here."
        />
      )}
    </div>
  );
}
