import { useEffect, useState } from "react";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "./adminStyles";

export const ADDRESS_FORM_FIELDS = {
  fullName: "",
  number: "",
  email: "",
  shopNo: "",
  shopName: "",
  fullAddress: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
};

const PHONE_PATTERN = /^[6789]\d{9}$/;
const PINCODE_PATTERN = /^\d{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAddressForm(form) {
  const fullName = form.fullName?.trim();
  const number = form.number?.trim();
  const email = form.email?.trim();
  const shopNo = form.shopNo?.trim();
  const shopName = form.shopName?.trim();
  const fullAddress = form.fullAddress?.trim();
  const landmark = form.landmark?.trim();
  const city = form.city?.trim();
  const state = form.state?.trim();
  const pincode = form.pincode?.trim();

  if (!fullName) return "Full name is required";
  if (!number) return "Phone number is required";
  if (!PHONE_PATTERN.test(number)) {
    return "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9";
  }
  if (!email) return "Email is required";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address";
  if (!shopNo) return "Shop number is required";
  if (!shopName) return "Shop name is required";
  if (!fullAddress) return "Full address is required";
  if (!landmark) return "Landmark is required";
  if (!city) return "City is required";
  if (!state) return "State is required";
  if (!pincode) return "Pincode is required";
  if (!PINCODE_PATTERN.test(pincode)) return "Pincode must be 6 digits";
  return "";
}

function AdminAddressForm({ initial, onSubmit, onCancel, submitting, submitLabel = "Save Address" }) {
  const [form, setForm] = useState(initial || ADDRESS_FORM_FIELDS);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setForm(initial || ADDRESS_FORM_FIELDS);
    setValidationError("");
  }, [initial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (validationError) setValidationError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validateAddressForm(form);
    if (error) {
      setValidationError(error);
      return;
    }

    onSubmit({
      fullName: form.fullName.trim(),
      number: form.number.trim(),
      email: form.email.trim(),
      shopNo: form.shopNo.trim(),
      shopName: form.shopName.trim(),
      fullAddress: form.fullAddress.trim(),
      landmark: form.landmark.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      isDefault: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{validationError}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Full name *</label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Phone *</label>
          <input
            name="number"
            value={form.number}
            onChange={handleChange}
            required
            maxLength={10}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Email *</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Shop no. *</label>
          <input
            name="shopNo"
            value={form.shopNo}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Shop name *</label>
          <input
            name="shopName"
            value={form.shopName}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Full address *</label>
        <textarea
          name="fullAddress"
          value={form.fullAddress}
          onChange={handleChange}
          required
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className={labelClass}>Landmark *</label>
        <input
          name="landmark"
          value={form.landmark}
          onChange={handleChange}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>City *</label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>State *</label>
          <input
            name="state"
            value={form.state}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Pincode *</label>
          <input
            name="pincode"
            value={form.pincode}
            onChange={handleChange}
            required
            maxLength={6}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button type="button" onClick={onCancel} className={btnSecondary} disabled={submitting}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className={btnPrimary} disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default AdminAddressForm;
