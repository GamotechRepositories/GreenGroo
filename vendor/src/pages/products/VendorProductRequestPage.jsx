import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import CopyId from "../../components/ui/CopyId";

const PAGE_SIZE = 24;
const INPUT = "w-full border border-gray-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-[#217346]";
const PRODUCT_ID_TEXT = "font-mono text-[10px] font-semibold tracking-wide text-[#217346]";

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function VendorProductRequestPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    vendorApi
      .getCatalogProducts({ q, category, page, limit: PAGE_SIZE })
      .then((res) => {
        if (!alive) return;
        setProducts(res.data?.products || []);
        setCategories(res.data?.categories || []);
        setTotal(res.data?.total || 0);
        setError("");
      })
      .catch((err) => alive && setError(err?.response?.data?.message || "Failed to load catalog"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, category, page]);

  const sendRequest = async () => {
    if (!selected || sending) return;
    setSending(true);
    setError("");
    try {
      await vendorApi.createProductRequest({ productId: selected.productId, notes });
      setProducts((prev) => prev.map((p) => (p.productId === selected.productId ? { ...p, requested: true } : p)));
      setToast(`Request for "${selected.name}" sent to admin. It will appear in My Products once approved.`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send request");
    } finally {
      setSelected(null);
      setSending(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Products</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Every product in the admin catalog. Send a request to add one — it moves to My Products after admin approves it.
          </p>
        </div>
        <Link to="/vendor/my-products" className="border border-[#217346] px-4 py-2 text-xs font-semibold text-[#217346] hover:bg-[#E8F5E9]">
          My Products
        </Link>
      </div>

      {toast ? (
        <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{toast}</div>
      ) : null}
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product, SKU, brand…"
          className={`${INPUT} sm:max-w-sm`}
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className={`${INPUT} sm:max-w-[220px]`}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Loading catalog…</p>
      ) : products.length === 0 ? (
        <p className="border border-gray-200 bg-white px-4 py-8 text-center text-xs text-gray-400">No products found in the catalog</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Unit</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.productId} className="border-t border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {p.image ? (
                        <img src={p.image} alt={p.name} loading="lazy" className="h-9 w-9 rounded border border-gray-200 object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded bg-[#E8F5E9] text-xs font-bold text-[#217346]">
                          {String(p.name || "P").charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <CopyId value={p.sku || p.productId} textClassName={PRODUCT_ID_TEXT} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{[p.category, p.subcategory].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-4 py-2 text-gray-600">{p.unit || "—"}</td>
                  <td className="px-4 py-2 text-gray-700">
                    <span className="font-semibold">{formatPrice(p.discountedPrice)}</span>
                    {Number(p.price) > Number(p.discountedPrice) ? (
                      <span className="ml-1 text-[10px] text-gray-400 line-through">{formatPrice(p.price)}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    <span className={p.inStock ? "text-gray-700" : "font-semibold text-red-600"}>
                      {p.inStock ? Number(p.stock || 0).toLocaleString("en-IN") : "Out of stock"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {p.added ? (
                      <span className="inline-block border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        In My Products
                      </span>
                    ) : p.requested ? (
                      <span className="inline-block border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                        Waiting for approval
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setNotes("");
                          setSelected(p);
                        }}
                        className="bg-[#217346] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1a5c38]"
                      >
                        Request to add
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="border border-gray-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="border border-gray-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white p-5 shadow-xl">
            <h2 className="text-sm font-bold text-gray-900">Request to add product</h2>
            <div className="mt-3 flex items-center gap-3">
              {selected.image ? (
                <img src={selected.image} alt={selected.name} className="h-14 w-14 rounded border border-gray-200 object-cover" />
              ) : null}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
                <CopyId value={selected.sku || selected.productId} textClassName={PRODUCT_ID_TEXT} />
                <p className="text-[11px] text-gray-500">{[selected.category, selected.unit].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <label className="mt-4 block text-[11px] font-semibold text-gray-600">Note for admin (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              className={`${INPUT} mt-1`}
              placeholder="e.g. Farmers near our centre grow this product"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="border border-gray-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={sendRequest}
                className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a5c38] disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send for Approval"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
