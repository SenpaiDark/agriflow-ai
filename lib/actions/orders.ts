"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { assertOk, unwrapMaybe } from "@/lib/supabase/errors";
import { notify } from "@/lib/notify";

export async function placeOrder(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const harvestId = String(formData.get("harvest_id"));
  const quantity = Number(formData.get("quantity"));
  if (!Number.isFinite(quantity) || quantity <= 0) return;

  const harvest = unwrapMaybe(
    await supabase.from("harvests").select("*").eq("id", harvestId).single(),
    "Load harvest"
  );
  if (!harvest || harvest.status !== "available") return;

  const available = Number(harvest.quantity);
  const qty = Math.min(quantity, available);
  if (qty <= 0) return;

  // Decrement stock FIRST with an optimistic guard on the quantity we read:
  // if a concurrent order already changed it, this update matches no row and
  // we abort instead of overselling.
  const remaining = available - qty;
  const updated = unwrapMaybe(
    await supabase
      .from("harvests")
      .update({
        quantity: remaining,
        status: remaining <= 0 ? "reserved" : "available",
      })
      .eq("id", harvestId)
      .eq("status", "available")
      .eq("quantity", available)
      .select()
      .single(),
    "Reserve harvest stock"
  );
  if (!updated) return; // Lost the race — stock changed under us.

  // City select supplies "lat,lng"; used by nearest-warehouse routing.
  const coords = String(formData.get("city_coords") || "").split(",");
  const rawLat = coords.length === 2 ? Number(coords[0]) : NaN;
  const rawLng = coords.length === 2 ? Number(coords[1]) : NaN;
  const lat = Number.isFinite(rawLat) ? rawLat : null;
  const lng = Number.isFinite(rawLng) ? rawLng : null;

  assertOk(
    await supabase.from("orders").insert({
      buyer_id: user.id,
      farmer_id: harvest.farmer_id,
      harvest_id: harvestId,
      product_name: harvest.product_name,
      quantity: qty,
      unit: harvest.unit,
      total_price: qty * Number(harvest.price_per_unit),
      delivery_address: String(formData.get("delivery_address")),
      delivery_lat: lat,
      delivery_lng: lng,
    }),
    "Place order"
  );

  await notify(
    harvest.farmer_id,
    "New order received",
    `A buyer ordered ${qty} ${harvest.unit} of ${harvest.product_name}. Confirm it from your Orders page.`,
    "info"
  );

  revalidatePath("/dashboard/buyer", "layout");
  revalidatePath("/dashboard/farmer", "layout");
}

export async function confirmOrder(formData: FormData) {
  const supabase = createClient();
  const profile = await getProfile();
  if (!profile) return;
  const orderId = String(formData.get("order_id"));

  // Only the order's farmer (or an admin) may confirm it.
  let query = supabase
    .from("orders")
    .update({ status: "confirmed" })
    .eq("id", orderId)
    .eq("status", "pending");
  if (profile.role !== "admin") query = query.eq("farmer_id", profile.id);

  const order = unwrapMaybe(await query.select().single(), "Confirm order");

  if (order) {
    await notify(
      order.buyer_id,
      "Order confirmed",
      `Your order for ${order.quantity} ${order.unit} of ${order.product_name} was confirmed and will be scheduled for delivery.`,
      "success"
    );
  }

  revalidatePath("/dashboard", "layout");
}

export async function cancelOrder(formData: FormData) {
  const supabase = createClient();
  const profile = await getProfile();
  if (!profile) return;
  const orderId = String(formData.get("order_id"));

  // Only the buyer or farmer on the order (or an admin) may cancel it.
  let query = supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .in("status", ["pending", "confirmed"]);
  if (profile.role !== "admin") {
    query = query.or(`buyer_id.eq.${profile.id},farmer_id.eq.${profile.id}`);
  }

  const order = unwrapMaybe(await query.select().single(), "Cancel order");

  if (order) {
    // Return the quantity to the marketplace.
    const harvest = unwrapMaybe(
      await supabase
        .from("harvests")
        .select("quantity")
        .eq("id", order.harvest_id)
        .single(),
      "Load harvest for restock"
    );
    if (harvest) {
      assertOk(
        await supabase
          .from("harvests")
          .update({
            quantity: Number(harvest.quantity) + Number(order.quantity),
            status: "available",
          })
          .eq("id", order.harvest_id),
        "Restock harvest"
      );
    }

    await notify(
      order.buyer_id,
      "Order cancelled",
      `The order for ${order.product_name} was cancelled.`,
      "warning"
    );
    await notify(
      order.farmer_id,
      "Order cancelled",
      `An order for ${order.product_name} was cancelled and stock returned to the marketplace.`,
      "warning"
    );
  }

  revalidatePath("/dashboard", "layout");
}
