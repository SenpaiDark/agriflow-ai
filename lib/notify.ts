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
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
  });
}
