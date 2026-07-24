import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/lib/types";

/** Rule-based notification insert, fired from server actions. */
export async function notify(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = "info"
) {
  const supabase = createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
  });
  // Notifications are a best-effort side effect: a failure here must not roll
  // back the action that triggered it, but it should never be swallowed
  // silently either.
  if (error) {
    console.error("[agriflow] Notify failed:", error);
  }
}
