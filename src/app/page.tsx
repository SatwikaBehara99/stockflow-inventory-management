import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between">
      {/* Navigation */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-lg font-black">
              S
            </span>
            <span className="text-xl font-bold tracking-tight text-zinc-900">
              StockFlow
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            Multi-Tenant SaaS Inventory System
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Streamlined Inventory & Stock Management
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Secure, scalable multi-tenant inventory control with automated organization onboarding, real-time stock monitoring, and scoped tenant isolation.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition"
            >
              Sign In to Organization
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} StockFlow SaaS. All rights reserved.
      </footer>
    </div>
  );
}
