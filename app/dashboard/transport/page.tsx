import Link from "next/link";
import { Truck, PackageCheck, Route, Navigation } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "Transport Overview" };

export default async function TransportOverview() {
  const profile = await requireRole(["transporter"]);
  const supabase = createClient();

  const { data: deliveries } = await supabase
    .from("deliveries")
    .select("*, orders(product_name, quantity, unit)")
    .eq("transporter_id", profile.id)
    .order("scheduled_date", { ascending: true });

  const all = deliveries ?? [];
  const active = all.filter((d) => d.status !== "delivered");
  const inTransit = all.filter((d) =>
    ["picked_up", "in_transit"].includes(d.status)
  );
  const done = all.filter((d) => d.status === "delivered");
  const totalKm = all.reduce((s, d) => s + Number(d.distance_km ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Transport Overview"
        subtitle="Your assigned deliveries and routes"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active deliveries" value={active.length} icon={<Truck className="h-5 w-5" />} />
        <StatCard
          label="In transit"
          value={inTransit.length}
          icon={<Navigation className="h-5 w-5" />}
          tone={inTransit.length > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Completed"
          value={done.length}
          icon={<PackageCheck className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Total distance"
          value={`${formatNumber(Math.round(totalKm))} km`}
          icon={<Route className="h-5 w-5" />}
        />
      </div>

      <Card className="mt-6 p-0">
        <div className="px-6 pt-6">
          <CardHeader
            title="Upcoming deliveries"
            action={
              <Link
                href="/dashboard/transport/deliveries"
                className="text-sm font-medium text-emerald-600 hover:underline"
              >
                Manage deliveries
              </Link>
            }
          />
        </div>
        {active.length > 0 ? (
          <Table headers={["Date", "Product", "From", "To", "Distance", "Status"]}>
            {active.slice(0, 8).map((d) => (
              <tr key={d.id}>
                <Td>{formatDate(d.scheduled_date)}</Td>
                <Td className="font-medium">
                  {d.orders?.product_name ?? "Order"}{" "}
                  <span className="text-gray-400">
                    ({formatNumber(Number(d.orders?.quantity ?? 0))}{" "}
                    {d.orders?.unit ?? ""})
                  </span>
                </Td>
                <Td className="max-w-40 truncate">{d.pickup_label}</Td>
                <Td className="max-w-40 truncate">{d.dropoff_label}</Td>
                <Td>{d.distance_km ? `${d.distance_km} km` : "—"}</Td>
                <Td>
                  <Badge status={d.status} />
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="p-6 pt-0">
            <EmptyState
              icon={Truck}
              title="No active deliveries"
              message="Deliveries assigned to you by the scheduler will appear here."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
