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

const formatPrice = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

function CouponIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z"
        />
      </svg>
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
    <article className="overflow-hidden rounded-2xl border border-[#E7E7E7] bg-white">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <CouponIcon />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold leading-snug text-text-primary">
                {formatCouponHeadline(coupon)}
              </h3>
              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                  coupon.unlocked
                    ? "border-[#1FAF38] text-[#1FAF38]"
                    : "border-[#D7D7D7] text-text-muted"
                }`}
              >
                {coupon.unlocked ? "Unlocked" : "Locked"}
              </span>
            </div>
            <p
              className={`mt-2 text-sm font-medium ${
                coupon.unlocked ? "text-[#1FAF38]" : "text-[#F57C00]"
              }`}
            >
              {formatCouponUnlockMessage(coupon)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-dashed border-[#DADADA]" />

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-md border border-[#ECECEC] bg-[#F7F7F7] px-3 py-1.5 text-sm font-bold tracking-wide text-text-primary">
            {coupon.code}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border-light px-2 py-1 text-xs font-semibold text-text-secondary transition hover:border-primary/40 hover:text-primary"
            aria-label={`Copy coupon code ${coupon.code}`}
          >
            {copied ? (
              "Copied"
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleDetails}
          className="inline-flex items-center gap-1 text-sm font-semibold text-text-primary"
        >
          Know more
          <svg
            className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`}
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
        <div className="border-t border-[#F0F0F0] bg-[#FAFAFA] px-4 py-3 text-sm text-text-secondary">
          <p>Valid till {formatCouponValidity(coupon.endDate)}.</p>
          <p className="mt-1">
            Minimum order: {formatPrice(coupon.minOrderAmount)}
            {coupon.appliesToAllProducts ? " · Applies to all products" : ""}
          </p>
          {!coupon.perUserUnlimited || !coupon.totalUnlimited ? (
            <p className="mt-1">
              Redemptions:
              {!coupon.perUserUnlimited ? ` ${coupon.maxRedemptionsPerUser} per user` : ""}
              {!coupon.perUserUnlimited && !coupon.totalUnlimited ? " ·" : ""}
              {!coupon.totalUnlimited ? ` ${coupon.maxTotalRedemptions} total` : ""}
              {coupon.perUserUnlimited && coupon.totalUnlimited ? " Unlimited" : ""}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => onApply(coupon)}
            className={`mt-3 rounded-lg px-4 py-2 text-sm font-bold ${
              coupon.unlocked
                ? "bg-primary text-white"
                : "border border-border-light bg-white text-text-primary"
            }`}
          >
            {coupon.unlocked ? "Apply coupon" : "View cart"}
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

  const applyCouponCode = async (code) => {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) return;

    if (!user) {
      openAuthModal("login");
      return;
    }

    setApplyingCode(normalized);
    setManualError("");

    try {
      await validateCoupon({ code: normalized, subtotal });
      navigate("/checkout", { state: { applyCouponCode: normalized } });
    } catch (err) {
      setManualError(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setApplyingCode("");
    }
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
    <div className="min-h-screen bg-[#F4F4F4] pb-24 lg:pb-8">
      <div className="sticky top-0 z-20 border-b border-border-light bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light text-text-primary"
              aria-label="Go back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h1 className="truncate text-lg font-bold text-text-primary">Coupons</h1>
          </div>

          <button
            type="button"
            onClick={() => setShowCodeInput((prev) => !prev)}
            className="shrink-0 rounded-full border border-border-light px-3 py-1.5 text-sm font-semibold text-text-primary"
          >
            Have a code?
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-4">
        <p className="text-center text-sm text-text-muted">
          Note: You can apply coupons during checkout.
        </p>

        {showCodeInput ? (
          <div className="mt-4 rounded-2xl border border-border-light bg-white p-4">
            <label htmlFor="manual-coupon" className="text-sm font-semibold text-text-primary">
              Enter coupon code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="manual-coupon"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.toUpperCase());
                  if (manualError) setManualError("");
                }}
                placeholder="COUPON CODE"
                className="min-w-0 flex-1 rounded-lg border border-border-light px-3 py-2.5 text-sm uppercase focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              <button
                type="button"
                disabled={!manualCode.trim() || applyingCode}
                onClick={() => applyCouponCode(manualCode)}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {applyingCode ? "..." : "Apply"}
              </button>
            </div>
            {manualError ? <p className="mt-2 text-xs text-red-600">{manualError}</p> : null}
          </div>
        ) : null}

        <div className="mt-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
            Featured Coupons
          </p>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`coupon-skeleton-${index}`}
                  className="h-36 animate-pulse rounded-2xl border border-border-light bg-white"
                />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {!loading && !error && coupons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-light bg-white px-4 py-10 text-center">
              <p className="text-sm text-text-secondary">No coupons available right now.</p>
              <Link to="/product" className="mt-3 inline-block text-sm font-semibold text-primary">
                Continue shopping
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
