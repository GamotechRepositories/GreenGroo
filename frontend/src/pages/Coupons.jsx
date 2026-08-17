import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAvailableCoupons, validateCoupon } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  formatCouponHeadline,
  formatCouponUnlockMessage,
  formatCouponValidity,
} from "../utils/couponDisplay";
import { Sparkles, Gift, Tag, Percent, ArrowRight, CheckCircle2, Copy, Check, X, ShoppingBag } from "lucide-react";

const formatPrice = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

// Hariyali Teej Special Offers Data
const HARIYALI_TEEJ_OFFERS = [
  {
    code: "TEEJ100",
    title: "Hariyali Teej Special ₹100 OFF",
    discount: "FLAT ₹100 DISCOUNT",
    minSpend: 499,
    description: "Get Flat ₹100 OFF on all Farm Fresh Veggies, Fruits & Groceries above ₹499.",
    badge: "Festive Exclusive",
    expiresIn: "Valid till Teej Festival",
  },
  {
    code: "FRESH50",
    title: "50% Instant Cashback on Ready2Cook",
    discount: "50% OFF (Up to ₹150)",
    minSpend: 299,
    description: "Save 50% on all pre-washed & chopped vegetables & meal prep mixes.",
    badge: "10-Min Prep Deal",
    expiresIn: "Limited Time",
  },
  {
    code: "SUPERMALL20",
    title: "Super Mall Mega Pantry Deal",
    discount: "FLAT 20% CASHBACK",
    minSpend: 999,
    description: "Extra 20% Cashback on Fortune Oils, Aashirvaad Atta & Branded Packaged Foods.",
    badge: "Super Mall Special",
    expiresIn: "Valid Today",
  },
];

// Bank Payment Cashbacks
const BANK_OFFERS = [
  {
    bank: "UPI / GPay / PhonePe",
    offer: "Flat ₹50 Instant Cashback",
    minOrder: "₹399+",
    code: "UPI50",
    bgColor: "bg-emerald-50 border-emerald-200 text-emerald-900",
  },
  {
    bank: "HDFC Bank Credit Cards",
    offer: "10% Instant Discount up to ₹250",
    minOrder: "₹999+",
    code: "HDFC10",
    bgColor: "bg-blue-50 border-blue-200 text-blue-900",
  },
  {
    bank: "ICICI Net Banking & Cards",
    offer: "Flat ₹150 Off on ₹1,299",
    minOrder: "₹1,299+",
    code: "ICICI150",
    bgColor: "bg-orange-50 border-orange-200 text-orange-900",
  },
];

function CouponIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0C831F] text-white shadow-xs">
      <Tag className="h-5 w-5" />
    </div>
  );
}

