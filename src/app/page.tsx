import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  LogoIcon,
  PackageIcon,
  AnalyticsIcon,
  ShieldIcon,
} from "@/components/icons";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon className="h-8 w-8 text-indigo-600" />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-zinc-900 leading-none">
                StockFlow
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                SaaS Inventory
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-100/70 transition"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
          Production-Grade SaaS Inventory System
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl max-w-4xl leading-tight">
          Modern Multi-Tenant <br />
          <span className="text-indigo-600">Stock & Inventory</span> Management
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          Streamlined inventory cataloging, real-time quantity monitoring, multi-tenant database isolation, and automated low-stock replenishment alerts built for scaling teams.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition text-center"
          >
            Start Free Trial &rarr;
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-800 shadow-xs ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition text-center"
          >
            Sign In to Organization
          </Link>
        </div>

        {/* Feature Grid Highlights */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left w-full">
          <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <PackageIcon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-zinc-900">
              Catalog Management
            </h3>
            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
              Complete SKU tracking, composite uniqueness enforcement per tenant, real-time threshold alerts, and instant search.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <AnalyticsIcon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-zinc-900">
              Inventory Analytics
            </h3>
            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
              Live stock health distribution, cost vs retail valuation calculations, and actionable restock reporting.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ShieldIcon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-zinc-900">
              Strict Tenant Isolation
            </h3>
            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
              Cryptographically verified JWT sessions with server-side scoped queries in PostgreSQL. No cross-tenant data leakage.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-6 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} StockFlow SaaS. Production Inventory System. All rights reserved.
      </footer>
    </div>
  );
}
