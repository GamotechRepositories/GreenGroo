import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllProducts, getStoreSettings, updateAdminOrder } from "../../api/api";
import {
  buildLineItemKey,
  getCartAdjustStep,
  getMinOrderQuantity,
  getUnitPriceForQuantity,
  isMultiVariant,
} from "../../utils/productPricing";
import { calculateOrderTotal } from "../../utils/gst";
import { calculateShippingCharge } from "../../utils/orderSettings";
import {
  adminCompactTableClass,
  adminCompactTdClass,
  adminCompactThClass,
  adminFilterInputClass,
  adminTableHeaderClass,
  adminTableWrapperClass,
  btnPrimary,
  btnSecondary,
  cardClass,
} from "./adminStyles";
import { formatPrice } from "./sections/adminOrderUtils";
import ProductSearchCard from "./ProductSearchCard";

function orderItemToLine(item) {
  const productId = item.product?._id || item.product;
  const product =
    typeof item.product === "object" && item.product?._id
      ? {
          ...item.product,
          name: item.name || item.product.name,
          brandName: item.brandName || item.product.brandName || "",
          productImages: item.image
            ? [item.image, ...(item.product.productImages || [])]
            : item.product.productImages || [],
        }
      : {
          _id: productId,
          name: item.name,
          brandName: item.brandName || "",
          productImages: item.image ? [item.image] : [],
        };

  return {
    key: buildLineItemKey(productId, item.variantName || "", item.colorName || ""),
    product,
    quantity: item.quantity,
    variantName: item.variantName || "",
    colorName: item.colorName || "",
    snapshotPrice: item.price,
  };
}

function getLineUnitPrice(item) {
  if (item.product?.variants || item.product?.pricingTiers) {
    return getUnitPriceForQuantity(item.product, item.quantity, item.variantName);
  }
  return item.snapshotPrice ?? item.product?.price ?? 0;
}

function getQtyStep(item) {
  if (item.product?.variants || item.product?.pricingTiers) {
    return getCartAdjustStep(item.product, item.variantName);
  }
  return 1;
}

function getQtyMin(item) {
  if (item.product?.variants || item.product?.pricingTiers) {
    return getMinOrderQuantity(item.product, item.variantName);
  }
  return 1;
}

function ProductThumb({ product, className = "h-12 w-12" }) {
  const image = product?.productImages?.[0] || "";
  return (
    <div
      className={`${className} shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50`}
    >
      {image ? (
        <img src={image} alt={product?.name || "Product"} className="h-full w-full object-contain p-0.5" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">—</div>
      )}
    </div>
  );
}

