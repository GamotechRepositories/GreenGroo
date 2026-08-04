import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";

const validateName = (value) => {
  const words = value.trim().split(/\s+/);
  if (words.length < 1 || words.length > 2) return false;
  return words.every((word) => /^[A-Za-z]{2,30}$/.test(word));
};
const PHONE_PATTERN = /^[6789]\d{9}$/;
const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const OTP_LENGTH = 6;

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

function ShopIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 6h.008v.008H6.75V6zm0 2.25h.008v.008H6.75V8.25zm0 2.25h.008v.008H6.75v-.008z" />
    </svg>
  );
}

function DocumentIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function LocationIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
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

function getAuthUi(isSignup) {
  if (isSignup) {
    return {
      modal: "max-w-[440px]",
      panel: "px-5 pb-5 pt-5 max-h-[90vh] overflow-y-auto",
      form: "space-y-3",
      label: "mb-1 block text-xs font-semibold text-gray-800",
      field:
        "w-full rounded-lg border border-gray-200 bg-white py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10",
      fieldPad: "pl-8 pr-2.5",
      fieldPadPassword: "pl-8 pr-9",
      iconLeft: "left-2.5",
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
      otpCell: "h-9 w-8 rounded-lg text-sm",
      otpGap: "gap-1.5",
      actionLinks: "text-xs",
      arrow: "h-3.5 w-3.5",
      toggle: "rounded-lg p-0.5 text-[11px]",
      toggleBtn: "rounded-md px-3 py-1.5",
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
    iconLeft: "left-3",
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
    otpCell: "h-12 w-11 rounded-xl text-base sm:w-12",
    otpGap: "gap-2",
    actionLinks: "text-sm",
    arrow: "h-4 w-4",
    toggle: "rounded-xl p-1 text-sm",
    toggleBtn: "rounded-lg px-4 py-2",
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

function OtpInput({ value, onChange, disabled, cellClass, gapClass }) {
  const inputsRef = useRef([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] || "");

  const focusInput = (index) => {
    inputsRef.current[index]?.focus();
  };

  const updateValue = (nextDigits) => {
    onChange(nextDigits.join("").slice(0, OTP_LENGTH));
  };

  const handleChange = (index, nextChar) => {
    if (!/^\d?$/.test(nextChar)) return;

    const nextDigits = [...digits];
    nextDigits[index] = nextChar;
    updateValue(nextDigits);

    if (nextChar && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] || "");
    updateValue(nextDigits);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  return (
    <div className={`flex justify-center ${gapClass}`}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value.slice(-1))}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          className={`${cellClass} border border-gray-200 bg-white text-center font-semibold text-gray-900 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10`}
        />
      ))}
    </div>
  );
}

