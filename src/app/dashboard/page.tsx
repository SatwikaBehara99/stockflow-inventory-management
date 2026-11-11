import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Multi-tenant database queries strictly scoped to session.organizationId
  const [organization, totalProducts, quantityAgg, allProducts, settings] =
    await Promise.all([
      prisma.organization.findUnique({
        where: { id: session.organizationId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
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
          quantityOnHand: true,
          lowStockThreshold: true,
        },
      }),
      prisma.settings.findUnique({
        where: { organizationId: session.organizationId },
      }),
    ]);

  const totalQuantityOnHand = quantityAgg._sum.quantityOnHand ?? 0;
  const lowStockCount = allProducts.filter(
    (p) => p.quantityOnHand <= (p.lowStockThreshold ?? 10)
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-zinc-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Welcome back, {session.name || session.email}!
            </h1>
            <p className="text-sm text-zinc-600 mt-1">
              Managing inventory for{" "}
              <span className="font-semibold text-zinc-900">
                {organization?.name ?? session.organizationName}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              Authenticated • {session.role}
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-zinc-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Total Products
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {totalProducts}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Active items in organization catalog
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border border-zinc-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Total Quantity on Hand
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {totalQuantityOnHand}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Units available across inventory
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border border-zinc-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Low-Stock Count
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${
              lowStockCount > 0 ? "text-amber-600" : "text-zinc-900"
            }`}
          >
            {lowStockCount}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Items at or below alert threshold
          </p>
        </div>
      </div>

      {/* Quick Access to Products */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Product Management
          </h2>
          <p className="text-sm text-zinc-600 mt-0.5">
            View, search, add, edit, and delete products scoped to your organization.
          </p>
        </div>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
        >
          Manage Products &rarr;
        </Link>
      </div>

      {/* Tenant Details & Organization Members Card */}
      <div className="rounded-xl bg-white shadow-sm border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Organization Team Members
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Organization: <span className="font-semibold text-zinc-800">{organization?.name}</span> ({organization?.slug}) • Currency: {settings?.currency || "USD"}
              </p>
            </div>
            <span className="font-mono text-xs text-zinc-500">
              Tenant ID: {session.organizationId}
            </span>
          </div>
        </div>
        <div className="divide-y divide-zinc-200">
          {organization?.users.map((member) => (
            <div
              key={member.id}
              className="px-6 py-3.5 flex items-center justify-between text-sm"
            >
              <div>
                <p className="font-medium text-zinc-900">
                  {member.name || "Unnamed Member"}
                </p>
                <p className="text-xs text-zinc-500">{member.email}</p>
              </div>
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Server-Side Isolation Guarantee Card */}
      <div className="rounded-xl bg-indigo-50/50 p-6 border border-indigo-100">
        <h3 className="text-sm font-semibold text-indigo-900">
          Multi-Tenancy Security Enforced
        </h3>
        <p className="mt-1 text-xs text-indigo-700 leading-relaxed">
          Every query and mutation in StockFlow resolves the verified organization context strictly from the server-validated JWT cookie. No client-supplied tenant identifier is ever trusted.
        </p>
      </div>
    </div>
  );
}

