import { Search } from "lucide-react";

/** GET-based search box — works server-side with searchParams, no JS needed. */
export function SearchForm({
  placeholder = "Search…",
  defaultValue = "",
}: {
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <form method="get" className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:w-64"
      />
    </form>
  );
}
