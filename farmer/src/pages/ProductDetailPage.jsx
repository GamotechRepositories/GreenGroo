import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteMyProduct, getMyProduct, updateMyProductStatus } from "../api/farmerApi";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { canProductAction, formatProductPrice, primaryGradeLabel } from "../utils/productActions";
import { formatCropDate, formatProductBusinessId } from "../utils/cropLinks";
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_PRIMARY,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../utils/excelStyles";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyProduct(id);
      setProduct(data);
      const nextId = data.productId || data.id;
      if (nextId && nextId !== id) {
        navigate(`/farmer/products/${nextId}`, { replace: true });
      }
    } catch (err) {
      setProduct(null);
      toast.error(err.message || "Product not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const onStatus = async (status) => {
    try {
      setProduct(await updateMyProductStatus(id, status));
      toast.success(status === "Paused" ? "Product paused" : "Product activated");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  if (loading) return <LoadingState rows={8} />;
  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        description="This product may have been deleted or does not belong to your account."
        action={
          <Link to="/farmer/products" className={EXCEL_BTN_PRIMARY}>
            Back to My Products
          </Link>
        }
      />
    );
  }

  const media = product.media || {};
  const photos = [media.mainPhoto, ...(media.farmPhotos || []), ...(media.cropPhotos || []), ...(media.harvestPhotos || [])].filter(Boolean);
  const status = product.status;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>{product.productName || product.name}</h1>
          <p className={EXCEL_PAGE_SUB}>
            {product.cropName || "Crop"} • {product.variety || "—"} • {product.farmName || "Farm"}
            {product.farmLocation ? ` • ${product.farmLocation}` : ""}
          </p>
          <p className="mt-1 font-mono text-[12px] font-semibold tracking-wide text-emerald-700">
            {formatProductBusinessId(product)}
          </p>
        </div>
        <StatusBadge status={product.stockStatus || status} />
      </div>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Product Details</h2>
        <div className="grid gap-3 p-3 sm:grid-cols-2 text-xs">
          <Info label="Product ID" value={formatProductBusinessId(product)} />
          <Info label="Product Name" value={product.productName || product.name} />
          <Info label="Crop" value={product.cropName} />
          <Info label="Variety" value={product.variety} />
          <Info label="Available Quantity" value={`${product.availableQuantity} ${product.unit}`} />
          <Info label="Selling Price" value={formatProductPrice(product.pricePerKg, product.unit)} />
          <Info label="MOQ" value={`${product.minimumOrderQuantity} ${product.unit}`} />
          <Info label="Harvest Date" value={formatCropDate(product.harvestDate)} />
          <Info label="Grade" value={primaryGradeLabel(product)} />
          <Info label="Organic / Conventional" value={product.farmingType} />
          <Info label="Available From" value={formatCropDate(product.availableFrom)} />
          <Info label="Available Until" value={formatCropDate(product.availableUntil)} />
          <Info label="Status" value={status} />
          {product.rejectionReason ? <Info label="Rejection Reason" value={product.rejectionReason} /> : null}
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Grades & Stock</h2>
        <div className="grid gap-2 p-3 sm:grid-cols-3 text-xs">
          {(product.grades || []).map((grade) => (
            <div key={grade.grade || grade.label} className="border border-[#D4D4D4] p-2">
              <p className="font-semibold">{grade.label || `Grade ${grade.grade}`}</p>
              <p>
                {grade.quantity} {product.unit}
              </p>
              <p>{formatProductPrice(grade.price || product.pricePerKg, product.unit)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Farm & Crop</h2>
        <div className="grid gap-3 p-3 sm:grid-cols-2 text-xs">
          <Info label="Farm Name" value={product.farmName} />
          <Info label="Farm Location" value={product.farmLocation} />
          <Info label="Crop Harvest" value={formatCropDate(product.crop?.expectedHarvestDate)} />
          <Info label="Estimated Crop Qty" value={product.crop ? `${product.crop.estimatedQuantity} ${product.crop.unit}` : "—"} />
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Product Photos & Media</h2>
        <div className="grid gap-2 p-3 sm:grid-cols-2 md:grid-cols-4">
          {photos.length ? (
            photos.map((src, i) => (
              <img key={i} src={src} alt={`${product.productName} ${i + 1}`} className="h-28 w-full rounded border border-[#D4D4D4] object-cover" />
            ))
          ) : (
            <p className="p-2 text-xs text-[#6B7280]">No photos uploaded.</p>
          )}
        </div>
        {(media.videos || []).filter(Boolean).length ? (
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {media.videos.filter(Boolean).map((src, i) => (
              <video key={i} src={src} controls className="h-40 w-full bg-black object-contain" />
            ))}
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        {canProductAction(status, "edit") ? (
          <Link to={`/farmer/products/${id}/edit`} className={EXCEL_BTN}>
            Edit
          </Link>
        ) : null}
        <Link to={`/farmer/products/${id}/media`} className={EXCEL_BTN}>
          Photos & Media
        </Link>
        {canProductAction(status, "stock") || canProductAction(status, "edit") ? (
          <Link to={`/farmer/products/${id}/stock`} className={EXCEL_BTN}>
            Update Stock
          </Link>
        ) : null}
        {canProductAction(status, "price") || canProductAction(status, "edit") ? (
          <Link to={`/farmer/products/${id}/stock`} className={EXCEL_BTN_PRIMARY}>
            Update Price
          </Link>
        ) : null}
        {canProductAction(status, "pause") ? (
          <button type="button" className={EXCEL_BTN} onClick={() => onStatus("Paused")}>
            Pause
          </button>
        ) : null}
        {canProductAction(status, "activate") ? (
          <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => onStatus("Active")}>
            Activate
          </button>
        ) : null}
        {canProductAction(status, "delete") ? (
          <button type="button" className={EXCEL_BTN_DANGER} onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete product?"
        message="This draft product will be removed."
        confirmLabel="Delete"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          try {
            await deleteMyProduct(id);
            toast.success("Product deleted");
            navigate("/farmer/products");
          } catch (err) {
            toast.error(err.message || "Failed to delete product");
          }
        }}
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-0.5 font-semibold text-[#1F2937]">{value || "—"}</p>
    </div>
  );
}

export default ProductDetailPage;
