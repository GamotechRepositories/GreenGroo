import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductImageFrame from "../components/product/ProductImageFrame";
import ImportantMessageCards from "../components/cart/ImportantMessageCards";
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
  const btnClass = compact
    ? "flex h-7 w-7 items-center justify-center text-base font-semibold text-[#0C831F] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
    : "flex h-8 w-8 items-center justify-center text-base font-semibold text-[#0C831F] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40";
  const qtyClass = compact
    ? "flex h-7 min-w-[1.75rem] items-center justify-center border-x border-emerald-200 px-1 text-xs font-bold text-slate-900"
    : "flex h-8 min-w-[2rem] items-center justify-center border-x border-emerald-200 px-2 text-sm font-bold text-slate-900";

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-emerald-200 bg-white">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        aria-label="Decrease quantity"
        className={btnClass}
      >
        −
      </button>
      <span className={qtyClass}>{quantity}</span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        aria-label="Increase quantity"
        className={btnClass}
      >
        +
      </button>
    </div>
  );
}

function CartItemMobile({ item, loading, onRemove, onIncrease, onDecrease }) {
  const lineTotal = item.discountedPrice * item.quantity;

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="relative flex items-start gap-3">
        <button
          type="button"
          onClick={() => onRemove(item._id, item.variantName, item.colorName)}
          className="absolute -right-1 -top-1 z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-rose-500"
          aria-label="Remove item"
        >
          ×
        </button>

        <Link
          to={`/product/${item._id}`}
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 sm:h-24 sm:w-24"
        >
          {item.productImages?.[0] ? (
            <img
              src={item.productImages[0]}
              alt={item.name}
              className="max-h-full max-w-full object-contain"
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
            <p className="mt-0.5 text-xs text-text-secondary">
              {item.quantity} × {formatPrice(item.discountedPrice)}
            </p>
          </Link>

          {item.variantName || item.colorName ? (
            <div className="mt-1">
              {item.variantName ? (
                <span className="block text-xs font-medium text-text-secondary">
                  Variant: {item.variantName}
                </span>
              ) : null}
              {item.colorName ? (
                <span className="block text-xs font-medium text-text-secondary">
                  Color: {item.colorName}
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

function CartItemDesktop({ item, loading, onRemove, onIncrease, onDecrease }) {
  const lineTotal = item.discountedPrice * item.quantity;

  return (
    <li className="relative border-b border-border-light px-5 py-5 last:border-b-0">
      <button
        type="button"
        onClick={() => onRemove(item._id, item.variantName, item.colorName)}
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center text-lg leading-none text-text-muted transition hover:text-red-500"
        aria-label="Remove item"
      >
        ×
      </button>

      <div className="flex items-center gap-4 pr-10">
        <Link
          to={`/product/${item._id}`}
          className="w-20 shrink-0 overflow-hidden rounded-lg border border-border-light"
        >
          <ProductImageFrame src={item.productImages?.[0]} alt={item.name} />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to={`/product/${item._id}`}
            className="block transition hover:text-primary"
          >
            <p className="line-clamp-2 text-base font-bold text-text-primary">{item.name}</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              {item.quantity} × {formatPrice(item.discountedPrice)}
            </p>
            {item.variantName ? (
              <span className="mt-1 block text-xs font-medium text-text-secondary">
                Variant: {item.variantName}
              </span>
            ) : null}
            {item.colorName ? (
              <span className="mt-1 block text-xs font-medium text-text-secondary">
                Color: {item.colorName}
              </span>
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
        {items.map((item) => (
          <CartItemMobile
            key={`${item._id}-${item.variantName || "default"}-${item.colorName || "default"}`}
            item={item}
            loading={loading}
            onRemove={onRemove}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
          />
        ))}
      </div>

      <div className="hidden rounded-xl border border-border-light bg-white shadow-sm lg:block">
        <div className="border-b border-border-light px-5 py-4">
          <h2 className="text-base font-bold text-text-primary">Cart Items ({itemCount})</h2>
        </div>
        <ul>
          {items.map((item) => (
            <CartItemDesktop
              key={`${item._id}-${item.variantName || "default"}-${item.colorName || "default"}`}
              item={item}
              loading={loading}
              onRemove={onRemove}
              onIncrease={onIncrease}
              onDecrease={onDecrease}
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
  const shipping = calculateShippingCharge(subtotal, storeSettings);
  const { total } = calculateOrderTotal(subtotal, shipping);
  const hasItems = items.length > 0;
  const canCheckout = hasItems && meetsMinimumOrder(subtotal, storeSettings);
  const shortfall = getMinimumOrderShortfall(subtotal, storeSettings);
  const minimumOrderValue = mergeStoreSettings(storeSettings).minimumOrderValue;

  return (
    <div className="rounded-xl border border-border-light bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold text-text-primary sm:text-lg">Order Summary</h2>

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
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800 sm:text-xs">
            Add {formatPrice(shortfall, 0)} more to reach the minimum order of{" "}
            {formatPrice(minimumOrderValue, 0)}.
          </p>
        ) : null}
      </div>

      <hr className="my-4 border-border-light" />

      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-text-primary sm:text-lg">Total</span>
        <span className="text-lg font-bold text-text-primary sm:text-xl">{formatPrice(total)}</span>
      </div>

      {canCheckout ? (
        user ? (
          <Link
            to="/checkout"
            onClick={() => clearBuyNowCheckout()}
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#0C831F] px-3 py-3 text-sm font-bold text-white transition hover:bg-[#0a6e1a]"
          >
            Proceed to checkout
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#0C831F] px-3 py-3 text-sm font-bold text-white transition hover:bg-[#0a6e1a]"
          >
            Login to checkout
          </button>
        )
      ) : (
        <button
          type="button"
          disabled
          className="mt-4 flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-[#0C831F] px-3 py-3 text-sm font-bold text-white opacity-50"
        >
          Proceed to checkout
        </button>
      )}

      <Link
        to="/"
        className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Continue shopping
      </Link>
    </div>
  );
}

function CartSidebar({ items, storeSettings }) {
  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <ImportantMessageCards settings={storeSettings} />
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
            <h1 className="text-xl font-bold sm:text-2xl lg:text-3xl">{pageTitle}</h1>
            {items.length > 0 ? (
              <button
                type="button"
                onClick={handleClearCart}
                disabled={clearing || loading}
                className="text-sm font-semibold text-red-500 transition hover:text-red-600 disabled:opacity-50"
              >
                Clear Cart
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
              <div className="h-72 animate-pulse rounded-xl border border-border-light bg-white" />
              <div className="h-80 animate-pulse rounded-xl border border-border-light bg-white" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">
                🛒
              </div>
              <h2 className="text-lg font-bold text-slate-900">Your cart is empty</h2>
              <p className="mt-1 text-sm text-slate-500">Add fresh items and they’ll show up here.</p>
              <Link
                to="/"
                className="mt-6 inline-flex rounded-xl bg-[#0C831F] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#0a6e1a]"
              >
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
              <CartSidebar items={items} storeSettings={storeSettings} />
            </div>
          )}
        </div>
      </section>

      {items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-[56px] z-30 border-t border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur lg:hidden">
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
                  className="ml-auto rounded-xl bg-[#0C831F] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Checkout
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="ml-auto rounded-xl bg-[#0C831F] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Login
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
