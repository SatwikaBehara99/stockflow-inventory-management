"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogoIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "@/components/icons";

export default function RegisterPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (organizationName.trim().length < 2) {
      setError("Organization name must be at least 2 characters long.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: organizationName.trim(),
          name: name.trim() || undefined,
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to register. Please check your details.");
        setLoading(false);
        return;
      }

      // Successful registration -> navigate to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  }

  const isPasswordValid = password.length >= 8;

  return (
    <div className="min-h-screen flex flex-col justify-center bg-zinc-50/70 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <LogoIcon className="h-10 w-10 text-indigo-600 shadow-xs" />
            <span className="text-2xl font-bold tracking-tight text-zinc-900 group-hover:text-indigo-600 transition">
              StockFlow
            </span>
          </Link>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            SaaS Inventory Platform
          </span>
          <h2 className="mt-5 text-center text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            Create your organization workspace
          </h2>
          <p className="mt-1 text-center text-xs text-zinc-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 underline"
            >
              Sign in to your organization
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-8 shadow-xs sm:p-10">
          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs font-medium text-rose-800 border border-rose-200">
              <AlertCircleIcon className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="organizationName"
                className="block text-xs font-semibold text-zinc-700"
              >
                Organization / Company Name *
              </label>
              <div className="mt-1.5">
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Acme Logistics Inc."
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-zinc-700"
              >
                Your Full Name
              </label>
              <div className="mt-1.5">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-700"
              >
                Work Email Address *
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="jane@acme.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-zinc-700"
              >
                Password *
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Requirement Hint */}
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                {isPasswordValid ? (
                  <CheckCircleIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-zinc-300 shrink-0" />
                )}
                <span
                  className={
                    isPasswordValid
                      ? "text-emerald-700 font-medium"
                      : "text-zinc-500"
                  }
                >
                  At least 8 characters
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-lg bg-indigo-600 py-2.5 px-4 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Creating organization..." : "Create Organization"}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Automated multi-tenant workspace isolation with scoped PostgreSQL encryption
        </p>
      </div>
    </div>
  );
}
