import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import { productFarmersPath, productNameOf } from "../../utils/productList";

function asList(res) {
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.farmers)) return data.farmers;
  if (Array.isArray(data?.products)) return data.products;
  return [];
}

export default function VendorSearchPage() {
  const [q, setQ] = useState("");
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [farmerRes, productRes] = await Promise.all([
          vendorApi.getFarmers().catch(() => ({ data: [] })),
          vendorApi.getProducts().catch(() => ({ data: { products: [] } })),
        ]);
        if (cancelled) return;
        setFarmers(asList(farmerRes));
        const pdata = productRes?.data || {};
        setProducts(Array.isArray(pdata.products) ? pdata.products : asList(productRes));
      } catch {
        if (!cancelled) {
          setFarmers([]);
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const needle = q.trim().toLowerCase();
  const farmerHits = useMemo(() => {
    if (!needle) return [];
    return farmers.filter((f) =>
      [f.name, f.mobile, f.farmName, f.id].some((v) => String(v || "").toLowerCase().includes(needle))
    );
  }, [farmers, needle]);
  const productHits = useMemo(() => {
    if (!needle) return [];
    return products.filter((p) =>
      [productNameOf(p), p.variety, p.productId, p.id, p.farmerName, p.category]
        .some((v) => String(v || "").toLowerCase().includes(needle))
    );
  }, [products, needle]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Search</h1>
        <p className="mt-0.5 text-sm text-gray-500">Find farmers and products</p>
      </div>
      <input
        type="search"
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search farmers or products…"
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#217346]"
      />
      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : !needle ? (
        <p className="text-sm text-gray-400">Type a name, ID, or mobile number.</p>
      ) : farmerHits.length === 0 && productHits.length === 0 ? (
        <p className="text-sm text-gray-400">No matching farmers or products.</p>
      ) : (
        <>
          {farmerHits.length ? (
            <section>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Farmers</p>
              <div className="space-y-1.5">
                {farmerHits.slice(0, 12).map((f) => (
                  <Link
                    key={f.id}
                    to={`/vendor/all-farmers/${f.id}`}
                    className="block rounded-xl border border-gray-200 bg-white px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-[#217346]">{f.name}</p>
                    <p className="text-[11px] text-gray-500">{[f.mobile, f.farmName].filter(Boolean).join(" · ")}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          {productHits.length ? (
            <section>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Products</p>
              <div className="space-y-1.5">
                {productHits.slice(0, 12).map((p) => (
                  <Link
                    key={`${p.farmerId || ""}-${p.id || p.productId}`}
                    to={productFarmersPath(p)}
                    className="block rounded-xl border border-gray-200 bg-white px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-[#217346]">{productNameOf(p)}</p>
                    <p className="text-[11px] text-gray-500">
                      {[p.variety, p.productId || p.id, p.farmerName].filter(Boolean).join(" · ")}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
