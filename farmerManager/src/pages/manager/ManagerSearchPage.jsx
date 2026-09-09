import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getManagerAllProducts, getManagerFarmers } from "../../api/farmerApi";
import { EXCEL_INPUT, EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE } from "../../utils/excelStyles";

function isBusinessProductId(value) {
  const id = String(value || "").trim();
  return Boolean(id) && !/^[a-f0-9]{24}$/i.test(id);
}

function productNameOf(item = {}) {
  return item.productName || item.name || "Farm Produce";
}

function productGroupKey(item = {}) {
  const id = String(item.productId || item.id || "").trim();
  if (isBusinessProductId(id)) return id.toUpperCase();
  return `${productNameOf(item).trim().toLowerCase()}|${String(item.variety || "").trim().toLowerCase()}`;
}

function productFarmersPath(product) {
  const key = productGroupKey(product);
  const params = new URLSearchParams({ name: productNameOf(product) });
  const productId =
    [product.productId, product.id].find((v) => isBusinessProductId(v)) || product.productId || product.id || "";
  if (productId) params.set("productId", productId);
  return `/manager/products/${encodeURIComponent(key)}/farmers?${params.toString()}`;
}

function asFarmers(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.farmers)) return data.farmers;
  return [];
}

export default function ManagerSearchPage() {
  const [q, setQ] = useState("");
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [farmerList, productData] = await Promise.all([
          getManagerFarmers({ lite: true }).catch(() => []),
          getManagerAllProducts().catch(() => ({ products: [] })),
        ]);
        if (cancelled) return;
        setFarmers(asFarmers(farmerList));
        setProducts(Array.isArray(productData?.products) ? productData.products : []);
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
      [productNameOf(p), p.variety, p.productId, p.id, p.farmerName, p.category].some((v) =>
        String(v || "").toLowerCase().includes(needle)
      )
    );
  }, [products, needle]);

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Search</h1>
        <p className={EXCEL_PAGE_SUB}>Find farmers and products</p>
      </div>
      <input
        type="search"
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search farmers or products…"
        className={EXCEL_INPUT}
      />
      {loading ? (
        <p className="text-xs text-[#6B7280]">Loading…</p>
      ) : !needle ? (
        <p className="text-sm text-[#9CA3AF]">Type a name, ID, or mobile number.</p>
      ) : farmerHits.length === 0 && productHits.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">No matching farmers or products.</p>
      ) : (
        <>
          {farmerHits.length ? (
            <section>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Farmers</p>
              <div className="space-y-1.5">
                {farmerHits.slice(0, 12).map((f) => (
                  <Link
                    key={f.id}
                    to={`/manager/farmers/${f.id}`}
                    className="block rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-[#217346]">{f.name}</p>
                    <p className="text-[11px] text-[#6B7280]">{[f.mobile, f.farmName].filter(Boolean).join(" · ")}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          {productHits.length ? (
            <section>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Products</p>
              <div className="space-y-1.5">
                {productHits.slice(0, 12).map((p) => (
                  <Link
                    key={`${p.farmerId || ""}-${p.id || p.productId}`}
                    to={productFarmersPath(p)}
                    className="block rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-[#217346]">{productNameOf(p)}</p>
                    <p className="text-[11px] text-[#6B7280]">
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
