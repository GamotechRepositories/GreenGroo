import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const COPY = {
  pending: {
    title: "Pending Inspection",
    sub: "Orders received at the collection centre after weight verification.",
    bucket: "pending",
    empty: "No orders waiting for quality inspection.",
  },
  inspection: {
    title: "Quality Inspection",
    sub: "Inspections in progress.",
    bucket: "inspection",
    empty: "No inspections in progress.",
  },
  grading: {
    title: "Grading",
    sub: "Orders ready for grade confirmation.",
    bucket: "grading",
    empty: "No orders in grading.",
  },
  completed: {
    title: "Completed",
    sub: "Grade confirmed and completed orders.",
    bucket: "completed",
    empty: "No completed quality inspections yet.",
  },
};

export default function QualityListPage({ mode = "pending" }) {
  const meta = COPY[mode] || COPY.pending;
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState("");
  const [qrError, setQrError] = useState("");
  const [qrBusy, setQrBusy] = useState(false);

  const load = () => {
    setLoading(true);
    vendorApi
      .getQualityPending({ bucket: meta.bucket })
      .then((r) => setRows(r.data?.items || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [meta.bucket]);

  const scan = async (e) => {
    e.preventDefault();
    setQrError("");
    setQrBusy(true);
    try {
      const res = await vendorApi.verifyQualityQr({ qrPayload: qr });
      const orderId = res.data?.orderId;
      if (orderId) navigate(`/vendor/quality/${orderId}`);
    } catch (err) {
      setQrError(err?.response?.data?.message || "QR verification failed");
    } finally {
      setQrBusy(false);
    }
  };

  const heads = useMemo(
    () => ["Order ID", "Farmer", "Product", "Received Qty", "Centre", "Status", ""],
    []
  );

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Quality & Grading · {meta.title}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{meta.sub}</p>
      </div>

      <form onSubmit={scan} className="border border-gray-200 bg-white p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#217346]">Scan Order QR / Order Code</p>
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[240px] flex-1 border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#217346]"
            placeholder="Paste QR payload or order code"
            value={qr}
            onChange={(e) => setQr(e.target.value)}
          />
          <button type="submit" disabled={qrBusy || !qr.trim()} className="bg-[#217346] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
            {qrBusy ? "Verifying…" : "Open Quality Check"}
          </button>
        </div>
        {qrError ? <p className="mt-2 text-[11px] text-red-600">{qrError}</p> : (
          <p className="mt-2 text-[11px] text-gray-400">Verified on the server: order, farmer, product, batch, received, weight completed, not already graded.</p>
        )}
      </form>

      <div className="overflow-x-auto border border-gray-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              {heads.map((h) => (
                <th key={h} className="px-3 py-2 font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">{meta.empty}</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.inspectionId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 font-semibold">{r.orderDisplayId}</td>
                  <td className="px-3 py-2">{r.farmerName}</td>
                  <td className="px-3 py-2">{r.productName}</td>
                  <td className="px-3 py-2">{r.receivedQuantity} {r.unit}</td>
                  <td className="px-3 py-2">{r.collectionCentre}</td>
                  <td className="px-3 py-2">{String(r.status || "").replace(/_/g, " ")}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="font-semibold text-[#217346]"
                      onClick={() => navigate(`/vendor/quality/${r.orderId}`)}
                    >
                      {r.locked ? "View Report" : "Open"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
