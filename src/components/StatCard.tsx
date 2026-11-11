import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    variant?: "default" | "success" | "warning" | "danger" | "info";
  };
  highlight?: "none" | "warning" | "danger" | "success";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtext,
  icon,
  badge,
  highlight = "none",
  className = "",
}: StatCardProps) {
  const highlightStyles = {
    none: "border-zinc-200/80 bg-white hover:border-zinc-300",
    warning: "border-amber-200 bg-amber-50/20 hover:border-amber-300",
    danger: "border-rose-200 bg-rose-50/20 hover:border-rose-300",
    success: "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300",
  };

  const badgeStyles = {
    default: "bg-zinc-100 text-zinc-700 border-zinc-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 shadow-xs transition-all duration-150 hover:shadow-sm ${highlightStyles[highlight]} ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </p>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200/60">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-3xl font-bold tracking-tight text-zinc-900">
          {value}
        </span>
        {badge && (
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
              badgeStyles[badge.variant || "default"]
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-zinc-500 truncate">{subtext}</p>
      )}
    </div>
  );
}

