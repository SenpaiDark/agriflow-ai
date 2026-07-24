import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

/**
 * Server-action helper: a Supabase client plus the current user (or null when
 * signed out). Unlike {@link requireProfile} it never redirects, so actions can
 * bail quietly with `if (!user) return`.
 */
export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

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

/** Redirects to the user's role home if they open a section for another role. */
export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role) && profile.role !== "admin") {
    redirect(ROLE_HOME[profile.role]);
  }
  return profile;
}
