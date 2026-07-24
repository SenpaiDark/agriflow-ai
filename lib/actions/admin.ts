"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { assertOk, unwrapMaybe } from "@/lib/supabase/errors";

export async function updateUserRole(formData: FormData) {
  const { supabase, user } = await getSessionUser();
  if (!user) return;

  // Only admins may change roles (RLS also enforces this).
  const me = unwrapMaybe(
    await supabase.from("profiles").select("role").eq("id", user.id).single(),
    "Load current profile"
  );
  if (me?.role !== "admin") return;

  assertOk(
    await supabase
      .from("profiles")
      .update({ role: String(formData.get("role")) })
      .eq("id", String(formData.get("user_id"))),
    "Update user role"
  );

  revalidatePath("/dashboard/admin", "layout");
}
