"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertOk, unwrapMaybe } from "@/lib/supabase/errors";
import { currentUserAndRole } from "@/lib/auth";
import { notify } from "@/lib/notify";
import type { DeliveryStatus, OrderStatus } from "@/lib/types";

const NEXT_STATUS: Record<string, DeliveryStatus> = {
  assigned: "picked_up",
  picked_up: "in_transit",
  in_transit: "delivered",
};

const ORDER_STATUS_FOR: Record<DeliveryStatus, OrderStatus | null> = {
  assigned: null,
  picked_up: "in_transit",
  in_transit: "in_transit",
  delivered: "delivered",
};

export async function advanceDelivery(formData: FormData) {
  const supabase = createClient();
  const { user, role } = await currentUserAndRole();
  if (!user) return;

  const deliveryId = String(formData.get("delivery_id"));

  const delivery = unwrapMaybe(
    await supabase.from("deliveries").select("*").eq("id", deliveryId).single(),
    "Load delivery"
  );
  if (!delivery) return;

  // Only the transporter assigned to this delivery (or an admin) may advance it.
  if (delivery.transporter_id !== user.id && role !== "admin") return;

  const next = NEXT_STATUS[delivery.status];
  if (!next) return;

  assertOk(
    await supabase.from("deliveries").update({ status: next }).eq("id", deliveryId),
    "Advance delivery"
  );

  const orderStatus = ORDER_STATUS_FOR[next];
  const order = unwrapMaybe(
    await supabase.from("orders").select("*").eq("id", delivery.order_id).single(),
    "Load order for delivery"
  );

  if (order && orderStatus) {
    assertOk(
      await supabase.from("orders").update({ status: orderStatus }).eq("id", order.id),
      "Update order status"
    );

    const labels: Record<DeliveryStatus, string> = {
      assigned: "assigned",
      picked_up: "picked up from the warehouse",
      in_transit: "on its way to you",
      delivered: "delivered",
    };
    await notify(
      order.buyer_id,
      next === "delivered" ? "Order delivered" : "Delivery update",
      `Your ${order.product_name} order is ${labels[next]}.`,
      next === "delivered" ? "success" : "info"
    );
    if (next === "delivered") {
      await notify(
        order.farmer_id,
        "Order completed",
        `The ${order.product_name} order was delivered to the buyer.`,
        "success"
      );
    }
  }

  revalidatePath("/dashboard", "layout");
}
