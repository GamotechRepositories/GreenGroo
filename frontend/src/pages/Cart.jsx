import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductImageFrame from "../components/product/ProductImageFrame";
import { getStoreSettings } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { clearBuyNowCheckout } from "../utils/checkoutSession";
import {
  getCartStepForItem,
  getDecreasedCartQuantityForItem,
} from "../utils/cartDefaults";
import {
  calculateShippingCharge,
  getMinimumOrderShortfall,
  meetsMinimumOrder,
  mergeStoreSettings,
} from "../utils/orderSettings";
import { calculateOrderTotal } from "../utils/gst";

const formatPrice = (amount, fractionDigits = 2) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);

function QuantityControl({ quantity, onDecrease, onIncrease, disabled, compact = false }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        aria-label="Decrease quantity"
        className={`flex items-center justify-center text-base font-bold text-[#0C831F] transition-all hover:bg-emerald-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${
          compact ? "h-7 w-7" : "h-8 w-8"
        }`}
      >
        −
      </button>
      <span
        className={`flex items-center justify-center border-x border-emerald-200 font-bold text-slate-900 ${
          compact
            ? "h-7 min-w-[1.75rem] px-1 text-xs"
            : "h-8 min-w-[2rem] px-2 text-sm"
        }`}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        aria-label="Increase quantity"
        className={`flex items-center justify-center text-base font-bold text-[#0C831F] transition-all hover:bg-emerald-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${
          compact ? "h-7 w-7" : "h-8 w-8"
        }`}
      >
        +
      </button>
    </div>
  );
}

