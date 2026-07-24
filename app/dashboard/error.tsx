"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

/**
 * Catches errors thrown while rendering a dashboard route or running one of
 * its server actions (e.g. a database write that failed). Without this the
 * user would see the mutation silently do nothing; here they get a clear
 * message and a way to retry.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="font-semibold text-gray-900">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {error.message ||
          "That action couldn't be completed. Please try again."}
      </p>
      <button
        onClick={reset}
        className="mt-5 flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        <RotateCw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}
