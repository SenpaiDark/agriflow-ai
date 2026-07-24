"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";

export async function updateUserRole(formData: FormData) {
  const { supabase, user } = await getSessionUser();
  if (!user) return;

  // Only admins may change roles (RLS also enforces this).
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return;

  await supabase
    .from("profiles")
    .update({ role: String(formData.get("role")) })
    .eq("id", String(formData.get("user_id")));

  revalidatePath("/dashboard/admin", "layout");
}
