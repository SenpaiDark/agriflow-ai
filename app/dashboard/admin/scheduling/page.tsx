import { CalendarClock, Play, Truck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { runSchedulingAction } from "@/lib/actions/scheduling";
import { MAX_DELIVERIES_PER_DAY } from "@/lib/scheduling";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatCard, Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Scheduling Engine" };

export default async function SchedulingPage() {
  await requireRole(["admin"]);
  const supabase = createClient();

  const [
    { count: confirmedCount },
    { count: transporterCount },
    { count: warehouseCount },
    { data: deliveries },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "transporter"),
    supabase.from("warehouses").select("*", { count: "exact", head: true }),
    supabase
      .from("deliveries")
      .select("*, orders(product_name), profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  return (
    <div>
      <PageHeader
        title="Scheduling Engine"
        subtitle="Rule-based: most perishable first, nearest warehouse as pickup, round-robin transporter assignment"
        action={
          <form action={runSchedulingAction}>
            <SubmitButton>
              <Play className="h-4 w-4" /> Run scheduler
            </SubmitButton>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Confirmed orders waiting"
          value={confirmedCount ?? 0}
          icon={CalendarClock}
          tone={(confirmedCount ?? 0) > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Transporters available"
          value={transporterCount ?? 0}
          icon={Truck}
        />
        <StatCard
          label="Pickup warehouses"
          value={warehouseCount ?? 0}
          icon={CalendarClock}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="How the rules work"
          subtitle="Deterministic logic — no AI involved"
        />
        <ol className="list-inside list-decimal space-y-1.5 text-sm text-gray-600">
          <li>
            Confirmed orders are ranked by <strong>shelf life remaining</strong>{" "}
            (most perishable first), ties broken by order age.
          </li>
          <li>
            Deliveries are placed starting tomorrow, at most{" "}
            <strong>{MAX_DELIVERIES_PER_DAY} per day</strong>; overflow rolls to
            the next day.
          </li>
          <li>
            The pickup point is the <strong>nearest warehouse</strong> to the
            buyer&apos;s drop-off (straight-line distance).
          </li>
          <li>
            Each delivery goes to the <strong>least-busy transporter</strong>{" "}
            (fewest open deliveries), who is notified automatically.
          </li>
        </ol>
      </Card>

      <Card className="mt-6 p-0">
        <div className="px-6 pt-6">
          <CardHeader title="Recent scheduled deliveries" />
        </div>
        {(deliveries ?? []).length > 0 ? (
          <Table headers={["Scheduled", "Product", "Transporter", "From", "To", "Distance", "Status"]}>
            {deliveries!.map((d) => (
              <tr key={d.id}>
                <Td>{formatDate(d.scheduled_date)}</Td>
                <Td className="font-medium">
                  {d.orders?.product_name ?? "Order"}
                </Td>
                <Td>{d.profiles?.full_name ?? "Unassigned"}</Td>
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
              title="Nothing scheduled yet"
              message="Run the scheduler once buyers have confirmed orders to create deliveries."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
