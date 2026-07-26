import { MapPin, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createWarehouse } from "@/lib/actions/inventory";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber, cn } from "@/lib/utils";

export const metadata = { title: "Warehouses" };

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default async function LocationsPage() {
  await requireRole(["warehouse_manager"]);
  const supabase = createClient();

  const [{ data: warehouses }, { data: items }] = await Promise.all([
    supabase.from("warehouses").select("*").order("name"),
    supabase
      .from("inventory_items")
      .select("warehouse_id, quantity")
      .eq("status", "in_storage"),
  ]);

  const usedByWarehouse = new Map<string, number>();
  for (const i of items ?? []) {
    usedByWarehouse.set(
      i.warehouse_id,
      (usedByWarehouse.get(i.warehouse_id) ?? 0) + Number(i.quantity)
    );
  }

  return (
    <div>
      <PageHeader
        title="Warehouses"
        subtitle="Storage locations used as pickup points by the scheduler"
      />

      <details className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer items-center gap-2 px-6 py-4 font-medium text-emerald-700">
          <Plus className="h-4 w-4" /> Add a warehouse
        </summary>
        <form action={createWarehouse} className="grid gap-4 border-t border-gray-100 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="wh-name" className="mb-1 block text-sm font-medium text-gray-700">
              Name
            </label>
            <input id="wh-name" name="name" required className={inputClass} placeholder="Lagos Central Warehouse" />
          </div>
          <div>
            <label htmlFor="wh-location" className="mb-1 block text-sm font-medium text-gray-700">
              Location
            </label>
            <input id="wh-location" name="location" required className={inputClass} placeholder="Ikeja, Lagos" />
          </div>
          <div>
            <label htmlFor="wh-capacity" className="mb-1 block text-sm font-medium text-gray-700">
              Capacity (units)
            </label>
            <input
              id="wh-capacity"
              name="capacity"
              type="number"
              min="1"
              defaultValue={10000}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="wh-lat" className="mb-1 block text-sm font-medium text-gray-700">
              Latitude
            </label>
            <input id="wh-lat" name="lat" type="number" step="any" required className={inputClass} placeholder="6.6018" />
          </div>
          <div>
            <label htmlFor="wh-lng" className="mb-1 block text-sm font-medium text-gray-700">
              Longitude
            </label>
            <input id="wh-lng" name="lng" type="number" step="any" required className={inputClass} placeholder="3.3515" />
          </div>
          <div className="flex items-end">
            <SubmitButton>Save warehouse</SubmitButton>
          </div>
        </form>
      </details>

      {(warehouses ?? []).length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {warehouses!.map((w) => {
            const used = usedByWarehouse.get(w.id) ?? 0;
            const pct = Math.min(
              100,
              Math.round((used / Number(w.capacity)) * 100)
            );
            return (
              <Card key={w.id}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{w.name}</h3>
                    <p className="text-sm text-gray-500">{w.location}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {w.lat.toFixed(4)}, {w.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>Capacity used</span>
                    <span>
                      {formatNumber(used)} / {formatNumber(Number(w.capacity))}{" "}
                      ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        pct > 90
                          ? "bg-red-500"
                          : pct > 70
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No warehouses"
          message="Add your first warehouse — it becomes a pickup point for scheduled deliveries."
        />
      )}
    </div>
  );
}
