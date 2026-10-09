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
import { Tag, ArrowRight, Copy, Check, X } from "lucide-react";

const formatPrice = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

// Seasonal Offers
const SEASONAL_OFFERS = [
  {
    code: "FRESH50",
    title: "50% Instant Cashback on Ready2Cook",
    discount: "50% OFF (Up to ₹150)",
    minSpend: 299,
    description: "Save 50% on all pre-washed & chopped vegetables & meal prep mixes.",
    expiresIn: "Limited Time",
  },
  {
    code: "SUPERMALL20",
    title: "Super Mall Mega Pantry Deal",
    discount: "FLAT 20% CASHBACK",
    minSpend: 999,
    description: "Extra 20% Cashback on Fortune Oils, Aashirvaad Atta & Branded Packaged Foods.",
    expiresIn: "Valid Today",
  },
];

// Bank Offers
const BANK_OFFERS = [
  {
    bank: "UPI / Wallets",
    offer: "Flat ₹50 Instant Cashback",
    minOrder: "₹399+",
    code: "UPI50",
  },
  {
    bank: "HDFC Bank Credit Cards",
    offer: "10% Instant Discount up to ₹250",
    minOrder: "₹999+",
    code: "HDFC10",
  },
  {
    bank: "ICICI Net Banking & Cards",
    offer: "Flat ₹150 Off on ₹1,299",
    minOrder: "₹1,299+",
    code: "ICICI150",
  },
];

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
    <article className="rounded-md border border-slate-200 bg-white">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-50 border border-slate-100 text-slate-700">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {formatCouponHeadline(coupon)}
              </h3>
              <p className={`mt-1 text-xs ${coupon.unlocked ? 'text-[#0C831F]' : 'text-slate-500'}`}>
                {formatCouponUnlockMessage(coupon)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleDetails}
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            {expanded ? "Hide Details" : "View Details"}
          </button>
        </div>

        {expanded && (
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <p>Valid till {formatCouponValidity(coupon.endDate)}.</p>
            <p className="mt-1">
              Minimum order: {formatPrice(coupon.minOrderAmount)}
              {coupon.appliesToAllProducts ? " · Applies to all products" : ""}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-wide text-slate-800">
              {coupon.code}
            </div>
            <button
              onClick={handleCopy}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              {copied ? <><Check className="h-3.5 w-3.5 text-[#0C831F]" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </button>
          </div>
          <button
            onClick={() => onApply(coupon)}
            className={`px-4 py-1.5 text-xs font-semibold rounded ${
              coupon.unlocked 
                ? "bg-[#0C831F] text-white hover:bg-[#0A6C19]" 
                : "border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {coupon.unlocked ? "Apply" : "View Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}

function Coupons() {
  const navigate = useNavigate();
  const { items } = useCart();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCode, setExpandedCode] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState("");
  const [applyingCode, setApplyingCode] = useState("");

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
    setTimeout(() => setToastMessage(""), 3000);
  };

  const applyCouponCode = async (code) => {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) return;

    setApplyingCode(normalized);
    setManualError("");

    try {
      const { data } = await validateCoupon({ code: normalized, subtotal });
      const validatedCoupon = data?.data;

      try {
        await navigator.clipboard.writeText(normalized);
      } catch {}

      const discountLabel =
        validatedCoupon?.discountType === "percentage"
          ? `${validatedCoupon.discountValue}% OFF` +
            (validatedCoupon.discountAmount ? ` (Save ₹${validatedCoupon.discountAmount})` : "")
          : `Flat ₹${validatedCoupon?.discountValue || 0} OFF`;

      setActiveAppliedOffer({
        code: normalized,
        title: validatedCoupon?.title || `Coupon ${normalized} Applied`,
        discount: discountLabel,
      });
      triggerToast(`Coupon ${normalized} applied successfully`);
    } catch (err) {
      setManualError(err.response?.data?.message || "Invalid or ineligible coupon code");
    } finally {
      setApplyingCode("");
    }
  };

  const handlePlayOffer = (offer) => {
    applyCouponCode(offer.code);
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
    <div className="min-h-screen bg-slate-50 pb-12">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded bg-slate-900 px-4 py-2 text-sm text-white shadow-md">
          {toastMessage}
        </div>
      )}

      {activeAppliedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="relative w-full max-w-sm rounded-md bg-white p-6 shadow-lg text-center">
            <button
              onClick={() => setActiveAppliedOffer(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0C831F]/10 text-[#0C831F] mb-4">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {activeAppliedOffer.title}
            </h3>
            <div className="mt-4 rounded bg-slate-50 p-3 border border-slate-100">
              <span className="font-mono text-sm font-semibold text-slate-800">
                {activeAppliedOffer.code}
              </span>
              <p className="mt-1 text-sm text-[#0C831F]">
                {activeAppliedOffer.discount}
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  setActiveAppliedOffer(null);
                  navigate("/checkout", { state: { applyCouponCode: activeAppliedOffer.code } });
                }}
                className="w-full rounded bg-[#0C831F] py-2.5 text-sm font-semibold text-white hover:bg-[#0A6C19]"
              >
                Proceed to Checkout
              </button>
              <button
                onClick={() => setActiveAppliedOffer(null)}
                className="w-full rounded border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Keep Exploring
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-slate-600 hover:text-slate-900"
          >
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">
            Coupons & Offers
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        
        <section>
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Have a promo code?</h2>
            <div className="flex gap-3">
              <input
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.toUpperCase());
                  if (manualError) setManualError("");
                }}
                placeholder="Enter code here"
                className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm uppercase focus:border-[#0C831F] focus:outline-none"
              />
              <button
                disabled={!manualCode.trim() || applyingCode}
                onClick={() => applyCouponCode(manualCode)}
                className="rounded-md bg-[#0C831F] px-6 py-2 text-sm font-semibold text-white hover:bg-[#0A6C19] disabled:opacity-50"
              >
                {applyingCode ? "Applying..." : "Apply"}
              </button>
            </div>
            {manualError && <p className="mt-2 text-sm text-red-600">{manualError}</p>}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">
            Available Promos ({coupons.length})
          </h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 rounded-md border border-slate-200 bg-white animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 bg-red-50 p-4 rounded-md border border-red-100">{error}</p>
          ) : coupons.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
              No promotions available right now.
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <CouponCard
                  key={coupon.code}
                  coupon={coupon}
                  expanded={expandedCode === coupon.code}
                  onToggleDetails={() =>
                    setExpandedCode(current => (current === coupon.code ? null : coupon.code))
                  }
                  onApply={handleCouponAction}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">
            Partner Offers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BANK_OFFERS.map(bank => (
              <div key={bank.code} className="rounded-md border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500 mb-1">{bank.bank}</p>
                <h3 className="text-sm font-semibold text-slate-900">{bank.offer}</h3>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    {bank.code}
                  </span>
                  <button
                    onClick={() => handlePlayOffer(bank)}
                    className="text-xs font-semibold text-[#0C831F] hover:text-[#0A6C19]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

export default Coupons;
