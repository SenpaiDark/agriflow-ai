"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
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
  const profile = await getProfile();
  if (!profile) return;
  const deliveryId = String(formData.get("delivery_id"));

  const { data: delivery } = await supabase
    .from("deliveries")
    .select("*")
    .eq("id", deliveryId)
    .single();
  if (!delivery) return;

  // Only the assigned transporter (or a warehouse manager/admin) may advance.
  const privileged =
    profile.role === "admin" || profile.role === "warehouse_manager";
  if (!privileged && delivery.transporter_id !== profile.id) return;

  const next = NEXT_STATUS[delivery.status];
  if (!next) return;

  await supabase
    .from("deliveries")
    .update({ status: next })
    .eq("id", deliveryId);

  const orderStatus = ORDER_STATUS_FOR[next];
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", delivery.order_id)
    .single();

  if (order && orderStatus) {
    await supabase
      .from("orders")
      .update({ status: orderStatus })
      .eq("id", order.id);

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
