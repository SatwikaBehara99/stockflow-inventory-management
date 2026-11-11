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
  PlusIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
} from "@/components/icons";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Multi-tenant database queries strictly scoped to session.organizationId
  const [
    organization,
    totalProducts,
    quantityAgg,
    allProducts,
    recentProducts,
    settings,
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.organizationId },
    }),
    prisma.product.count({
      where: { organizationId: session.organizationId },
    }),
    prisma.product.aggregate({
      where: { organizationId: session.organizationId },
      _sum: { quantityOnHand: true },
    }),
    prisma.product.findMany({
      where: { organizationId: session.organizationId },
      select: {
        id: true,
        name: true,
        sku: true,
        quantityOnHand: true,
        lowStockThreshold: true,
        costPrice: true,
        sellingPrice: true,
      },
    }),
    prisma.product.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.settings.findUnique({
      where: { organizationId: session.organizationId },
    }),
  ]);

  const totalQuantityOnHand = quantityAgg._sum.quantityOnHand ?? 0;
  const outOfStockProducts = allProducts.filter((p) => p.quantityOnHand === 0);
  const lowStockProducts = allProducts.filter(
    (p) =>
      p.quantityOnHand > 0 && p.quantityOnHand <= (p.lowStockThreshold ?? 10)
  );
  const inStockProducts = allProducts.filter(
    (p) => p.quantityOnHand > (p.lowStockThreshold ?? 10)
  );

  const outOfStockCount = outOfStockProducts.length;
  const lowStockCount = lowStockProducts.length;
  const inStockCount = inStockProducts.length;

  const inStockPct =
    totalProducts > 0 ? Math.round((inStockCount / totalProducts) * 100) : 0;
  const lowStockPct =
    totalProducts > 0 ? Math.round((lowStockCount / totalProducts) * 100) : 0;
  const outOfStockPct =
    totalProducts > 0
      ? Math.max(0, 100 - inStockPct - lowStockPct)
      : 0;

  // Calculate estimated values safely
  const currencySymbol = settings?.currency === "EUR" ? "€" : "$";
  const estimatedRetailValue = allProducts.reduce((sum, p) => {
    return (
      sum +
      p.quantityOnHand * (p.sellingPrice !== null ? Number(p.sellingPrice) : 0)
    );
  }, 0);

  // Formatted date string
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const userGreeting = session.name ? session.name.split(" ")[0] : "there";

  return (
    <div className="space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Good day, {userGreeting}!
            </h1>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              Live Tenant
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Managing inventory for{" "}
            <span className="font-semibold text-zinc-800">
              {organization?.name ?? session.organizationName}
            </span>{" "}
            • Here&apos;s what&apos;s happening with your inventory today.
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">{todayFormatted}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={totalProducts}
          subtext="Active SKUs in organization catalog"
          icon={<PackageIcon className="h-5 w-5 text-indigo-600" />}
        />

        <StatCard
          title="Total Stock Quantity"
          value={totalQuantityOnHand.toLocaleString()}
          subtext="Total units available on hand"
          icon={<LayersIcon className="h-5 w-5 text-zinc-700" />}
        />

        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          subtext="Items at or below alert threshold"
          highlight={lowStockCount > 0 ? "warning" : "none"}
          badge={
            lowStockCount > 0
              ? { text: "Action Needed", variant: "warning" }
              : { text: "Healthy", variant: "success" }
          }
          icon={<AlertTriangleIcon className="h-5 w-5 text-amber-600" />}
        />

        <StatCard
          title="Out of Stock"
          value={outOfStockCount}
          subtext="Products with zero quantity"
          highlight={outOfStockCount > 0 ? "danger" : "none"}
          badge={
            outOfStockCount > 0
              ? { text: "Depleted", variant: "danger" }
              : { text: "Zero", variant: "default" }
          }
          icon={<AlertCircleIcon className="h-5 w-5 text-rose-600" />}
        />
      </div>

      {/* Inventory Stock Health & Distribution Visualizer */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Inventory Stock Distribution
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live breakdown of catalog health based on per-product threshold settings
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              In Stock: {inStockCount} ({inStockPct}%)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-amber-700">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Low Stock: {lowStockCount} ({lowStockPct}%)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-rose-700">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              Out of Stock: {outOfStockCount} ({outOfStockPct}%)
            </span>
          </div>
        </div>

        {totalProducts === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-400">
            No products in catalog. Add your first product to see stock distribution.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {/* Multi-segment distribution bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 flex">
              <div
                style={{ width: `${inStockPct}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title={`In Stock: ${inStockCount} (${inStockPct}%)`}
              />
              <div
                style={{ width: `${lowStockPct}%` }}
                className="bg-amber-500 transition-all duration-300"
                title={`Low Stock: ${lowStockCount} (${lowStockPct}%)`}
              />
              <div
                style={{ width: `${outOfStockPct}%` }}
                className="bg-rose-500 transition-all duration-300"
                title={`Out of Stock: ${outOfStockCount} (${outOfStockPct}%)`}
              />
            </div>

            {/* Quick Valuation Note */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-500 pt-2">
              <span>
                Estimated Retail Inventory Value:{" "}
                <strong className="text-zinc-800 font-semibold font-mono">
                  {currencySymbol}
                  {estimatedRetailValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </span>
              <Link
                href="/dashboard/analytics"
                className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1 mt-1 sm:mt-0"
              >
                View Detailed Analytics &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Grid: Recently Added Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Recently Added Products */}
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Recently Added Products
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Latest items added to your organization catalog
              </p>
            </div>
            <Link
              href="/dashboard/products"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState
                title="No products yet"
                description="Your product inventory is currently empty."
                action={{
                  label: "+ Add Product",
                  href: "/dashboard/products",
                }}
              />
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {recentProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-50/60 transition"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {p.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                        {p.sku}
                      </span>
                      {p.sellingPrice !== null && (
                        <span className="text-xs text-zinc-500">
                          {currencySymbol}
                          {Number(p.sellingPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-zinc-900">
                      {p.quantityOnHand} units
                    </span>
                    <StockStatusBadge
                      quantity={p.quantityOnHand}
                      threshold={p.lowStockThreshold}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Low Stock Restock Alerts */}
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <span>Low Stock Attention Needed</span>
                {lowStockCount + outOfStockCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {lowStockCount + outOfStockCount}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Items currently at or below their restock trigger threshold
              </p>
            </div>
            <Link
              href="/dashboard/products"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-semibold text-zinc-900">
                All inventory healthy
              </h4>
              <p className="mt-1 text-xs text-zinc-500 max-w-xs mx-auto">
                No items are currently below their restock thresholds. Great inventory health!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {[...outOfStockProducts, ...lowStockProducts].slice(0, 5).map((p) => {
                const threshold = p.lowStockThreshold ?? 10;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-50/60 transition"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {p.name}
                      </p>
                      <p className="font-mono text-[11px] text-zinc-500 mt-0.5">
                        SKU: {p.sku} • Alert Threshold: {threshold}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs font-bold ${
                          p.quantityOnHand === 0
                            ? "text-rose-600"
                            : "text-amber-600"
                        }`}
                      >
                        {p.quantityOnHand} left
                      </span>
                      <StockStatusBadge
                        quantity={p.quantityOnHand}
                        threshold={threshold}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
