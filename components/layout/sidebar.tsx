"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Leaf,
  LayoutDashboard,
  Sprout,
  Package,
  Calendar,
  ShoppingCart,
  ClipboardList,
  ArrowLeftRight,
  MapPin,
  Truck,
  Map,
  TrendingUp,
  Sparkles,
  Bell,
  BarChart3,
  Users,
  UserCircle,
  CalendarClock,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  farmer: [
    { href: "/dashboard/farmer", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/farmer/crops", label: "My Crops", icon: Sprout },
    { href: "/dashboard/farmer/harvests", label: "Harvests", icon: Package },
    { href: "/dashboard/farmer/calendar", label: "Calendar", icon: Calendar },
    { href: "/dashboard/farmer/orders", label: "Orders", icon: ClipboardList },
    { href: "/dashboard/forecasting", label: "Forecasting", icon: TrendingUp },
  ],
  buyer: [
    { href: "/dashboard/buyer", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/buyer/browse", label: "Browse Produce", icon: ShoppingCart },
    { href: "/dashboard/buyer/orders", label: "My Orders", icon: ClipboardList },
    { href: "/dashboard/forecasting", label: "Forecasting", icon: TrendingUp },
  ],
  warehouse_manager: [
    { href: "/dashboard/warehouse", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/warehouse/inventory", label: "Inventory", icon: Package },
    { href: "/dashboard/warehouse/movements", label: "Stock Movements", icon: ArrowLeftRight },
    { href: "/dashboard/warehouse/locations", label: "Warehouses", icon: MapPin },
  ],
  transporter: [
    { href: "/dashboard/transport", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/transport/deliveries", label: "Deliveries", icon: Truck },
    { href: "/dashboard/transport/routes", label: "Route Map", icon: Map },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/orders", label: "All Orders", icon: ClipboardList },
    { href: "/dashboard/admin/scheduling", label: "Scheduling", icon: CalendarClock },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    { href: "/dashboard/forecasting", label: "Forecasting", icon: TrendingUp },
  ],
};

const COMMON_NAV: NavItem[] = [
  { href: "/dashboard/assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile", label: "My Profile", icon: UserCircle },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = [...NAV_BY_ROLE[role], ...COMMON_NAV];

  const nav = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href.split("/").length > 3 && pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "text-emerald-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            {active && (
              <motion.span
                layoutId="activeNav"
                className="absolute inset-0 rounded-lg bg-emerald-50"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <item.icon className="relative z-10 h-4 w-4 shrink-0" />
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <BrandMark />
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="border-b border-gray-100 px-5 py-4">
          <BrandMark />
        </div>
        {nav}
      </aside>
    </>
  );
}

function BrandMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
        <Leaf className="h-4 w-4 text-white" />
      </div>
      <span className="font-bold">AgriFlow AI</span>
    </Link>
  );
}
