import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createCoupon, updateCoupon } from "../../../api/api";
import AdminAlert from "../AdminAlert";
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  formHeaderClass,
  inputClass,
  labelClass,
} from "../adminStyles";

const EMPTY_FORM = {
  code: "",
  title: "",
  discountType: "percentage",
  discountValue: "",
  startDate: "",
  endDate: "",
  minOrderAmount: "0",
  maxRedemptionsPerUser: "1",
  maxRedemptionsPerUserUnlimited: true,
  maxTotalRedemptions: "100",
  maxTotalRedemptionsUnlimited: true,
  isActive: true,
};

function toDatetimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function AddCouponSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const editCoupon = location.state?.editCoupon;

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!editCoupon) return;

    const perUserUnlimited =
      editCoupon.maxRedemptionsPerUser === null ||
      editCoupon.maxRedemptionsPerUser === undefined;
    const totalUnlimited =
      editCoupon.maxTotalRedemptions === null ||
      editCoupon.maxTotalRedemptions === undefined;

    setEditingId(editCoupon._id);
    setForm({
      code: editCoupon.code || "",
      title: editCoupon.title || "",
      discountType: editCoupon.discountType || "percentage",
      discountValue: String(editCoupon.discountValue ?? ""),
      startDate: toDatetimeLocalValue(editCoupon.startDate),
      endDate: toDatetimeLocalValue(editCoupon.endDate),
      minOrderAmount: String(editCoupon.minOrderAmount ?? 0),
      maxRedemptionsPerUser: perUserUnlimited
        ? "1"
        : String(editCoupon.maxRedemptionsPerUser),
      maxRedemptionsPerUserUnlimited: perUserUnlimited,
      maxTotalRedemptions: totalUnlimited
        ? "100"
        : String(editCoupon.maxTotalRedemptions),
      maxTotalRedemptionsUnlimited: totalUnlimited,
      isActive: editCoupon.isActive !== false,
    });
  }, [editCoupon]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "maxRedemptionsPerUserUnlimited" && checked) {
        next.maxRedemptionsPerUser = "1";
      }
      if (name === "maxTotalRedemptionsUnlimited" && checked) {
        next.maxTotalRedemptions = "100";
      }

      return next;
    });
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    navigate("/coupons/show");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      code: form.code.trim(),
      title: form.title.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxRedemptionsPerUser: form.maxRedemptionsPerUserUnlimited
        ? null
        : Number(form.maxRedemptionsPerUser),
      maxTotalRedemptions: form.maxTotalRedemptionsUnlimited
        ? null
        : Number(form.maxTotalRedemptions),
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await updateCoupon(editingId, payload);
        setSuccess("Coupon updated");
      } else {
        await createCoupon(payload);
        setSuccess("Coupon created");
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      navigate("/coupons/show", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save coupon");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      <AdminAlert
        error={error}
        success={success}
        onClear={() => {
          setError("");
          setSuccess("");
        }}
      />

      <form onSubmit={handleSubmit} className={`${cardClass} space-y-4`}>
        <div className={formHeaderClass}>
          <h3 className="font-semibold text-text-primary">
            {editingId ? "Edit Coupon" : "Create Coupon"}
          </h3>
          <button type="button" onClick={handleCancel} className={btnSecondary}>
            Back to Coupons
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="coupon-code">
              Coupon Code
            </label>
            <input
              id="coupon-code"
              name="code"
              value={form.code}
              onChange={handleChange}
              required
              placeholder="SAVE10"
              className={`${inputClass} uppercase`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-title">
              Title (optional)
            </label>
            <input
              id="coupon-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Summer sale"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-discount-type">
              Discount Type
            </label>
            <select
              id="coupon-discount-type"
              name="discountType"
              value={form.discountType}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed amount (₹)</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-discount-value">
              Discount Value
            </label>
            <input
              id="coupon-discount-value"
              name="discountValue"
              type="number"
              min="0"
              step={form.discountType === "percentage" ? "1" : "0.01"}
              max={form.discountType === "percentage" ? "100" : undefined}
              value={form.discountValue}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-start-date">
              Start Date & Time
            </label>
            <input
              id="coupon-start-date"
              name="startDate"
              type="datetime-local"
              value={form.startDate}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-end-date">
              End Date & Time
            </label>
            <input
              id="coupon-end-date"
              name="endDate"
              type="datetime-local"
              value={form.endDate}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-min-order">
              Minimum Order Amount (₹)
            </label>
            <input
              id="coupon-min-order"
              name="minOrderAmount"
              type="number"
              min="0"
              step="1"
              value={form.minOrderAmount}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-max-per-user">
              Max Redemptions Per User
            </label>
            <input
              id="coupon-max-per-user"
              name="maxRedemptionsPerUser"
              type="number"
              min="1"
              step="1"
              value={form.maxRedemptionsPerUser}
              onChange={handleChange}
              disabled={form.maxRedemptionsPerUserUnlimited}
              className={inputClass}
            />
            <label className="mt-2 flex items-center gap-2 text-xs font-medium text-text-secondary">
              <input
                type="checkbox"
                name="maxRedemptionsPerUserUnlimited"
                checked={form.maxRedemptionsPerUserUnlimited}
                onChange={handleChange}
                className="h-4 w-4 accent-primary"
              />
              Unlimited (∞)
            </label>
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-max-total">
              Max Total Redemptions
            </label>
            <input
              id="coupon-max-total"
              name="maxTotalRedemptions"
              type="number"
              min="1"
              step="1"
              value={form.maxTotalRedemptions}
              onChange={handleChange}
              disabled={form.maxTotalRedemptionsUnlimited}
              className={inputClass}
            />
            <label className="mt-2 flex items-center gap-2 text-xs font-medium text-text-secondary">
              <input
                type="checkbox"
                name="maxTotalRedemptionsUnlimited"
                checked={form.maxTotalRedemptionsUnlimited}
                onChange={handleChange}
                className="h-4 w-4 accent-primary"
              />
              Unlimited (∞)
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="h-4 w-4 accent-primary"
              />
              Active
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={submitting} className={btnPrimary}>
            {submitting ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
          </button>
          <button type="button" onClick={handleCancel} className={btnSecondary}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddCouponSection;
