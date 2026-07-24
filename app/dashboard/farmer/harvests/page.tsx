import { Package, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createHarvest } from "@/lib/actions/crops";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, formatNumber, inputClass } from "@/lib/utils";

export const metadata = { title: "Harvests" };

export default async function HarvestsPage() {
  const profile = await requireRole(["farmer"]);
  const supabase = createClient();

  const [{ data: harvests }, { data: crops }] = await Promise.all([
    supabase
      .from("harvests")
      .select("*")
      .eq("farmer_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("crops")
      .select("id, name, status")
      .eq("farmer_id", profile.id)
      .neq("status", "harvested")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader
        title="Harvests"
        subtitle="Record harvests and list them for buyers"
      />

      <details className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer items-center gap-2 px-6 py-4 font-medium text-emerald-700">
          <Plus className="h-4 w-4" /> Record a harvest
        </summary>
        {(crops ?? []).length > 0 ? (
          <form action={createHarvest} className="grid gap-4 border-t border-gray-100 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Crop
              </label>
              <select name="crop_id" required className={inputClass}>
                {crops!.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Harvest date
              </label>
              <input name="harvest_date" type="date" required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <div className="flex gap-2">
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="any"
                  required
                  className={inputClass}
                  placeholder="500"
                />
                <select name="unit" className="w-28 rounded-lg border border-gray-300 px-2 py-2 text-sm">
                  <option value="kg">kg</option>
                  <option value="tonnes">tonnes</option>
                  <option value="crates">crates</option>
                  <option value="bags">bags</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Quality grade
              </label>
              <select name="quality_grade" className={inputClass}>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Price per unit (₦)
              </label>
              <input
                name="price_per_unit"
                type="number"
                min="0"
                step="any"
                required
                className={inputClass}
                placeholder="1500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Shelf life (days)
              </label>
              <input
                name="shelf_life_days"
                type="number"
                min="1"
                defaultValue={7}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <SubmitButton>List harvest</SubmitButton>
            </div>
          </form>
        ) : (
          <p className="border-t border-gray-100 p-6 text-sm text-gray-500">
            Add a crop first — harvests are recorded against a crop.
          </p>
        )}
      </details>

      {(harvests ?? []).length > 0 ? (
        <Card className="p-0">
          <div className="px-6 pt-6">
            <CardHeader title="All harvests" />
          </div>
          <Table headers={["Product", "Harvested", "Remaining", "Grade", "Price/unit", "Shelf life", "Status"]}>
            {harvests!.map((h) => (
              <tr key={h.id}>
                <Td className="font-medium">{h.product_name}</Td>
                <Td>{formatDate(h.harvest_date)}</Td>
                <Td>
                  {formatNumber(Number(h.quantity))} {h.unit}
                </Td>
                <Td>Grade {h.quality_grade}</Td>
                <Td>{formatCurrency(Number(h.price_per_unit))}</Td>
                <Td>{h.shelf_life_days} days</Td>
                <Td>
                  <Badge status={h.status} />
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={Package}
          title="No harvests recorded"
          message="Record your first harvest to make it available to buyers in the marketplace."
        />
      )}
    </div>
  );
}
