"use server";

import { createClient } from "@/lib/supabase/server";
import { askGemini, type GeminiResult } from "@/lib/gemini";
import { buildWeeklySeries, forecastDemand } from "@/lib/forecasting";

/**
 * Answers a question with Gemini, grounded in a compact snapshot of the
 * user's live data. On failure the actual error message is returned so the
 * chat can show it — the rest of the app never depends on Gemini.
 */
export async function askAssistant(question: string): Promise<GeminiResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { text: null, error: "You are signed out." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Non-admins only see orders they're a party to; admins see everything.
  let ordersQuery = supabase
    .from("orders")
    .select("created_at, product_name, quantity, status, total_price")
    .order("created_at", { ascending: false })
    .limit(100);
  if (profile?.role !== "admin") {
    ordersQuery = ordersQuery.or(
      `buyer_id.eq.${user.id},farmer_id.eq.${user.id}`
    );
  }

  const [{ data: orders }, { data: inventory }] =
    await Promise.all([
      ordersQuery,
      supabase
        .from("inventory_items")
        .select("product_name, quantity, unit, status, entry_date, shelf_life_days")
        .limit(100),
    ]);

  const forecasts: string[] = [];
  if (orders && orders.length > 0) {
    const series = buildWeeklySeries(
      orders.map((o) => ({
        created_at: o.created_at,
        product_name: o.product_name,
        quantity: Number(o.quantity),
      }))
    );
    Array.from(series.entries()).forEach(([product, points]) => {
      const f = forecastDemand(points);
      forecasts.push(
        `${product}: weekly demand ${points.map((p) => p.quantity).join(", ")}; ` +
          `3-week moving average ${f.movingAverage?.toFixed(1)}, ` +
          `weighted moving average ${f.weightedMovingAverage?.toFixed(1)}`
      );
    });
  }

  const context = [
    `User role: ${profile?.role ?? "unknown"} (${profile?.full_name ?? ""})`,
    `Recent orders (latest first): ${JSON.stringify(orders?.slice(0, 25) ?? [])}`,
    `Warehouse inventory: ${JSON.stringify(inventory ?? [])}`,
    `Deterministic demand forecasts: ${forecasts.join(" | ") || "not enough data"}`,
  ].join("\n");

  return askGemini(question, context);
}
