"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertOk, unwrapMaybe } from "@/lib/supabase/errors";
import { notify } from "@/lib/notify";

export async function addInventory(formData: FormData) {
  const supabase = createClient();

  const item = unwrapMaybe(
    await supabase
      .from("inventory_items")
      .insert({
        warehouse_id: String(formData.get("warehouse_id")),
        product_name: String(formData.get("product_name")),
        quantity: Number(formData.get("quantity")),
        unit: String(formData.get("unit") || "kg"),
        entry_date: String(formData.get("entry_date")),
        shelf_life_days: Number(formData.get("shelf_life_days") || 7),
      })
      .select()
      .single(),
    "Add inventory"
  );

  if (item) {
    assertOk(
      await supabase.from("stock_movements").insert({
        warehouse_id: item.warehouse_id,
        inventory_item_id: item.id,
        type: "in",
        quantity: item.quantity,
        note: "Stock received",
      }),
      "Log stock movement"
    );
  }

  revalidatePath("/dashboard/warehouse", "layout");
}

export async function dispatchInventory(formData: FormData) {
  const supabase = createClient();
  const itemId = String(formData.get("item_id"));
  const quantity = Number(formData.get("quantity"));

  const item = unwrapMaybe(
    await supabase.from("inventory_items").select("*").eq("id", itemId).single(),
    "Load inventory item"
  );
  if (!item || item.status !== "in_storage") return;

  const outQty = Math.min(quantity, Number(item.quantity));
  if (outQty <= 0) return;

  const remaining = Number(item.quantity) - outQty;
  assertOk(
    await supabase
      .from("inventory_items")
      .update({
        quantity: remaining,
        status: remaining <= 0 ? "dispatched" : "in_storage",
      })
      .eq("id", itemId),
    "Update inventory item"
  );

  assertOk(
    await supabase.from("stock_movements").insert({
      warehouse_id: item.warehouse_id,
      inventory_item_id: itemId,
      type: "out",
      quantity: outQty,
      note: String(formData.get("note") || "Stock dispatched"),
    }),
    "Log stock movement"
  );

  revalidatePath("/dashboard/warehouse", "layout");
}

export async function markSpoiled(formData: FormData) {
  const supabase = createClient();
  const itemId = String(formData.get("item_id"));

  // Only stored items can be written off — guards against double write-offs
  // on already-dispatched/spoiled rows.
  const item = unwrapMaybe(
    await supabase
      .from("inventory_items")
      .update({ status: "spoiled" })
      .eq("id", itemId)
      .eq("status", "in_storage")
      .select()
      .single(),
    "Mark inventory spoiled"
  );

  if (item) {
    assertOk(
      await supabase.from("stock_movements").insert({
        warehouse_id: item.warehouse_id,
        inventory_item_id: itemId,
        type: "out",
        quantity: item.quantity,
        note: "Marked spoiled (shelf life exceeded)",
      }),
      "Log stock movement"
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await notify(
        user.id,
        "Stock spoiled",
        `${item.quantity} ${item.unit} of ${item.product_name} was written off as spoiled.`,
        "alert"
      );
    }
  }

  revalidatePath("/dashboard/warehouse", "layout");
}

export async function createWarehouse(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const capacity = Number(formData.get("capacity") || 10000);

  assertOk(
    await supabase.from("warehouses").insert({
      name: String(formData.get("name")),
      manager_id: user.id,
      location: String(formData.get("location")),
      lat,
      lng,
      capacity: Number.isFinite(capacity) ? capacity : 10000,
    }),
    "Create warehouse"
  );

  revalidatePath("/dashboard/warehouse", "layout");
}
