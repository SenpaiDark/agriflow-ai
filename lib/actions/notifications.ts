"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertOk } from "@/lib/supabase/errors";

export async function markNotificationRead(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  assertOk(
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", String(formData.get("notification_id")))
      .eq("user_id", user.id),
    "Mark notification read"
  );

  revalidatePath("/dashboard", "layout");
}

export async function markAllNotificationsRead() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  assertOk(
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false),
    "Mark all notifications read"
  );

  revalidatePath("/dashboard", "layout");
}
