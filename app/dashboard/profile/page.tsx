import { UserCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/lib/actions/profile";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My Profile" };

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default async function ProfilePage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Your account details on AgriFlow"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center py-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
              {initials}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              {profile.full_name}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">{user?.email}</p>
            <Badge status={profile.role} className="mt-3" />
            <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
              <UserCircle className="h-3.5 w-3.5" />
              Member since {formatDate(profile.created_at)}
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Edit details"
            subtitle="Name, phone and location are visible to your trading partners"
          />
          <form action={updateProfile} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="profile-name"
                name="full_name"
                required
                defaultValue={profile.full_name}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="mb-1 block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                id="profile-phone"
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ""}
                className={inputClass}
                placeholder="+234…"
              />
            </div>
            <div>
              <label htmlFor="profile-location" className="mb-1 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                id="profile-location"
                name="location"
                defaultValue={profile.location ?? ""}
                className={inputClass}
                placeholder="City, State"
              />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton>Save changes</SubmitButton>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-500">
            <p>
              <strong className="text-gray-700">Email:</strong> {user?.email}{" "}
              <span className="text-xs">(sign-in email cannot be changed here)</span>
            </p>
            <p className="mt-1">
              <strong className="text-gray-700">Role:</strong>{" "}
              {profile.role.replace(/_/g, " ")}{" "}
              <span className="text-xs">
                (contact an administrator to change your role)
              </span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
