"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { StockStatusBadge } from "@/components/StockStatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import {
  PackageIcon,
  LayersIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CloseIcon,
  FilterIcon,
  RefreshIcon,
} from "@/components/icons";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  quantityOnHand: number;
  costPrice: string | number | null;
  sellingPrice: string | number | null;
  lowStockThreshold: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductResponse {
  products: Product[];
  totalProducts: number;
  totalQuantityOnHand: number;
  lowStockCount: number;
}

type StatusFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

export default function ProductsPage() {
  const [, startTransition] = useTransition();
  const [data, setData] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formQuantityOnHand, setFormQuantityOnHand] = useState("0");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formSellingPrice, setFormSellingPrice] = useState("");
  const [formThreshold, setFormThreshold] = useState("10");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || "Failed to load products.");
      }
    } catch {
      setError("Network error while connecting to inventory service.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        fetchProducts();
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  function resetForm() {
    setFormName("");
    setFormSku("");
    setFormDescription("");
    setFormQuantityOnHand("0");
    setFormCostPrice("");
    setFormSellingPrice("");
    setFormThreshold("10");
    setFormError(null);
  }

  function openAddModal() {
    resetForm();
    setShowAddModal(true);
  }

  function openEditModal(p: Product) {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormDescription(p.description || "");
    setFormQuantityOnHand(String(p.quantityOnHand));
    setFormCostPrice(p.costPrice !== null ? String(p.costPrice) : "");
    setFormSellingPrice(p.sellingPrice !== null ? String(p.sellingPrice) : "");
    setFormThreshold(
      p.lowStockThreshold !== null ? String(p.lowStockThreshold) : "10"
    );
    setFormError(null);
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          sku: formSku.trim(),
          description: formDescription.trim() || undefined,
          quantityOnHand: parseInt(formQuantityOnHand, 10) || 0,
          costPrice: formCostPrice !== "" ? parseFloat(formCostPrice) : undefined,
          sellingPrice:
            formSellingPrice !== "" ? parseFloat(formSellingPrice) : undefined,
          lowStockThreshold:
            formThreshold !== "" ? parseInt(formThreshold, 10) : 10,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setFormError(resData.error || "Failed to create product.");
        setSubmitting(false);
        return;
      }

      setShowAddModal(false);
      resetForm();
      fetchProducts();
    } catch {
      setFormError("Network error while creating product.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          sku: formSku.trim(),
          description: formDescription.trim() || undefined,
          quantityOnHand: parseInt(formQuantityOnHand, 10) || 0,
          costPrice: formCostPrice !== "" ? parseFloat(formCostPrice) : null,
          sellingPrice:
            formSellingPrice !== "" ? parseFloat(formSellingPrice) : null,
          lowStockThreshold:
            formThreshold !== "" ? parseInt(formThreshold, 10) : 10,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setFormError(resData.error || "Failed to update product.");
        setSubmitting(false);
        return;
      }

      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch {
      setFormError("Network error while updating product.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProduct() {
    if (!deletingProduct) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeletingProduct(null);
        fetchProducts();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  // Filter products by status tab
  const filteredProducts = (data?.products || []).filter((p) => {
    const threshold = p.lowStockThreshold ?? 10;
    if (statusFilter === "in_stock") return p.quantityOnHand > threshold;
    if (statusFilter === "low_stock")
      return p.quantityOnHand > 0 && p.quantityOnHand <= threshold;
    if (statusFilter === "out_of_stock") return p.quantityOnHand === 0;
    return true;
  });

  // Derived counts for tabs
  const allCount = data?.products.length ?? 0;
  const inStockCount =
    data?.products.filter((p) => p.quantityOnHand > (p.lowStockThreshold ?? 10))
      .length ?? 0;
  const lowStockCount =
    data?.products.filter(
      (p) =>
        p.quantityOnHand > 0 && p.quantityOnHand <= (p.lowStockThreshold ?? 10)
    ).length ?? 0;
  const outOfStockCount =
    data?.products.filter((p) => p.quantityOnHand === 0).length ?? 0;

  function clearAllFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Products & Inventory
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your organization&apos;s product catalog, pricing, and live inventory levels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Mini-Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Total Products
            </span>
            <PackageIcon className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {data?.totalProducts ?? 0}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Total Units
            </span>
            <LayersIcon className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {(data?.totalQuantityOnHand ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Low Stock
            </span>
            <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${
              lowStockCount > 0 ? "text-amber-600" : "text-zinc-900"
            }`}
          >
            {lowStockCount}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Out of Stock
            </span>
            <AlertCircleIcon className="h-4 w-4 text-rose-500" />
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${
              outOfStockCount > 0 ? "text-rose-600" : "text-zinc-900"
            }`}
          >
            {outOfStockCount}
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            id="product-search"
            type="text"
            aria-label="Search by product name or SKU"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 pl-9 pr-8 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search query"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
              statusFilter === "all"
                ? "bg-zinc-900 text-white shadow-xs"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            All ({allCount})
          </button>
          <button
            onClick={() => setStatusFilter("in_stock")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
              statusFilter === "in_stock"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            In Stock ({inStockCount})
          </button>
          <button
            onClick={() => setStatusFilter("low_stock")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
              statusFilter === "low_stock"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setStatusFilter("out_of_stock")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
              statusFilter === "out_of_stock"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>

          {(search || statusFilter !== "all") && (
            <button
              onClick={clearAllFilters}
              className="ml-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline shrink-0 px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Product Table Container */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
        {loading && !data ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircleIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-zinc-900">
              Error loading products
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{error}</p>
            <button
              onClick={() => fetchProducts()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500"
            >
              <RefreshIcon className="h-4 w-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            {search || statusFilter !== "all" ? (
              <div>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                  <FilterIcon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-zinc-900">
                  No products matched your filters
                </h3>
                <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">
                  Try adjusting your search query or reset the stock status filter.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 transition"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <EmptyState
                title="No products yet"
                description="Get started by adding your first product to the inventory catalog."
                action={{
                  label: "+ Add Product",
                  onClick: openAddModal,
                }}
              />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-left">
              <thead className="bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    SKU
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Quantity on Hand
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Cost Price
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Selling Price
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Stock Status
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {filteredProducts.map((p) => {
                  const updatedDate = new Date(p.updatedAt).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  );

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50/60 transition-colors"
                    >
                      {/* Product Name & Description */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-900">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="text-xs text-zinc-500 truncate max-w-xs mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                          {p.sku}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-zinc-900">
                          {p.quantityOnHand.toLocaleString()}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="px-6 py-4 text-zinc-600 font-mono text-xs">
                        {p.costPrice !== null && p.costPrice !== undefined
                          ? `$${Number(p.costPrice).toFixed(2)}`
                          : "—"}
                      </td>

                      {/* Selling Price */}
                      <td className="px-6 py-4 text-zinc-800 font-mono text-xs font-semibold">
                        {p.sellingPrice !== null && p.sellingPrice !== undefined
                          ? `$${Number(p.sellingPrice).toFixed(2)}`
                          : "—"}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <StockStatusBadge
                          quantity={p.quantityOnHand}
                          threshold={p.lowStockThreshold}
                        />
                      </td>

                      {/* Updated Date */}
                      <td className="px-6 py-4 text-xs text-zinc-400">
                        {updatedDate}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <EditIcon className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingProduct(p)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-product-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
              <div>
                <h2 id="add-product-title" className="text-lg font-bold text-zinc-900">
                  Add New Product
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Create a new catalog item with SKU and stock levels
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 rounded-md p-1"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="mt-4 space-y-4">
              <div>
                <label htmlFor="add-product-name" className="block text-xs font-semibold text-zinc-700">
                  Product Name *
                </label>
                <input
                  id="add-product-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Wireless Barcode Scanner"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="add-product-sku" className="block text-xs font-semibold text-zinc-700">
                  SKU (Unique within organization) *
                </label>
                <input
                  id="add-product-sku"
                  type="text"
                  required
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  placeholder="e.g. SCAN-WL-01"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-mono uppercase text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="add-product-quantity" className="block text-xs font-semibold text-zinc-700">
                    Quantity on Hand *
                  </label>
                  <input
                    id="add-product-quantity"
                    type="number"
                    min="0"
                    required
                    value={formQuantityOnHand}
                    onChange={(e) => setFormQuantityOnHand(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="add-product-threshold" className="block text-xs font-semibold text-zinc-700">
                    Low Stock Threshold
                  </label>
                  <input
                    id="add-product-threshold"
                    type="number"
                    min="0"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    placeholder="10"
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="add-product-selling-price" className="block text-xs font-semibold text-zinc-700">
                    Selling Price ($)
                  </label>
                  <input
                    id="add-product-selling-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    placeholder="49.99"
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="add-product-cost-price" className="block text-xs font-semibold text-zinc-700">
                    Cost Price ($)
                  </label>
                  <input
                    id="add-product-cost-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    placeholder="25.00"
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="add-product-description" className="block text-xs font-semibold text-zinc-700">
                  Description
                </label>
                <textarea
                  id="add-product-description"
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional details, supplier info, or specs..."
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-product-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
              <div>
                <h2 id="edit-product-title" className="text-lg font-bold text-zinc-900">
                  Edit Product
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Update product details and stock level
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setEditingProduct(null)}
                className="text-zinc-400 hover:text-zinc-600 rounded-md p-1"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateProduct} className="mt-4 space-y-4">
              <div>
                <label htmlFor="edit-product-name" className="block text-xs font-semibold text-zinc-700">
                  Product Name *
                </label>
                <input
                  id="edit-product-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="edit-product-sku" className="block text-xs font-semibold text-zinc-700">
                  SKU (Unique within organization) *
                </label>
                <input
                  id="edit-product-sku"
                  type="text"
                  required
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-mono uppercase text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-product-quantity" className="block text-xs font-semibold text-zinc-700">
                    Quantity on Hand *
                  </label>
                  <input
                    id="edit-product-quantity"
                    type="number"
                    min="0"
                    required
                    value={formQuantityOnHand}
                    onChange={(e) => setFormQuantityOnHand(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-product-threshold" className="block text-xs font-semibold text-zinc-700">
                    Low Stock Threshold
                  </label>
                  <input
                    id="edit-product-threshold"
                    type="number"
                    min="0"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-product-selling-price" className="block text-xs font-semibold text-zinc-700">
                    Selling Price ($)
                  </label>
                  <input
                    id="edit-product-selling-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-product-cost-price" className="block text-xs font-semibold text-zinc-700">
                    Cost Price ($)
                  </label>
                  <input
                    id="edit-product-cost-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-product-description" className="block text-xs font-semibold text-zinc-700">
                  Description
                </label>
                <textarea
                  id="edit-product-description"
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <TrashIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 id="delete-product-title" className="text-base font-bold text-zinc-900">
                  Delete Product
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg border border-zinc-200/80">
              Are you sure you want to delete{" "}
              <strong className="text-zinc-900">{deletingProduct.name}</strong>{" "}
              (SKU: <code className="font-mono">{deletingProduct.sku}</code>)?
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={submitting}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-rose-500 disabled:opacity-50 transition"
              >
                {submitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
