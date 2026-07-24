import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export const ROLE_HOME: Record<UserRole, string> = {
  farmer: "/dashboard/farmer",
  buyer: "/dashboard/buyer",
  transporter: "/dashboard/transport",
  warehouse_manager: "/dashboard/warehouse",
  admin: "/dashboard/admin",
};

/** Current user's profile, redirecting to /login when signed out. */
export async function requireProfile(): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  return profile as Profile;
}

/**
 * Server-action guard: returns the signed-in user and their role, or nulls
 * when signed out. Unlike requireProfile it never redirects, so callers can
 * bail out quietly (server actions must not throw redirects on every call).
 */
export async function currentUserAndRole(): Promise<{
  user: { id: string } | null;
  role: UserRole | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null };

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { user, role: (data?.role as UserRole | undefined) ?? null };
}

/** Redirects to the user's role home if they open a section for another role. */
export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role) && profile.role !== "admin") {
    redirect(ROLE_HOME[profile.role]);
  }
  return profile;
}
