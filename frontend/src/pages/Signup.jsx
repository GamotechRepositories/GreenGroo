import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthSplitLayout, {
  AuthHeader,
  AuthSection,
  AuthField,
  AuthSubmitButton,
  AuthFooterLink,
  AuthError,
  authInputClass,
  authPhoneWrapClass,
} from "../components/auth/AuthSplitLayout";

const validateName = (value) => {
  const words = value.trim().split(/\s+/);
  if (words.length < 1 || words.length > 2) return false;
  return words.every((word) => /^[A-Za-z]{2,30}$/.test(word));
};
const PHONE_PATTERN = /^[6789]\d{9}$/;
const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function AccountTypeToggle({ value, onChange }) {
  const options = [
    {
      id: "retail",
      title: "Personal",
      desc: "Everyday shopping",
    },
    {
      id: "bulk",
      title: "Bulk / Business",
      desc: "Wholesale grades",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-lg px-3 py-2.5 text-left transition ${
              active
                ? "bg-white shadow-sm ring-1 ring-black/5"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span
              className={`block text-[13px] font-semibold ${
                active ? "text-gray-900" : "text-gray-700"
              }`}
            >
              {option.title}
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">
              {option.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function Signup() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [accountType, setAccountType] = useState("retail");
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isBulk = accountType === "bulk";
  const redirectTo = location.state?.from || "/";

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  const validateForm = () => {
    if (!validateName(name)) {
      return isBulk
        ? "Owner name must be 1 or 2 words, letters only (e.g. Rahul or John Smith)"
        : "Name must be 1 or 2 words, letters only (e.g. Rahul or John Smith)";
    }

    if (isBulk) {
      if (!shopName.trim() || shopName.trim().length < 2) {
        return "Business name is required (at least 2 characters)";
      }
      if (!shopAddress.trim() || shopAddress.trim().length < 5) {
        return "Please enter a complete business location";
      }
      if (!PHONE_PATTERN.test(ownerContact.trim())) {
        return "Owner contact must be 10 digits starting with 6, 7, 8, or 9";
      }
      const gst = gstNumber.trim().toUpperCase();
      if (gst && !GST_PATTERN.test(gst)) {
        return "Please provide a valid GST number";
      }
    }

    if (!PHONE_PATTERN.test(phone.trim())) {
      return "Phone must be 10 digits starting with 6, 7, 8, or 9";
    }
    if (!password || password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        password,
        accountType,
      };

      if (isBulk) {
        payload.shopName = shopName.trim();
        payload.shopAddress = shopAddress.trim();
        payload.ownerContact = ownerContact.trim();
        if (gstNumber.trim()) {
          payload.gstNumber = gstNumber.trim().toUpperCase();
        }
      }

      await signup(payload);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Sign up failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout mode="signup" wide>
      <AuthHeader
        eyebrow="Create account"
        title={isBulk ? "Business registration" : "Join GreenGroo"}
        subtitle={
          isBulk
            ? "Tell us about your business, then set login details."
            : "A few details and you’re ready to shop."
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthSection title="Account type">
          <AccountTypeToggle
            value={accountType}
            onChange={(next) => {
              setAccountType(next);
              setError("");
            }}
          />
        </AuthSection>

        <AuthSection title={isBulk ? "Business details" : "Your details"}>
          <AuthField label={isBulk ? "Owner name" : "Full name"} htmlFor="signup-name">
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder={isBulk ? "e.g. Rahul Sharma" : "e.g. Rahul Sharma"}
              className={authInputClass}
              required
              autoComplete="name"
            />
          </AuthField>

          {isBulk ? (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <AuthField label="Business name" htmlFor="signup-business">
                  <input
                    id="signup-business"
                    type="text"
                    value={shopName}
                    onChange={(event) => {
                      setShopName(event.target.value);
                      setError("");
                    }}
                    placeholder="Registered business name"
                    className={authInputClass}
                    required
                  />
                </AuthField>

                <AuthField label="GST number" htmlFor="signup-gst" optional>
                  <input
                    id="signup-gst"
                    type="text"
                    value={gstNumber}
                    onChange={(event) => {
                      setGstNumber(
                        event.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15)
                      );
                      setError("");
                    }}
                    placeholder="22AAAAA0000A1Z5"
                    className={authInputClass}
                    maxLength={15}
                  />
                </AuthField>
              </div>

              <AuthField label="Business location" htmlFor="signup-location">
                <textarea
                  id="signup-location"
                  value={shopAddress}
                  onChange={(event) => {
                    setShopAddress(event.target.value);
                    setError("");
                  }}
                  placeholder="Address, city, pincode"
                  rows={2}
                  className={`${authInputClass} resize-none`}
                  required
                />
              </AuthField>

              <AuthField label="Owner contact" htmlFor="signup-owner-contact">
                <div className={authPhoneWrapClass}>
                  <div className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-[13px] font-medium text-gray-600">
                    +91
                  </div>
                  <input
                    id="signup-owner-contact"
                    type="tel"
                    value={ownerContact}
                    onChange={(event) => {
                      setOwnerContact(event.target.value.replace(/\D/g, "").slice(0, 10));
                      setError("");
                    }}
                    placeholder="Owner phone number"
                    maxLength={10}
                    className="min-w-0 flex-1 bg-white px-3.5 py-2.5 text-[13.5px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    required
                  />
                </div>
              </AuthField>
            </>
          ) : null}
        </AuthSection>

        <AuthSection title="Login details">
          <AuthField
            label="Mobile number"
            htmlFor="signup-phone"
            hint="You’ll use this number to sign in"
          >
            <div className={authPhoneWrapClass}>
              <div className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-[13px] font-medium text-gray-600">
                +91
              </div>
              <input
                id="signup-phone"
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                  setError("");
                }}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="min-w-0 flex-1 bg-white px-3.5 py-2.5 text-[13.5px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                required
                autoComplete="tel"
              />
            </div>
          </AuthField>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <AuthField label="Password" htmlFor="signup-password" hint="Minimum 6 characters">
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Create password"
                  className={`${authInputClass} pr-10`}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </AuthField>

            <AuthField label="Confirm password" htmlFor="signup-confirm">
              <input
                id="signup-confirm"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                placeholder="Re-enter password"
                className={authInputClass}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </AuthField>
          </div>
        </AuthSection>

        <AuthError message={error} />
        <AuthSubmitButton submitting={submitting}>
          {isBulk ? "Register business account" : "Create account"}
        </AuthSubmitButton>
      </form>

      <AuthFooterLink
        prompt="Already have an account?"
        to="/login"
        label="Sign in"
        state={location.state}
      />
    </AuthSplitLayout>
  );
}
