import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateUserRole } from "@/lib/actions/admin";
import { USER_ROLES } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { SearchForm } from "@/components/ui/search-form";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "User Management" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const me = await requireRole(["admin"]);
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? "";

  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (q) query = query.ilike("full_name", `%${q}%`);

  const { data: profiles } = await query;

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Every account on the platform, grouped by supply chain role"
        action={<SearchForm placeholder="Search by name…" defaultValue={q} />}
      />

      {(profiles ?? []).length > 0 ? (
        <Card className="p-0">
          <div className="px-6 pt-6">
            <CardHeader
              title="All users"
              subtitle={`${profiles!.length} registered`}
            />
          </div>
          <Table headers={["Name", "Role", "Phone", "Location", "Joined", "Change role"]}>
            {profiles!.map((p) => (
              <tr key={p.id}>
                <Td className="font-medium">
                  {p.full_name}
                  {p.id === me.id && (
                    <span className="ml-2 text-xs text-gray-400">(you)</span>
                  )}
                </Td>
                <Td>
                  <Badge status={p.role} />
                </Td>
                <Td>{p.phone ?? "—"}</Td>
                <Td>{p.location ?? "—"}</Td>
                <Td>{formatDate(p.created_at)}</Td>
                <Td>
                  {p.id !== me.id ? (
                    <form action={updateUserRole} className="flex items-center gap-1">
                      <input type="hidden" name="user_id" value={p.id} />
                      <select
                        name="role"
                        defaultValue={p.role}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                      >
                        {USER_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700"
                      >
                        Set
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={Users}
          title="No users"
          message="Registered users will appear here."
        />
      )}
    </div>
  );
}
