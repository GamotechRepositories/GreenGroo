import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import CopyId from "../../components/ui/CopyId";
import VendorProductEditModal from "./VendorProductEditModal";

const PRODUCT_ID_TEXT = "font-mono text-[10px] font-semibold tracking-wide text-[#217346]";

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-600 border-red-200",
  Cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function Thumb({ src, name }) {
  if (src) return <img src={src} alt={name} loading="lazy" className="h-9 w-9 rounded border border-gray-200 object-cover" />;
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded bg-[#E8F5E9] text-xs font-bold text-[#217346]">
      {String(name || "P").charAt(0)}
    </div>
  );
}

export default function VendorMyProductsPage() {
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await vendorApi.getMyProducts();
      setProducts(res.data?.products || []);
      setRequests(res.data?.requests || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancelRequest = async (request) => {
    if (!window.confirm(`Cancel the request for "${request.productName}"?`)) return;
    try {
      await vendorApi.cancelProductRequest(request.id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to cancel request");
    }
  };

  const applyUpdate = (updated, message) => {
    if (updated) setProducts((prev) => prev.map((p) => (p.productId === updated.productId ? updated : p)));
    setEditing(null);
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) =>
      [p.name, p.sku, p.category, p.subcategory, p.brandName, p.varietyName].some((v) =>
        String(v || "").toLowerCase().includes(query)
      )
    );
  }, [products, q]);

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Products</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Products you added from the catalog and admin approved for your collection centre.
          </p>
        </div>
        <Link to="/vendor/products" className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white">
          + Add from All Products
        </Link>
      </div>

      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}
      {notice ? (
        <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{notice}</div>
      ) : null}

      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : (
        <>
          <section className="border border-gray-200 bg-white">
            <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#217346]">My Products ({products.length})</h2>
              {products.length ? (
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search product, SKU, category…"
                  className="w-full border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#217346] sm:w-64"
                />
              ) : null}
            </div>
            {products.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">
                No products yet.{" "}
                <Link to="/vendor/products" className="font-semibold text-[#217346] hover:underline">
                  Request a product from All Products
                </Link>
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">No matching products</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">Unit</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Stock</th>
                      <th className="px-4 py-2">Added</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.productId} className="border-t border-gray-100">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Thumb src={p.image} name={p.name} />
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900">{p.name}</p>
                              <CopyId value={p.sku || p.productId} textClassName={PRODUCT_ID_TEXT} />
                              {p.brandName || p.varietyName ? (
                                <p className="text-[10px] text-gray-500">
                                  {[p.brandName, p.varietyName].filter(Boolean).join(" · ")}
                                </p>
                              ) : null}
                              {!p.catalogMissing && p.inStock === false ? (
                                <p className="text-[10px] font-semibold text-amber-700">Out of stock</p>
                              ) : null}
                              {p.catalogMissing ? (
                                <p className="text-[10px] font-semibold text-red-600">No longer active in admin catalog</p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {[p.category, p.subcategory].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{p.unit || "—"}</td>
                        <td className="px-4 py-2 text-gray-700">
                          {p.catalogMissing ? (
                            "—"
                          ) : (
                            <>
                              <span className="font-semibold">{formatPrice(p.discountedPrice)}</span>
                              {Number(p.price) > Number(p.discountedPrice) ? (
                                <span className="ml-1 text-[10px] text-gray-400 line-through">{formatPrice(p.price)}</span>
                              ) : null}
                              {p.customPricing ? (
                                <span className="ml-1.5 inline-block border border-emerald-200 bg-emerald-50 px-1 text-[9px] font-semibold uppercase text-emerald-700">
                                  Custom
                                </span>
                              ) : null}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {p.stock === null || p.stock === undefined ? "—" : Number(p.stock).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{formatDate(p.createdAt)}</td>
                        <td className="px-4 py-2 text-right">
                          {p.catalogMissing ? null : (
                            <button
                              type="button"
                              onClick={() => setEditing(p)}
                              className="text-[11px] font-semibold text-[#217346] hover:underline"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="border border-gray-200 bg-white">
            <h2 className="border-b border-gray-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#217346]">
              My Requests ({requests.length}){pendingCount ? ` · ${pendingCount} waiting for approval` : ""}
            </h2>
            {requests.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">No requests sent yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">Sent</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Admin remarks</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id} className="border-t border-gray-100 align-top">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Thumb src={request.productImage} name={request.productName} />
                            <div>
                              <p className="font-semibold text-gray-900">{request.productName}</p>
                              <p className="text-[10px] text-gray-400">{request.category || "—"}</p>
                              {request.notes ? <p className="text-[10px] text-gray-500">Note: {request.notes}</p> : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{formatDate(request.createdAt)}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-block border px-2 py-0.5 text-[10px] font-semibold ${
                              STATUS_STYLES[request.status] || STATUS_STYLES.Cancelled
                            }`}
                          >
                            {request.status === "Pending" ? "Waiting for approval" : request.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{request.adminRemarks || "—"}</td>
                        <td className="px-4 py-2 text-right">
                          {request.status === "Pending" ? (
                            <button
                              type="button"
                              onClick={() => cancelRequest(request)}
                              className="text-[11px] font-semibold text-red-600 hover:underline"
                            >
                              Cancel
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {editing ? (
        <VendorProductEditModal
          key={editing.productId}
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={applyUpdate}
        />
      ) : null}
    </div>
  );
}