function AdminOrderItemsEditor({ order, disabled, itemsEditable = true, onUpdated, onError, onSuccess }) {
  const [lineItems, setLineItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [hasSearchedProducts, setHasSearchedProducts] = useState(false);
  const [expandedProductIds, setExpandedProductIds] = useState(() => new Set());
  const [productDrafts, setProductDrafts] = useState({});
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    setLineItems((order.items || []).map(orderItemToLine));
  }, [order._id, order.updatedAt, order.items]);

  useEffect(() => {
    getStoreSettings()
      .then(({ data }) => setStoreSettings(data.data))
      .catch(() => setStoreSettings(null));
  }, []);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + getLineUnitPrice(item) * item.quantity, 0),
    [lineItems]
  );
  const deliveryCharges = useMemo(
    () => calculateShippingCharge(subtotal, storeSettings),
    [subtotal, storeSettings]
  );
  const { total } = useMemo(
    () => calculateOrderTotal(subtotal, deliveryCharges),
    [subtotal, deliveryCharges]
  );

  const addToLineItems = useCallback((product, draft) => {
    const key = buildLineItemKey(product._id, draft.variantName, draft.colorName);
    setLineItems((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        const step = getCartAdjustStep(product, draft.variantName);
        return prev.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + step } : item
        );
      }
      return [
        ...prev,
        {
          key,
          product,
          quantity: draft.quantity,
          variantName: draft.variantName || "",
          colorName: draft.colorName || "",
          snapshotPrice: getUnitPriceForQuantity(product, draft.quantity, draft.variantName),
        },
      ];
    });
    onError?.("");
  }, [onError]);

  const updateLineQty = useCallback((key, delta) => {
    setLineItems((prev) =>
      prev
        .map((item) => {
          if (item.key !== key) return item;
          const step = getQtyStep(item);
          const minQty = getQtyMin(item);
          const nextQty = item.quantity + delta * step;
          return { ...item, quantity: Math.max(minQty, nextQty) };
        })
        .filter((item) => item.quantity >= getQtyMin(item))
    );
  }, []);

  const removeLineItem = (key) => {
    setLineItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleProductSearch = async () => {
    if (!productSearch.trim()) {
      onError?.("Enter a product name or SKU to search");
      return;
    }
    try {
      setSearchingProducts(true);
      setHasSearchedProducts(true);
      setExpandedProductIds(new Set());
      const { data } = await getAllProducts({
        page: 1,
        limit: 24,
        search: productSearch.trim(),
        sortBy: "name",
        sortDir: "asc",
      });
      const products = (data.data || []).filter((product) => product.isActive !== false);
      setSearchResults(products);
      setProductDrafts(
        Object.fromEntries(
          products.map((product) => [
            product._id,
            {
              variantName: isMultiVariant(product) ? product.variants?.[0]?.name || "" : "",
              colorName: "",
              quantity: getMinOrderQuantity(
                product,
                isMultiVariant(product) ? product.variants?.[0]?.name || "" : ""
              ),
            },
          ])
        )
      );
    } catch (err) {
      onError?.(err.response?.data?.message || "Failed to search products");
      setSearchResults([]);
      setProductDrafts({});
    } finally {
      setSearchingProducts(false);
    }
  };

  const toggleProductExpand = (productId) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleSaveItems = async () => {
    if (!lineItems.length) {
      onError?.("Order must have at least one item");
      return;
    }

    try {
      setSaving(true);
      onError?.("");
      const { data } = await updateAdminOrder(order._id, {
        items: lineItems.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
          variantName: item.variantName || "",
          colorName: item.colorName || "",
        })),
      });
      onUpdated?.(data.data);
      onSuccess?.("Order items updated");
    } catch (err) {
      onError?.(err.response?.data?.message || "Failed to update order items");
    } finally {
      setSaving(false);
    }
  };

  const resetItems = () => {
    setLineItems((order.items || []).map(orderItemToLine));
    onError?.("");
  };

  const lineItemKeys = useMemo(() => new Set(lineItems.map((item) => item.key)), [lineItems]);

  return (
    <div className={cardClass}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Order Items</h3>
          {!itemsEditable ? (
            <p className="mt-1 text-[11px] text-neutral-500">
              Items can only be edited while the order is processing or earlier.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={resetItems} disabled={disabled || saving} className={btnSecondary}>
            Reset
          </button>
          <button
            type="button"
            onClick={handleSaveItems}
            disabled={disabled || saving || !lineItems.length}
            className={btnPrimary}
          >
            {saving ? "Saving..." : "Save items"}
          </button>
        </div>
      </div>

      {lineItems.length ? (
        <div className="space-y-3">
          {lineItems.map((item) => {
            const unitPrice = getLineUnitPrice(item);
            const step = getQtyStep(item);
            return (
              <div
                key={item.key}
                className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-2.5 md:hidden"
              >
                <div className="flex items-start gap-2">
                  <ProductThumb product={item.product} className="h-10 w-10" />
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-semibold text-text-primary">{item.product.name}</p>
                      {item.variantName ? (
                        <p className="text-[10px] text-text-secondary">{item.variantName}</p>
                      ) : null}
                      {item.colorName ? (
                        <p className="text-[10px] text-text-secondary">{item.colorName}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.key)}
                      disabled={disabled || saving}
                      className={`${btnSecondary} !px-2 !py-1 text-[10px]`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pl-[2.875rem]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateLineQty(item.key, -1)}
                      disabled={disabled || saving}
                      className={`${btnSecondary} !px-2 !py-1 text-xs`}
                    >
                      −
                    </button>
                    <span className="min-w-[1.75rem] text-center text-xs font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateLineQty(item.key, 1)}
                      disabled={disabled || saving}
                      className={`${btnSecondary} !px-2 !py-1 text-xs`}
                    >
                      +
                    </button>
                    {step > 1 ? (
                      <span className="text-[10px] text-text-secondary">Step {step}</span>
                    ) : null}
                  </div>
                  <div className="text-right text-[10px] sm:text-xs">
                    <p className="text-text-secondary">{formatPrice(unitPrice)} each</p>
                    <p className="text-xs font-semibold text-text-primary">
                      {formatPrice(unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className={`hidden md:block ${adminTableWrapperClass}`}>
            <table className={adminCompactTableClass}>
              <thead>
                <tr className={adminTableHeaderClass}>
                  <th className={adminCompactThClass}>Image</th>
                  <th className={adminCompactThClass}>Product</th>
                  <th className={adminCompactThClass}>Variant</th>
                  <th className={adminCompactThClass}>Qty</th>
                  <th className={adminCompactThClass}>Price</th>
                  <th className={adminCompactThClass}>Total</th>
                  <th className={adminCompactThClass}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => {
                  const unitPrice = getLineUnitPrice(item);
                  const step = getQtyStep(item);
                  return (
                    <tr key={item.key} className="border-b border-neutral-100 last:border-0">
                      <td className={adminCompactTdClass}>
                        <ProductThumb product={item.product} className="h-8 w-8" />
                      </td>
                      <td className={`${adminCompactTdClass} text-xs font-medium text-neutral-900`}>
                        <span className="line-clamp-2">{item.product.name}</span>
                        {item.colorName ? (
                          <span className="block truncate text-[10px] text-neutral-500">
                            {item.colorName}
                          </span>
                        ) : null}
                      </td>
                      <td className={`${adminCompactTdClass} text-[10px] text-neutral-600`}>
                        {item.variantName || "—"}
                      </td>
                      <td className={adminCompactTdClass}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateLineQty(item.key, -1)}
                            disabled={disabled || saving}
                            className={btnSecondary}
                          >
                            −
                          </button>
                          <span className="min-w-[1.75rem] text-center text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateLineQty(item.key, 1)}
                            disabled={disabled || saving}
                            className={btnSecondary}
                          >
                            +
                          </button>
                        </div>
                        {step > 1 ? (
                          <span className="mt-1 block text-[10px] text-neutral-500">Step: {step}</span>
                        ) : null}
                      </td>
                      <td className={`${adminCompactTdClass} text-xs`}>{formatPrice(unitPrice)}</td>
                      <td className={`${adminCompactTdClass} text-xs font-medium`}>
                        {formatPrice(unitPrice * item.quantity)}
                      </td>
                      <td className={adminCompactTdClass}>
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.key)}
                          disabled={disabled || saving}
                          className={btnSecondary}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">No items in this order. Add products below.</p>
      )}

      <div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-3 sm:p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Add products</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleProductSearch()}
            placeholder="Search by name or SKU"
            className={adminFilterInputClass}
            disabled={disabled || saving}
          />
          <button
            type="button"
            onClick={handleProductSearch}
            disabled={disabled || saving || searchingProducts}
            className={btnSecondary}
          >
            {searchingProducts ? "Searching..." : "Search"}
          </button>
        </div>

        {hasSearchedProducts && !searchResults.length && !searchingProducts ? (
          <p className="mt-3 text-sm text-neutral-500">No products found.</p>
        ) : null}

        {searchResults.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {searchResults.map((product) => {
              const draft = productDrafts[product._id] || {
                variantName: "",
                colorName: "",
                quantity: 1,
              };
              const key = buildLineItemKey(product._id, draft.variantName, draft.colorName);
              return (
                <ProductSearchCard
                  key={product._id}
                  product={product}
                  draft={draft}
                  isExpanded={expandedProductIds.has(product._id)}
                  isInOrder={lineItemKeys.has(key)}
                  disabled={disabled || saving}
                  onToggleExpand={() => toggleProductExpand(product._id)}
                  onQuickAdd={() => addToLineItems(product, draft)}
                  onDraftChange={(nextDraft) =>
                    setProductDrafts((prev) => ({ ...prev, [product._id]: nextDraft }))
                  }
                  onConfirmAdd={(p, d) => {
                    addToLineItems(p, d);
                    setExpandedProductIds((prev) => {
                      const next = new Set(prev);
                      next.delete(p._id);
                      return next;
                    });
                  }}
                  onError={onError}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal (preview)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Delivery</span>
          <span>{deliveryCharges === 0 ? "Free" : formatPrice(deliveryCharges)}</span>
        </div>
        <div className="flex justify-between font-bold text-neutral-900">
          <span>Total (preview)</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}

export default AdminOrderItemsEditor;
