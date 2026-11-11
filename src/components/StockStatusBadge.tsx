import React from "react";

interface StockStatusBadgeProps {
  quantity: number;
  threshold?: number | null;
  className?: string;
}

export function StockStatusBadge({
  quantity,
  threshold = 10,
  className = "",
}: StockStatusBadgeProps) {
  const safeThreshold = threshold ?? 10;
  const isOutOfStock = quantity === 0;
  const isLowStock = !isOutOfStock && quantity <= safeThreshold;

  if (isOutOfStock) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
        Out of Stock
      </span>
    );
  }

  if (isLowStock) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Low Stock (≤{safeThreshold})
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      In Stock
    </span>
  );
}

