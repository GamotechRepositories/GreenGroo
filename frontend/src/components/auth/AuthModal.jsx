import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";

const validateName = (value) => {
  const words = value.trim().split(/\s+/);
  if (words.length < 1 || words.length > 2) return false;
  return words.every((word) => /^[A-Za-z]{2,30}$/.test(word));
};
const PHONE_PATTERN = /^[6789]\d{9}$/;
const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function UserIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function PhoneIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function ArrowRightIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function LockIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function BuildingIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function EyeIcon({ open, className = "h-4 w-4" }) {
  if (open) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function getAuthUi(isSignup) {
  if (isSignup) {
    return {
      modal: "max-w-[480px]",
      panel: "px-5 pb-5 pt-5 max-h-[90vh] overflow-y-auto",
      form: "space-y-3",
      label: "mb-1 block text-xs font-semibold text-gray-800",
      field:
        "w-full rounded-lg border border-gray-200 bg-white py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10",
      fieldPad: "pl-8 pr-2.5",
      fieldPadPassword: "pl-8 pr-9",
      phoneWrap: "rounded-lg",
      phonePrefix: "gap-1.5 px-2.5 text-xs",
      phoneIcon: "h-3.5 w-3.5",
      phoneInput: "py-2 pl-2.5 pr-2.5 text-xs",
      btn: "gap-1.5 rounded-lg py-2.5 text-xs",
      footer: "mt-3 text-xs",
      error: "px-2.5 py-2 text-xs",
      headerMb: "mb-4",
      headerGap: "gap-2.5 pr-7",
      headerIcon: "h-9 w-9",
      headerTitle: "text-lg",
      headerSubtitle: "mt-0.5 text-xs",
      arrow: "h-3.5 w-3.5",
    };
  }

  return {
    modal: "max-w-[420px]",
    panel: "px-6 pb-6 pt-6",
    form: "space-y-5",
    label: "mb-1.5 block text-sm font-semibold text-gray-800",
    field:
      "w-full rounded-xl border border-gray-200 bg-white py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10",
    fieldPad: "pl-10 pr-3",
    fieldPadPassword: "pl-10 pr-11",
    phoneWrap: "rounded-xl",
    phonePrefix: "gap-2 px-3.5 text-sm",
    phoneIcon: "h-4 w-4",
    phoneInput: "py-3 pl-3 pr-3 text-sm",
    btn: "gap-2 rounded-xl py-3.5 text-sm",
    footer: "mt-5 text-sm",
    error: "px-3 py-2.5 text-sm",
    headerMb: "mb-5",
    headerGap: "gap-3 pr-8",
    headerIcon: "h-11 w-11",
    headerTitle: "text-xl sm:text-2xl",
    headerSubtitle: "mt-1 text-sm",
    arrow: "h-4 w-4",
  };
}

function IconField({ label, htmlFor, optional = false, icon, labelClassName, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClassName}>
        {label}
        {optional ? <span className="font-normal text-gray-400"> (Optional)</span> : null}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function AuthModalHeader({ isSignup, isBulk, ui }) {
  const headerWrap = `${ui.headerMb} flex items-start ${ui.headerGap}`;
  const iconWrap = `flex ${ui.headerIcon} shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary`;
  const titleClass = `${ui.headerTitle} font-bold leading-tight text-gray-900`;
  const subtitleClass = `${ui.headerSubtitle} leading-snug text-gray-500`;

  if (isSignup) {
    return (
      <div className={headerWrap}>
        <div className={iconWrap}>
          {isBulk ? <BuildingIcon className="h-4 w-4" /> : <UserIcon />}
        </div>
        <div>
          <h2 id="auth-modal-title" className={titleClass}>
            Create Your <span className="text-primary">Account</span>
          </h2>
          <p className={subtitleClass}>
            {isBulk
              ? "Register your business for bulk ordering"
              : "Fill your details and set a password to sign up"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={headerWrap}>
      <div className={iconWrap}>
        <PhoneIcon className="h-4 w-4" />
      </div>
      <div>
        <h2 id="auth-modal-title" className={titleClass}>
          Welcome <span className="text-primary">Back</span>
        </h2>
        <p className={subtitleClass}>Sign in with your phone number and password</p>
      </div>
    </div>
  );
}

function AuthModal({ mode, onClose, onSwitchMode }) {
  const { login, signup } = useAuth();
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

  const isSignup = mode === "signup";
  const isBulk = accountType === "bulk";
  const ui = getAuthUi(isSignup);

  const resetForm = () => {
    setAccountType("retail");
    setName("");
    setShopName("");
    setShopAddress("");
    setOwnerContact("");
    setGstNumber("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setError("");
  };

  const handleModeSwitch = (nextMode) => {
    resetForm();
    onSwitchMode(nextMode);
  };

  useEffect(() => {
    resetForm();
  }, [mode]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const validateForm = () => {
    if (isSignup && !validateName(name)) {
      return isBulk
        ? "Owner name must be 1 or 2 words, letters only (e.g. Rahul or John Smith)"
        : "Name must be 1 or 2 words, letters only (e.g. Rahul or John Smith)";
    }

    if (isSignup && isBulk) {
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
    if (isSignup && password !== confirmPassword) {
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
      if (isSignup) {
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
      } else {
        await login({
          phone: phone.trim(),
          password,
        });
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          (isSignup ? "Sign up failed. Please try again." : "Sign in failed. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className={`relative my-auto w-full ${ui.modal} rounded-xl bg-white text-gray-900 shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className={ui.panel}>
          <AuthModalHeader isSignup={isSignup} isBulk={isBulk} ui={ui} />

          <form onSubmit={handleSubmit} className={ui.form}>
            {isSignup ? (
              <div>
                <p className={ui.label}>I want to shop as</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountType("retail");
                      setError("");
                    }}
                    className={`rounded-lg border px-3 py-2.5 text-left transition ${
                      accountType === "retail"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="block text-xs font-bold text-gray-900">Normal (B2C)</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-gray-500">
                      Everyday grocery shopping
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountType("bulk");
                      setError("");
                    }}
                    className={`rounded-lg border px-3 py-2.5 text-left transition ${
                      accountType === "bulk"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="block text-xs font-bold text-gray-900">Bulk Order</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-gray-500">
                      Business / wholesale grades
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {isSignup ? (
              <IconField
                label={isBulk ? "Owner Name" : "Name"}
                htmlFor="auth-name"
                labelClassName={ui.label}
                icon={<UserIcon className="h-3.5 w-3.5" />}
              >
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  placeholder={isBulk ? "Enter owner full name" : "Enter your full name"}
                  className={`${ui.field} ${ui.fieldPad}`}
                  required
                />
              </IconField>
            ) : null}

            {isSignup && isBulk ? (
              <>
                <IconField
                  label="Business Name"
                  htmlFor="auth-business-name"
                  labelClassName={ui.label}
                  icon={<BuildingIcon />}
                >
                  <input
                    id="auth-business-name"
                    type="text"
                    value={shopName}
                    onChange={(event) => {
                      setShopName(event.target.value);
                      setError("");
                    }}
                    placeholder="Enter your business name"
                    className={`${ui.field} ${ui.fieldPad}`}
                    required
                  />
                </IconField>

                <div>
                  <label htmlFor="auth-business-location" className={ui.label}>
                    Business Location
                  </label>
                  <textarea
                    id="auth-business-location"
                    value={shopAddress}
                    onChange={(event) => {
                      setShopAddress(event.target.value);
                      setError("");
                    }}
                    placeholder="Shop / warehouse address, city, pincode"
                    rows={2}
                    className={`${ui.field} px-2.5`}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="auth-owner-contact" className={ui.label}>
                    Owner Contact Number
                  </label>
                  <div
                    className={`flex overflow-hidden border border-gray-200 bg-white focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/10 ${ui.phoneWrap}`}
                  >
                    <div
                      className={`flex items-center border-r border-gray-200 bg-gray-50 font-medium text-gray-600 ${ui.phonePrefix}`}
                    >
                      <PhoneIcon className={ui.phoneIcon} />
                      <span>+91</span>
                    </div>
                    <input
                      id="auth-owner-contact"
                      type="tel"
                      value={ownerContact}
                      onChange={(event) => {
                        setOwnerContact(event.target.value.replace(/\D/g, "").slice(0, 10));
                        setError("");
                      }}
                      placeholder="Owner contact number"
                      maxLength={10}
                      className={`min-w-0 flex-1 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none ${ui.phoneInput}`}
                      required
                    />
                  </div>
                </div>

                <IconField
                  label="GST Number"
                  htmlFor="auth-gst"
                  optional
                  labelClassName={ui.label}
                >
                  <input
                    id="auth-gst"
                    type="text"
                    value={gstNumber}
                    onChange={(event) => {
                      setGstNumber(event.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15));
                      setError("");
                    }}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    className={`${ui.field} px-2.5`}
                    maxLength={15}
                  />
                </IconField>

                <div className="rounded-lg border border-dashed border-primary/25 bg-primary/5 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Login credentials
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-gray-500">
                    Use the phone and password below to sign in after registration.
                  </p>
                </div>
              </>
            ) : null}

            <div>
              <label htmlFor="auth-phone" className={ui.label}>
                {isSignup ? (isBulk ? "Login Mobile Number" : "Mobile Number") : "Phone Number"}
              </label>
              <div
                className={`flex overflow-hidden border border-gray-200 bg-white focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/10 ${ui.phoneWrap}`}
              >
                <div
                  className={`flex items-center border-r border-gray-200 bg-gray-50 font-medium text-gray-600 ${ui.phonePrefix}`}
                >
                  <PhoneIcon className={ui.phoneIcon} />
                  <span>+91</span>
                </div>
                <input
                  id="auth-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                    setError("");
                  }}
                  placeholder="Enter your phone number"
                  maxLength={10}
                  className={`min-w-0 flex-1 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none ${ui.phoneInput}`}
                  required
                />
              </div>
            </div>

            <IconField
              label="Password"
              htmlFor="auth-password"
              labelClassName={ui.label}
              icon={<LockIcon />}
            >
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder={isSignup ? "Create a password (min 6 chars)" : "Enter your password"}
                className={`${ui.field} ${ui.fieldPadPassword}`}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </IconField>

            {isSignup ? (
              <IconField
                label="Confirm Password"
                htmlFor="auth-confirm-password"
                labelClassName={ui.label}
                icon={<LockIcon />}
              >
                <input
                  id="auth-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Re-enter your password"
                  className={`${ui.field} ${ui.fieldPad}`}
                  required
                  minLength={6}
                />
              </IconField>
            ) : null}

            {error ? (
              <p className={`rounded-lg border border-red-200 bg-red-50 text-red-600 ${ui.error}`}>
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className={`flex w-full items-center justify-center bg-primary font-bold uppercase tracking-wide text-white shadow-sm transition hover:brightness-110 disabled:opacity-60 ${ui.btn}`}
            >
              {submitting
                ? "Please wait..."
                : isSignup
                  ? isBulk
                    ? "Register Bulk Account"
                    : "Sign Up"
                  : "Sign In"}
              {!submitting ? <ArrowRightIcon className={ui.arrow} /> : null}
            </button>
          </form>

          <p className={`text-center text-gray-500 ${ui.footer}`}>
            {isSignup ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeSwitch("login")}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeSwitch("signup")}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign Up
                </button>
              </>
            )}
          </p>

          {isSignup ? (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="flex items-center justify-center gap-1 text-center text-[10px] leading-tight text-gray-400">
                <LockIcon />
                Your information is secure and will never be shared
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AuthModal;