function CartItemMobile({ item, loading, onRemove, onIncrease, onDecrease, index }) {
  const lineTotal = item.discountedPrice * item.quantity;
  const hasDiscount = item.price && item.price > item.discountedPrice;

  return (
    <article
      className="cart-item-enter rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:shadow-md"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative flex items-start gap-3">
        <button
          type="button"
          onClick={() => onRemove(item._id, item.variantName, item.colorName)}
          className="absolute -right-1 -top-1 z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500 hover:scale-110"
          aria-label="Remove item"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <Link
          to={`/product/${item._id}`}
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100 transition-all hover:ring-emerald-200 hover:shadow-sm sm:h-24 sm:w-24"
        >
          {item.productImages?.[0] ? (
            <img
              src={item.productImages[0]}
              alt={item.name}
              className="max-h-full max-w-full object-contain transition-transform hover:scale-105"
            />
          ) : (
            <div className="h-full w-full rounded-md bg-mobile-surface" />
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-center pr-6">
          <Link to={`/product/${item._id}`} className="block">
            <p className="line-clamp-2 text-base font-bold leading-snug text-text-primary">
              {item.name}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-xs text-text-secondary">
                {item.quantity} × {formatPrice(item.discountedPrice)}
              </span>
              {hasDiscount && (
                <span className="text-[10px] text-slate-400 line-through">
                  {formatPrice(item.price)}
                </span>
              )}
            </div>
          </Link>

          {item.variantName || item.colorName ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {item.variantName ? (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-text-secondary ring-1 ring-slate-100">
                  {item.variantName}
                </span>
              ) : null}
              {item.colorName ? (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-text-secondary ring-1 ring-slate-100">
                  {item.colorName}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-2 flex items-center justify-between gap-2">
            <QuantityControl
              quantity={item.quantity}
              disabled={loading}
              compact
              onDecrease={() => onDecrease(item)}
              onIncrease={() => onIncrease(item)}
            />
            <p className="shrink-0 text-base font-bold text-text-primary">
              {formatPrice(lineTotal)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function CartItemDesktop({ item, loading, onRemove, onIncrease, onDecrease, index }) {
  const lineTotal = item.discountedPrice * item.quantity;
  const hasDiscount = item.price && item.price > item.discountedPrice;

  return (
    <li
      className="cart-item-enter group relative border-b border-border-light px-5 py-5 transition-all last:border-b-0 hover:bg-emerald-50/30"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Hover accent bar */}
      <div className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-[#0C831F] opacity-0 transition-opacity group-hover:opacity-100" />

      <button
        type="button"
        onClick={() => onRemove(item._id, item.variantName, item.colorName)}
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-all hover:bg-rose-50 hover:text-rose-500 hover:scale-110"
        aria-label="Remove item"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-center gap-4 pr-10">
        <Link
          to={`/product/${item._id}`}
          className="w-20 shrink-0 overflow-hidden rounded-lg border border-border-light transition-all hover:shadow-md hover:ring-1 hover:ring-emerald-200"
        >
          <ProductImageFrame src={item.productImages?.[0]} alt={item.name} />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to={`/product/${item._id}`}
            className="block transition hover:text-primary"
          >
            <p className="line-clamp-2 text-base font-bold text-text-primary">{item.name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-xs text-text-secondary">
                {item.quantity} × {formatPrice(item.discountedPrice)}
              </span>
              {hasDiscount && (
                <span className="text-[10px] text-slate-400 line-through">
                  {formatPrice(item.price)}
                </span>
              )}
            </div>
            {item.variantName || item.colorName ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {item.variantName ? (
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-text-secondary ring-1 ring-slate-100">
                    {item.variantName}
                  </span>
                ) : null}
                {item.colorName ? (
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-text-secondary ring-1 ring-slate-100">
                    {item.colorName}
                  </span>
                ) : null}
              </div>
            ) : null}
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <QuantityControl
            quantity={item.quantity}
            disabled={loading}
            onDecrease={() => onDecrease(item)}
            onIncrease={() => onIncrease(item)}
          />
          <p className="min-w-[4.5rem] text-right text-base font-bold text-text-primary">
            {formatPrice(lineTotal)}
          </p>
        </div>
      </div>
    </li>
  );
}

function CartItemsSection({ items, loading, onRemove, onIncrease, onDecrease }) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <div className="space-y-3 lg:hidden">
        {items.map((item, index) => (
          <CartItemMobile
            key={`${item._id}-${item.variantName || "default"}-${item.colorName || "default"}`}
            item={item}
            loading={loading}
            onRemove={onRemove}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
            index={index}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border-light bg-white shadow-sm lg:block">
        <div className="border-b border-border-light bg-gradient-to-r from-emerald-50/80 to-white px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
            <svg className="h-5 w-5 text-[#0C831F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Cart Items ({itemCount})
          </h2>
        </div>
        <ul>
          {items.map((item, index) => (
            <CartItemDesktop
              key={`${item._id}-${item.variantName || "default"}-${item.colorName || "default"}`}
              item={item}
              loading={loading}
              onRemove={onRemove}
              onIncrease={onIncrease}
              onDecrease={onDecrease}
              index={index}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function OrderSummary({ items, storeSettings }) {
  const { user, openAuthModal } = useAuth();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.discountedPrice * item.quantity,
    0
  );
  const originalSubtotal = items.reduce(
    (sum, item) => sum + (item.price || item.discountedPrice) * item.quantity,
    0
  );
  const totalSavings = Math.max(0, originalSubtotal - subtotal);
  const shipping = calculateShippingCharge(subtotal, storeSettings);
  const { total } = calculateOrderTotal(subtotal, shipping);
  const hasItems = items.length > 0;
  const canCheckout = hasItems && meetsMinimumOrder(subtotal, storeSettings);
  const shortfall = getMinimumOrderShortfall(subtotal, storeSettings);
  const minimumOrderValue = mergeStoreSettings(storeSettings).minimumOrderValue;

  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-white shadow-sm">
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#0C831F] via-emerald-400 to-[#0C831F]" />

      <div className="p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-text-primary sm:text-lg">
          <svg className="h-5 w-5 text-[#0C831F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Order Summary
        </h2>

        {totalSavings > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <span className="float-badge text-sm">✨</span>
            You save {formatPrice(totalSavings)} on this order!
          </div>
        )}

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between text-text-secondary">
            <span>Subtotal ({itemCount} items)</span>
            <span className="font-medium text-text-primary">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-text-secondary">
            <span>Shipping Charges</span>
            <span className="font-medium text-text-primary">{formatPrice(shipping)}</span>
          </div>
          {!canCheckout && hasItems ? (
            <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200/60 sm:text-xs">
              <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Add {formatPrice(shortfall, 0)} more to reach the minimum order of{" "}
              {formatPrice(minimumOrderValue, 0)}.
            </p>
          ) : null}
        </div>

        <hr className="my-4 border-border-light" />

        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-text-primary sm:text-lg">Total</span>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#0C831F] pulse-glow" />
            <span className="text-lg font-bold text-text-primary sm:text-xl">{formatPrice(total)}</span>
          </div>
        </div>

        {canCheckout ? (
          user ? (
            <Link
              to="/checkout"
              onClick={() => clearBuyNowCheckout()}
              className="pulse-glow mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0C831F] to-[#16a34a] px-3 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5M4.5 10.5h15v8.25a1.5 1.5 0 01-1.5 1.5h-12a1.5 1.5 0 01-1.5-1.5V10.5z" />
              </svg>
              Proceed to checkout
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="pulse-glow mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0C831F] to-[#16a34a] px-3 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Login to checkout
            </button>
          )
        ) : (
          <button
            type="button"
            disabled
            className="mt-4 flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-[#0C831F] px-3 py-3.5 text-sm font-bold text-white opacity-50"
          >
            Proceed to checkout
          </button>
        )}

        <Link
          to="/"
          className="group/shop mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
        >
          <svg className="h-4 w-4 transition-transform group-hover/shop:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

function CartSidebarSection({ items, storeSettings }) {
  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <OrderSummary items={items} storeSettings={storeSettings} />
    </div>
  );
}

function Cart() {
  const { user, openAuthModal } = useAuth();
  const { items, removeFromCart, incrementCartItem, decrementCartItem, loading, loadCart } =
    useCart();
  const [clearing, setClearing] = useState(false);
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    clearBuyNowCheckout();
    if (user) loadCart();
  }, [user, loadCart]);

  useEffect(() => {
    let active = true;
    getStoreSettings()
      .then(({ data }) => {
        if (active) setStoreSettings(data.data);
      })
      .catch(() => {
        if (active) setStoreSettings(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleClearCart = async () => {
    if (!items.length || clearing) return;

    const confirmed = window.confirm("Are you sure you want to clear your cart?");
    if (!confirmed) return;

    setClearing(true);
    try {
      // Delete sequentially to avoid concurrent cart document writes on backend.
      for (const item of items) {
        await removeFromCart(item._id, item.variantName, item.colorName);
      }
    } finally {
      setClearing(false);
    }
  };

  const pageTitle = "My Cart";

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.discountedPrice * item.quantity,
    0
  );
  const shipping = calculateShippingCharge(subtotal, storeSettings);
  const { total } = calculateOrderTotal(subtotal, shipping);
  const canCheckout = items.length > 0 && meetsMinimumOrder(subtotal, storeSettings);

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900">
      <section className="px-3 pb-28 pt-4 sm:px-4 sm:pb-10 sm:pt-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0C831F] to-emerald-400 text-white shadow-md">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold sm:text-2xl lg:text-3xl">{pageTitle}</h1>
            </div>
            {items.length > 0 ? (
              <button
                type="button"
                onClick={handleClearCart}
                disabled={clearing || loading}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-500 transition-all hover:bg-red-100 hover:border-red-300 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Cart
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="shimmer-loading h-24 rounded-xl border border-border-light" />
                ))}
              </div>
              <div className="shimmer-loading h-80 rounded-xl border border-border-light" />
            </div>
          ) : items.length === 0 ? (
            <div className="scale-in rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-emerald-50/30 px-6 py-16 text-center shadow-sm">
              <div className="bounce-gentle mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-4xl shadow-sm">
                🛒
              </div>
              <h2 className="text-xl font-bold text-slate-900">Your cart is empty</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
                Looks like you haven't added any fresh items yet. Start exploring and add them here!
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0C831F] to-[#16a34a] px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
              <CartItemsSection
                items={items}
                loading={loading || clearing}
                onRemove={removeFromCart}
                onIncrease={(item) =>
                  incrementCartItem({
                    productId: item._id,
                    variantName: item.variantName || "",
                    colorName: item.colorName || "",
                    step: getCartStepForItem(item),
                  })
                }
                onDecrease={(item) =>
                  decrementCartItem({
                    productId: item._id,
                    variantName: item.variantName || "",
                    colorName: item.colorName || "",
                    resolveNextQuantity: (currentQty) =>
                      getDecreasedCartQuantityForItem({ ...item, quantity: currentQty }),
                  })
                }
              />
              <CartSidebarSection items={items} storeSettings={storeSettings} />
            </div>
          )}
        </div>
      </section>

      {items.length > 0 ? (
        <div className="glass-bar fixed inset-x-0 bottom-[56px] z-30 px-3 py-2.5 lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900">{formatPrice(total)}</p>
              <p className="text-[11px] text-slate-500">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>
            {canCheckout ? (
              user ? (
                <Link
                  to="/checkout"
                  onClick={() => clearBuyNowCheckout()}
                  className="ml-auto flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0C831F] to-[#16a34a] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.97]"
                >
                  Checkout
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="ml-auto flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0C831F] to-[#16a34a] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.97]"
                >
                  Login
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )
            ) : (
              <button
                type="button"
                disabled
                className="ml-auto rounded-xl bg-[#0C831F] px-5 py-2.5 text-sm font-bold text-white opacity-50"
              >
                Checkout
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Cart;
