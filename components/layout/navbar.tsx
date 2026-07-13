"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Profile } from "@/lib/types";

export function Navbar({
  profile,
  unreadCount,
}: {
  profile: Profile;
  unreadCount: number;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:px-8">
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-500">
          Welcome back,{" "}
          <span className="font-medium text-gray-900">
            {profile.full_name}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Badge status={profile.role} className="hidden sm:inline-flex" />

        <ThemeToggle />

        <Link
          href="/dashboard/notifications"
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <Link
          href="/dashboard/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white transition-transform hover:scale-105"
          title="My profile"
        >
          {initials}
        </Link>

        <button
          onClick={handleSignOut}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
