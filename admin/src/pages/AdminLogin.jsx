import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  requestAdminPasswordReset,
  resetAdminPassword,
} from "../api/api";
import { STORE_URL } from "../constants/brand";
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  inputClass,
  labelClass,
} from "../components/admin/adminStyles";

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  required = false,
  minLength,
  placeholder,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`${inputClass} pr-10`}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
            />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}

function AdminLogin() {
  const { adminUser, loading, adminLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneHint, setPhoneHint] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-neutral-500">
        Loading...
      </div>
    );
  }

  if (adminUser?.role === "admin") {
    return <Navigate to="/" replace />;
  }

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const switchToLogin = () => {
    resetMessages();
    setMode("login");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setPhoneHint("");
  };

  const switchToForgot = () => {
    resetMessages();
    setMode("forgot-request");
    setPassword("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setPhoneHint("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await adminLogin({ email, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    resetMessages();
    setSubmitting(true);

    try {
      const { data } = await requestAdminPasswordReset({ email: email.trim() });
      setPhoneHint(data.data?.phoneHint || "");
      setSuccess(data.message || "OTP sent to your registered phone number.");
      setMode("forgot-reset");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    resetMessages();

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await resetAdminPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setSuccess(data.message || "Password reset successfully.");
      setPassword("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setPhoneHint("");
      setMode("login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className={`${cardClass} w-full max-w-md`}>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            {mode === "login" ? "Admin Login" : "Reset Password"}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {mode === "login"
              ? "Sign in with an admin account to access the dashboard"
              : mode === "forgot-request"
                ? "Enter your admin email to receive an OTP on your registered phone"
                : "Enter the OTP and choose a new password"}
          </p>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        ) : null}

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className={labelClass}>
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label htmlFor="admin-password" className={labelClass}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={switchToForgot}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <PasswordInput
                id="admin-password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : null}

        {mode === "forgot-request" ? (
          <form onSubmit={handleSendResetOtp} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className={labelClass}>
                Admin email
              </label>
              <input
                id="reset-email"
                type="email"
                required
                autoComplete="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
              {submitting ? "Sending OTP..." : "Send OTP"}
            </button>

            <button type="button" onClick={switchToLogin} className={`${btnSecondary} w-full`}>
              Back to login
            </button>
          </form>
        ) : null}

        {mode === "forgot-reset" ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {phoneHint ? (
              <p className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-text-secondary">
                OTP sent to {phoneHint}
              </p>
            ) : null}

            <div>
              <label htmlFor="reset-otp" className={labelClass}>
                OTP
              </label>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={8}
                className={inputClass}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter OTP from SMS"
              />
            </div>

            <div>
              <label htmlFor="reset-new-password" className={labelClass}>
                New password
              </label>
              <PasswordInput
                id="reset-new-password"
                required
                minLength={6}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="reset-confirm-password" className={labelClass}>
                Confirm new password
              </label>
              <PasswordInput
                id="reset-confirm-password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
              {submitting ? "Updating..." : "Reset password"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetMessages();
                setMode("forgot-request");
              }}
              className={`${btnSecondary} w-full`}
            >
              Resend OTP
            </button>

            <button type="button" onClick={switchToLogin} className={`${btnSecondary} w-full`}>
              Back to login
            </button>
          </form>
        ) : null}

        <p className="mt-6 text-center text-sm text-text-muted">
          <a href={STORE_URL} className="text-primary hover:underline">
            Back to website
          </a>
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
