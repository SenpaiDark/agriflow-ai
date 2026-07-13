import { redirect } from "next/navigation";
import { requireProfile, ROLE_HOME } from "@/lib/auth";

export default async function DashboardPage() {
  const profile = await requireProfile();
  redirect(ROLE_HOME[profile.role]);
}
