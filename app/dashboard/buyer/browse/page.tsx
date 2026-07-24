import { ShoppingCart, Leaf } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { placeOrder } from "@/lib/actions/orders";
import { DELIVERY_CITIES } from "@/lib/cities";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { SearchForm } from "@/components/ui/search-form";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, formatNumber, inputClass } from "@/lib/utils";

export const metadata = { title: "Browse Produce" };

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireRole(["buyer"]);
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? "";

  let query = supabase
    .from("harvests")
    .select("*, profiles!harvests_farmer_id_fkey(full_name, location)")
    .eq("status", "available")
    .gt("quantity", 0)
    .order("created_at", { ascending: false });
  if (q) query = query.ilike("product_name", `%${q}%`);

  const { data: harvests } = await query;

  return (
    <div>
      <PageHeader
        title="Browse Produce"
        subtitle="Fresh harvests listed by farmers, ready to order"
        action={<SearchForm placeholder="Search produce…" defaultValue={q} />}
      />

      {(harvests ?? []).length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {harvests!.map((h) => (
            <div
              key={h.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between p-5 pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <Leaf className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{h.product_name}</h3>
                    <p className="text-xs text-gray-500">
                      {h.profiles?.full_name ?? "Farmer"}
                      {h.profiles?.location ? ` · ${h.profiles.location}` : ""}
                    </p>
                  </div>
                </div>
                <Badge status={`Grade ${h.quality_grade}`} className="bg-gray-100 text-gray-700" />
              </div>

              <dl className="grid grid-cols-2 gap-3 p-5 text-sm">
                <div>
                  <dt className="text-gray-500">Available</dt>
                  <dd className="font-medium">
                    {formatNumber(Number(h.quantity))} {h.unit}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Price</dt>
                  <dd className="font-medium">
                    {formatCurrency(Number(h.price_per_unit))}/{h.unit}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Harvested</dt>
                  <dd className="font-medium">{formatDate(h.harvest_date)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Shelf life</dt>
                  <dd className="font-medium">{h.shelf_life_days} days</dd>
                </div>
              </dl>

              <details className="mt-auto border-t border-gray-100">
                <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-emerald-700">
                  Order this produce
                </summary>
                <form action={placeOrder} className="space-y-3 px-5 pb-5">
                  <input type="hidden" name="harvest_id" value={h.id} />
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Quantity ({h.unit}, max {formatNumber(Number(h.quantity))})
                    </label>
                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      max={Number(h.quantity)}
                      step="any"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Delivery address
                    </label>
                    <input
                      name="delivery_address"
                      required
                      className={inputClass}
                      placeholder="Street, area"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      City (used for routing)
                    </label>
                    <select name="city_coords" className={inputClass}>
                      {DELIVERY_CITIES.map((c) => (
                        <option key={c.name} value={`${c.lat},${c.lng}`}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <SubmitButton className="w-full">
                    <ShoppingCart className="h-4 w-4" /> Place order
                  </SubmitButton>
                </form>
              </details>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShoppingCart}
          title={q ? "No matching produce" : "Marketplace is empty"}
          message={
            q
              ? `Nothing available matches "${q}". Try a different search.`
              : "No produce is listed right now. Check back once farmers record new harvests."
          }
        />
      )}
    </div>
  );
}
