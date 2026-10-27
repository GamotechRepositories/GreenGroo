import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getManagerAllProducts } from "../api/farmerApi";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { EXCEL_BTN_PRIMARY, EXCEL_INPUT, EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL } from "../utils/excelStyles";
import { formatProductBusinessId, managerProductPath } from "../utils/cropLinks";
import CopyId from "../components/ui/CopyId";

function ProductDetailsHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedFarmerId = searchParams.get("farmerId") || "";

  useEffect(() => {
    (async () => {
      try {
        const data = await getManagerAllProducts();
        setFarmers(Array.isArray(data?.farmers) ? data.farmers : []);
        setProducts(Array.isArray(data?.products) ? data.products : []);
      } catch (err) {
        toast.error(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!selectedFarmerId) return products;
    return products.filter((p) => String(p.farmerId || "") === selectedFarmerId);
  }, [products, selectedFarmerId]);

  const addPath = selectedFarmerId
    ? `/manager/farmers/${encodeURIComponent(selectedFarmerId)}/products/add`
    : "/manager/products/add";

  if (loading) return <LoadingState rows={6} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Product Details</h1>
        <p className={EXCEL_PAGE_SUB}>Open a farmer’s product to view photos, stock and price.</p>
      </div>

      <select
        className={`${EXCEL_INPUT} max-w-xs`}
        value={selectedFarmerId}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams);
          if (e.target.value) next.set("farmerId", e.target.value);
          else next.delete("farmerId");
          setSearchParams(next, { replace: true });
        }}
      >
        <option value="">All Farmers</option>
        {farmers.map((f) => (
          <option key={f.id || f.farmerId} value={f.id || f.farmerId}>
            {f.name}
          </option>
        ))}
      </select>

      {!filtered.length ? (
        <EmptyState
          title="No product details yet"
          description="Add a product for a farmer first, then open its details, photos and price."
          action={
            <Link to={addPath} className={EXCEL_BTN_PRIMARY}>
              Add Product
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {Object.values(
            filtered.reduce((acc, product) => {
              const key = String(product.farmerId || product.farmerName || "unknown");
              if (!acc[key]) {
                acc[key] = {
                  farmerId: product.farmerId,
                  farmerName: product.farmerName || "Farmer",
                  items: [],
                };
              }
              acc[key].items.push(product);
              return acc;
            }, {})
          )
            .sort((a, b) => a.farmerName.localeCompare(b.farmerName))
            .map((group) => (
              <section key={group.farmerId || group.farmerName} className="space-y-2">
                <Link
                  to={group.farmerId ? `/manager/farmers/${encodeURIComponent(group.farmerId)}` : "/manager/farmers"}
                  className="text-sm font-bold text-[#217346] hover:underline"
                >
                  {group.farmerName}
                </Link>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.items.map((product) => {
                    const id = product.productId || product.id;
                    const farmerId = product.farmerId;
                    return (
                      <Link
                        key={`${farmerId}-${id}`}
                        to={managerProductPath(farmerId, id)}
                        className={`${EXCEL_PANEL} p-3 hover:bg-[#F9F9F9]`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold">{product.productName || product.name}</p>
                            <CopyId
                              value={formatProductBusinessId(product)}
                              textClassName="font-mono text-[11px] font-semibold tracking-wide text-emerald-700"
                            />
                            <p className="text-[11px] text-[#6B7280]">
                              {product.cropName} • {product.variety}
                            </p>
                          </div>
                          <StatusBadge status={product.stockStatus || product.status} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}

export default ProductDetailsHubPage;
