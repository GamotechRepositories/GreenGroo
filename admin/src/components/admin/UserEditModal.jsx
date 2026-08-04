import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  modalBodyClass,
  modalFooterClass,
  modalHeaderClass,
  modalOverlayClass,
  modalPanelClass,
} from "./adminStyles";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

function UserEditModal({ user, isAdd = false, onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyForm);
  const open = isAdd || Boolean(user);

  useEffect(() => {
    if (!open) return;
    if (isAdd) {
      setForm(emptyForm);
      return;
    }
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
    });
  }, [user, isAdd, open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
    };
    if (form.email.trim()) {
      payload.email = form.email.trim();
    }
    if (form.password.trim()) {
      payload.password = form.password;
    }
    onSave(isAdd ? null : user._id, payload);
  };

  return createPortal(
    <div className={modalOverlayClass} onClick={onClose}>
      <div
        className={`${modalPanelClass} sm:max-w-md`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalHeaderClass}>
          <h2 className="text-lg font-bold text-text-primary">
            {isAdd ? "Add User" : "Edit User"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-light p-2 text-text-secondary hover:bg-mobile-surface"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className={`${modalBodyClass} space-y-4`}>
          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className={inputClass}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className={labelClass}>Phone *</label>
            <input
              type="tel"
              required
              maxLength={10}
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              placeholder={isAdd ? "Optional — users sign in with OTP" : "Leave blank to keep current password"}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className={inputClass}
              minLength={6}
            />
          </div>
          </div>

          <div className={modalFooterClass}>
            <button type="button" onClick={onClose} className={btnSecondary} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? "Saving..." : isAdd ? "Add User" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default UserEditModal;
