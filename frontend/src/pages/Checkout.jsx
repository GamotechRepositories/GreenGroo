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
  validateGiftCard,
  placeOrder,
  getMyRewardPoints,
  getRewardSettings,
} from "../api/api";
import { loadRazorpayScript, openRazorpayCheckout } from "../utils/razorpay";
import AddressForm, { ADDRESS_FORM_FIELDS } from "../components/address/AddressForm";
import RewardPointsModal from "../components/rewards/RewardPointsModal";
import { readDeliveryLocation } from "../utils/deliveryLocation";
import { isLocalProductId } from "../utils/localProductId";
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

function checkoutCustomerLocation() {
  const loc = readDeliveryLocation();
  if (!loc) return undefined;
  const lat = Number(loc.lat ?? loc.latitude);
  const lng = Number(loc.lng ?? loc.longitude);
  const payload = {
    city: loc.city || "",
    area: loc.area || "",
    state: loc.state || "",
    pincode: loc.pincode || "",
    fullAddress: loc.address || "",
  };
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    payload.lat = lat;
    payload.lng = lng;
    payload.location = { lat, lng };
  }
  if (!payload.city && !payload.area && payload.lat == null) return undefined;
  return payload;
}

const formatPrice = (amount, fractionDigits = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);

const safeTrim = (value) => String(value ?? "").trim();

/* ──────────────────────────────────────────────
   Progress Step Indicator
   ────────────────────────────────────────────── */
