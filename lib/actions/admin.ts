"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { USER_ROLES } from "@/lib/types";

const VALID_ROLES = new Set(USER_ROLES.map((r) => r.value));

export async function updateUserRole(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Only admins may change roles (RLS also enforces this).
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return;

  const newRole = String(formData.get("role"));
  if (!VALID_ROLES.has(newRole as (typeof USER_ROLES)[number]["value"])) return;

  await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", String(formData.get("user_id")));

  revalidatePath("/dashboard/admin", "layout");
}
