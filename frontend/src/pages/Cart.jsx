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
    ? "flex h-6 w-6 items-center justify-center text-sm text-text-secondary transition hover:bg-mobile-surface disabled:cursor-not-allowed disabled:opacity-40"
    : "flex h-8 w-8 items-center justify-center text-text-secondary transition hover:bg-mobile-surface disabled:cursor-not-allowed disabled:opacity-40";
  const qtyClass = compact
    ? "flex h-6 min-w-[1.5rem] items-center justify-center border-x border-border-light px-1 text-xs font-semibold text-text-primary"
    : "flex h-8 min-w-[2rem] items-center justify-center border-x border-border-light px-2 text-sm font-semibold text-text-primary";

  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-border-light bg-white">
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
    <article className="min-h-[9rem] rounded-xl border border-border-light bg-white p-3 shadow-sm sm:min-h-[10rem] sm:p-4">
      <div className="relative flex items-stretch gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onRemove(item._id, item.variantName, item.colorName)}
          className="absolute right-0 top-0 z-10 flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none text-text-muted transition hover:text-red-500"
          aria-label="Remove item"
        >
          ×
        </button>

        <Link
          to={`/product/${item._id}`}
          className="flex h-28 w-28 shrink-0 items-center justify-center sm:h-32 sm:w-32"
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
        <Link
          to="/checkout"
          onClick={() => clearBuyNowCheckout()}
          className="mt-4 flex w-full items-center justify-center rounded-md bg-primary px-3 py-2.5 text-xs font-bold text-white transition hover:brightness-110 sm:text-sm"
        >
          Proceed to Checkout
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-4 flex w-full cursor-not-allowed items-center justify-center rounded-md bg-primary px-3 py-2.5 text-xs font-bold text-white opacity-50 sm:text-sm"
        >
          Proceed to Checkout
        </button>
      )}

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Link
          to="/product"
          className="flex items-center justify-center gap-1 whitespace-nowrap rounded-md border border-border-light px-2 py-1.5 text-[11px] font-bold leading-none text-text-primary transition hover:border-primary hover:text-primary sm:text-xs"
        >
          <svg className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          Continue Shopping
        </Link>

        <Link
          to="/support"
          className="flex items-center justify-center gap-1 whitespace-nowrap rounded-md border border-primary px-2 py-1.5 text-[11px] font-bold leading-none text-primary transition hover:bg-primary/5 sm:text-xs"
          title="Support"
        >
          <svg className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
          Support
        </Link>
      </div>
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

  const pageTitle = "Shopping Cart";

  if (!user) {
    return (
      <div className="min-h-[60vh] bg-mobile-bg px-4 py-16 text-text-primary sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-3 text-2xl font-bold sm:text-3xl">{pageTitle}</h1>
          <p className="mb-6 text-text-secondary">
            Please login to view your cart and bulk orders.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-bold tracking-wide text-white transition hover:brightness-110"
          >
            Login / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mobile-bg text-text-primary">
      <section className="px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
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
            <div className="rounded-xl border border-border-light bg-white py-16 text-center shadow-sm">
              <p className="mb-6 text-text-secondary">Your cart is empty.</p>
              <Link
                to="/product"
                className="inline-block rounded-lg bg-primary px-8 py-3 text-sm font-bold tracking-wide text-white transition hover:brightness-110"
              >
                Browse Products
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
    </div>
  );
}

export default Cart;