const CHECKOUT_STEPS = [
  { key: "address", label: "Address", icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" },
  { key: "payment", label: "Payment", icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
  { key: "review", label: "Review", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

function CheckoutProgress({ selectedAddress, paymentPlan }) {
  const completedSteps = [];
  if (selectedAddress) completedSteps.push("address");
  if (paymentPlan) completedSteps.push("payment");
  if (selectedAddress && paymentPlan) completedSteps.push("review");

  return (
    <div className="mb-5 flex items-center justify-center gap-0 sm:mb-7">
      {CHECKOUT_STEPS.map((step, i) => {
        const isComplete = completedSteps.includes(step.key);
        const isCurrent =
          !isComplete &&
          (i === 0 || completedSteps.includes(CHECKOUT_STEPS[i - 1]?.key));

        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <div
                className="step-connector mx-1.5 w-8 sm:mx-2.5 sm:w-14"
                data-active={completedSteps.includes(CHECKOUT_STEPS[i - 1]?.key) ? "true" : "false"}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-10 sm:w-10 ${
                  isComplete
                    ? "border-[#0C831F] bg-[#0C831F] text-white shadow-md"
                    : isCurrent
                    ? "border-[#0C831F] bg-emerald-50 text-[#0C831F] shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                {isComplete ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                  </svg>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold sm:text-xs ${
                  isComplete
                    ? "text-[#0C831F]"
                    : isCurrent
                    ? "text-text-primary"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Confetti Burst (CSS-only)
   ────────────────────────────────────────────── */
const CONFETTI_COLORS = ["#0C831F", "#22c55e", "#4ade80", "#fbbf24", "#f87171", "#818cf8", "#fb923c"];

function ConfettiBurst() {
  const pieces = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * 360;
      const rad = (angle * Math.PI) / 180;
      const dist = 40 + Math.random() * 50;
      return {
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        x: Math.cos(rad) * dist,
        y: Math.sin(rad) * dist - 30,
        r: 180 + Math.random() * 360,
        delay: Math.random() * 0.15,
      };
    });
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            backgroundColor: p.color,
            "--confetti-x": `${p.x}px`,
            "--confetti-y": `${p.y}px`,
            "--confetti-r": `${p.r}deg`,
            animationDelay: `${p.delay}s`,
            borderRadius: p.id % 3 === 0 ? "50%" : "1px",
            width: p.id % 2 === 0 ? "6px" : "4px",
            height: p.id % 2 === 0 ? "6px" : "8px",
          }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Section Wrapper
   ────────────────────────────────────────────── */
function StepSection({ title, stepNumber, icon, children }) {
  return (
    <div className="group/section overflow-hidden rounded-xl border border-border-light bg-white shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3 border-b border-border-light bg-gradient-to-r from-slate-50 to-white px-3 py-3 sm:px-5 sm:py-4">
        {stepNumber && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0C831F] to-emerald-400 text-xs font-bold text-white shadow-sm">
            {stepNumber}
          </span>
        )}
        {icon && (
          <svg className="h-5 w-5 shrink-0 text-[#0C831F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        )}
        <h2 className="text-sm font-bold text-text-primary sm:text-base lg:text-lg">
          {title}
        </h2>
      </div>
      <div className="p-3 sm:p-5 lg:p-6">
        {children}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Modal
   ────────────────────────────────────────────── */
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
      <div className="scale-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
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

/* ──────────────────────────────────────────────
   Address Summary
   ────────────────────────────────────────────── */
function AddressSummary({ address }) {
  return (
    <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 p-4 text-sm transition-all">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0C831F]/10 text-[#0C831F]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
          </svg>
        </div>
        <p className="font-semibold text-text-primary">{getAddressFullName(address)}</p>
        {address.isDefault ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Default
          </span>
        ) : null}
      </div>
      <p className="mt-2 pl-10 text-text-secondary">{formatAddressLine(address)}</p>
      <p className="pl-10 text-text-secondary">+91 {address.number}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Payment Icons
   ────────────────────────────────────────────── */
const PaymentIcons = {
  cod: (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    </div>
  ),
  online: (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    </div>
  ),
  advance: (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
};

/* ──────────────────────────────────────────────
   Checkout Page
   ────────────────────────────────────────────── */
function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const { items, loading: cartLoading, loadCart, resetCart } = useCart();

  const buyNowItem = getBuyNowCheckout();
  const isBuyNow = Boolean(buyNowItem);
  const checkoutItems = isBuyNow ? [buyNowItem].filter(Boolean) : items;
  const checkoutItemsPayload = useMemo(
    () =>
      checkoutItems.map((item) => {
        const productId = item.productId || item._id;
        const payload = {
          productId,
          quantity: item.quantity,
          variantName: item.variantName || "",
          colorName: item.colorName || "",
        };

        if (isLocalProductId(productId)) {
          payload.name = item.name;
          payload.price = item.price;
          payload.discountedPrice = item.discountedPrice;
          payload.brandName = item.brandName || "";
          payload.image = item.productImages?.[0] || "";
        }

        return payload;
      }),
    [checkoutItems]
  );

  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState(PAYMENT_PLAN.COD);
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
  const [giftCardInput, setGiftCardInput] = useState("");
  const [appliedGiftCard, setAppliedGiftCard] = useState(null);
  const [giftCardError, setGiftCardError] = useState("");
  const [applyingGiftCard, setApplyingGiftCard] = useState(false);

  // Reward Points state
  const [rewardSettings, setRewardSettings] = useState(null);
  const [userRewardPoints, setUserRewardPoints] = useState(user?.rewardPoints || 0);
  const [useRewards, setUseRewards] = useState(false);
  const [rewardPointsInput, setRewardPointsInput] = useState(0);
  const [showRewardTermsModal, setShowRewardTermsModal] = useState(false);
  const rewardPointsToUseRef = useRef(0);

  const messageRef = useRef("");
  const attemptedOrderIdRef = useRef(null);
  const appliedCouponRef = useRef(null);
  const appliedGiftCardRef = useRef(null);
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
        giftCardCode: appliedGiftCard?.code || "",
        rewardPointsToUse: useRewards ? rewardPointsInput : 0,
      }),
    [selectedAddressId, paymentMethod, paymentPlan, checkoutItems, appliedCoupon, appliedGiftCard, useRewards, rewardPointsInput]
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

  useEffect(() => {
    appliedGiftCardRef.current = appliedGiftCard;
  }, [appliedGiftCard]);

  // Load Reward Points and settings for the authenticated user
  useEffect(() => {
    if (!user) return;
    setUserRewardPoints(user.rewardPoints || 0);
    getMyRewardPoints()
      .then(({ data }) => {
        if (data?.data) {
          setUserRewardPoints(data.data.points || 0);
          if (data.data.settings) {
            setRewardSettings(data.data.settings);
          }
        }
      })
      .catch(() => {
        getRewardSettings()
          .then(({ data }) => {
            if (data?.data) setRewardSettings(data.data);
          })
          .catch(() => {});
      });
  }, [user]);

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.discountedPrice * item.quantity,
    0
  );
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);

  const rewardsActive = rewardSettings?.enabled === true;

  // Maximum reward points allowed for redemption on this cart
  const maxRedeemablePoints = useMemo(() => {
    if (!rewardsActive || !userRewardPoints) return 0;
    if (subtotal < (rewardSettings.minOrderAmountToRedeem || 0)) return 0;
    if (userRewardPoints < (rewardSettings.minPointsToRedeem || 0)) return 0;

    const pointValue = rewardSettings.pointValueInRupees || 1.0;
    const maxDiscountAllowed =
      (subtotalAfterCoupon * (rewardSettings.maxRedemptionPercent || 50)) / 100;
    let maxPoints = Math.floor(maxDiscountAllowed / pointValue);

    if (rewardSettings.maxPointsPerOrder > 0) {
      maxPoints = Math.min(maxPoints, rewardSettings.maxPointsPerOrder);
    }
    return Math.max(0, Math.min(userRewardPoints, maxPoints));
  }, [rewardsActive, rewardSettings, userRewardPoints, subtotal, subtotalAfterCoupon]);

  const effectiveRewardPoints = rewardsActive && useRewards ? Math.min(rewardPointsInput, maxRedeemablePoints) : 0;
  const rewardDiscount =
    Math.round(effectiveRewardPoints * (rewardSettings?.pointValueInRupees || 1.0) * 100) / 100;

  rewardPointsToUseRef.current = effectiveRewardPoints;

  // Reward points earned on this order
  const pointsToEarn = useMemo(() => {
    if (!rewardsActive) return 0;
    if (subtotal < (rewardSettings?.minOrderAmountToEarn || 0)) return 0;
    const spend = rewardSettings?.earningRate?.spendAmount || 100;
    const rate = rewardSettings?.earningRate?.pointsEarned || 10;
    return Math.floor((subtotal / spend) * rate);
  }, [rewardsActive, rewardSettings, subtotal]);

  const giftCardDiscount = Math.min(
    Number(appliedGiftCard?.discountAmount || 0),
    Math.max(0, subtotalAfterCoupon - rewardDiscount)
  );
  const discountedSubtotal = Math.max(0, subtotalAfterCoupon - rewardDiscount - giftCardDiscount);
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
    if (
      authLoading ||
      bootstrapping ||
      !user ||
      orderPlaced ||
      checkoutItems.length === 0
    ) {
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
        giftCardCode: appliedGiftCardRef.current?.code || undefined,
        rewardPointsToUse: rewardPointsToUseRef.current || undefined,
        customerLocation: checkoutCustomerLocation(),
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

  const handleApplyGiftCard = async () => {
    const code = giftCardInput.trim();
    if (!code) {
      setGiftCardError("Enter a gift card code");
      return;
    }
    setApplyingGiftCard(true);
    setGiftCardError("");
    try {
      const payable = Math.max(0, subtotalAfterCoupon - rewardDiscount);
      const { data } = await validateGiftCard({ code, payableAmount: payable, subtotal: payable });
      setAppliedGiftCard(data.data);
      setGiftCardInput(data.data.code);
    } catch (err) {
      setAppliedGiftCard(null);
      setGiftCardError(err.response?.data?.message || "Invalid gift card");
    } finally {
      setApplyingGiftCard(false);
    }
  };

  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardInput("");
    setGiftCardError("");
  };

  useEffect(() => {
    const code = String(location.state?.applyCouponCode || "").trim().toUpperCase();
    if (!code || authLoading || subtotal <= 0) return;

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
  }, [location.state?.applyCouponCode, authLoading, subtotal, navigate, location.pathname]);

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
      giftCardCode: appliedGiftCardRef.current?.code || undefined,
      rewardPointsToUse: rewardPointsToUseRef.current || undefined,
      customerLocation: checkoutCustomerLocation(),
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
            giftCardCode: appliedGiftCardRef.current?.code || undefined,
            rewardPointsToUse: rewardPointsToUseRef.current || undefined,
            customerLocation: checkoutCustomerLocation(),
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
      
      if (paymentPlan === PAYMENT_PLAN.COD) {
        await placeOrder({
          addressId: selectedAddressId,
          paymentMethod: "cod",
          customerMessage: safeTrim(messageRef.current),
          checkoutItems: checkoutItemsPayload,
          checkoutMode: isBuyNow ? "buyNow" : "cart",
          buyNow: isBuyNow,
          attemptedOrderId: attemptedOrderIdRef.current,
          couponCode: appliedCouponRef.current?.code || undefined,
          giftCardCode: appliedGiftCardRef.current?.code || undefined,
          rewardPointsToUse: rewardPointsToUseRef.current || undefined,
          customerLocation: checkoutCustomerLocation(),
        });

        await completeOrderSuccess("Order confirmed. Pay the full amount on delivery.");
      } else {
        await handleRazorpayPayment();
      }
    } catch (err) {
      setOrderError(err.response?.data?.message || "Failed to start payment. Please try again.");
      setPlacingOrder(false);
    }
  };

  const handleSaveAddress = async (formData) => {
    setSavingAddress(true);
    setFormError("");
    try {
      const loc = readDeliveryLocation();
      const lat = Number(loc?.lat ?? loc?.latitude);
      const lng = Number(loc?.lng ?? loc?.longitude);
      const payload = { ...formData, isDefault: addresses.length === 0 };
      if (!payload.location?.lat && Number.isFinite(lat) && Number.isFinite(lng)) {
        payload.location = { lat, lng };
      }
      if (!payload.area && loc?.area) payload.area = loc.area;
      const { data } = await addAddress(payload);
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
    fullName: user?.name || "",
    number: user?.phone || "",
    email: user?.email || "",
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-mobile-bg px-4 py-16 text-text-primary sm:px-6">
        <div className="scale-in mx-auto max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg ring-1 ring-slate-100">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50">
            <svg className="h-8 w-8 text-[#0C831F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5M4.5 10.5h15v8.25a1.5 1.5 0 01-1.5 1.5h-12a1.5 1.5 0 01-1.5-1.5V10.5z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Checkout</h1>
          <p className="mb-6 text-sm text-text-secondary">Please login to proceed with checkout.</p>
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="w-full rounded-xl bg-gradient-to-r from-[#0C831F] to-[#16a34a] px-8 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            Login / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mobile-bg text-text-primary">
      {/* Processing overlay */}
      {placingOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40">
          <div className="scale-in flex flex-col items-center gap-4 rounded-2xl bg-white px-10 py-8 shadow-2xl ring-1 ring-slate-100">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-[#0C831F]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-5 w-5 text-[#0C831F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5M4.5 10.5h15v8.25a1.5 1.5 0 01-1.5 1.5h-12a1.5 1.5 0 01-1.5-1.5V10.5z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-text-primary">Processing your order</p>
              <p className="mt-1 text-xs text-text-secondary">Please don't close this page…</p>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4">
          <div className="scale-in relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-8 text-center shadow-2xl ring-1 ring-slate-100">
            <ConfettiBurst />
            <div className="success-ring mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-50 shadow-lg shadow-green-100">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path className="checkmark-draw" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-2xl font-bold text-text-primary">Order Confirmed! 🎉</h3>
            <p className="mb-6 text-sm leading-relaxed text-text-secondary">{orderSuccessNote}</p>
            <button
              type="button"
              onClick={() => navigate("/orders", { replace: true, state: { orderPlaced: true } })}
              className="w-full rounded-xl bg-gradient-to-r from-[#0C831F] to-[#16a34a] py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              View My Orders
            </button>
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="mt-2 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* Address picker modal */}
      <CheckoutModal
        open={showAddressPicker}
        title="Select Delivery Address"
        onClose={closeAddressPicker}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={openAddressForm}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add new address
            </button>
            <button
              type="button"
              onClick={closeAddressPicker}
              disabled={!selectedAddressId}
              className="rounded-xl bg-gradient-to-r from-[#0C831F] to-[#16a34a] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
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
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-all ${
                  selectedAddressId === addr._id
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                    : "border-border-light hover:border-primary/40 hover:bg-slate-50"
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

      {/* Address form modal */}
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

      <section className="px-3 pb-28 pt-1 sm:px-4 sm:pb-14 lg:px-8 lg:pb-10 lg:pt-2">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <nav className="mb-3 text-xs text-text-secondary sm:text-sm">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <span className="mx-2">›</span>
            <Link to={isBuyNow ? "/product" : "/cart"} className="hover:text-primary">
              {isBuyNow ? "Products" : "Cart"}
            </Link>
            <span className="mx-2">›</span>
            <span className="font-medium text-text-primary">Checkout</span>
          </nav>

          <h1 className="mb-2 flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 sm:mb-4 sm:text-2xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0C831F] to-emerald-400 text-white shadow-sm">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5M4.5 10.5h15v8.25a1.5 1.5 0 01-1.5 1.5h-12a1.5 1.5 0 01-1.5-1.5V10.5z" />
              </svg>
            </div>
            Checkout
          </h1>

          {/* Progress indicator */}
          <CheckoutProgress selectedAddress={selectedAddress} paymentPlan={paymentPlan} />

          {cartLoading && !isBuyNow ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="shimmer-loading h-36 rounded-xl border border-border-light" />
                ))}
              </div>
              <div className="shimmer-loading h-[480px] rounded-xl border border-border-light" />
            </div>
          ) : (
            <div className="grid items-start gap-3 sm:gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
              {/* Left column */}
              <div className="space-y-3 sm:space-y-4">
                {/* Address */}
                <StepSection
                  title="Delivery address"
                  stepNumber="1"
                  icon="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z"
                >
                  {addressesLoading ? (
                    <div className="shimmer-loading h-24 rounded-lg" />
                  ) : selectedAddress ? (
                    <>
                      <AddressSummary address={selectedAddress} />
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddressPicker(true)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                          </svg>
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={openAddressForm}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-[#0C831F] shadow-sm transition-all hover:bg-emerald-100"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add new
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
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-[#0C831F] shadow-sm transition-all hover:bg-emerald-100"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Address
                      </button>
                    </>
                  )}
                </StepSection>

                {/* Payment */}
                <StepSection
                  title="Payment"
                  stepNumber="2"
                  icon="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                >
                  <div className="space-y-2.5">
                    {/* COD */}
                    <label
                      className={`flex cursor-pointer items-center gap-3.5 rounded-xl border p-4 transition-all ${
                        paymentPlan === PAYMENT_PLAN.COD
                          ? "border-[#0C831F] bg-emerald-50/60 shadow-sm ring-1 ring-emerald-200/50"
                          : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentPlan"
                        value={PAYMENT_PLAN.COD}
                        checked={paymentPlan === PAYMENT_PLAN.COD}
                        onChange={() => setPaymentPlan(PAYMENT_PLAN.COD)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#0C831F]"
                      />
                      {PaymentIcons.cod}
                      <div>
                        <p className="text-sm font-bold text-slate-900">Pay on delivery</p>
                        <p className="mt-0.5 text-xs text-slate-500">Cash or UPI when your order arrives</p>
                      </div>
                    </label>

                    {/* Full online */}
                    <label
                      className={`flex cursor-pointer items-center gap-3.5 rounded-xl border p-4 transition-all ${
                        paymentPlan === PAYMENT_PLAN.FULL
                          ? "border-[#0C831F] bg-emerald-50/60 shadow-sm ring-1 ring-emerald-200/50"
                          : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentPlan"
                        value={PAYMENT_PLAN.FULL}
                        checked={paymentPlan === PAYMENT_PLAN.FULL}
                        onChange={() => setPaymentPlan(PAYMENT_PLAN.FULL)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#0C831F]"
                      />
                      {PaymentIcons.online}
                      <div>
                        <p className="text-sm font-bold text-slate-900">Pay online now</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatPrice(orderTotal, 2)} via Razorpay
                        </p>
                      </div>
                    </label>

                    {/* 10% advance */}
                    <label
                      className={`flex cursor-pointer items-center gap-3.5 rounded-xl border p-4 transition-all ${
                        paymentPlan === PAYMENT_PLAN.ADVANCE
                          ? "border-[#0C831F] bg-emerald-50/60 shadow-sm ring-1 ring-emerald-200/50"
                          : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentPlan"
                        value={PAYMENT_PLAN.ADVANCE}
                        checked={paymentPlan === PAYMENT_PLAN.ADVANCE}
                        onChange={() => setPaymentPlan(PAYMENT_PLAN.ADVANCE)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#0C831F]"
                      />
                      {PaymentIcons.advance}
                      <div>
                        <p className="text-sm font-bold text-slate-900">Pay 10% now</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatPrice(calculateAdvanceAmount(orderTotal), 2)} now · rest on delivery
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Secure badge */}
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500 ring-1 ring-slate-100">
                    <svg className="h-4 w-4 shrink-0 text-[#0C831F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    100% Secure Payments · SSL Encrypted
                  </div>
                </StepSection>

                {/* Delivery instructions */}
                <StepSection
                  title="Delivery instructions"
                  stepNumber="3"
                  icon="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                >
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
                      className="w-full resize-none rounded-xl border border-border-light px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                    <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-text-muted">
                      {message.length}/{MAX_ORDER_NOTE_LENGTH}
                    </span>
                  </div>
                </StepSection>
              </div>

              {/* Right column — Order Summary */}
              <div className="overflow-hidden rounded-xl border border-border-light bg-white shadow-sm lg:sticky lg:top-24">
                {/* Gradient accent */}
                <div className="h-1 bg-gradient-to-r from-[#0C831F] via-emerald-400 to-[#0C831F]" />

                <div className="p-3 sm:p-5 lg:p-6">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-bold sm:mb-5 sm:text-base lg:text-lg">
                    <svg className="h-5 w-5 text-[#0C831F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Order Summary
                  </h2>

                  {/* Item list */}
                  <ul className="mb-3 max-h-40 space-y-3 overflow-y-auto sm:mb-5 sm:max-h-56 sm:space-y-4">
                    {checkoutItems.map((item) => (
                      <li key={`${item.productId || item._id}-${item.variantName || "default"}-${item.colorName || "default"}`} className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-slate-50">
                        <div className="w-14 shrink-0 overflow-hidden rounded-lg border border-border-light transition-all hover:shadow-sm">
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
                        <span className="shrink-0 text-sm font-bold text-text-primary">
                          {formatPrice(item.discountedPrice * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Coupon / Gift card / Rewards */}
                  <div className="mb-3 border-b border-border-light pb-3 sm:mb-4">
                    {/* Coupon */}
                    {appliedCoupon ? (
                      <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-green-800">
                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Coupon: {appliedCoupon.code}
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
                          <label htmlFor="couponCode" className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                            <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z" />
                            </svg>
                            Have a coupon?
                          </label>
                          <Link to="/coupons" className="text-xs font-semibold text-primary hover:underline">
                            View all
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
                            className="min-w-0 flex-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm uppercase outline-none transition-all focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={applyingCoupon || !couponInput.trim()}
                            className="shrink-0 rounded-lg bg-[#0C831F] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#0a6e1a] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {applyingCoupon ? "..." : "Apply"}
                          </button>
                        </div>
                        {couponError ? (
                          <p className="text-xs text-red-600">{couponError}</p>
                        ) : null}
                      </div>
                    )}

                    {/* Gift card */}
                    {appliedGiftCard ? (
                      <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                            Gift card: {appliedGiftCard.code}
                          </p>
                          <p className="mt-1 text-xs font-medium text-emerald-700">
                            Balance used {formatPrice(giftCardDiscount)}
                          </p>
                        </div>
                        <button type="button" onClick={handleRemoveGiftCard} className="text-xs font-semibold text-red-600 hover:underline">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <label htmlFor="giftCardCode" className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                          <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                          </svg>
                          Have a gift card?
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="giftCardCode"
                            type="text"
                            value={giftCardInput}
                            onChange={(e) => {
                              setGiftCardInput(e.target.value.toUpperCase());
                              if (giftCardError) setGiftCardError("");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyGiftCard();
                              }
                            }}
                            placeholder="Enter gift card code"
                            className="min-w-0 flex-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm uppercase outline-none transition-all focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20"
                          />
                          <button
                            type="button"
                            onClick={handleApplyGiftCard}
                            disabled={applyingGiftCard || !giftCardInput.trim()}
                            className="shrink-0 rounded-lg bg-[#0C831F] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#0a6e1a] disabled:opacity-50"
                          >
                            {applyingGiftCard ? "..." : "Apply"}
                          </button>
                        </div>
                        {giftCardError ? <p className="text-xs text-red-600">{giftCardError}</p> : null}
                      </div>
                    )}

                    {/* Reward Points Redemption Block */}
                    {rewardsActive && (
                      <div className="mt-3 border-t border-border-light pt-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">🪙</span>
                            <span className="text-xs font-bold text-text-primary">Reward Points</span>
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                              Bal: {userRewardPoints} pts (₹{((userRewardPoints || 0) * (rewardSettings?.pointValueInRupees || 1.0)).toFixed(2)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowRewardTermsModal(true)}
                            className="text-[11px] font-medium text-text-secondary hover:text-primary underline"
                          >
                            T&C
                          </button>
                        </div>

                        {userRewardPoints <= 0 ? (
                          <p className="text-[11px] text-text-secondary">
                            Earn points on this order and redeem them on your next grocery delivery!
                          </p>
                        ) : subtotal < (rewardSettings?.minOrderAmountToRedeem || 0) ? (
                          <p className="text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded-lg">
                            Minimum order of ₹{rewardSettings.minOrderAmountToRedeem} required to redeem reward points.
                          </p>
                        ) : userRewardPoints < (rewardSettings?.minPointsToRedeem || 0) ? (
                          <p className="text-[11px] text-text-secondary">
                            Minimum {rewardSettings.minPointsToRedeem} points required to start redeeming (You have {userRewardPoints} pts).
                          </p>
                        ) : (
                          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3 space-y-2.5">
                            <label className="flex items-start gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={useRewards}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setUseRewards(checked);
                                  setRewardPointsInput(checked ? maxRedeemablePoints : 0);
                                }}
                                className="mt-0.5 h-4 w-4 rounded accent-primary text-primary focus:ring-primary"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-text-primary">
                                  Redeem Reward Points for Instant Discount
                                </p>
                                <p className="text-[11px] text-text-secondary mt-0.5">
                                  Use up to {maxRedeemablePoints} points (Max {rewardSettings?.maxRedemptionPercent || 50}% of order).
                                </p>
                              </div>
                            </label>

                            {useRewards && (
                              <div className="space-y-2">
                                {/* Progress bar */}
                                <div className="relative h-2 w-full overflow-hidden rounded-full bg-amber-100">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                                    style={{ width: `${maxRedeemablePoints > 0 ? (rewardPointsInput / maxRedeemablePoints) * 100 : 0}%` }}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <input
                                      type="number"
                                      min="1"
                                      max={maxRedeemablePoints}
                                      value={rewardPointsInput || ""}
                                      onChange={(e) => {
                                        const val = Math.max(0, Math.min(maxRedeemablePoints, Number(e.target.value)));
                                        setRewardPointsInput(val);
                                      }}
                                      placeholder={`Points (max ${maxRedeemablePoints})`}
                                      className="w-full rounded-lg border border-border-light bg-white px-3 py-1.5 text-xs font-bold text-text-primary outline-none focus:border-primary"
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-text-muted">
                                      pts
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setRewardPointsInput(maxRedeemablePoints)}
                                    className="shrink-0 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-200 transition"
                                  >
                                    Max ({maxRedeemablePoints})
                                  </button>
                                </div>
                              </div>
                            )}

                            {useRewards && rewardDiscount > 0 && (
                              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                                <span>Points Discount:</span>
                                <span>-₹{rewardDiscount.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price breakdown */}
                  <div className="space-y-2.5 border-t border-border-light pt-4 text-sm">
                    <div className="flex justify-between text-text-secondary">
                      <span>Subtotal</span>
                      <span className="font-medium text-text-primary">{formatPrice(subtotal)}</span>
                    </div>
                    {couponDiscount > 0 ? (
                      <div className="flex justify-between text-green-700">
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                          </svg>
                          Coupon discount
                        </span>
                        <span className="font-semibold">-{formatPrice(couponDiscount)}</span>
                      </div>
                    ) : null}
                    {giftCardDiscount > 0 ? (
                      <div className="flex justify-between text-emerald-700">
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                          </svg>
                          Gift card
                        </span>
                        <span className="font-semibold">-{formatPrice(giftCardDiscount)}</span>
                      </div>
                    ) : null}
                    {rewardsActive && rewardDiscount > 0 ? (
                      <div className="flex justify-between text-emerald-700">
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                          </svg>
                          Reward Points ({effectiveRewardPoints} pts)
                        </span>
                        <span className="font-bold">-{formatPrice(rewardDiscount)}</span>
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
                      <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-200/60">
                        <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        Add {formatPrice(minimumOrderShortfall)} more to reach the minimum order of{" "}
                        {formatPrice(minimumOrderValue)}.
                      </p>
                    ) : null}
                  </div>

                  {/* Total */}
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50/60 px-3 py-3 ring-1 ring-emerald-100 sm:mt-4">
                    <span className="text-sm font-bold text-text-primary sm:text-base">Total Amount</span>
                    <span className="text-lg font-bold text-[#0C831F] sm:text-xl lg:text-2xl">
                      {formatPrice(orderTotal)}
                    </span>
                  </div>

                  {/* Savings badge */}
                  {savings > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-2.5 py-2 text-[11px] font-medium text-green-700 ring-1 ring-green-100 sm:mt-4 sm:px-3 sm:py-2.5 sm:text-sm">
                      <span className="float-badge text-sm">✨</span>
                      You will save {formatPrice(savings)} on this order
                    </div>
                  )}

                  {/* Reward points earned */}
                  {rewardsActive && pointsToEarn > 0 && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] font-semibold text-amber-900 border border-amber-200/80 sm:px-3 sm:py-2.5 sm:text-xs">
                      <span className="text-base">🪙</span>
                      <span>
                        You will earn <strong className="font-bold text-amber-800">+{pointsToEarn} Reward Points</strong> on this order!
                      </span>
                    </div>
                  )}

                  {/* Error */}
                  {orderError && (
                    <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600 ring-1 ring-red-100">
                      {orderError}
                    </p>
                  )}

                  {/* Place order button */}
                  <button
                    type="button"
                    disabled={!selectedAddressId || placingOrder || !minimumOrderMet}
                    onClick={handlePlaceOrder}
                    className="pulse-glow mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0C831F] to-[#16a34a] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:mt-5"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5M4.5 10.5h15v8.25a1.5 1.5 0 01-1.5 1.5h-12a1.5 1.5 0 01-1.5-1.5V10.5z"
                      />
                    </svg>
                    {placingOrder
                      ? "Placing order…"
                      : paymentPlan === PAYMENT_PLAN.COD
                        ? "Place order · Pay on delivery"
                        : paymentPlan === PAYMENT_PLAN.ADVANCE
                        ? `Pay ${formatPrice(payableNow, 2)} now`
                        : `Pay ${formatPrice(orderTotal, 2)} now`}
                  </button>

                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {showRewardTermsModal && (
        <RewardPointsModal
          open={showRewardTermsModal}
          onClose={() => setShowRewardTermsModal(false)}
        />
      )}
    </div>
  );
}

export default Checkout;
