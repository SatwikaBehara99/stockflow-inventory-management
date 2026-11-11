import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Left brand & organization */}
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-base font-black">
                  S
                </span>
                <span className="text-xl font-bold tracking-tight text-zinc-900">
                  StockFlow
                </span>
              </Link>

              <span className="h-5 w-px bg-zinc-200 hidden sm:block" aria-hidden="true" />

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Tenant
                </span>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                  {session.organizationName}
                </span>
              </div>

              {/* Main Nav Links */}
              <nav className="flex items-center gap-1 sm:ml-4">
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 hover:text-indigo-600 hover:bg-zinc-100 transition"
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/products"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 hover:text-indigo-600 hover:bg-zinc-100 transition"
                >
                  Products & Inventory
                </Link>
              </nav>
            </div>

            {/* Right user profile & logout */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-zinc-900 leading-none">
                  {session.name || session.email}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {session.role} • {session.email}
                </p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
