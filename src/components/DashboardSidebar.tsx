"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogoIcon,
  OverviewIcon,
  PackageIcon,
  AnalyticsIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  CloseIcon,
} from "./icons";

interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
}

interface DashboardSidebarProps {
  user: SessionUser;
  children: React.ReactNode;
}

interface SidebarContentProps {
  user: SessionUser;
  pathname: string;
  userInitials: string;
  onNavigate?: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}

function SidebarContent({
  user,
  pathname,
  userInitials,
  onNavigate,
  onLogout,
  loggingOut,
}: SidebarContentProps) {
  const navigation = [
    {
      group: "MAIN MENU",
      items: [
        {
          name: "Overview",
          href: "/dashboard",
          icon: OverviewIcon,
          current: pathname === "/dashboard",
        },
        {
          name: "Products / Inventory",
          href: "/dashboard/products",
          icon: PackageIcon,
          current: pathname.startsWith("/dashboard/products"),
        },
        {
          name: "Analytics",
          href: "/dashboard/analytics",
          icon: AnalyticsIcon,
          current: pathname.startsWith("/dashboard/analytics"),
        },
      ],
    },
    {
      group: "MANAGEMENT",
      items: [
        {
          name: "Settings",
          href: "/dashboard/settings",
          icon: SettingsIcon,
          current: pathname.startsWith("/dashboard/settings"),
        },
      ],
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between bg-white border-r border-zinc-200/90">
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {/* Brand Header */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-2 py-1 group transition"
          onClick={onNavigate}
        >
          <LogoIcon className="h-8 w-8 text-indigo-600 shadow-xs" />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-zinc-900 group-hover:text-indigo-600 transition">
              StockFlow
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Inventory Management
            </span>
          </div>
        </Link>

        {/* Current Organization Pill */}
        <div className="mt-5 mx-1 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/70">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Current Tenant
          </p>
          <p className="mt-0.5 text-xs font-bold text-zinc-800 truncate">
            {user.organizationName}
          </p>
        </div>

        {/* Navigation Sections */}
        <nav className="mt-6 space-y-6">
          {navigation.map((section) => (
            <div key={section.group}>
              <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                {section.group}
              </h3>
              <div className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onNavigate}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                        item.current
                          ? "bg-indigo-50/90 text-indigo-700 font-semibold ring-1 ring-indigo-200/70 shadow-xs"
                          : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          item.current
                            ? "text-indigo-600"
                            : "text-zinc-400 group-hover:text-zinc-600"
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer: User Profile & Logout */}
      <div className="border-t border-zinc-200 p-3.5 bg-zinc-50/60">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white border border-zinc-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-xs">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-900 truncate">
                {user.name || user.email}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            disabled={loggingOut}
            title="Sign out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar({ user, children }: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const userInitials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || user.email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50/60 flex flex-col md:flex-row">
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 shadow-xs">
        <SidebarContent
          user={user}
          pathname={pathname}
          userInitials={userInitials}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />
      </aside>

      {/* Mobile Top Navigation Bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden shadow-xs">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoIcon className="h-7 w-7 text-indigo-600" />
          <span className="text-base font-bold tracking-tight text-zinc-900">
            StockFlow
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Drawer (Slide-out) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer Pane */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute right-0 top-0 -mr-12 pt-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>
            <SidebarContent
              user={user}
              pathname={pathname}
              userInitials={userInitials}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
              loggingOut={loggingOut}
            />
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 px-4 py-8 sm:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
