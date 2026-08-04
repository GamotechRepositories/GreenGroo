import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ProductImageFrame from "../components/product/ProductImageFrame";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  getAddresses,
  addAddress,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getStoreSettings,
  createCheckoutAttempt,
  validateCoupon,
} from "../api/api";
import { loadRazorpayScript, openRazorpayCheckout } from "../utils/razorpay";
import AddressForm, { ADDRESS_FORM_FIELDS } from "../components/address/AddressForm";
import {
  clearBuyNowCheckout,
  getBuyNowCheckout,
} from "../utils/checkoutSession";
import {
  formatAddressLine,
  getAddressFullName,
} from "../utils/addressDisplay";
import {
  calculateShippingCharge,
  getMinimumOrderShortfall,
  meetsMinimumOrder,
  mergeStoreSettings,
} from "../utils/orderSettings";
import { calculateOrderTotal } from "../utils/gst";
import {
  calculateAdvanceAmount,
  calculatePayableAmount,
  getCheckoutPaymentMethod,
  PAYMENT_PLAN,
} from "../utils/payment";

const MAX_ORDER_NOTE_LENGTH = 200;

const formatPrice = (amount, fractionDigits = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);

const safeTrim = (value) => String(value ?? "").trim();

function StepSection({ title, children }) {
  return (
    <div className="rounded-xl border border-border-light bg-white p-3 shadow-sm sm:p-5 lg:p-6">
      <h2 className="mb-3 text-sm font-bold text-text-primary sm:mb-5 sm:text-base lg:text-lg">
        {title}
      </h2>
      {children}
    </div>
  );
}

function CheckoutModal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 sm:items-center sm:px-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border-light px-4 py-3 sm:px-5">
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary transition hover:bg-mobile-surface hover:text-text-primary"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-border-light px-4 py-3 sm:px-5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

