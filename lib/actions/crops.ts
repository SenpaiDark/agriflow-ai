"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertOk, unwrapMaybe } from "@/lib/supabase/errors";
import { currentUserAndRole } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function createCrop(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  assertOk(
    await supabase.from("crops").insert({
      farmer_id: user.id,
      name: String(formData.get("name")),
      category: String(formData.get("category")),
      planting_date: String(formData.get("planting_date")),
      expected_harvest_date: String(formData.get("expected_harvest_date")),
      quantity_estimate: Number(formData.get("quantity_estimate")),
      unit: String(formData.get("unit") || "kg"),
      notes: String(formData.get("notes") || "") || null,
    }),
    "Create crop"
  );

  revalidatePath("/dashboard/farmer", "layout");
}

export async function updateCropStatus(formData: FormData) {
  const supabase = createClient();
  const { user, role } = await currentUserAndRole();
  if (!user) return;

  // Farmers may only touch their own crops; admins may touch any.
  let query = supabase
    .from("crops")
    .update({ status: String(formData.get("status")) })
    .eq("id", String(formData.get("crop_id")));
  if (role !== "admin") query = query.eq("farmer_id", user.id);
  assertOk(await query, "Update crop status");

  revalidatePath("/dashboard/farmer", "layout");
}

export async function deleteCrop(formData: FormData) {
  const supabase = createClient();
  const { user, role } = await currentUserAndRole();
  if (!user) return;

  let query = supabase
    .from("crops")
    .delete()
    .eq("id", String(formData.get("crop_id")));
  if (role !== "admin") query = query.eq("farmer_id", user.id);
  assertOk(await query, "Delete crop");

  revalidatePath("/dashboard/farmer", "layout");
}

export async function createHarvest(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const cropId = String(formData.get("crop_id"));
  // The crop must belong to the farmer recording the harvest.
  const crop = unwrapMaybe(
    await supabase
      .from("crops")
      .select("name")
      .eq("id", cropId)
      .eq("farmer_id", user.id)
      .single(),
    "Load crop"
  );
  if (!crop) return;

  // Insert, crop status update and notification are independent — run together.
  const [insertResult, updateResult] = await Promise.all([
    supabase.from("harvests").insert({
      crop_id: cropId,
      farmer_id: user.id,
      product_name: crop?.name ?? "Produce",
      harvest_date: String(formData.get("harvest_date")),
      quantity: Number(formData.get("quantity")),
      unit: String(formData.get("unit") || "kg"),
      quality_grade: String(formData.get("quality_grade") || "A"),
      price_per_unit: Number(formData.get("price_per_unit")),
      shelf_life_days: Number(formData.get("shelf_life_days") || 7),
    }),
    // Harvest recorded means the crop cycle is complete.
    supabase.from("crops").update({ status: "harvested" }).eq("id", cropId),
    notify(
      user.id,
      "Harvest recorded",
      `${crop?.name ?? "Produce"} harvest is now listed for buyers.`,
      "success"
    ),
  ]);
  assertOk(insertResult, "Record harvest");
  assertOk(updateResult, "Mark crop harvested");

  revalidatePath("/dashboard/farmer", "layout");
  revalidatePath("/dashboard/buyer", "layout");
}
