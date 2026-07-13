"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { RoutePoint } from "./route-map";

// Leaflet touches `window`, so the map only loads in the browser.
const RouteMap = dynamic(() => import("./route-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export function RouteMapLoader({ routes }: { routes: RoutePoint[] }) {
  return <RouteMap routes={routes} />;
}
