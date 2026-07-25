import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/contexts/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { WelcomeSplash } from "@/components/welcome-splash";
import { PageTransition } from "@/components/ui/page-transition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("read", false);

  return (
    <AuthProvider user={{ name: profile.full_name, role: profile.role }}>
      <div className="flex min-h-screen">
        <Sidebar role={profile.role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar profile={profile} unreadCount={count ?? 0} />
          <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
      <WelcomeSplash />
    </AuthProvider>
  );
}
