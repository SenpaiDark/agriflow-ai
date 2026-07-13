import { Package, Plus, Trash2, Send } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  addInventory,
  dispatchInventory,
  markSpoiled,
} from "@/lib/actions/inventory";
import { shelfLifeInfo } from "@/lib/spoilage";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { SearchForm } from "@/components/ui/search-form";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "Inventory" };

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireRole(["warehouse_manager"]);
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? "";

  let itemsQuery = supabase
    .from("inventory_items")
    .select("*, warehouses(name)")
    .order("created_at", { ascending: false });
  if (q) itemsQuery = itemsQuery.ilike("product_name", `%${q}%`);

  const [{ data: items }, { data: warehouses }] = await Promise.all([
    itemsQuery,
    supabase.from("warehouses").select("id, name").order("name"),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Stock in storage with live shelf-life tracking"
        action={<SearchForm placeholder="Search products…" defaultValue={q} />}
      />

      <details className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer items-center gap-2 px-6 py-4 font-medium text-emerald-700">
          <Plus className="h-4 w-4" /> Receive stock
        </summary>
        <form action={addInventory} className="grid gap-4 border-t border-gray-100 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Warehouse
            </label>
            <select name="warehouse_id" required className={inputClass}>
              {(warehouses ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Product
            </label>
            <input name="product_name" required className={inputClass} placeholder="Tomatoes" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <div className="flex gap-2">
              <input
                name="quantity"
                type="number"
                min="1"
                step="any"
                required
                className={inputClass}
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
              Entry date
            </label>
            <input
              name="entry_date"
              type="date"
              defaultValue={today}
              required
              className={inputClass}
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
          <div className="flex items-end">
            <SubmitButton>Add to inventory</SubmitButton>
          </div>
        </form>
      </details>

      {(items ?? []).length > 0 ? (
        <Card className="p-0">
          <div className="px-6 pt-6">
            <CardHeader
              title="All inventory"
              subtitle="Freshness is computed from entry date + shelf life"
            />
          </div>
          <Table headers={["Product", "Warehouse", "Qty", "Entry", "Expiry", "Freshness", "Status", "Actions"]}>
            {items!.map((item) => {
              const life = shelfLifeInfo(item.entry_date, item.shelf_life_days);
              return (
                <tr key={item.id}>
                  <Td className="font-medium">{item.product_name}</Td>
                  <Td>{item.warehouses?.name ?? "—"}</Td>
                  <Td>
                    {formatNumber(Number(item.quantity))} {item.unit}
                  </Td>
                  <Td>{formatDate(item.entry_date)}</Td>
                  <Td>{formatDate(life.expiryDate)}</Td>
                  <Td>
                    {item.status === "in_storage" ? (
                      <Badge status={life.state} />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </Td>
                  <Td>
                    <Badge status={item.status} />
                  </Td>
                  <Td>
                    {item.status === "in_storage" ? (
                      <div className="flex items-center gap-2">
                        <form action={dispatchInventory} className="flex items-center gap-1">
                          <input type="hidden" name="item_id" value={item.id} />
                          <input
                            name="quantity"
                            type="number"
                            min="1"
                            max={Number(item.quantity)}
                            step="any"
                            defaultValue={Number(item.quantity)}
                            className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-xs"
                            aria-label="Dispatch quantity"
                          />
                          <button
                            type="submit"
                            className="flex items-center gap-1 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                            title="Dispatch stock"
                          >
                            <Send className="h-3 w-3" /> Out
                          </button>
                        </form>
                        <form action={markSpoiled}>
                          <input type="hidden" name="item_id" value={item.id} />
                          <button
                            type="submit"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            title="Mark spoiled"
                            aria-label="Mark spoiled"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={Package}
          title={q ? "No matching stock" : "Inventory is empty"}
          message={
            q
              ? `Nothing in storage matches "${q}".`
              : "Receive stock above to start tracking storage and shelf life."
          }
        />
      )}
    </div>
  );
}
