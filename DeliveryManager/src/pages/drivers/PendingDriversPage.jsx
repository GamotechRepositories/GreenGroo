import { useCallback, useEffect, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/layout/ManagerLayout";

const CHECK_ITEMS = [
  { key: "aadhaar", label: "Aadhaar card" },
  { key: "pan", label: "PAN card" },
  { key: "passport", label: "Passport / ID" },
  { key: "license", label: "Driving license" },
  { key: "rc", label: "Vehicle RC" },
  { key: "insurance", label: "Insurance" },
  { key: "selfie", label: "Passport-size / selfie photo" },
  { key: "bankDetails", label: "Bank details" },
  { key: "liveness", label: "Live camera / liveness check" },
];

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

export default function PendingDriversPage() {
  const { manager } = useAuth();
  const [riders, setRiders] = useState([]);
  const [checks, setChecks] = useState({});
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

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
      showToast("Tick all document checkboxes before completing verification");
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
          ? "Verified — driver can go online now"
          : res.data.message || `Driver ${decision}`
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
      title="New Driver Verification"
      subtitle={`Review documents · ${manager?.area}`}
    >
      {toast && (
        <div className="rounded-xl border border-green-primary/20 bg-green-light px-4 py-3 text-sm font-medium text-green-dark">
          {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">
          Pending applications ({riders.length})
        </h2>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : riders.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          No new driver applications waiting for verification in this area.
        </div>
      ) : (
        <div className="space-y-4">
          {riders.map((r) => {
            const ready = allChecked(r.id);
            return (
              <div key={r.id} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {r.name || "New rider"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {r.phone} · {r.vehicleType || "vehicle n/a"} · {r.area}
                    </p>
                    {r.bankDetails && (
                      <p className="mt-1 text-xs text-gray-400">
                        Bank: {r.bankDetails.accountHolderName || "—"} · UPI{" "}
                        {r.bankDetails.upiId || "—"}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!!busyId || !ready}
                      onClick={() => onVerify(r.id, "approved")}
                      className="rounded-lg bg-green-dark px-4 py-2 text-sm font-semibold text-white hover:bg-green-primary disabled:cursor-not-allowed disabled:opacity-50"
                      title={
                        ready
                          ? "Complete verification"
                          : "Tick all checkboxes first"
                      }
                    >
                      {busyId === `${r.id}-approved`
                        ? "Completing…"
                        : "Complete verification"}
                    </button>
                    <button
                      type="button"
                      disabled={!!busyId}
                      onClick={() => onVerify(r.id, "rejected")}
                      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyId === `${r.id}-rejected` ? "Rejecting…" : "Reject"}
                    </button>
                  </div>
                </div>

                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Tick each item after checking the document
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {CHECK_ITEMS.map((item) => {
                    const status = docStatus(r, item.key);
                    const checked = !!checks[r.id]?.[item.key];
                    return (
                      <label
                        key={item.key}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 ${
                          checked
                            ? "border-green-primary bg-green-light/50"
                            : "border-gray-100 bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCheck(r.id, item.key)}
                          className="mt-1 h-4 w-4 accent-green-primary"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-gray-900">
                            {item.label}
                          </span>
                          <span className="text-[11px] capitalize text-gray-500">
                            Status: {status}
                            {item.key === "selfie" && r.selfie?.fileName
                              ? ` · ${r.selfie.fileName}`
                              : ""}
                            {r.documents?.[item.key]?.fileName
                              ? ` · ${r.documents[item.key].fileName}`
                              : ""}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {!ready && (
                  <p className="mt-3 text-xs text-orange-600">
                    Complete verification unlocks only after all checkboxes are
                    ticked. Driver then moves to Total Drivers.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
