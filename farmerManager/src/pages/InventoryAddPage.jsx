import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductForm from "../components/products/ProductForm";
import {
  adjustFarmerStockByManager,
  getManagerFarmers,
  getManagerFarmerById,
  getManagerFarmerProducts,
  updateManagerFarmerProduct,
} from "../api/farmerApi";
import { EXCEL_BTN_PRIMARY, EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL, FORM_INPUT } from "../utils/excelStyles";
import LoadingState from "../components/ui/LoadingState";

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.farmers)) return value.farmers;
  if (Array.isArray(value?.products)) return value.products;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function productOptionId(product) {
  return product.id || product.productId || "";
}

function InventoryAddPage() {
  const { farmerId: farmerIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lockedFarmerId = farmerIdParam || searchParams.get("farmerId") || "";
  const editProductId = searchParams.get("productId") || "";
  const isEdit = Boolean(editProductId);

  const [farmers, setFarmers] = useState([]);
  const [farmerId, setFarmerId] = useState(lockedFarmerId);
  const [farmerName, setFarmerName] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!lockedFarmerId) {
          const list = await getManagerFarmers({ lite: true });
          if (!cancelled) setFarmers(asArray(list));
        }
        if (farmerId) {
          const [farmer, productList] = await Promise.all([
            getManagerFarmerById(farmerId).catch(() => null),
            getManagerFarmerProducts(farmerId).catch(() => []),
          ]);
          if (!cancelled) {
            setFarmerName(farmer?.name || "");
            setProducts(asArray(productList));
          }
        } else if (!cancelled) {
          setFarmerName("");
          setProducts([]);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmerId, lockedFarmerId]);

  const backTo = lockedFarmerId
    ? `/manager/farmers/${encodeURIComponent(lockedFarmerId)}`
    : "/manager/inventory";

  if (loading) return <LoadingState rows={4} />;

  if (farmerId && products.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-2">
        <h1 className={EXCEL_PAGE_TITLE}>{isEdit ? "Edit Inventory" : "Add Inventory"}</h1>
        <div className={`${EXCEL_PANEL} px-3 py-8 text-center text-xs text-[#6B7280]`}>
          <p>No products available for {farmerName || "this farmer"}. Add a product first.</p>
          <Link
            to={`/manager/farmers/${encodeURIComponent(farmerId)}/products/add`}
            className={`${EXCEL_BTN_PRIMARY} mt-3 inline-block`}
          >
            Add Product
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-2">
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        {lockedFarmerId ? (
          <>
            <Link to="/manager/farmers" className="hover:text-[#217346]">Farmers</Link>
            <span>›</span>
            <Link to={backTo} className="hover:text-[#217346]">{farmerName || "Farmer"}</Link>
          </>
        ) : (
          <Link to="/manager/inventory" className="hover:text-[#217346]">Inventory</Link>
        )}
        <span>›</span>
        <span className="font-semibold text-[#1F2937]">{isEdit ? "Edit Inventory" : "Add Inventory"}</span>
      </div>

      <div>
        <h1 className={EXCEL_PAGE_TITLE}>{isEdit ? "Edit Inventory" : "Add Inventory"}</h1>
        <p className={`${EXCEL_PAGE_SUB} hidden sm:block`}>
          {farmerName ? `Update stock for ${farmerName}.` : "Select a farmer, then add inventory."}
        </p>
      </div>

      {!lockedFarmerId ? (
        <div className={`${EXCEL_PANEL} p-3 sm:p-4`}>
          <label className="mb-1 block text-[11px] font-semibold text-slate-600">Farmer *</label>
          <select
            className={FORM_INPUT}
            value={farmerId}
            onChange={(e) => setFarmerId(e.target.value)}
          >
            <option value="">Select farmer</option>
            {farmers.map((f) => (
              <option key={f.id || f.farmerId} value={f.id || f.farmerId}>
                {f.name} {f.mobile ? `· ${f.mobile}` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {farmerId ? (
        <ProductForm
          key={`${farmerId}-${editProductId || "new"}`}
          mode="inventory"
          availableProducts={products.map((p) => ({
            ...p,
            id: productOptionId(p),
            name: p.productName || p.name,
          }))}
          initialProductId={editProductId}
          disableProductSelect={isEdit}
          submitting={submitting}
          submitLabel={isEdit ? "Update Inventory" : "Save Inventory"}
          stockUpdatedBy="Manager"
          adjustStockFn={async (payload) =>
            adjustFarmerStockByManager({
              farmerId,
              ...payload,
              updatedBy: "Manager",
            })
          }
          onStockAdjusted={(updated) => {
            setProducts((prev) =>
              prev.map((p) => (productOptionId(p) === (updated.id || updated.productId) ? { ...p, ...updated } : p))
            );
          }}
          onSubmit={async (values) => {
            if (!values.productId) {
              toast.error("Select a product");
              return;
            }
            setSubmitting(true);
            try {
              const { productId, ...payload } = values;
              const selected = products.find((p) => productOptionId(p) === productId);
              await updateManagerFarmerProduct(farmerId, productId, {
                ...payload,
                cropId: selected?.cropId || payload.cropId,
                cropName: selected?.cropName || payload.cropName || payload.name,
                variety: selected?.variety || payload.variety,
                productName: payload.name || selected?.productName || selected?.name,
              });
              toast.success(isEdit ? "Inventory updated" : "Inventory saved");
              navigate("/manager/inventory");
            } catch (err) {
              toast.error(err.message || "Failed to save inventory");
            } finally {
              setSubmitting(false);
            }
          }}
        />
      ) : (
        <p className="text-xs text-[#6B7280]">Select a farmer to continue.</p>
      )}
    </div>
  );
}

export default InventoryAddPage;
