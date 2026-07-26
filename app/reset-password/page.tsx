"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setError(
        error.message.includes("session")
          ? "This reset link is invalid or has expired. Request a new one from the Forgot Password page."
          : error.message
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="You arrived here from a password reset email"
      footer={
        <>
          Link expired?{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-emerald-600 hover:underline"
          >
            Request a new one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-gray-700">
            New password
          </label>
          <PasswordInput
            id="new-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-gray-700">
            Confirm new password
          </label>
          <PasswordInput
            id="confirm-password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            placeholder="Repeat the password"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          {loading ? "Saving…" : "Save new password"}
        </button>
      </form>
    </AuthShell>
  );
}