function CouponCard({ coupon, expanded, onToggleDetails, onApply }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:shadow-md">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <CouponIcon />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold leading-snug text-slate-900">
                {formatCouponHeadline(coupon)}
              </h3>
              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                  coupon.unlocked
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 bg-slate-50 text-slate-500"
                }`}
              >
                {coupon.unlocked ? "Unlocked" : "Locked"}
              </span>
            </div>
            <p
              className={`mt-2 text-sm font-semibold ${
                coupon.unlocked ? "text-emerald-700" : "text-amber-600"
              }`}
            >
              {formatCouponUnlockMessage(coupon)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-dashed border-slate-200" />

      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50/50">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-black tracking-wider text-slate-900 shadow-2xs">
            {coupon.code}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            {copied ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Copied
              </span>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleDetails}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          Details
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <p>Valid till {formatCouponValidity(coupon.endDate)}.</p>
          <p className="mt-1">
            Minimum order: {formatPrice(coupon.minOrderAmount)}
            {coupon.appliesToAllProducts ? " · Applies to all products" : ""}
          </p>
          <button
            type="button"
            onClick={() => onApply(coupon)}
            className={`mt-3 w-full rounded-xl py-2 text-xs font-black transition cursor-pointer ${
              coupon.unlocked
                ? "bg-[#0C831F] text-white hover:bg-[#097019]"
                : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            }`}
          >
            {coupon.unlocked ? "Apply Coupon Now" : "View Cart to Unlock"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function Coupons() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { items } = useCart();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCode, setExpandedCode] = useState(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState("");
  const [applyingCode, setApplyingCode] = useState("");

  // Offer Application State & Live Success Modal
  const [activeAppliedOffer, setActiveAppliedOffer] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.discountedPrice || 0) * Number(item.quantity || 0),
        0
      ),
    [items]
  );

  useEffect(() => {
    let cancelled = false;

    const loadCoupons = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await getAvailableCoupons({ subtotal });
        if (!cancelled) {
          setCoupons(data.data || []);
        }
      } catch {
        if (!cancelled) {
          setCoupons([]);
          setError("Could not load coupons right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCoupons();

    return () => {
      cancelled = true;
    };
  }, [subtotal]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const applyCouponCode = async (code) => {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) return;

    // Direct play activation for dummy offer test
    const dummyMatch = HARIYALI_TEEJ_OFFERS.find((o) => o.code === normalized) || BANK_OFFERS.find((b) => b.code === normalized);
    
    if (dummyMatch) {
      try {
        await navigator.clipboard.writeText(normalized);
      } catch {}

      setActiveAppliedOffer({
        code: normalized,
        title: dummyMatch.title || dummyMatch.offer || `Code ${normalized} Activated`,
        discount: dummyMatch.discount || dummyMatch.offer || "Special Discount Applied",
      });
      triggerToast(`🎉 Promo Code ${normalized} Activated Successfully!`);
      return;
    }

    if (!user) {
      openAuthModal("login");
      return;
    }

    setApplyingCode(normalized);
    setManualError("");

    try {
      await validateCoupon({ code: normalized, subtotal });
      setActiveAppliedOffer({
        code: normalized,
        title: `Coupon ${normalized} Applied`,
        discount: "Discount Applied to Cart",
      });
      triggerToast(`🎉 Coupon ${normalized} Applied!`);
    } catch (err) {
      setManualError(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setApplyingCode("");
    }
  };

  const handlePlayOffer = (offer) => {
    try {
      navigator.clipboard.writeText(offer.code);
    } catch {}

    setActiveAppliedOffer({
      code: offer.code,
      title: offer.title || offer.offer,
      discount: offer.discount || offer.offer,
    });
    triggerToast(`🎉 Offer ${offer.code} Activated! Code copied to clipboard.`);
  };

  const handleCouponAction = (coupon) => {
    if (coupon.redemptionBlocked) {
      setManualError(coupon.redemptionBlocked);
      return;
    }
    if (!coupon.unlocked) {
      navigate("/cart");
      return;
    }
    applyCouponCode(coupon.code);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-24 lg:pb-8">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 animate-bounce rounded-2xl bg-emerald-950 px-5 py-3 text-xs font-black text-amber-300 shadow-2xl border border-emerald-500/60 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Live Active Offer Modal */}
      {activeAppliedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-emerald-100 text-center">
            <button
              type="button"
              onClick={() => setActiveAppliedOffer(null)}
              className="absolute top-3 right-3 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-3 shadow-inner">
              <Gift className="h-8 w-8 animate-pulse" />
            </div>

            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-[10.5px] font-black text-amber-800 uppercase tracking-wider">
              Offer Activated Live
            </span>

            <h3 className="mt-2 text-lg font-black text-slate-900 leading-tight">
              {activeAppliedOffer.title}
            </h3>

            <div className="mt-3 rounded-2xl bg-emerald-50 p-3 border border-emerald-200">
              <span className="font-mono text-base font-black text-emerald-800 tracking-wider">
                {activeAppliedOffer.code}
              </span>
              <p className="mt-1 text-xs font-bold text-emerald-700">
                {activeAppliedOffer.discount}
              </p>
            </div>

            <p className="mt-3 text-xs text-slate-500 font-medium">
              Promo code copied to clipboard & automatically linked to your account checkout!
            </p>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setActiveAppliedOffer(null);
                  navigate("/checkout", { state: { applyCouponCode: activeAppliedOffer.code } });
                }}
                className="w-full rounded-2xl bg-[#0C831F] py-3 text-xs font-black text-white hover:bg-[#097019] shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" /> Proceed to Checkout
              </button>
              <button
                type="button"
                onClick={() => setActiveAppliedOffer(null)}
                className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Keep Exploring Offers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Go back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <h1 className="truncate text-base font-black text-slate-900 leading-none">
                Super Saver Mega Offers
              </h1>
              <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                Coupons, Cashbacks & Bank Discounts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCodeInput((prev) => !prev)}
            className="shrink-0 rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 hover:bg-emerald-100 cursor-pointer"
          >
            Have a code?
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-3 sm:px-4 py-4 space-y-5">
        {/* SUPER SAVER FESTIVE HERO SECTION */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 p-5 text-white shadow-xl border border-emerald-700/50">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-full bg-emerald-800/80 px-3 py-1 text-[11px] font-extrabold text-amber-300 border border-emerald-600/60 shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Super Savings Bumper Bounty</span>
            </div>
            <div className="flex items-center gap-1 bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black">
              <Gift className="h-3 w-3" /> Special Deals
            </div>
          </div>

          <div className="mt-3">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Super Saver Festive Deals & Coupons
            </h2>
            <p className="mt-1 text-xs text-emerald-200 font-medium max-w-lg">
              Enjoy extra festive discounts on Farm Fresh Organic Veggies, 10-Min Meal Prep Veggie Mixes & Super Mall Marketplace Essentials!
            </p>
          </div>

          {/* Festive Highlights Cards */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {HARIYALI_TEEJ_OFFERS.map((offer) => (
              <div
                key={offer.code}
                className="relative overflow-hidden rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/20 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block rounded-md bg-amber-400 px-2 py-0.5 text-[9.5px] font-black text-slate-950">
                    {offer.badge}
                  </span>
                  <h4 className="mt-2 text-xs font-black text-white leading-snug line-clamp-1">
                    {offer.title}
                  </h4>
                  <p className="text-[10px] font-bold text-amber-200 mt-0.5">
                    {offer.discount}
                  </p>
                  <p className="text-[9.5px] text-emerald-100 mt-1 line-clamp-2 leading-relaxed">
                    {offer.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/15">
                  <span className="font-mono text-xs font-black tracking-wider text-amber-300">
                    {offer.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlayOffer(offer)}
                    className="rounded-lg bg-amber-400 px-2.5 py-1 text-[10px] font-black text-slate-950 hover:bg-amber-300 transition cursor-pointer shadow-xs"
                  >
                    Apply Deal
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Redirect Buttons */}
          <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-emerald-800">
            <Link
              to="/greengrocc"
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-extrabold text-emerald-200 hover:bg-emerald-500/30 border border-emerald-400/40"
            >
              🥦 GreenGrocc Fresh <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/ready2cook"
              className="inline-flex items-center gap-1 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-extrabold text-amber-200 hover:bg-amber-500/30 border border-amber-400/40"
            >
              🍳 Ready2Cook <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/super-mall"
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-500/20 px-3 py-1.5 text-xs font-extrabold text-indigo-200 hover:bg-indigo-500/30 border border-indigo-400/40"
            >
              🛍️ Super Mall <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* BANK & UPI PAYMENT OFFERS */}
        <section className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200/80">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-black text-slate-900">
              Bank & Wallet Payment Cashbacks
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {BANK_OFFERS.map((bank) => (
              <div
                key={bank.code}
                className={`rounded-xl p-3 border ${bank.bgColor} flex flex-col justify-between`}
              >
                <div>
                  <p className="text-[10.5px] font-bold opacity-80">{bank.bank}</p>
                  <p className="text-xs font-black mt-0.5 leading-snug">{bank.offer}</p>
                  <p className="text-[10px] mt-1 font-semibold opacity-75">Min Order: {bank.minOrder}</p>
                </div>
                <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-black/10">
                  <span className="font-mono text-xs font-black">{bank.code}</span>
                  <button
                    type="button"
                    onClick={() => handlePlayOffer(bank)}
                    className="rounded-md bg-white/80 px-2 py-0.5 text-[10.5px] font-black text-slate-900 border border-black/10 hover:bg-white cursor-pointer shadow-2xs"
                  >
                    Apply Offer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MANUAL CODE INPUT FORM */}
        {showCodeInput ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
            <label htmlFor="manual-coupon" className="text-xs font-extrabold text-emerald-950">
              Enter Promo / Coupon Code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="manual-coupon"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.toUpperCase());
                  if (manualError) setManualError("");
                }}
                placeholder="EX: TEEJ100"
                className="min-w-0 flex-1 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-sm uppercase font-black focus:border-emerald-600 focus:outline-none"
              />
              <button
                type="button"
                disabled={!manualCode.trim() || applyingCode}
                onClick={() => applyCouponCode(manualCode)}
                className="rounded-xl bg-[#0C831F] px-4 py-2 text-xs font-black text-white hover:bg-[#097019] disabled:opacity-50 cursor-pointer"
              >
                {applyingCode ? "Applying..." : "Apply Code"}
              </button>
            </div>
            {manualError ? <p className="mt-2 text-xs font-bold text-red-600">{manualError}</p> : null}
          </div>
        ) : null}

        {/* FEATURED COUPONS LIST */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-slate-600">
              Available Promo Coupons
            </p>
            <span className="text-xs font-bold text-slate-500">
              {coupons.length} Active Deals
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`coupon-skeleton-${index}`}
                  className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
              {error}
            </p>
          ) : null}

          {!loading && !error && coupons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
              <p className="text-xs font-semibold text-slate-500">No promo coupons available right now.</p>
              <Link to="/product" className="mt-2 inline-block text-xs font-bold text-emerald-700 hover:underline">
                Explore All Products
              </Link>
            </div>
          ) : null}

          {!loading && !error && coupons.length > 0 ? (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <CouponCard
                  key={coupon.code}
                  coupon={coupon}
                  expanded={expandedCode === coupon.code}
                  onToggleDetails={() =>
                    setExpandedCode((current) => (current === coupon.code ? null : coupon.code))
                  }
                  onApply={handleCouponAction}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Coupons;