function AddressSummary({ address }) {
  return (
    <div className="rounded-xl border border-border-light p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold text-text-primary">{getAddressFullName(address)}</p>
        {address.isDefault ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Default
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-text-secondary">{formatAddressLine(address)}</p>
      <p className="text-text-secondary">+91 {address.number}</p>
    </div>
  );
}

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const { items, loading: cartLoading, loadCart, resetCart } = useCart();

  const buyNowItem = getBuyNowCheckout();
  const isBuyNow = Boolean(buyNowItem);
  const checkoutItems = isBuyNow ? [buyNowItem] : items;
  const checkoutItemsPayload = useMemo(
    () =>
      checkoutItems.map((item) => ({
        productId: item.productId || item._id,
        quantity: item.quantity,
        variantName: item.variantName || "",
        colorName: item.colorName || "",
      })),
    [checkoutItems]
  );

  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState(PAYMENT_PLAN.ADVANCE);
  const paymentMethod = getCheckoutPaymentMethod(paymentPlan);
  const [formError, setFormError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [orderSuccessNote, setOrderSuccessNote] = useState("");
  const [message, setMessage] = useState("");
  const [storeSettings, setStoreSettings] = useState(null);
  const [attemptedOrderId, setAttemptedOrderId] = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const messageRef = useRef("");
  const attemptedOrderIdRef = useRef(null);
  const appliedCouponRef = useRef(null);
  const hasAutoOpenedAddressRef = useRef(false);

  const checkoutAttemptKey = useMemo(
    () =>
      JSON.stringify({
        addressId: selectedAddressId,
        paymentMethod,
        paymentPlan,
        items: checkoutItems.map((item) => ({
          productId: item.productId || item._id,
          quantity: item.quantity,
          variantName: item.variantName || "",
          colorName: item.colorName || "",
        })),
        couponCode: appliedCoupon?.code || "",
      }),
    [selectedAddressId, paymentMethod, paymentPlan, checkoutItems, appliedCoupon]
  );

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    attemptedOrderIdRef.current = attemptedOrderId;
  }, [attemptedOrderId]);

  useEffect(() => {
    appliedCouponRef.current = appliedCoupon;
  }, [appliedCoupon]);

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.discountedPrice * item.quantity,
    0
  );
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const deliveryCharges = calculateShippingCharge(subtotal, storeSettings);
  const { total: orderTotal } = calculateOrderTotal(discountedSubtotal, deliveryCharges);
  const payableNow = calculatePayableAmount(orderTotal, paymentPlan);
  const balanceOnDelivery = Math.max(0, Math.round((orderTotal - payableNow) * 100) / 100);
  const minimumOrderMet = meetsMinimumOrder(subtotal, storeSettings);
  const minimumOrderShortfall = getMinimumOrderShortfall(subtotal, storeSettings);
  const minimumOrderValue = mergeStoreSettings(storeSettings).minimumOrderValue;
  const savings = checkoutItems.reduce((sum, item) => {
    const original = item.price ?? item.discountedPrice;
    const diff = Math.max(0, original - item.discountedPrice);
    return sum + diff * item.quantity;
  }, 0);

  const loadAddresses = async () => {
    setAddressesLoading(true);
    try {
      const { data } = await getAddresses();
      const list = data.data || [];
      setAddresses(list);
      const defaultAddr = list.find((a) => a.isDefault) || list[0];
      if (defaultAddr) setSelectedAddressId(defaultAddr._id);
    } catch {
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      setBootstrapping(true);
      return;
    }

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
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) {
      setBootstrapping(true);
      return;
    }

    if (user) {
      const bootstrap = async () => {
        setBootstrapping(true);
        try {
          await Promise.all([loadCart(), loadAddresses()]);
        } finally {
          setBootstrapping(false);
        }
      };
      bootstrap();
    } else {
      setBootstrapping(false);
    }
  }, [user, authLoading, loadCart]);

  useEffect(() => {
    if (addressesLoading || hasAutoOpenedAddressRef.current) return;

    hasAutoOpenedAddressRef.current = true;
    if (addresses.length === 0) {
      setShowAddressForm(true);
    } else if (!selectedAddressId) {
      setShowAddressPicker(true);
    }
  }, [addressesLoading, addresses.length, selectedAddressId]);

  useEffect(() => {
    if (
      !authLoading &&
      user &&
      !bootstrapping &&
      !cartLoading &&
      checkoutItems.length === 0 &&
      !orderPlaced
    ) {
      navigate(isBuyNow ? "/product" : "/cart", { replace: true });
    }
  }, [
    authLoading,
    user,
    bootstrapping,
    cartLoading,
    checkoutItems.length,
    navigate,
    orderPlaced,
    isBuyNow,
  ]);

  const syncCheckoutAttempt = useCallback(async () => {
    if (authLoading || bootstrapping || !user || orderPlaced || checkoutItems.length === 0) {
      return attemptedOrderIdRef.current;
    }

    try {
      const { data } = await createCheckoutAttempt({
        addressId: selectedAddressId || undefined,
        paymentMethod,
        checkoutItems: checkoutItemsPayload,
        checkoutMode: isBuyNow ? "buyNow" : "cart",
        buyNow: isBuyNow,
        couponCode: appliedCouponRef.current?.code || undefined,
      });
      const orderId = data?.data?._id;
      if (orderId) {
        setAttemptedOrderId(orderId);
        attemptedOrderIdRef.current = orderId;
        return orderId;
      }
    } catch (err) {
      console.warn("Checkout attempt sync failed:", err.response?.data?.message || err.message);
    }

    return attemptedOrderIdRef.current;
  }, [
    authLoading,
    bootstrapping,
    user,
    orderPlaced,
    checkoutItems.length,
    selectedAddressId,
    paymentMethod,
    checkoutItemsPayload,
    isBuyNow,
  ]);

  useEffect(() => {
    syncCheckoutAttempt();
  }, [syncCheckoutAttempt, checkoutAttemptKey]);

  useEffect(() => {
    if (!appliedCoupon?.code) return undefined;

    let active = true;
    validateCoupon({ code: appliedCoupon.code, subtotal })
      .then(({ data }) => {
        if (!active) return;
        setAppliedCoupon(data.data);
        setCouponError("");
      })
      .catch((err) => {
        if (!active) return;
        setAppliedCoupon(null);
        setCouponError(err.response?.data?.message || "Coupon is no longer valid");
      });

    return () => {
      active = false;
    };
  }, [subtotal, appliedCoupon?.code]);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Enter a coupon code");
      return;
    }

    setApplyingCoupon(true);
    setCouponError("");
    try {
      const { data } = await validateCoupon({ code, subtotal });
      setAppliedCoupon(data.data);
      setCouponInput(data.data.code);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  useEffect(() => {
    const code = String(location.state?.applyCouponCode || "").trim().toUpperCase();
    if (!code || authLoading || !user || subtotal <= 0) return;

    let active = true;

    validateCoupon({ code, subtotal })
      .then(({ data }) => {
        if (!active) return;
        setAppliedCoupon(data.data);
        setCouponInput(data.data.code);
        setCouponError("");
      })
      .catch((err) => {
        if (!active) return;
        setCouponError(err.response?.data?.message || "Invalid coupon code");
      })
      .finally(() => {
        navigate(location.pathname, { replace: true, state: null });
      });

    return () => {
      active = false;
    };
  }, [location.state?.applyCouponCode, authLoading, user, subtotal, navigate, location.pathname]);

  const completeOrderSuccess = async (note = "") => {
    setOrderSuccessNote(
      note || "Your order has been placed and will be delivered soon."
    );
    setOrderPlaced(true);
    clearBuyNowCheckout();
    resetCart();
    await loadCart();
    setShowSuccessModal(true);
  };

  const handleRazorpayPayment = async () => {
    const paymentMode = paymentPlan;

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error("Failed to load payment gateway");
    }

    const { data } = await createRazorpayOrder({
      addressId: selectedAddressId,
      paymentMode,
      checkoutItems: checkoutItemsPayload,
      checkoutMode: isBuyNow ? "buyNow" : "cart",
      buyNow: isBuyNow,
      couponCode: appliedCouponRef.current?.code || undefined,
    });
    const paymentData = data.data;

    if (paymentData.attemptedOrderId) {
      setAttemptedOrderId(paymentData.attemptedOrderId);
      attemptedOrderIdRef.current = paymentData.attemptedOrderId;
    }

    setPlacingOrder(false);

    openRazorpayCheckout({
      keyId: paymentData.keyId,
      amount: paymentData.amount,
      razorpayOrderId: paymentData.razorpayOrderId,
      user,
      description:
        paymentMode === PAYMENT_PLAN.ADVANCE
          ? "10% advance payment via Razorpay"
          : "Full order payment via Razorpay",
      onSuccess: async (response) => {
        setPlacingOrder(true);
        setOrderError("");
        try {
          await verifyRazorpayPayment({
            addressId: selectedAddressId,
            paymentMode,
            customerMessage: safeTrim(messageRef.current),
            checkoutItems: checkoutItemsPayload,
            checkoutMode: isBuyNow ? "buyNow" : "cart",
            buyNow: isBuyNow,
            attemptedOrderId: attemptedOrderIdRef.current,
            couponCode: appliedCouponRef.current?.code || undefined,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          await completeOrderSuccess(
            paymentMode === PAYMENT_PLAN.ADVANCE
              ? "Order confirmed. 10% paid via Razorpay. Pay the balance on delivery."
              : ""
          );
        } catch (err) {
          setOrderError(
            err.response?.data?.message || "Payment verified but order failed. Contact support."
          );
        } finally {
          setPlacingOrder(false);
        }
      },
      onDismiss: async () => {
        setPlacingOrder(false);
        setOrderError("Payment cancelled. Your order was not placed.");
        await syncCheckoutAttempt();
      },
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || placingOrder || !minimumOrderMet) return;
    setOrderError("");
    setPlacingOrder(true);
    await loadCart();
    try {
      await syncCheckoutAttempt();
      await handleRazorpayPayment();
    } catch (err) {
      setOrderError(err.response?.data?.message || "Failed to start payment. Please try again.");
      setPlacingOrder(false);
    }
  };

  const handleSaveAddress = async (formData) => {
    setSavingAddress(true);
    setFormError("");
    try {
      const { data } = await addAddress({ ...formData, isDefault: addresses.length === 0 });
      const newAddress = data.data;
      setAddresses((prev) => [newAddress, ...prev]);
      setSelectedAddressId(newAddress._id);
      setShowAddressForm(false);
      setShowAddressPicker(false);
      setFormError("");
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const closeAddressForm = () => {
    setShowAddressForm(false);
    setFormError("");
  };

  const closeAddressPicker = () => {
    setShowAddressPicker(false);
  };

  const openAddressForm = () => {
    setShowAddressPicker(false);
    setShowAddressForm(true);
  };

  const selectedAddress = addresses.find((addr) => addr._id === selectedAddressId) || null;

  const addressFormInitial = {
    ...ADDRESS_FORM_FIELDS,
    fullName: user.name || "",
    number: user.phone || "",
    email: user.email || "",
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] bg-mobile-bg px-4 py-16 text-text-primary sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-3 text-2xl font-bold sm:text-3xl">Checkout</h1>
          <p className="mb-6 text-text-secondary">Please login to proceed with checkout.</p>
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
      {placingOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-4 rounded-xl bg-white px-10 py-8 shadow-lg">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-light border-t-primary" />
            <p className="text-sm font-semibold text-text-primary">Processing payment...</p>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-text-primary">Order Confirmed</h3>
            <p className="mb-6 text-sm text-text-secondary">{orderSuccessNote}</p>
            <button
              type="button"
              onClick={() => navigate("/orders", { replace: true, state: { orderPlaced: true } })}
              className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:brightness-110"
            >
              View My Orders
            </button>
          </div>
        </div>
      )}

      <CheckoutModal
        open={showAddressPicker}
        title="Select Delivery Address"
        onClose={closeAddressPicker}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={openAddressForm}
              className="text-sm font-semibold text-primary hover:underline"
            >
              + Add new address
            </button>
            <button
              type="button"
              onClick={closeAddressPicker}
              disabled={!selectedAddressId}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use this address
            </button>
          </div>
        }
      >
        <ul className="space-y-2">
          {addresses.map((addr) => (
            <li key={addr._id}>
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                  selectedAddressId === addr._id
                    ? "border-primary bg-primary/5"
                    : "border-border-light hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="checkoutAddressPicker"
                  value={addr._id}
                  checked={selectedAddressId === addr._id}
                  onChange={() => {
                    setSelectedAddressId(addr._id);
                    setShowAddressPicker(false);
                  }}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-text-primary">{getAddressFullName(addr)}</p>
                    {addr.isDefault ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-text-secondary">{formatAddressLine(addr)}</p>
                  <p className="text-text-secondary">+91 {addr.number}</p>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </CheckoutModal>

      <CheckoutModal open={showAddressForm} title="Delivery Address" onClose={closeAddressForm}>
        {formError ? (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
        ) : null}
        <AddressForm
          plain
          initial={addressFormInitial}
          onSubmit={handleSaveAddress}
          onCancel={closeAddressForm}
          submitting={savingAddress}
        />
      </CheckoutModal>

      <section className="px-3 pb-24 pt-1 sm:px-4 sm:pb-14 lg:px-8 lg:pb-10 lg:pt-2">
        <div className="mx-auto max-w-7xl">
          <nav className="mb-3 text-xs text-text-secondary sm:text-sm">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <span className="mx-2">›</span>
            <Link to={isBuyNow ? "/product" : "/cart"} className="hover:text-primary">
              {isBuyNow ? "Products" : "Cart"}
            </Link>
            <span className="mx-2">›</span>
            <span className="text-text-primary">Checkout</span>
          </nav>

          <h1 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl lg:text-3xl">Checkout</h1>

          {cartLoading && !isBuyNow ? (
            <div className="grid animate-pulse gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                <div className="h-44 rounded-xl border border-border-light bg-white" />
                <div className="h-36 rounded-xl border border-border-light bg-white" />
                <div className="h-32 rounded-xl border border-border-light bg-white" />
              </div>
              <div className="h-[480px] rounded-xl border border-border-light bg-white" />
            </div>
          ) : (
            <div className="grid items-start gap-3 sm:gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
              <div className="space-y-3 sm:space-y-4">
                <StepSection title="Payment via Razorpay">
                  <div className="space-y-3">
                    <label
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition sm:gap-4 sm:rounded-xl sm:p-4 ${
                        paymentPlan === PAYMENT_PLAN.ADVANCE
                          ? "border-primary bg-primary/5"
                          : "border-border-light hover:border-primary/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentPlan"
                        value={PAYMENT_PLAN.ADVANCE}
                        checked={paymentPlan === PAYMENT_PLAN.ADVANCE}
                        onChange={() => setPaymentPlan(PAYMENT_PLAN.ADVANCE)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text-primary sm:text-base">
                          Pay 10% now · balance on delivery
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary sm:text-sm">
                          Pay {formatPrice(calculateAdvanceAmount(orderTotal), 2)} now via Razorpay ·{" "}
                          {formatPrice(Math.max(0, orderTotal - calculateAdvanceAmount(orderTotal)), 2)}{" "}
                          on delivery
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition sm:gap-4 sm:rounded-xl sm:p-4 ${
                        paymentPlan === PAYMENT_PLAN.FULL
                          ? "border-primary bg-primary/5"
                          : "border-border-light hover:border-primary/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentPlan"
                        value={PAYMENT_PLAN.FULL}
                        checked={paymentPlan === PAYMENT_PLAN.FULL}
                        onChange={() => setPaymentPlan(PAYMENT_PLAN.FULL)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text-primary sm:text-base">
                          Pay 100% now
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary sm:text-sm">
                          Complete payment of {formatPrice(orderTotal, 2)} via Razorpay
                        </p>
                      </div>
                    </label>
                  </div>
                </StepSection>

                <StepSection title="Delivery Details">
                  {addressesLoading ? (
                    <div className="h-24 animate-pulse rounded-lg bg-mobile-surface" />
                  ) : selectedAddress ? (
                    <>
                      <AddressSummary address={selectedAddress} />
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setShowAddressPicker(true)}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          Change address
                        </button>
                        <button
                          type="button"
                          onClick={openAddressForm}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          + Add new address
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-text-secondary">
                        No saved address yet. Add one to continue.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(true)}
                        className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        <span className="text-base leading-none">+</span>
                        Add Address
                      </button>
                    </>
                  )}
                </StepSection>

                <StepSection title="Order Notes (Optional)">
                  <div className="relative">
                    <textarea
                      id="orderMessage"
                      value={message}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_ORDER_NOTE_LENGTH) {
                          setMessage(e.target.value);
                        }
                      }}
                      maxLength={MAX_ORDER_NOTE_LENGTH}
                      rows={4}
                      placeholder="Add delivery instructions or any note for your order..."
                      className="w-full resize-none rounded-xl border border-border-light px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                    <span className="pointer-events-none absolute bottom-3 right-3 text-xs text-text-muted">
                      {message.length}/{MAX_ORDER_NOTE_LENGTH}
                    </span>
                  </div>
                </StepSection>
              </div>

              <div className="rounded-xl border border-border-light bg-white p-3 shadow-sm sm:p-5 lg:sticky lg:top-24 lg:p-6">
                <h2 className="mb-3 text-sm font-bold sm:mb-5 sm:text-base lg:text-lg">Order Summary</h2>

                <ul className="mb-3 max-h-40 space-y-3 overflow-y-auto sm:mb-5 sm:max-h-56 sm:space-y-4">
                  {checkoutItems.map((item) => (
                    <li key={`${item.productId || item._id}-${item.variantName || "default"}-${item.colorName || "default"}`} className="flex items-center gap-3">
                      <div className="w-14 shrink-0 overflow-hidden rounded-lg border border-border-light">
                        <ProductImageFrame
                          src={item.productImages?.[0]}
                          alt={item.name}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-text-primary">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">Qty: {item.quantity}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-text-primary">
                        {formatPrice(item.discountedPrice * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mb-3 border-b border-border-light pb-3 sm:mb-4">
                  {appliedCoupon ? (
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-green-800">
                          Coupon applied: {appliedCoupon.code}
                        </p>
                        {appliedCoupon.title ? (
                          <p className="mt-0.5 text-xs text-green-700">{appliedCoupon.title}</p>
                        ) : null}
                        <p className="mt-1 text-xs font-medium text-green-700">
                          You save {formatPrice(appliedCoupon.discountAmount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label htmlFor="couponCode" className="text-sm font-semibold text-text-primary">
                          Have a coupon?
                        </label>
                        <Link to="/coupons" className="text-xs font-semibold text-primary hover:underline">
                          View all coupons
                        </Link>
                      </div>
                      <div className="flex gap-2">
                        <input
                          id="couponCode"
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            if (couponError) setCouponError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          placeholder="Enter coupon code"
                          className="min-w-0 flex-1 rounded-lg border border-border-light px-3 py-2 text-sm uppercase outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={applyingCoupon || !couponInput.trim()}
                          className="shrink-0 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {applyingCoupon ? "..." : "Apply"}
                        </button>
                      </div>
                      {couponError ? (
                        <p className="text-xs text-red-600">{couponError}</p>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 border-t border-border-light pt-4 text-sm">
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal</span>
                    <span className="font-medium text-text-primary">{formatPrice(subtotal)}</span>
                  </div>
                  {couponDiscount > 0 ? (
                    <div className="flex justify-between text-green-700">
                      <span>Coupon discount</span>
                      <span className="font-semibold">-{formatPrice(couponDiscount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-text-secondary">
                    <span>Delivery Charges</span>
                    <span className="font-semibold text-text-primary">
                      {formatPrice(deliveryCharges)}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Pay now (Razorpay)</span>
                    <span className="font-medium text-text-primary">{formatPrice(payableNow, 2)}</span>
                  </div>
                  {paymentPlan === PAYMENT_PLAN.ADVANCE ? (
                    <div className="flex justify-between text-text-secondary">
                      <span>Balance on delivery</span>
                      <span className="font-medium text-text-primary">
                        {formatPrice(balanceOnDelivery, 2)}
                      </span>
                    </div>
                  ) : null}
                  {!minimumOrderMet ? (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                      Add {formatPrice(minimumOrderShortfall)} more to reach the minimum order of{" "}
                      {formatPrice(minimumOrderValue)}.
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border-light pt-3 sm:mt-4 sm:pt-4">
                  <span className="text-sm font-bold text-text-primary sm:text-base">Total Amount</span>
                  <span className="text-lg font-bold text-primary sm:text-xl lg:text-2xl">
                    {formatPrice(orderTotal)}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-2.5 py-2 text-[11px] font-medium text-green-700 sm:mt-4 sm:px-3 sm:py-2.5 sm:text-sm">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  You will save {formatPrice(savings)} on this order
                </div>

                {orderError && (
                  <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600">
                    {orderError}
                  </p>
                )}

                <button
                  type="button"
                  disabled={!selectedAddressId || placingOrder || !minimumOrderMet}
                  onClick={handlePlaceOrder}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-5 sm:px-6 sm:py-3.5"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5M4.5 10.5h15v8.25a1.5 1.5 0 01-1.5 1.5h-12a1.5 1.5 0 01-1.5-1.5V10.5z"
                    />
                  </svg>
                  {placingOrder
                    ? "Please wait..."
                    : paymentPlan === PAYMENT_PLAN.ADVANCE
                      ? `Pay ${formatPrice(payableNow, 2)} with Razorpay`
                      : `Pay ${formatPrice(orderTotal, 2)} with Razorpay`}
                </button>

              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Checkout;
