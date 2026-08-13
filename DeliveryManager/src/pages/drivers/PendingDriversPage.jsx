import { useCallback, useEffect, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";
import { Icon } from "../../components/ui/Icon";

const CHECK_ITEMS = [
  { key: "aadhaar", label: "Aadhaar card", type: "doc" },
  { key: "pan", label: "PAN card", type: "doc" },
  { key: "passport", label: "Passport / ID", type: "doc" },
  { key: "license", label: "Driving license", type: "doc" },
  { key: "rc", label: "Vehicle RC", type: "doc" },
  { key: "insurance", label: "Insurance", type: "doc" },
  { key: "selfie", label: "Selfie Photo", type: "selfie" },
  { key: "bankDetails", label: "Bank details", type: "bank" },
  { key: "liveness", label: "Liveness check", type: "liveness" },
];

function docMeta(rider, key) {
  if (key === "selfie") return rider.selfie || {};
  return rider.documents?.[key] || {};
}

function docStatus(rider, key) {
  if (key === "selfie") return rider.selfie?.status || "pending";
  if (key === "liveness") return rider.livenessPassed ? "passed" : "pending";
  if (key === "bankDetails") {
    const b = rider.bankDetails || {};
    const filled = b.accountNumber || b.upiId || b.ifscCode;
    return filled ? "submitted" : "missing";
  }
  return rider.documents?.[key]?.status || "pending";
}

function imageSrc(rider, key) {
  if (key === "selfie") return rider.selfie?.imageBase64 || "";
  return rider.documents?.[key]?.imageBase64 || "";
}

export default function PendingDriversPage() {
  const { manager } = useAuth();
  const [riders, setRiders] = useState([]);
  const [checks, setChecks] = useState({});
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await managerApi.pendingRiders();
      const list = res.data.riders || [];
      setRiders(list);
      setChecks((prev) => {
        const next = { ...prev };
        for (const r of list) {
          if (!next[r.id]) next[r.id] = {};
        }
        return next;
      });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load pending drivers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const toggleCheck = (riderId, key) => {
    setChecks((prev) => ({
      ...prev,
      [riderId]: {
        ...(prev[riderId] || {}),
        [key]: !prev[riderId]?.[key],
      },
    }));
  };

  const allChecked = (riderId) =>
    CHECK_ITEMS.every((item) => checks[riderId]?.[item.key]);

  const onVerify = async (riderId, decision) => {
    if (decision === "approved" && !allChecked(riderId)) {
      showToast("Please check and verify all document checkboxes before approving");
      return;
    }
    setBusyId(`${riderId}-${decision}`);
    try {
      const checkedItems = CHECK_ITEMS.filter((i) => checks[riderId]?.[i.key]).map(
        (i) => i.key
      );
      const res = await managerApi.verifyRider(riderId, {
        decision,
        checkedItems,
      });
      showToast(
        decision === "approved"
          ? "Driver verified successfully! They can go online now."
          : res.data.message || `Driver application ${decision}`
      );
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || "Verification failed");
    } finally {
      setBusyId("");
    }
  };

  return (
    <PageShell
      title="Driver Verification Desk"
      subtitle={`Review background verification, KYC documents & bank accounts for ${manager?.area}`}
    >
      {toast && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 shadow-sm flex items-center gap-3">
          <span>⚡</span>
          <span>{toast}</span>
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600">
          {error}
        </div>
      )}

      {/* Header bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold">
            <Icon name="user" size="sm" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Pending Applications ({riders.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          🔄 Refresh Feed
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : riders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
          <p className="text-3xl mb-2">📋</p>
          <h3 className="text-base font-bold text-slate-800">Verification Queue Empty</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            No new delivery partner applications awaiting document verification in this store area.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {riders.map((r) => {
            const ready = allChecked(r.id);
            const bank = r.bankDetails || {};
            return (
              <div
                key={r.id || r._id}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                      {r.name || "New Applicant"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      📞 {r.phone} · Vehicle: <strong className="text-slate-800">{r.vehicleType || "N/A"}</strong> · Area: <strong className="text-slate-800">{r.area}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={!!busyId || !ready}
                      onClick={() => onVerify(r.id, "approved")}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-40 transition active:scale-95"
                    >
                      {busyId === `${r.id}-approved` ? "Approving…" : "Approve & Activate ✓"}
                    </button>
                    <button
                      type="button"
                      disabled={!!busyId}
                      onClick={() => onVerify(r.id, "rejected")}
                      className="rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition"
                    >
                      {busyId === `${r.id}-rejected` ? "Rejecting…" : "Reject Application"}
                    </button>
                  </div>
                </div>

                {/* Bank Account Verification Box */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    🏦 Bank Payout Details
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Account Holder</p>
                      <p className="font-bold text-slate-900">{bank.accountHolderName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Account Number</p>
                      <p className="font-bold text-slate-900 font-mono">{bank.accountNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">IFSC Code</p>
                      <p className="font-bold text-slate-900 font-mono">{bank.ifscCode || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Bank Name</p>
                      <p className="font-bold text-slate-900">{bank.bankName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">UPI ID</p>
                      <p className="font-bold text-slate-900 font-mono">{bank.upiId || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Checklist Title */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    KYC Documents & Verification Checklist
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {CHECK_ITEMS.map((item) => {
                      const status = docStatus(r, item.key);
                      const checked = !!checks[r.id]?.[item.key];
                      const src = imageSrc(r, item.key);
                      const meta = docMeta(r, item.key);

                      return (
                        <div
                          key={item.key}
                          className={`rounded-xl border p-3.5 transition ${
                            checked
                              ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                              : "border-slate-200/80 bg-slate-50/50"
                          }`}
                        >
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCheck(r.id, item.key)}
                              className="mt-0.5 h-4 w-4 rounded-md accent-emerald-600 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="block text-xs font-bold text-slate-900">
                                {item.label}
                              </span>
                              <span className="text-[10px] text-slate-500 capitalize">
                                Status: <strong className="text-slate-700">{status}</strong>
                              </span>
                            </div>
                          </label>

                          {item.type === "liveness" ? (
                            <div className="mt-3 rounded-lg bg-white p-3 text-center text-xs font-semibold text-slate-600 border border-slate-100">
                              {r.livenessPassed ? "✅ Liveness passed on device" : "❌ Liveness incomplete"}
                            </div>
                          ) : src ? (
                            <button
                              type="button"
                              className="mt-3 group relative block w-full overflow-hidden rounded-lg border border-slate-200 bg-white"
                              onClick={() => setPreview({ src, title: item.label, fileName: meta.fileName })}
                            >
                              <img src={src} alt={item.label} className="h-32 w-full object-cover group-hover:scale-105 transition" />
                              <span className="block bg-slate-900/80 py-1 text-[10px] font-bold text-white text-center">
                                🔍 Tap to Enlarge Photo
                              </span>
                            </button>
                          ) : item.type !== "bank" ? (
                            <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-100/60 py-5 text-center text-[11px] text-slate-400">
                              No image re-uploaded yet
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="font-bold text-slate-900 text-sm">{preview.title}</p>
                {preview.fileName && <p className="text-xs text-slate-400 font-mono">{preview.fileName}</p>}
              </div>
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                onClick={() => setPreview(null)}
              >
                Close ✕
              </button>
            </div>
            <img src={preview.src} alt={preview.title} className="max-h-[70vh] w-full object-contain rounded-xl" />
          </div>
        </div>
      )}
    </PageShell>
  );
}
