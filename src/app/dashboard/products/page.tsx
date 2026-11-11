"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

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

export default function ProductsPage() {
  const [, startTransition] = useTransition();
  const [data, setData] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
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
    setFormThreshold(p.lowStockThreshold !== null ? String(p.lowStockThreshold) : "10");
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
          sellingPrice: formSellingPrice !== "" ? parseFloat(formSellingPrice) : undefined,
          lowStockThreshold: formThreshold !== "" ? parseInt(formThreshold, 10) : 10,
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
          sellingPrice: formSellingPrice !== "" ? parseFloat(formSellingPrice) : null,
          lowStockThreshold: formThreshold !== "" ? parseInt(formThreshold, 10) : 10,
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

  return (
    <div className="space-y-6">
      {/* Page Title & Add Product Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Products & Inventory
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Manage your organization&apos;s product catalog and inventory levels.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
        >
          + Add Product
        </button>
      </div>

      {/* Dashboard KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-zinc-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Total Products
          </p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {data?.totalProducts ?? 0}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Active catalog items</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border border-zinc-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Total Quantity On Hand
          </p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {data?.totalQuantityOnHand ?? 0}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Total units in inventory</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border border-zinc-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Low-Stock Count
          </p>
          <p className={`mt-2 text-2xl font-bold ${(data?.lowStockCount ?? 0) > 0 ? "text-amber-600" : "text-zinc-900"}`}>
            {data?.lowStockCount ?? 0}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Items at or below alert threshold</p>
        </div>
      </div>

      {/* Simple Search Input */}
      <div className="rounded-xl bg-white p-4 shadow-sm border border-zinc-200">
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="rounded-xl bg-white shadow-sm border border-zinc-200 overflow-hidden">
        {loading && !data ? (
          <div className="py-16 text-center text-sm text-zinc-500">
            Loading products...
          </div>
        ) : data?.products.length === 0 ? (
          <div className="py-16 text-center px-4">
            <h3 className="text-base font-semibold text-zinc-900">
              No products found
            </h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">
              {search
                ? `No products match "${search}".`
                : "You have not added any products yet."}
            </p>
            <div className="mt-4">
              <button
                onClick={openAddModal}
                className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
              >
                + Add First Product
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-left">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Name</th>
                  <th scope="col" className="px-6 py-3.5">SKU</th>
                  <th scope="col" className="px-6 py-3.5">Quantity on Hand</th>
                  <th scope="col" className="px-6 py-3.5">Selling Price</th>
                  <th scope="col" className="px-6 py-3.5">Stock Indicator</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-sm">
                {data?.products.map((p) => {
                  const threshold = p.lowStockThreshold ?? 10;
                  const isLowStock = p.quantityOnHand <= threshold;
                  const isOutOfStock = p.quantityOnHand === 0;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-900">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-zinc-500 truncate max-w-xs mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-700">
                        <span className="bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                          {p.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-900">
                        {p.quantityOnHand}
                      </td>
                      <td className="px-6 py-4 text-zinc-700">
                        {p.sellingPrice !== null && p.sellingPrice !== undefined
                          ? `$${Number(p.sellingPrice).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                            Low Stock (≤{threshold})
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => openEditModal(p)}
                          className="font-medium text-indigo-600 hover:text-indigo-900 text-xs hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingProduct(p)}
                          className="font-medium text-red-600 hover:text-red-900 text-xs hover:underline"
                        >
                          Delete
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-zinc-200">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h2 className="text-lg font-bold text-zinc-900">Add New Product</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-md bg-red-50 p-3 text-xs font-medium text-red-800 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Wireless Barcode Scanner"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  SKU (Unique within organization) *
                </label>
                <input
                  type="text"
                  required
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  placeholder="e.g. SCAN-WL-01"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm uppercase focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700">
                    Quantity on Hand *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formQuantityOnHand}
                    onChange={(e) => setFormQuantityOnHand(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700">
                    Selling Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    placeholder="49.99"
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    placeholder="25.00"
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional details or specifications..."
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-zinc-200">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h2 className="text-lg font-bold text-zinc-900">
                Edit Product
              </h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-zinc-400 hover:text-zinc-600 text-xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-md bg-red-50 p-3 text-xs font-medium text-red-800 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateProduct} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  SKU (Unique within organization) *
                </label>
                <input
                  type="text"
                  required
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm uppercase focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700">
                    Quantity on Hand *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formQuantityOnHand}
                    onChange={(e) => setFormQuantityOnHand(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700">
                    Selling Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-zinc-200">
            <h3 className="text-base font-bold text-zinc-900">Delete Product</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-zinc-900">{deletingProduct.name}</span>{" "}
              (SKU: <code className="font-mono">{deletingProduct.sku}</code>)?
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={submitting}
                className="rounded-md bg-red-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
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
