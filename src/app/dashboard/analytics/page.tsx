import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/StatCard";
import { StockStatusBadge } from "@/components/StockStatusBadge";
import { EmptyState } from "@/components/EmptyState";
import {
  PackageIcon,
  LayersIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  DollarSignIcon,
  TrendingUpIcon,
  ArrowUpRightIcon,
} from "@/components/icons";

export default async function AnalyticsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Multi-tenant database queries strictly scoped to session.organizationId
  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { quantityOnHand: "desc" },
    }),
    prisma.settings.findUnique({
      where: { organizationId: session.organizationId },
    }),
  ]);

  const currencySymbol = settings?.currency === "EUR" ? "€" : "$";
  const totalProducts = products.length;

  let totalQuantity = 0;
  let estimatedCostValue = 0;
  let estimatedRetailValue = 0;
  let outOfStockCount = 0;
  let lowStockCount = 0;
  let inStockCount = 0;

  for (const p of products) {
    totalQuantity += p.quantityOnHand;
    const threshold = p.lowStockThreshold ?? 10;

    if (p.quantityOnHand === 0) {
      outOfStockCount++;
    } else if (p.quantityOnHand <= threshold) {
      lowStockCount++;
    } else {
      inStockCount++;
    }

    if (p.costPrice !== null) {
      estimatedCostValue += p.quantityOnHand * Number(p.costPrice);
    }
    if (p.sellingPrice !== null) {
      estimatedRetailValue += p.quantityOnHand * Number(p.sellingPrice);
    }
  }

  const inStockPct =
    totalProducts > 0 ? Math.round((inStockCount / totalProducts) * 100) : 0;
  const lowStockPct =
    totalProducts > 0 ? Math.round((lowStockCount / totalProducts) * 100) : 0;
  const outOfStockPct =
    totalProducts > 0
      ? Math.max(0, 100 - inStockPct - lowStockPct)
      : 0;

  const estimatedPotentialMargin = Math.max(
    0,
    estimatedRetailValue - estimatedCostValue
  );
  const marginPercentage =
    estimatedRetailValue > 0
      ? Math.round((estimatedPotentialMargin / estimatedRetailValue) * 100)
      : 0;

  // Top 5 products by quantity
  const topProducts = products.slice(0, 5);
  const maxTopQty = topProducts[0]?.quantityOnHand || 1;

  // Low stock products needing restocking
  const lowStockReport = products.filter(
    (p) => p.quantityOnHand <= (p.lowStockThreshold ?? 10)
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Inventory Analytics & Valuation
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Real-time catalog stock distribution, health metrics, and estimated inventory valuation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            Tenant: {session.organizationName}
          </span>
        </div>
      </div>

      {totalProducts === 0 ? (
        <EmptyState
          title="No inventory data yet"
          description="Analytics will automatically compute and populate once products are added to your catalog."
          action={{
            label: "+ Add First Product",
            href: "/dashboard/products",
          }}
        />
      ) : (
        <>
          {/* 1. Inventory Summary KPI Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Catalog SKUs"
              value={totalProducts}
              subtext="Distinct products registered"
              icon={<PackageIcon className="h-5 w-5 text-indigo-600" />}
            />

            <StatCard
              title="Total Stock Units"
              value={totalQuantity.toLocaleString()}
              subtext="Aggregated physical units on hand"
              icon={<LayersIcon className="h-5 w-5 text-zinc-700" />}
            />

            <StatCard
              title="Low Stock Items"
              value={lowStockCount}
              subtext="Products below trigger threshold"
              highlight={lowStockCount > 0 ? "warning" : "none"}
              badge={
                lowStockCount > 0
                  ? { text: `${lowStockPct}% of catalog`, variant: "warning" }
                  : { text: "Optimal", variant: "success" }
              }
              icon={<AlertTriangleIcon className="h-5 w-5 text-amber-600" />}
            />

            <StatCard
              title="Out of Stock Items"
              value={outOfStockCount}
              subtext="Zero units available on hand"
              highlight={outOfStockCount > 0 ? "danger" : "none"}
              badge={
                outOfStockCount > 0
                  ? { text: "Needs Reorder", variant: "danger" }
                  : { text: "None", variant: "default" }
              }
              icon={<AlertCircleIcon className="h-5 w-5 text-rose-600" />}
            />
          </div>

          {/* 2. Inventory Valuation Section */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-100 gap-2">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <span>Estimated Inventory Valuation</span>
                  <span className="text-[11px] font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                    Calculated: units × unit price
                  </span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Based on current physical stock and configured cost & selling prices (not realized sales or revenue)
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Cost Value */}
              <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Est. Cost Value
                  </span>
                  <DollarSignIcon className="h-4 w-4 text-zinc-400" />
                </div>
                <p className="mt-2 text-2xl font-bold font-mono text-zinc-900">
                  {currencySymbol}
                  {estimatedCostValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Total capital tied in current inventory
                </p>
              </div>

              {/* Potential Retail Value */}
              <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                    Est. Retail Value
                  </span>
                  <DollarSignIcon className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="mt-2 text-2xl font-bold font-mono text-indigo-900">
                  {currencySymbol}
                  {estimatedRetailValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="mt-1 text-xs text-indigo-600">
                  Potential valuation at selling price
                </p>
              </div>

              {/* Potential Gross Margin */}
              <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Est. Potential Margin
                  </span>
                  <TrendingUpIcon className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-bold font-mono text-emerald-900">
                    {currencySymbol}
                    {estimatedPotentialMargin.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <span className="text-xs font-bold text-emerald-700">
                    ({marginPercentage}%)
                  </span>
                </div>
                <p className="mt-1 text-xs text-emerald-600">
                  Gross profit spread if fully sold
                </p>
              </div>
            </div>
          </div>

          {/* 3. Stock Health & Catalog Visual Distribution */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Stock Health Card */}
            <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-zinc-900">
                Catalog Stock Health
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Distribution of products across health tiers
              </p>

              {/* Visual Multi-Bar */}
              <div className="mt-5 space-y-4">
                <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 flex">
                  <div
                    style={{ width: `${inStockPct}%` }}
                    className="bg-emerald-500"
                    title={`In Stock: ${inStockCount}`}
                  />
                  <div
                    style={{ width: `${lowStockPct}%` }}
                    className="bg-amber-500"
                    title={`Low Stock: ${lowStockCount}`}
                  />
                  <div
                    style={{ width: `${outOfStockPct}%` }}
                    className="bg-rose-500"
                    title={`Out of Stock: ${outOfStockCount}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700">
                      In Stock
                    </p>
                    <p className="mt-1 text-lg font-bold text-emerald-900">
                      {inStockCount}
                    </p>
                    <p className="text-[11px] text-emerald-600">{inStockPct}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700">
                      Low Stock
                    </p>
                    <p className="mt-1 text-lg font-bold text-amber-900">
                      {lowStockCount}
                    </p>
                    <p className="text-[11px] text-amber-600">{lowStockPct}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-100">
                    <p className="text-xs font-semibold text-rose-700">
                      Out of Stock
                    </p>
                    <p className="mt-1 text-lg font-bold text-rose-900">
                      {outOfStockCount}
                    </p>
                    <p className="text-[11px] text-rose-600">
                      {outOfStockPct}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products by Quantity Card */}
            <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-zinc-900">
                Top Products by Volume
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Highest quantity on hand across active catalog
              </p>

              <div className="mt-5 space-y-3">
                {topProducts.map((p) => {
                  const barWidth = Math.max(
                    6,
                    Math.round((p.quantityOnHand / maxTopQty) * 100)
                  );
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-zinc-800 truncate font-semibold">
                          {p.name}
                        </span>
                        <span className="font-mono text-zinc-600">
                          {p.quantityOnHand} units
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div
                          style={{ width: `${barWidth}%` }}
                          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Low Stock Restock Report */}
          <div className="rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Low Stock & Depleted Items Report
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Actionable list of products needing supplier replenishment
                </p>
              </div>
              <Link
                href="/dashboard/products"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                <span>Edit Quantities</span>
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>

            {lowStockReport.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                No items currently require restocking. All catalog products are above alert thresholds.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 text-left">
                  <thead className="bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">SKU</th>
                      <th className="px-6 py-3">Current Stock</th>
                      <th className="px-6 py-3">Threshold</th>
                      <th className="px-6 py-3">Units Needed</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {lowStockReport.map((p) => {
                      const threshold = p.lowStockThreshold ?? 10;
                      const unitsNeeded = Math.max(0, threshold - p.quantityOnHand + 5);

                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/60">
                          <td className="px-6 py-3 font-semibold text-zinc-900">
                            {p.name}
                          </td>
                          <td className="px-6 py-3 font-mono text-zinc-600">
                            {p.sku}
                          </td>
                          <td className="px-6 py-3 font-bold text-zinc-900">
                            {p.quantityOnHand}
                          </td>
                          <td className="px-6 py-3 text-zinc-500 font-mono">
                            {threshold}
                          </td>
                          <td className="px-6 py-3 font-semibold text-indigo-600">
                            +{unitsNeeded} units
                          </td>
                          <td className="px-6 py-3">
                            <StockStatusBadge
                              quantity={p.quantityOnHand}
                              threshold={threshold}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

