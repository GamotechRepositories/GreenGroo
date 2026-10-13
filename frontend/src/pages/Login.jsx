import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
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

const PHONE_PATTERN = /^[6789]\d{9}$/;

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

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Blocked account & unblock request states
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [unblockPhone, setUnblockPhone] = useState("");
  const [unblockReason, setUnblockReason] = useState("");
  const [unblockSubmitting, setUnblockSubmitting] = useState(false);
  const [unblockSuccess, setUnblockSuccess] = useState("");
  const [unblockError, setUnblockError] = useState("");

  const redirectTo = location.state?.from || "/";

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!PHONE_PATTERN.test(phone.trim())) {
      setError("Phone must be 10 digits starting with 6, 7, 8, or 9");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    setError("");
    setIsBlocked(false);

    try {
      await login({ phone: phone.trim(), password });
      navigate("/location", { replace: true, state: { returnTo: redirectTo } });
    } catch (err) {
      const respData = err.response?.data;
      const blocked = respData?.isBlocked || err.response?.status === 403;
      if (blocked) {
        setIsBlocked(true);
        setBlockReason(respData?.blockReason || "");
        setUnblockPhone(phone.trim());
      }
      setError(
        respData?.message || err.message || "Sign in failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblockSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = unblockPhone.trim().replace(/\D/g, "").slice(-10);
    if (!PHONE_PATTERN.test(cleanPhone)) {
      setUnblockError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!unblockReason.trim() || unblockReason.trim().length < 5) {
      setUnblockError("Please provide a reason (at least 5 characters)");
      return;
    }

    setUnblockSubmitting(true);
    setUnblockError("");
    setUnblockSuccess("");

    try {
      const res = await api.post("/api/users/unblock-request", {
        phone: cleanPhone,
        reason: unblockReason.trim(),
      });
      setUnblockSuccess(
        res.data?.message || "Unblock request submitted successfully. Our team will review your account."
      );
      setUnblockReason("");
    } catch (err) {
      setUnblockError(
        err.response?.data?.message || err.message || "Failed to submit request. Please try again."
      );
    } finally {
      setUnblockSubmitting(false);
    }
  };

  return (
    <>
      <AuthSplitLayout mode="login">
        <AuthHeader
          eyebrow="Welcome back"
          title="Sign in to GreenGroo"
          subtitle="Enter your phone number and password to continue."
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthSection>
            <AuthField label="Phone number" htmlFor="login-phone">
              <div className={authPhoneWrapClass}>
                <div className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-[13px] font-medium text-gray-600">
                  +91
                </div>
                <input
                  id="login-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                    setError("");
                    setIsBlocked(false);
                  }}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="min-w-0 flex-1 bg-white px-3.5 py-2.5 text-[13.5px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  required
                  autoComplete="tel"
                />
              </div>
            </AuthField>

            <AuthField label="Password" htmlFor="login-password">
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                    setIsBlocked(false);
                  }}
                  placeholder="Enter your password"
                  className={`${authInputClass} pr-10`}
                  required
                  minLength={6}
                  autoComplete="current-password"
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
          </AuthSection>

          {isBlocked && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 shadow-sm space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="rounded-full bg-rose-100 p-1 text-rose-600 mt-0.5 shrink-0">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-rose-900 text-sm">Account Deactivated / Blocked</p>
                  <p className="mt-0.5 text-rose-700">
                    Your account has been blocked or deactivated by administration.
                    {blockReason ? ` (Reason: ${blockReason})` : ""}
                  </p>
                </div>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnblockModal(true);
                    setUnblockPhone(phone.trim());
                    setUnblockError("");
                    setUnblockSuccess("");
                  }}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition shadow-sm"
                >
                  Request to Unblock Account
                </button>
              </div>
            </div>
          )}

          {!isBlocked && <AuthError message={error} />}
          <AuthSubmitButton submitting={submitting}>Sign in</AuthSubmitButton>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setShowUnblockModal(true);
              setUnblockPhone(phone.trim() || unblockPhone);
              setUnblockError("");
              setUnblockSuccess("");
            }}
            className="text-xs font-medium text-slate-500 hover:text-emerald-700 underline underline-offset-2 transition"
          >
            Account blocked? Request to unblock
          </button>
        </div>

        <AuthFooterLink
          prompt="Don't have an account?"
          to="/signup"
          label="Create account"
          state={location.state}
        />
      </AuthSplitLayout>

      {/* Unblock Request Modal */}
      {showUnblockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Request Account Unblock</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Submit an appeal to the administration team to review and reactivate your account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUnblockModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {unblockSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-gray-900">Request Submitted</h4>
                <p className="text-xs text-gray-600 leading-relaxed px-4">
                  {unblockSuccess}
                </p>
                <button
                  type="button"
                  onClick={() => setShowUnblockModal(false)}
                  className="mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleUnblockSubmit} className="mt-4 space-y-4">
                {unblockError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    {unblockError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Registered Mobile Number
                  </label>
                  <div className={authPhoneWrapClass}>
                    <div className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-[13px] font-medium text-gray-600">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={unblockPhone}
                      onChange={(e) => setUnblockPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit number"
                      maxLength={10}
                      className="min-w-0 flex-1 bg-white px-3.5 py-2 text-[13.5px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Reason / Explanation for Unblock
                  </label>
                  <textarea
                    rows={4}
                    value={unblockReason}
                    onChange={(e) => setUnblockReason(e.target.value)}
                    placeholder="Describe why your account was deactivated or why it should be restored..."
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                    required
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Provide relevant details to help administrators verify your account quickly.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowUnblockModal(false)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={unblockSubmitting}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60"
                  >
                    {unblockSubmitting ? "Submitting..." : "Send Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