function AuthModalHeader({ isSignup, step, phone, ui }) {
  const headerWrap = `${ui.headerMb} flex items-start ${ui.headerGap}`;
  const iconWrap = `flex ${ui.headerIcon} shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary`;
  const titleClass = `${ui.headerTitle} font-bold leading-tight text-gray-900`;
  const subtitleClass = `${ui.headerSubtitle} leading-snug text-gray-500`;

  if (step === "verify") {
    return (
      <div className={headerWrap}>
        <div className={iconWrap}>
          <PhoneIcon className="h-4 w-4" />
        </div>
        <div>
          <h2 id="auth-modal-title" className={titleClass}>
            Verify <span className="text-primary">OTP</span>
          </h2>
          <p className={subtitleClass}>
            Enter the 6-digit code sent to +91 {phone}
          </p>
        </div>
      </div>
    );
  }

  if (isSignup) {
    return (
      <div className={headerWrap}>
        <div className={iconWrap}>
          <UserIcon />
        </div>
        <div>
          <h2 id="auth-modal-title" className={titleClass}>
            Create Your <span className="text-primary">Account</span>
          </h2>
          <p className={subtitleClass}>
            Fill your details and verify your phone with OTP
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
        <p className={subtitleClass}>
          Enter your phone number to sign in with OTP
        </p>
      </div>
    </div>
  );
}

function AuthModal({ mode, onClose, onSwitchMode }) {
  const { sendOtp, loginWithOtp } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("details");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const verifyInFlight = useRef(false);

  const isSignup = mode === "signup";
  const ui = getAuthUi(isSignup);

  const resetFlow = () => {
    setStep("details");
    setOtp("");
    setShopName("");
    setShopAddress("");
    setGstNumber("");
    setError("");
  };

  const handleModeSwitch = (nextMode) => {
    resetFlow();
    onSwitchMode(nextMode);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timer = window.setInterval(() => {
      setResendCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    resetFlow();
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

  const validateDetailsStep = () => {
    if (isSignup && !validateName(name)) {
      return "Name must be 1 or 2 words, letters only (e.g. Rahul or John Smith)";
    }
    if (!PHONE_PATTERN.test(phone.trim())) {
      return "Phone must be 10 digits starting with 6, 7, 8, or 9";
    }
    if (isSignup && !shopName.trim()) {
      return "Shop name is required";
    }
    if (isSignup && shopName.trim().length < 2) {
      return "Shop name must be at least 2 characters";
    }
    if (isSignup && !shopAddress.trim()) {
      return "Shop address is required";
    }
    if (isSignup && shopAddress.trim().length < 5) {
      return "Please enter a complete shop address";
    }
    if (isSignup && gstNumber.trim() && !GST_PATTERN.test(gstNumber.trim().toUpperCase())) {
      return "Please enter a valid GST number";
    }
    return "";
  };

  const handleSendOtp = async () => {
    const validationError = validateDetailsStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!PHONE_PATTERN.test(phone.trim())) {
      setError("Phone must be 10 digits starting with 6, 7, 8, or 9");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await sendOtp(phone.trim(), { purpose: isSignup ? "signup" : "login" });
      setStep("verify");
      setOtp("");
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (verifyInFlight.current) return;

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the 6-digit OTP sent to your phone");
      return;
    }

    verifyInFlight.current = true;
    setSubmitting(true);
    setError("");

    try {
      const result = await loginWithOtp({
        phone: phone.trim(),
        otp: otp.trim(),
        ...(isSignup
          ? {
              name: name.trim(),
              shopName: shopName.trim(),
              shopAddress: shopAddress.trim(),
              gstNumber: gstNumber.trim(),
            }
          : {}),
      });

      if (result?.needsSignup) {
        setError("No account found with this number. Please sign up first.");
        return;
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "OTP verification failed.");
    } finally {
      verifyInFlight.current = false;
      setSubmitting(false);
    }
  };

  const handleDetailsSubmit = async (event) => {
    event.preventDefault();
    await handleSendOtp();
  };

  const primaryButtonLabel = () => {
    if (submitting) {
      if (step === "verify") return "Please wait...";
      return "Sending OTP...";
    }
    if (step === "verify") {
      return isSignup ? "Verify & Sign Up" : "Verify & Sign In";
    }
    return "Send OTP";
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
          <AuthModalHeader
            isSignup={isSignup}
            step={step}
            phone={phone}
            ui={ui}
          />

          <form onSubmit={step === "verify" ? handleVerifyOtp : handleDetailsSubmit} className={ui.form}>
            {step === "details" ? (
              <>
                {isSignup ? (
                  <>
                    <IconField
                      label="Name"
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
                        placeholder="Enter your full name"
                        className={`${ui.field} ${ui.fieldPad}`}
                        required
                      />
                    </IconField>

                    <div>
                      <label htmlFor="auth-phone" className={ui.label}>
                        Mobile Number
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
                      label="Shop Name"
                      htmlFor="auth-shop-name"
                      labelClassName={ui.label}
                      icon={<ShopIcon />}
                    >
                      <input
                        id="auth-shop-name"
                        type="text"
                        value={shopName}
                        onChange={(event) => {
                          setShopName(event.target.value);
                          setError("");
                        }}
                        placeholder="Enter your shop name"
                        className={`${ui.field} ${ui.fieldPad}`}
                        required
                      />
                    </IconField>

                    <div>
                      <label htmlFor="auth-shop-address" className={ui.label}>
                        Shop Address
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2.5 top-2.5 text-gray-400">
                          <LocationIcon />
                        </span>
                        <textarea
                          id="auth-shop-address"
                          value={shopAddress}
                          onChange={(event) => {
                            setShopAddress(event.target.value);
                            setError("");
                          }}
                          placeholder="Building, street, area, city"
                          rows={3}
                          className={`${ui.field} resize-none py-2 pl-8 pr-2.5`}
                          required
                        />
                      </div>
                    </div>

                    <IconField
                      label="GST Number"
                      htmlFor="auth-gst"
                      labelClassName={ui.label}
                      optional
                      icon={<DocumentIcon />}
                    >
                      <input
                        id="auth-gst"
                        type="text"
                        value={gstNumber}
                        onChange={(event) => {
                          setGstNumber(event.target.value.toUpperCase());
                          setError("");
                        }}
                        placeholder="e.g. 22AAAAA0000A1Z5"
                        maxLength={15}
                        className={`${ui.field} ${ui.fieldPad}`}
                      />
                    </IconField>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="auth-phone" className={ui.label}>
                        Phone Number
                      </label>
                      <div
                        className={`flex overflow-hidden border border-gray-200 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 ${ui.phoneWrap}`}
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
                  </>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className={`${ui.label} text-center`}>
                    Enter OTP
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={(value) => {
                      setOtp(value);
                      setError("");
                    }}
                    disabled={submitting}
                    cellClass={ui.otpCell}
                    gapClass={ui.otpGap}
                  />
                </div>

                <div className={`flex items-center justify-between gap-2 ${ui.actionLinks}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("details");
                      setOtp("");
                      setError("");
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    Change number
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={submitting || resendCooldown > 0}
                    className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                  </button>
                </div>
              </>
            )}

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
              {primaryButtonLabel()}
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

          {isSignup && step === "details" ? (
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
