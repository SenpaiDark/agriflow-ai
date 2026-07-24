"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertOk, unwrapMaybe } from "@/lib/supabase/errors";
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
  assertOk(
    await supabase
      .from("crops")
      .update({ status: String(formData.get("status")) })
      .eq("id", String(formData.get("crop_id"))),
    "Update crop status"
  );

  revalidatePath("/dashboard/farmer", "layout");
}

export async function deleteCrop(formData: FormData) {
  const supabase = createClient();
  assertOk(
    await supabase
      .from("crops")
      .delete()
      .eq("id", String(formData.get("crop_id"))),
    "Delete crop"
  );

  revalidatePath("/dashboard/farmer", "layout");
}

export async function createHarvest(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const cropId = String(formData.get("crop_id"));
  // Only allow recording a harvest against the caller's own crop.
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

  const quantity = Number(formData.get("quantity"));
  const pricePerUnit = Number(formData.get("price_per_unit"));
  if (!Number.isFinite(quantity) || quantity <= 0) return;
  if (!Number.isFinite(pricePerUnit) || pricePerUnit < 0) return;

  // Insert, crop status update and notification are independent — run together.
  const [insertResult, updateResult] = await Promise.all([
    supabase.from("harvests").insert({
      crop_id: cropId,
      farmer_id: user.id,
      product_name: crop.name,
      harvest_date: String(formData.get("harvest_date")),
      quantity,
      unit: String(formData.get("unit") || "kg"),
      quality_grade: String(formData.get("quality_grade") || "A"),
      price_per_unit: pricePerUnit,
      shelf_life_days: Number(formData.get("shelf_life_days") || 7),
    }),
    // Harvest recorded means the crop cycle is complete.
    supabase.from("crops").update({ status: "harvested" }).eq("id", cropId),
    notify(
      user.id,
      "Harvest recorded",
      `${crop.name} harvest is now listed for buyers.`,
      "success"
    ),
  ]);
  assertOk(insertResult, "Record harvest");
  assertOk(updateResult, "Mark crop harvested");

  revalidatePath("/dashboard/farmer", "layout");
  revalidatePath("/dashboard/buyer", "layout");
}
