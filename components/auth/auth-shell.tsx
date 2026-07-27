import Link from "next/link";
import { Leaf, Sprout, Truck, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const HERO_POINTS = [
  {
    icon: Sprout,
    text: "Farmers list harvests and track crops from planting to market",
  },
  {
    icon: TrendingUp,
    text: "Demand forecasting shows what buyers will need next week",
  },
  {
    icon: Truck,
    text: "Smart scheduling moves perishable produce first",
  },
];

/** Shared split layout for all public auth pages — hero left, form right. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Hero panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">AgriFlow AI</span>
        </Link>

        <div className="relative">
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
            From field to market, without the waste.
          </h2>
          <ul className="mt-8 space-y-4">
            {HERO_POINTS.map((p) => (
              <li key={p.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <p.icon className="h-4 w-4 text-white" />
                </span>
                <span className="text-sm leading-relaxed text-emerald-50">
                  {p.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-emerald-100/70">
          Agricultural Supply Chain & Produce Scheduling System
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col bg-page lg:w-1/2">
        <div className="flex items-center justify-between px-6 py-4 lg:justify-end">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">AgriFlow AI</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-6">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && (
              <div className="mt-6 text-center text-sm text-gray-600">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
