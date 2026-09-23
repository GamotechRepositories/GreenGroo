import { useState } from "react";
import { staffApi } from "../../api/staffApi";
import { useAuth } from "../../context/AuthContext";

const ISSUE_TYPES = [
  { value: "order", label: "Order / inventory" },
  { value: "payment", label: "Payment" },
  { value: "other", label: "Other" },
];

export default function SupportPage({ roleKey = "product_manager", title = "Support" }) {
  const { staff } = useAuth();
  const [form, setForm] = useState({
    name: staff?.name || "",
    email: staff?.email || "",
    phone: staff?.phone || staff?.mobile || "",
    orderId: "",
    issueType: "other",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await staffApi.submitSupport({ ...form, roleKey });
      setSuccess("Support request submitted. Admin will review it shortly.");
      setForm((p) => ({ ...p, orderId: "", message: "", issueType: "other" }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit support request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Send a request to GreenGrocc admin for this role panel.
        </p>
      </div>
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {["name", "email", "phone"].map((key) => (
          <label key={key} className="block text-xs font-semibold capitalize text-slate-600">
            {key}
            <input
              required
              type={key === "email" ? "email" : "text"}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form[key]}
              onChange={onChange(key)}
            />
          </label>
        ))}
        <label className="block text-xs font-semibold text-slate-600">
          Related ref (optional)
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.orderId}
            onChange={onChange("orderId")}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Issue type
          <select
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.issueType}
            onChange={onChange("issueType")}
          >
            {ISSUE_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Message
          <textarea
            required
            rows={5}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.message}
            onChange={onChange("message")}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit support request"}
        </button>
      </form>
    </div>
  );
}
