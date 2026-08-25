import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getMyProducts } from "../api/farmerApi";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { EXCEL_BTN_PRIMARY, EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL } from "../utils/excelStyles";

function ProductDetailsHubPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setProducts(await getMyProducts());
      } catch (err) {
        toast.error(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState rows={6} />;

  if (!products.length) {
    return (
      <EmptyState
        title="No product details yet"
        description="Add a product first, then open its details, photos and price."
        action={
          <Link to="/farmer/products/add" className={EXCEL_BTN_PRIMARY}>
            Add Product
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Product Details</h1>
        <p className={EXCEL_PAGE_SUB}>Open a product to view photos, stock and price.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((product) => {
          const id = product.productId || product.id;
          return (
            <Link key={id} to={`/farmer/products/${id}`} className={`${EXCEL_PANEL} p-3 hover:bg-[#F9F9F9]`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold">{product.productName || product.name}</p>
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
    </div>
  );
}

export default ProductDetailsHubPage;
