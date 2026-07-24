import { Sprout, Plus, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createCrop, updateCropStatus, deleteCrop } from "@/lib/actions/crops";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatNumber, inputClass, pluralize } from "@/lib/utils";

export const metadata = { title: "My Crops" };

const CROP_CATEGORIES = [
  "Grains",
  "Vegetables",
  "Fruits",
  "Tubers",
  "Legumes",
  "Other",
];

export default async function CropsPage() {
  const profile = await requireRole(["farmer"]);
  const supabase = createClient();

  const { data: crops } = await supabase
    .from("crops")
    .select("*")
    .eq("farmer_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="My Crops"
        subtitle="Track every crop from planting to harvest"
      />

      <details className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer items-center gap-2 px-6 py-4 font-medium text-emerald-700">
          <Plus className="h-4 w-4" /> Add a new crop
        </summary>
        <form action={createCrop} className="grid gap-4 border-t border-gray-100 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Crop name
            </label>
            <input name="name" required className={inputClass} placeholder="Maize" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select name="category" className={inputClass}>
              {CROP_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Estimated yield
            </label>
            <div className="flex gap-2">
              <input
                name="quantity_estimate"
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
              Planting date
            </label>
            <input name="planting_date" type="date" required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Expected harvest date
            </label>
            <input
              name="expected_harvest_date"
              type="date"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <input name="notes" className={inputClass} placeholder="Optional" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <SubmitButton>Save crop</SubmitButton>
          </div>
        </form>
      </details>

      {(crops ?? []).length > 0 ? (
        <Card className="p-0">
          <div className="px-6 pt-6">
            <CardHeader
              title="All crops"
              subtitle={`${pluralize(crops!.length, "crop")} recorded`}
            />
          </div>
          <Table headers={["Crop", "Category", "Planted", "Expected harvest", "Est. yield", "Status", "Actions"]}>
            {crops!.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium">{c.name}</Td>
                <Td>{c.category}</Td>
                <Td>{formatDate(c.planting_date)}</Td>
                <Td>{formatDate(c.expected_harvest_date)}</Td>
                <Td>
                  {formatNumber(Number(c.quantity_estimate))} {c.unit}
                </Td>
                <Td>
                  <Badge status={c.status} />
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <form action={updateCropStatus} className="flex items-center gap-1">
                      <input type="hidden" name="crop_id" value={c.id} />
                      <select
                        name="status"
                        defaultValue={c.status}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="planted">Planted</option>
                        <option value="growing">Growing</option>
                        <option value="ready">Ready</option>
                        <option value="harvested">Harvested</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700"
                      >
                        Set
                      </button>
                    </form>
                    <form action={deleteCrop}>
                      <input type="hidden" name="crop_id" value={c.id} />
                      <button
                        type="submit"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={Sprout}
          title="No crops yet"
          message="Add your first crop above to start tracking your farm."
        />
      )}
    </div>
  );
}
