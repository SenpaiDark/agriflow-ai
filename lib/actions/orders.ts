"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertOk, unwrapMaybe } from "@/lib/supabase/errors";
import { currentUserAndRole } from "@/lib/auth";
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

  const qty = Math.min(quantity, Number(harvest.quantity));
  if (qty <= 0) return;

  // City select supplies "lat,lng"; used by nearest-warehouse routing.
  const coords = String(formData.get("city_coords") || "").split(",");
  const lat = coords.length === 2 ? coords[0] : null;
  const lng = coords.length === 2 ? coords[1] : null;

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
      delivery_lat: lat ? Number(lat) : null,
      delivery_lng: lng ? Number(lng) : null,
    }),
    "Place order"
  );

  // Reduce remaining stock; fully bought harvests leave the marketplace.
  const remaining = Number(harvest.quantity) - qty;
  assertOk(
    await supabase
      .from("harvests")
      .update({
        quantity: remaining,
        status: remaining <= 0 ? "reserved" : "available",
      })
      .eq("id", harvestId),
    "Update harvest stock"
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
  const { user, role } = await currentUserAndRole();
  if (!user) return;

  const orderId = String(formData.get("order_id"));

  // Only the farmer who owns the order (or an admin) may confirm it.
  const existing = unwrapMaybe(
    await supabase.from("orders").select("farmer_id").eq("id", orderId).single(),
    "Load order to confirm"
  );
  if (!existing) return;
  if (existing.farmer_id !== user.id && role !== "admin") return;

  const order = unwrapMaybe(
    await supabase
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", orderId)
      .eq("status", "pending")
      .select()
      .single(),
    "Confirm order"
  );

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
  const { user, role } = await currentUserAndRole();
  if (!user) return;

  const orderId = String(formData.get("order_id"));

  // Only the buyer or farmer on the order (or an admin) may cancel it.
  const existing = unwrapMaybe(
    await supabase
      .from("orders")
      .select("buyer_id, farmer_id")
      .eq("id", orderId)
      .single(),
    "Load order to cancel"
  );
  if (!existing) return;
  if (
    existing.buyer_id !== user.id &&
    existing.farmer_id !== user.id &&
    role !== "admin"
  ) {
    return;
  }

  const order = unwrapMaybe(
    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .in("status", ["pending", "confirmed"])
      .select()
      .single(),
    "Cancel order"
  );

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
