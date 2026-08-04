import { createPortal } from "react-dom";
import ProductShareMenu from "./ProductShareMenu";
import AdminProductPrice from "./AdminProductPrice";
import {
  getBulkTierRows,
  getMinOrderQuantity,
  getUnitPriceForQuantity,
  isBulkPricing,
  isMultiVariant,
} from "../../utils/productPricing";
import {
  adminDetailRowClass,
  btnPrimary,
  btnSecondary,
  modalBodyClass,
  modalFooterClass,
  modalHeaderClass,
  modalOverlayClass,
  modalPanelClass,
} from "./adminStyles";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function DetailRow({ label, value, children }) {
  return (
    <div className={adminDetailRowClass}>
      <span className="font-medium text-text-secondary">{label}</span>
      <span className="min-w-0 break-words text-text-primary">{children ?? value ?? "—"}</span>
    </div>
  );
}

function ProductDetailModal({ product, onClose, onEdit }) {
  if (!product) return null;

  return createPortal(
    <div className={modalOverlayClass} onClick={onClose}>
      <div className={modalPanelClass} onClick={(e) => e.stopPropagation()}>
        <div className={modalHeaderClass}>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {product.brandName}
            </p>
            <h2 className="text-base font-bold leading-snug text-text-primary sm:text-lg">
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-border-light p-2 text-text-secondary hover:bg-mobile-surface transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={modalBodyClass}>
          {product.productImages?.length > 0 && (
            <div className="mb-5 flex gap-2 overflow-x-auto hide-scrollbar">
              {product.productImages.map((img, index) => (
                <div
                  key={`${img}-${index}`}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border-light bg-mobile-surface"
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="h-full w-full object-contain p-1"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-border-light bg-mobile-surface/50 px-4">
            <DetailRow label="Product ID" value={product._id} />
            <DetailRow label="SKU" value={product.sku || "—"} />
            <DetailRow label="Brand" value={product.brandName} />
            <DetailRow
              label="Subcategories"
              value={
                Array.isArray(product.subcategories) && product.subcategories.length
                  ? product.subcategories.join(", ")
                  : product.subcategory
              }
            />
            <DetailRow label="Categories">
              {product.categories?.length
                ? product.categories.join(", ")
                : "—"}
            </DetailRow>
            <DetailRow label="Price">
              <AdminProductPrice product={product} size="detail" />
              {isBulkPricing(product) ? (
                <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                  {getBulkTierRows(product).map((tier) => (
                    <li key={tier.key}>
                      {tier.maxQuantity
                        ? `${tier.minQuantity}–${tier.maxQuantity} pcs`
                        : `${tier.minQuantity}+ pcs`}
                      : {formatPrice(tier.price)}
                    </li>
                  ))}
                </ul>
              ) : null}
              {isMultiVariant(product) ? (
                <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                  {product.variants.map((variant) => {
                    const moq = getMinOrderQuantity(product, variant.name);
                    const unitPrice = getUnitPriceForQuantity(product, moq, variant.name);
                    return (
                      <li key={variant.name}>
                        {variant.name}: {formatPrice(unitPrice)}
                        {variant.pricingType === "bulk" ? " (bulk)" : ""}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </DetailRow>
            <DetailRow label="In stock">
              <span className={product.inStock !== false ? "text-green-600" : "text-red-500"}>
                {product.inStock !== false ? "Yes" : "No"}
              </span>
            </DetailRow>
            <DetailRow label="Rating" value={`${product.ratings ?? 0} / 5`} />
            <DetailRow label="Status">
              <span className={product.isActive ? "text-green-600" : "text-red-500"}>
                {product.isActive ? "Active" : "Inactive"}
              </span>
            </DetailRow>
            <DetailRow label="Description">
              {product.description || "—"}
            </DetailRow>
            <DetailRow label="Product Specifications">
              {product.specifications?.length ? (
                <ul className="space-y-1">
                  {product.specifications.map((spec, index) => (
                    <li key={`${spec.name}-${spec.value}-${index}`}>
                      <span className="font-medium">{spec.name}: </span>
                      {spec.value}
                    </li>
                  ))}
                </ul>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow
              label="Created"
              value={
                product.createdAt
                  ? new Date(product.createdAt).toLocaleString("en-IN")
                  : "—"
              }
            />
            <DetailRow
              label="Updated"
              value={
                product.updatedAt
                  ? new Date(product.updatedAt).toLocaleString("en-IN")
                  : "—"
              }
            />
          </div>
        </div>

        <div className={`${modalFooterClass} sm:justify-between`}>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Close
          </button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <ProductShareMenu
              product={product}
              imageUrl={product.productImages?.[0] || ""}
            />
            <button
              type="button"
              onClick={() => {
                onEdit(product);
                onClose();
              }}
              className={btnPrimary}
            >
              Edit Product
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ProductDetailModal;
