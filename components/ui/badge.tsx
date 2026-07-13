import { cn } from "@/lib/utils";

const STATUS_TONES: Record<string, string> = {
  // generic
  info: "bg-blue-50 text-blue-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  alert: "bg-red-50 text-red-700",
  // crops
  planted: "bg-blue-50 text-blue-700",
  growing: "bg-emerald-50 text-emerald-700",
  ready: "bg-amber-50 text-amber-700",
  harvested: "bg-gray-100 text-gray-600",
  // harvests / inventory
  available: "bg-green-50 text-green-700",
  reserved: "bg-amber-50 text-amber-700",
  sold: "bg-gray-100 text-gray-600",
  stored: "bg-blue-50 text-blue-700",
  in_storage: "bg-blue-50 text-blue-700",
  dispatched: "bg-gray-100 text-gray-600",
  spoiled: "bg-red-50 text-red-700",
  fresh: "bg-green-50 text-green-700",
  expiring: "bg-amber-50 text-amber-700",
  // orders / deliveries
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  scheduled: "bg-indigo-50 text-indigo-700",
  assigned: "bg-indigo-50 text-indigo-700",
  picked_up: "bg-blue-50 text-blue-700",
  in_transit: "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
  // roles
  farmer: "bg-emerald-50 text-emerald-700",
  buyer: "bg-blue-50 text-blue-700",
  transporter: "bg-purple-50 text-purple-700",
  warehouse_manager: "bg-amber-50 text-amber-700",
  admin: "bg-gray-900 text-white",
};

export function Badge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_TONES[status] ?? "bg-gray-100 text-gray-600",
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
