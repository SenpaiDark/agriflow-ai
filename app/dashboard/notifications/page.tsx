import { Bell, CheckCheck, Check } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDate, pluralize } from "@/lib/utils";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const unread = (notifications ?? []).filter((n) => !n.read);

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={
          unread.length > 0
            ? pluralize(unread.length, "unread notification")
            : "You're all caught up"
        }
        action={
          unread.length > 0 ? (
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
            </form>
          ) : undefined
        }
      />

      {(notifications ?? []).length > 0 ? (
        <div className="space-y-3">
          {notifications!.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm",
                n.read ? "border-gray-200" : "border-emerald-200 bg-emerald-50/40"
              )}
            >
              <div className="flex items-start gap-3">
                <Badge status={n.type} className="mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(n.created_at)}
                  </p>
                </div>
              </div>
              {!n.read && (
                <form action={markNotificationRead}>
                  <input type="hidden" name="notification_id" value={n.id} />
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark read
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications"
          message="Order updates, delivery progress and spoilage alerts will land here."
        />
      )}
    </div>
  );
}
