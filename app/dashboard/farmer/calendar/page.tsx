import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = { title: "Harvest Calendar" };

interface CalEvent {
  day: number;
  label: string;
  kind: "planting" | "expected" | "harvest";
}

const KIND_STYLES: Record<CalEvent["kind"], string> = {
  planting: "bg-blue-50 text-blue-700",
  expected: "bg-amber-50 text-amber-700",
  harvest: "bg-green-50 text-green-700",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { m?: string };
}) {
  const profile = await requireRole(["farmer"]);
  const supabase = createClient();

  const now = new Date();
  const [year, month] = (
    searchParams.m ?? `${now.getFullYear()}-${now.getMonth() + 1}`
  )
    .split("-")
    .map(Number);

  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = first.getDay();

  const prev = new Date(year, month - 2, 1);
  const next = new Date(year, month, 1);
  const monthLabel = first.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const [{ data: crops }, { data: harvests }] = await Promise.all([
    supabase
      .from("crops")
      .select("name, planting_date, expected_harvest_date")
      .eq("farmer_id", profile.id),
    supabase
      .from("harvests")
      .select("product_name, harvest_date")
      .eq("farmer_id", profile.id),
  ]);

  const events = new Map<number, CalEvent[]>();
  const push = (dateStr: string, label: string, kind: CalEvent["kind"]) => {
    const d = new Date(dateStr);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1) return;
    const day = d.getDate();
    const list = events.get(day) ?? [];
    list.push({ day, label, kind });
    events.set(day, list);
  };

  for (const c of crops ?? []) {
    push(c.planting_date, `Plant ${c.name}`, "planting");
    push(c.expected_harvest_date, `Harvest ${c.name}`, "expected");
  }
  for (const h of harvests ?? []) {
    push(h.harvest_date, `Harvested ${h.product_name}`, "harvest");
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isToday = (day: number) =>
    day === now.getDate() &&
    month - 1 === now.getMonth() &&
    year === now.getFullYear();

  return (
    <div>
      <PageHeader
        title="Harvest Calendar"
        subtitle="Planting dates, expected harvests and recorded harvests"
      />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`?m=${prev.getFullYear()}-${prev.getMonth() + 1}`}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h2 className="font-semibold">{monthLabel}</h2>
          <Link
            href={`?m=${next.getFullYear()}-${next.getMonth() + 1}`}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 text-sm">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="bg-gray-50 px-2 py-2 text-center text-xs font-medium uppercase text-gray-500"
            >
              {d}
            </div>
          ))}
          {cells.map((day, i) => (
            <div key={i} className="min-h-24 bg-white p-1.5">
              {day && (
                <>
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday(day)
                        ? "bg-emerald-600 text-white"
                        : "text-gray-700"
                    )}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {(events.get(day) ?? []).map((e, j) => (
                      <div
                        key={j}
                        className={cn(
                          "truncate rounded px-1.5 py-0.5 text-[11px] font-medium",
                          KIND_STYLES[e.kind]
                        )}
                        title={e.label}
                      >
                        {e.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400" /> Planting
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Expected
            harvest
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Recorded
            harvest
          </span>
        </div>
      </Card>
    </div>
  );
}
