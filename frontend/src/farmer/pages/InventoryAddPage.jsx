import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductForm from "../components/products/ProductForm";
import { getProducts, updateProduct } from "../api/farmerApi";
import { EXCEL_BTN_PRIMARY, EXCEL_PAGE_TITLE, EXCEL_PANEL } from "../utils/excelStyles";
import LoadingState from "../components/ui/LoadingState";

function InventoryAddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editProductId = searchParams.get("productId") || "";
  const isEdit = Boolean(editProductId);

  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts({ limit: 100 });
        setProducts(data.products);
      } catch (err) {
        toast.error(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState rows={4} />;

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-2">
        <h1 className={EXCEL_PAGE_TITLE}>{isEdit ? "Edit Inventory" : "Add Inventory"}</h1>
        <div className={`${EXCEL_PANEL} px-3 py-8 text-center text-xs text-[#6B7280]`}>
          <p>No products available. Add a product first.</p>
          <Link to="/farmer/products/add" className={`${EXCEL_BTN_PRIMARY} mt-3 inline-block`}>
            Add Product
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-2">
      <h1 className={EXCEL_PAGE_TITLE}>{isEdit ? "Edit Inventory" : "Add Inventory"}</h1>
      <ProductForm
        mode="inventory"
        availableProducts={products}
        initialProductId={editProductId}
        disableProductSelect={isEdit}
        submitting={submitting}
        submitLabel={isEdit ? "Update Inventory" : "Save Inventory"}
        onStockAdjusted={(updated) => {
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }}
        onSubmit={async (values) => {
          if (!values.productId) {
            toast.error("Select a product");
            return;
          }

          setSubmitting(true);
          try {
            const { productId, ...payload } = values;
            await updateProduct(productId, payload);
            toast.success(isEdit ? "Inventory updated" : "Inventory saved");
            navigate("/farmer/inventory");
          } catch (err) {
            toast.error(err.message || "Failed to save inventory");
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </div>
  );
}

export default InventoryAddPage;
