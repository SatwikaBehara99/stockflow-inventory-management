"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SettingsIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LogOutIcon,
  BuildingIcon,
  UserIcon,
} from "@/components/icons";

interface SettingsData {
  organization: {
    id: string;
    name: string;
    slug: string | null;
    createdAt: string;
  };
  settings: {
    id: string;
    currency: string;
    lowStockThreshold: number;
    timeZone: string;
    lowStockAlert: boolean;
  } | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form state
  const [threshold, setThreshold] = useState("10");
  const [currency, setCurrency] = useState("USD");
  const [timeZone, setTimeZone] = useState("UTC");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.settings) {
            setThreshold(String(json.settings.lowStockThreshold ?? 10));
            setCurrency(json.settings.currency || "USD");
            setTimeZone(json.settings.timeZone || "UTC");
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lowStockThreshold: parseInt(threshold, 10) || 10,
          currency,
          timeZone,
        }),
      });

      const resJson = await res.json();

      if (res.ok) {
        setStatusMsg({
          type: "success",
          text: "Inventory settings updated successfully.",
        });
      } else {
        setStatusMsg({
          type: "error",
          text: resJson.error || "Failed to update settings.",
        });
      }
    } catch {
      setStatusMsg({
        type: "error",
        text: "Network error occurred while saving.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-zinc-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div className="pb-6 border-b border-zinc-200/80">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Organization & System Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your organization profile, inventory threshold defaults, and account details.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircleIcon className="h-5 w-5 shrink-0 text-rose-600" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 1. Organization Information Card */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BuildingIcon className="h-5 w-5 text-zinc-500" />
            <h2 className="text-sm font-bold text-zinc-900">
              Organization Profile
            </h2>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded ring-1 ring-emerald-600/20">
            Active Tenant
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Organization Name
            </span>
            <p className="mt-1.5 text-base font-bold text-zinc-900">
              {data?.organization.name}
            </p>
          </div>

          <div>
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Organization Slug / Key
            </span>
            <p className="mt-1.5 font-mono text-xs text-zinc-700 bg-zinc-100 inline-block px-2 py-1 rounded">
              {data?.organization.slug || "default"}
            </p>
          </div>

          <div>
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Unique Tenant Identifier (ID)
            </span>
            <p className="mt-1.5 font-mono text-xs text-zinc-600 truncate bg-zinc-50 p-2 rounded border border-zinc-200">
              {data?.organization.id}
            </p>
          </div>

          <div>
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Registered Since
            </span>
            <p className="mt-1.5 text-xs text-zinc-700">
              {data?.organization.createdAt
                ? new Date(data.organization.createdAt).toLocaleDateString(
                    "en-US",
                    { dateStyle: "long" }
                  )
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Inventory Preferences Form */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2.5">
          <SettingsIcon className="h-5 w-5 text-zinc-500" />
          <h2 className="text-sm font-bold text-zinc-900">
            Inventory Preferences
          </h2>
        </div>

        <form onSubmit={handleSaveSettings} className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="settings-threshold" className="block text-xs font-semibold text-zinc-700">
                Default Low-Stock Threshold
              </label>
              <input
                id="settings-threshold"
                type="number"
                min="0"
                required
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Default alert trigger when adding new catalog products
              </p>
            </div>

            <div>
              <label htmlFor="settings-currency" className="block text-xs font-semibold text-zinc-700">
                Operating Currency
              </label>
              <select
                id="settings-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
              <p className="mt-1 text-[11px] text-zinc-400">
                Currency symbol used across inventory & valuation
              </p>
            </div>

            <div>
              <label htmlFor="settings-timezone" className="block text-xs font-semibold text-zinc-700">
                Time Zone
              </label>
              <select
                id="settings-timezone"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="UTC">UTC (Universal Time)</option>
                <option value="EST">EST (US Eastern)</option>
                <option value="CST">CST (US Central)</option>
                <option value="PST">PST (US Pacific)</option>
                <option value="GMT">GMT (London)</option>
                <option value="IST">IST (India Standard Time)</option>
              </select>
              <p className="mt-1 text-[11px] text-zinc-400">
                Used for timestamp formatting
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Account Details Card */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserIcon className="h-5 w-5 text-zinc-500" />
            <h2 className="text-sm font-bold text-zinc-900">
              Authenticated Account
            </h2>
          </div>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            {data?.user.role}
          </span>
        </div>

        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-base font-bold text-zinc-900">
              {data?.user.name || "Administrator"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">{data?.user.email}</p>
            <p className="text-xs text-zinc-400 mt-2">
              Organization:{" "}
              <strong className="text-zinc-700 font-semibold">
                {data?.organization.name}
              </strong>
            </p>
          </div>

          <div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition"
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Sign out of account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
