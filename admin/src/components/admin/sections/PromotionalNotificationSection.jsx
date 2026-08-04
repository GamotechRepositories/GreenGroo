import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPromotionalAudienceStats,
  getPromotionalNotificationHistory,
  sendPromotionalNotification,
} from "../../../api/api";
import AdminAlert from "../AdminAlert";
import {
  adminCompactTableClass,
  adminCompactTdClass,
  adminCompactThClass,
  adminTableHeaderClass,
  adminTableWrapperClass,
  btnPrimary,
  cardClass,
  formHeaderClass,
  inputClass,
  labelClass,
} from "../adminStyles";

const LINK_TARGET_OPTIONS = [
  { value: "none", label: "No link (message only)" },
  { value: "just_arrived", label: "Just Arrived products" },
  { value: "hot_selling", label: "Hot Selling products" },
  { value: "home", label: "Shop home" },
  { value: "product", label: "Specific product" },
];

const EMPTY_FORM = {
  title: "",
  message: "",
  linkTarget: "none",
  productId: "",
};

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getLinkTargetLabel(value) {
  return LINK_TARGET_OPTIONS.find((option) => option.value === value)?.label || value || "—";
}

function PromotionalNotificationSection() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [audience, setAudience] = useState({
    totalUsers: 0,
    pushEnabledUsers: 0,
    inAppOnlyUsers: 0,
  });
  const [history, setHistory] = useState([]);
  const [loadingAudience, setLoadingAudience] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAudience = useCallback(async () => {
    try {
      setLoadingAudience(true);
      const { data } = await getPromotionalAudienceStats();
      setAudience(
        data.data || {
          totalUsers: 0,
          pushEnabledUsers: 0,
          inAppOnlyUsers: 0,
        }
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load audience stats");
    } finally {
      setLoadingAudience(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const { data } = await getPromotionalNotificationHistory({ limit: 20 });
      setHistory(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notification history");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadAudience();
    loadHistory();
  }, [loadAudience, loadHistory]);

  const previewLinkLabel = useMemo(() => {
    if (form.linkTarget === "product" && form.productId.trim()) {
      return `Product: ${form.productId.trim()}`;
    }
    return getLinkTargetLabel(form.linkTarget);
  }, [form.linkTarget, form.productId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const title = form.title.trim();
    const message = form.message.trim();

    if (!title || !message) {
      setError("Title and message are required.");
      return;
    }

    if (form.linkTarget === "product" && !form.productId.trim()) {
      setError("Enter a product ID for the product link.");
      return;
    }

    const audienceLabel = audience.totalUsers;
    const confirmed = window.confirm(
      `Send this promotional notification to all ${audienceLabel} customer${audienceLabel === 1 ? "" : "s"}?`
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      const { data } = await sendPromotionalNotification({
        title,
        body: message,
        linkTarget: form.linkTarget,
        productId: form.productId.trim(),
      });

      const summary = data.data || {};
      setSuccess(
        `Notification sent to ${summary.targetedUsers || 0} customers. Push delivered: ${
          summary.pushDelivered || 0
        }, saved in app: ${summary.inAppSaved || 0}.`
      );
      setForm(EMPTY_FORM);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send promotional notification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <AdminAlert error={error} success={success} onClear={() => setError("")} />

      <div className={cardClass}>
        <div className={formHeaderClass}>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Promotional Notifications</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Send offers and announcements to all customers. Notifications are saved in the app for
              every customer and pushed to users with the mobile app installed.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">All customers</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">
              {loadingAudience ? "…" : audience.totalUsers}
            </p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-green-700">Push enabled</p>
            <p className="mt-1 text-2xl font-bold text-green-900">
              {loadingAudience ? "…" : audience.pushEnabledUsers}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">In-app only</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">
              {loadingAudience ? "…" : audience.inAppOnlyUsers}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className={cardClass}>
          <h3 className="text-base font-semibold text-neutral-900">Create notification</h3>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="promo-title" className={labelClass}>
                Title
              </label>
              <input
                id="promo-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={200}
                placeholder="e.g. Weekend wholesale offer"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="promo-message" className={labelClass}>
                Message
              </label>
              <textarea
                id="promo-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                maxLength={1000}
                rows={5}
                placeholder="Write the promotional message customers will see..."
                className={inputClass}
                required
              />
              <p className="mt-1 text-xs text-neutral-500">{form.message.length}/1000 characters</p>
            </div>

            <div>
              <label htmlFor="promo-link-target" className={labelClass}>
                Open link (optional)
              </label>
              <select
                id="promo-link-target"
                name="linkTarget"
                value={form.linkTarget}
                onChange={handleChange}
                className={inputClass}
              >
                {LINK_TARGET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {form.linkTarget === "product" ? (
              <div>
                <label htmlFor="promo-product-id" className={labelClass}>
                  Product ID
                </label>
                <input
                  id="promo-product-id"
                  name="productId"
                  value={form.productId}
                  onChange={handleChange}
                  placeholder="Paste MongoDB product _id"
                  className={inputClass}
                />
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? "Sending to all customers..." : "Send to all customers"}
            </button>
          </div>
        </form>

        <div className={cardClass}>
          <h3 className="text-base font-semibold text-neutral-900">Preview</h3>
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Bulk Mobile Mart</p>
              <p className="mt-2 text-sm font-bold text-neutral-900">
                {form.title.trim() || "Notification title"}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                {form.message.trim() || "Your promotional message will appear here."}
              </p>
              <p className="mt-3 text-xs text-neutral-500">Tap action: {previewLinkLabel}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Customers with the mobile app receive a push alert. All customers see this in their
            in-app notifications list.
          </p>
        </div>
      </div>

      <div className={cardClass}>
        <div className={formHeaderClass}>
          <div>
            <h3 className="text-base font-semibold text-neutral-900">Recent promotional sends</h3>
            <p className="mt-1 text-sm text-neutral-600">Previously sent offers and announcements.</p>
          </div>
          <button
            type="button"
            onClick={loadHistory}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Refresh
          </button>
        </div>

        {loadingHistory ? (
          <p className="mt-4 text-sm text-neutral-500">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No promotional notifications sent yet.</p>
        ) : (
          <div className={`${adminTableWrapperClass} mt-4`}>
            <table className={adminCompactTableClass}>
              <thead>
                <tr className={adminTableHeaderClass}>
                  <th className={adminCompactThClass}>Sent</th>
                  <th className={adminCompactThClass}>Title</th>
                  <th className={adminCompactThClass}>Message</th>
                  <th className={adminCompactThClass}>Link</th>
                  <th className={adminCompactThClass}>Recipients</th>
                  <th className={adminCompactThClass}>Push sent</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={`${item.title}-${item.createdAt}`} className="border-b border-neutral-100 last:border-0">
                    <td className={`${adminCompactTdClass} whitespace-nowrap text-neutral-600`}>
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className={`${adminCompactTdClass} font-semibold text-neutral-900`}>
                      {item.title}
                    </td>
                    <td className={`${adminCompactTdClass} text-neutral-600`}>
                      <span className="line-clamp-2">{item.body}</span>
                    </td>
                    <td className={`${adminCompactTdClass} text-neutral-600`}>
                      {item.linkTarget === "product" && item.productId
                        ? `Product (${item.productId})`
                        : getLinkTargetLabel(item.linkTarget)}
                    </td>
                    <td className={adminCompactTdClass}>{item.recipients || 0}</td>
                    <td className={adminCompactTdClass}>{item.pushDelivered || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PromotionalNotificationSection;
