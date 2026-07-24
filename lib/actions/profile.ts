"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertOk } from "@/lib/supabase/errors";

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  assertOk(
    await supabase
      .from("profiles")
      .update({
        full_name: String(formData.get("full_name")),
        phone: String(formData.get("phone") || "") || null,
        location: String(formData.get("location") || "") || null,
      })
      .eq("id", user.id),
    "Update profile"
  );

  revalidatePath("/dashboard", "layout");
}
