import { Map as MapIcon } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RouteMapLoader } from "@/components/maps/route-map-loader";
import type { RoutePoint } from "@/components/maps/route-map";
import { formatDate, pluralize } from "@/lib/utils";

export const metadata = { title: "Route Map" };

export default async function RoutesPage() {
  const profile = await requireRole(["transporter"]);
  const supabase = createClient();

  const { data: deliveries } = await supabase
    .from("deliveries")
    .select("*, orders(product_name)")
    .eq("transporter_id", profile.id)
    .neq("status", "delivered")
    .order("scheduled_date", { ascending: true });

  const routes: RoutePoint[] = (deliveries ?? []).map((d) => ({
    id: d.id,
    pickup: { lat: d.pickup_lat, lng: d.pickup_lng, label: d.pickup_label },
    dropoff: { lat: d.dropoff_lat, lng: d.dropoff_lng, label: d.dropoff_label },
    title: d.orders?.product_name ?? "Delivery",
    subtitle: `Scheduled ${formatDate(d.scheduled_date)} · ${d.distance_km ?? "?"} km`,
  }));

  return (
    <div>
      <PageHeader
        title="Route Map"
        subtitle="Active routes — pickup warehouse chosen by nearest distance to the drop-off"
      />

      {routes.length > 0 ? (
        <Card className="p-0">
          <div className="px-6 pt-6">
            <CardHeader
              title="Active delivery routes"
              subtitle={`${pluralize(routes.length, "route")} on the map`}
            />
          </div>
          <div className="h-[520px] px-6 pb-6">
            <RouteMapLoader routes={routes} />
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={MapIcon}
          title="No active routes"
          message="Routes for your assigned deliveries will be drawn here on the map."
        />
      )}
    </div>
  );
}
