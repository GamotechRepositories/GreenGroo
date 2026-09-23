import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { managerApi } from "../../api/managerApi";
import { PageShell } from "../../components/layout/ManagerLayout";

function pretty(status) {
  return String(status || "—").replaceAll("_", " ");
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function ReturnPickupsPage() {
  const [rows, setRows] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState("");
  const [qrModal, setQrModal] = useState(null);

  const load = useCallback(async () => {
    try {
      const [pickups, ridersRes] = await Promise.all([
        managerApi.returnPickups(),
        managerApi.riders(),
      ]);
      const list = pickups.data?.data;
      setRows(Array.isArray(list) ? list : []);
      const riderList = ridersRes.data?.riders ?? ridersRes.data?.data?.riders ?? ridersRes.data?.data;
      setRiders(Array.isArray(riderList) ? riderList : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load return pickups");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const assign = async (id) => {
    const riderId = selectedRider[id];
    if (!riderId) {
      setError("Select a delivery boy first");
      return;
    }
    setBusyId(id);
    try {
      await managerApi.assignReturnPickup(id, riderId);
      setToast("Return pickup assigned");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Assign failed");
    } finally {
      setBusyId("");
    }
  };

  const showQr = async (id) => {
    setBusyId(id);
    try {
      const res = await managerApi.getReturnPickupQr(id);
      setQrModal(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load QR");
    } finally {
      setBusyId("");
    }
  };

  const approveProof = async (id) => {
    setBusyId(id);
    try {
      await managerApi.approveReturnProof(id);
      setToast("Pickup proof approved");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Approve failed");
    } finally {
      setBusyId("");
    }
  };

  const markSuccess = async (id) => {
    setBusyId(id);
    try {
      await managerApi.markReturnSuccessful(id);
      setToast("Return marked successful");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not mark successful");
    } finally {
      setBusyId("");
    }
  };

  return (
    <PageShell
      title="Return pickups"
      subtitle="Assign a boy for admin-accepted returns, show QR for confirm pickup, then mark successful when the item is back at store."
    >
      {toast ? (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading return pickups…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No return pickups yet. They appear here after admin accepts a return/warranty request.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-slate-900">
                    Order #{row.orderNumber || "—"} · {row.type}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {row.customerName} · {row.customerPhone}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{row.customerAddress || "No address"}</p>
                  <p className="mt-2 text-xs text-slate-500">{row.reason}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-700">
                    {pretty(row.status)}
                  </span>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{money(row.amount)}</p>
                  {row.rider ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Rider: {row.rider.name || row.rider.phone}
                    </p>
                  ) : null}
                </div>
              </div>

              {row.pickupProofImageUrl && row.pickupProofStatus === "pending" ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800">Pickup photo awaiting approval</p>
                  <img
                    src={row.pickupProofImageUrl}
                    alt="Return pickup proof"
                    className="mt-2 max-h-40 rounded-lg border border-amber-100 object-contain"
                  />
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {row.status === "awaiting_assignment" || row.status === "assigned" ? (
                  <>
                    <select
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={selectedRider[row.id] || ""}
                      onChange={(e) =>
                        setSelectedRider((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                    >
                      <option value="">Select delivery boy</option>
                      {riders.map((r) => (
                        <option key={r.id || r._id} value={r.id || r._id}>
                          {r.name || r.phone} {r.status ? `(${r.status})` : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => assign(row.id)}
                      className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Assign manual pickup
                    </button>
                  </>
                ) : null}

                {["assigned", "qr_scanned", "proof_pending", "picked_up"].includes(row.status) ? (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => showQr(row.id)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    Show return QR
                  </button>
                ) : null}

                {row.pickupProofStatus === "pending" ? (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => approveProof(row.id)}
                    className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Approve pickup photo
                  </button>
                ) : null}

                {["picked_up", "returned_to_store", "proof_pending", "qr_scanned"].includes(row.status) ? (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => markSuccess(row.id)}
                    className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Mark successful
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {qrModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Return pickup QR</h3>
            <p className="mt-1 text-sm text-slate-500">
              Order #{qrModal.orderNumber} — boy scans this to confirm pickup, then uploads a photo.
            </p>
            <div className="mt-4 flex justify-center">
              <QRCodeSVG value={qrModal.qrPayload || ""} size={200} level="M" includeMargin />
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold"
              onClick={() => setQrModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
