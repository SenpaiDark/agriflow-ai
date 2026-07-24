"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentUserAndRole } from "@/lib/auth";
import { notify } from "@/lib/notify";
import {
  scheduleOrders,
  type SchedulableOrder,
  type WarehousePoint,
} from "@/lib/scheduling";

/**
 * Runs the rule-based scheduling engine over all confirmed orders:
 * creates deliveries (nearest warehouse as pickup), assigns transporters
 * round-robin, marks orders scheduled and notifies everyone involved.
 */
export async function runScheduling() {
  const supabase = createClient();

  // Scheduling is an admin-only operation.
  const { user, role } = await currentUserAndRole();
  if (!user) return { scheduled: 0, message: "You are signed out." };
  if (role !== "admin") {
    return { scheduled: 0, message: "Only admins can run the scheduler." };
  }

  const [
    { data: orders },
    { data: warehouses },
    { data: transporters },
    { data: activeDeliveries },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*, harvests(harvest_date, shelf_life_days)")
      .eq("status", "confirmed"),
    supabase.from("warehouses").select("id, name, lat, lng"),
    supabase
      .from("profiles")
      .select("id, full_name, created_at")
      .eq("role", "transporter"),
    supabase
      .from("deliveries")
      .select("transporter_id")
      .neq("status", "delivered"),
  ]);

  // Least-busy assignment: transporters with the fewest open deliveries first.
  const load = new Map<string, number>();
  for (const t of transporters ?? []) load.set(t.id, 0);
  for (const d of activeDeliveries ?? []) {
    if (d.transporter_id && load.has(d.transporter_id)) {
      load.set(d.transporter_id, (load.get(d.transporter_id) ?? 0) + 1);
    }
  }
  const pickTransporter = () => {
    if (!transporters || transporters.length === 0) return null;
    let best = transporters[0];
    for (const t of transporters) {
      const tLoad = load.get(t.id) ?? 0;
      const bestLoad = load.get(best.id) ?? 0;
      // Fewest open deliveries wins; ties go to the newest transporter.
      if (
        tLoad < bestLoad ||
        (tLoad === bestLoad &&
          new Date(t.created_at) > new Date(best.created_at))
      ) {
        best = t;
      }
    }
    load.set(best.id, (load.get(best.id) ?? 0) + 1);
    return best;
  };

  if (!orders || orders.length === 0) {
    return { scheduled: 0, message: "No confirmed orders waiting." };
  }
  if (!warehouses || warehouses.length === 0) {
    return { scheduled: 0, message: "No warehouses configured." };
  }

  const schedulable: SchedulableOrder[] = orders.map((o) => ({
    id: o.id,
    created_at: o.created_at,
    shelf_life_days: o.harvests?.shelf_life_days ?? 7,
    harvest_date: o.harvests?.harvest_date ?? o.created_at,
    delivery_lat: o.delivery_lat,
    delivery_lng: o.delivery_lng,
    delivery_address: o.delivery_address,
  }));

  const plan = scheduleOrders(schedulable, warehouses as WarehousePoint[]);

  for (let i = 0; i < plan.length; i++) {
    const d = plan[i];
    const transporter = pickTransporter();

    await supabase.from("deliveries").insert({
      order_id: d.order_id,
      transporter_id: transporter?.id ?? null,
      pickup_label: d.pickup_label,
      pickup_lat: d.pickup_lat,
      pickup_lng: d.pickup_lng,
      dropoff_label: d.dropoff_label,
      dropoff_lat: d.dropoff_lat,
      dropoff_lng: d.dropoff_lng,
      scheduled_date: d.scheduled_date,
      distance_km: d.distance_km,
    });

    await supabase
      .from("orders")
      .update({ status: "scheduled" })
      .eq("id", d.order_id);

    const order = orders.find((o) => o.id === d.order_id);
    if (order) {
      await notify(
        order.buyer_id,
        "Delivery scheduled",
        `Your ${order.product_name} order is scheduled for ${d.scheduled_date} from ${d.pickup_label} (${d.distance_km} km).`,
        "info"
      );
      if (transporter) {
        await notify(
          transporter.id,
          "New delivery assigned",
          `Deliver ${order.product_name} from ${d.pickup_label} to ${d.dropoff_label} on ${d.scheduled_date}.`,
          "info"
        );
      }
    }
  }

  revalidatePath("/dashboard", "layout");
  return {
    scheduled: plan.length,
    message: `Scheduled ${plan.length} deliver${plan.length === 1 ? "y" : "ies"}.`,
  };
}

/** Form-friendly wrapper so <form action> gets a void return. */
export async function runSchedulingAction() {
  await runScheduling();
}
