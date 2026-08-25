import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteMyProduct, getMyProducts, updateMyProductStatus } from "../api/farmerApi";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { canProductAction, formatProductPrice, primaryGradeLabel } from "../utils/productActions";
import { formatCropDate } from "../utils/cropLinks";
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_PRIMARY,
  EXCEL_CELL,
  EXCEL_HEAD,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_TABLE,
  EXCEL_WRAP,
} from "../utils/excelStyles";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setProducts(await getMyProducts());
    } catch (err) {
      toast.error(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onStatus = async (id, status) => {
    try {
      await updateMyProductStatus(id, status);
      toast.success(status === "Paused" ? "Product paused" : "Product updated");
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>My Products</h1>
          <p className={EXCEL_PAGE_SUB}>Products linked to your crops. Publish for admin approval before they go live.</p>
        </div>
        <Link to="/farmer/products/add" className={`${EXCEL_BTN_PRIMARY} px-4 py-2`}>
          Add Product
        </Link>
      </div>

      {loading ? (
        <LoadingState rows={6} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create a product from a crop to start listing harvest."
          action={
            <Link to="/farmer/products/add" className={EXCEL_BTN_PRIMARY}>
              Add Product
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const id = product.productId || product.id;
              return (
                <div key={id} className={EXCEL_PANEL}>
                  {product.image ? (
                    <img src={product.image} alt={product.productName} className="h-32 w-full object-cover" />
                  ) : (
                    <div className="flex h-24 items-center justify-center bg-[#F2F2F2] text-xs text-[#6B7280]">No photo</div>
                  )}
                  <div className="space-y-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-[#1F2937]">{product.productName || product.name}</p>
                        <p className="text-[11px] text-[#6B7280]">
                          {product.cropName || "Crop"} • {primaryGradeLabel(product)}
                        </p>
                      </div>
                      <StatusBadge status={product.stockStatus || product.status} />
                    </div>
                    <p className="text-[11px] text-[#4B5563]">
                      Stock: {product.availableQuantity} {product.unit} • {formatProductPrice(product.pricePerKg, product.unit)}
                    </p>
                    <ActionButtons
                      product={product}
                      onPause={() => onStatus(id, "Paused")}
                      onActivate={() => onStatus(id, "Active")}
                      onDelete={() => setDeleteId(id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`${EXCEL_WRAP} hidden md:block`}>
            <table className={EXCEL_TABLE}>
              <thead>
                <tr>
                  {["Product", "Crop", "Variety", "Grade", "Qty", "Unit", "Price", "Harvest", "Status", "Actions"].map((h) => (
                    <th key={h} className={EXCEL_HEAD}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const id = product.productId || product.id;
                  return (
                    <tr key={`row-${id}`}>
                      <td className={`${EXCEL_CELL} font-semibold`}>{product.productName || product.name}</td>
                      <td className={EXCEL_CELL}>{product.cropName || "—"}</td>
                      <td className={EXCEL_CELL}>{product.variety || "—"}</td>
                      <td className={EXCEL_CELL}>{primaryGradeLabel(product)}</td>
                      <td className={EXCEL_CELL}>{product.availableQuantity}</td>
                      <td className={EXCEL_CELL}>{product.unit}</td>
                      <td className={EXCEL_CELL}>{formatProductPrice(product.pricePerKg, product.unit)}</td>
                      <td className={EXCEL_CELL}>{formatCropDate(product.harvestDate)}</td>
                      <td className={EXCEL_CELL}>
                        <StatusBadge status={product.stockStatus || product.status} />
                      </td>
                      <td className={EXCEL_CELL}>
                        <ActionButtons
                          compact
                          product={product}
                          onPause={() => onStatus(id, "Paused")}
                          onActivate={() => onStatus(id, "Active")}
                          onDelete={() => setDeleteId(id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete product?"
        message="Only draft products can be deleted. This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={busy}
        onClose={() => setDeleteId("")}
        onConfirm={async () => {
          setBusy(true);
          try {
            await deleteMyProduct(deleteId);
            toast.success("Product deleted");
            setDeleteId("");
            await load();
          } catch (err) {
            toast.error(err.message || "Failed to delete product");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

function ActionButtons({ product, onPause, onActivate, onDelete, compact }) {
  const id = product.productId || product.id;
  const status = product.status;
  const cls = compact ? `${EXCEL_BTN} px-1 py-0.5 text-[10px]` : EXCEL_BTN;
  return (
    <div className="flex flex-wrap gap-1 pt-1">
      {canProductAction(status, "view") ? (
        <Link to={`/farmer/products/${id}`} className={cls}>
          View
        </Link>
      ) : null}
      {canProductAction(status, "edit") ? (
        <Link to={`/farmer/products/${id}/edit`} className={cls}>
          Edit
        </Link>
      ) : null}
      {canProductAction(status, "stock") ? (
        <Link to={`/farmer/products/${id}/stock`} className={cls}>
          Update Stock
        </Link>
      ) : null}
      {canProductAction(status, "price") ? (
        <Link to={`/farmer/products/${id}/stock`} className={cls}>
          Update Price
        </Link>
      ) : null}
      {canProductAction(status, "publish") ? (
        <Link to={`/farmer/products/${id}/edit`} className={cls}>
          Publish
        </Link>
      ) : null}
      {canProductAction(status, "pause") ? (
        <button type="button" className={cls} onClick={onPause}>
          Pause
        </button>
      ) : null}
      {canProductAction(status, "activate") ? (
        <button type="button" className={cls} onClick={onActivate}>
          Activate
        </button>
      ) : null}
      {canProductAction(status, "delete") ? (
        <button type="button" className={compact ? `${EXCEL_BTN_DANGER} px-1 py-0.5 text-[10px]` : EXCEL_BTN_DANGER} onClick={onDelete}>
          Delete
        </button>
      ) : null}
    </div>
  );
}

export default ProductsPage;
