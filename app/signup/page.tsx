"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, UserPlus, Wand2, Check, X, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WELCOME_FLAG } from "@/contexts/auth-context";
import { SIGNUP_ROLES } from "@/lib/types";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { cn } from "@/lib/utils";

const REQUIREMENTS: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
];

function strengthOf(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "" };
  let score = REQUIREMENTS.filter((r) => r.test(password)).length;
  if (password.length >= 14) score = Math.min(4, score + 1);
  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (score === 3) return { score: 3, label: "Good", color: "bg-emerald-500" };
  return { score: 4, label: "Strong", color: "bg-emerald-600" };
}

function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*+-?";
  const all = upper + lower + digits + symbols;
  const rand = (set: string) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return set[buf[0] % set.length];
  };
  let pwd = rand(upper) + rand(lower) + rand(digits) + rand(symbols);
  for (let i = 0; i < 10; i++) pwd += rand(all);
  return pwd
    .split("")
    .sort(() => {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return (buf[0] % 3) - 1;
    })
    .join("");
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirm: "",
    role: "farmer",
    phone: "",
    location: "",
  });
  const [generated, setGenerated] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleGenerate() {
    const pwd = generatePassword();
    setForm((f) => ({ ...f, password: pwd, confirm: pwd }));
    setGenerated(true);
  }

  const strength = strengthOf(form.password);
  const mismatch = form.confirm.length > 0 && form.confirm !== form.password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (strength.score < 2) {
      setError("Please choose a stronger password (see the checklist).");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role: form.role,
          phone: form.phone,
          location: form.location,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setConfirmed(true);
      setLoading(false);
      return;
    }

    try {
      sessionStorage.setItem(WELCOME_FLAG, "1");
    } catch {}
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: "google" });
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle={confirmed ? "" : "Choose your role in the supply chain — it decides your dashboard"}
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      {confirmed ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-emerald-600" />
          <h2 className="mt-3 font-semibold text-gray-900">Check your inbox</h2>
          <p className="mt-1 text-sm text-gray-600">
            We sent a confirmation link to <strong>{form.email}</strong>.
            Click the link to activate your account, then sign in.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className={inputClass}
                placeholder="Ada Obi"
              />
            </div>
            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">
                I am a
              </label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className={inputClass}
              >
                {SIGNUP_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
              >
                <Wand2 className="h-3.5 w-3.5" /> Generate secure password
              </button>
            </div>
            <PasswordInput
              id="password"
              name="password"
              value={form.password}
              onChange={(v) => {
                update("password", v);
                setGenerated(false);
              }}
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              forceVisible={generated}
            />

            {form.password && (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-1.5 flex-1 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 rounded-full",
                          i <= strength.score ? strength.color : "bg-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <span className="w-12 text-right text-xs font-medium text-gray-500">
                    {strength.label}
                  </span>
                </div>
                <ul className="mt-2 grid grid-cols-2 gap-1">
                  {REQUIREMENTS.map((r) => {
                    const ok = r.test(form.password);
                    return (
                      <li
                        key={r.label}
                        className={cn(
                          "flex items-center gap-1.5 text-xs",
                          ok ? "text-emerald-600" : "text-gray-400"
                        )}
                      >
                        {ok ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        {r.label}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <PasswordInput
              id="confirm"
              name="confirm"
              value={form.confirm}
              onChange={(v) => update("confirm", v)}
              autoComplete="new-password"
              placeholder="Repeat your password"
              forceVisible={generated}
            />
            {mismatch && (
              <p className="mt-1 text-xs text-red-600">
                Passwords do not match yet.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputClass}
                placeholder="080 XXX XXXX"
              />
            </div>
            <div>
              <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                id="location"
                type="text"
                required
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className={inputClass}
                placeholder="City, State"
              />
            </div>
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
            disabled={loading || mismatch}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}

      {!confirmed && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-page px-2 text-gray-500">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-page"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </>
      )}
    </AuthShell>
  );
}
