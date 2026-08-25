import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { listManagerQuality, verifyManagerQualityQr } from "../../api/farmerApi";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import { usePolling } from "../../hooks/usePolling";
import {
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
  EXCEL_TABLE,
  EXCEL_WRAP,
  EXCEL_HEAD,
  EXCEL_CELL,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
} from "../../utils/excelStyles";

const COPY = {
  pending: { title: "Pending Inspection", sub: "Orders received after weight verification.", bucket: "pending", empty: "No orders waiting for quality inspection." },
  inspection: { title: "Quality Inspection", sub: "Inspections in progress.", bucket: "inspection", empty: "No inspections in progress." },
  grading: { title: "Grading", sub: "Orders ready for grade confirmation.", bucket: "grading", empty: "No orders in grading." },
  completed: { title: "Completed", sub: "Grade confirmed and completed orders.", bucket: "completed", empty: "No completed quality inspections yet." },
};

export default function ManagerQualityListPage({ mode = "pending" }) {
  const meta = COPY[mode] || COPY.pending;
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState("");
  const [qrError, setQrError] = useState("");
  const [qrBusy, setQrBusy] = useState(false);

  usePolling(() => {
    listManagerQuality({ bucket: meta.bucket })
      .then((data) => setRows(data?.items || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [meta.bucket], 8000);

  const scan = async (e) => {
    e.preventDefault();
    setQrError("");
    setQrBusy(true);
    try {
      const res = await verifyManagerQualityQr({ qrPayload: qr });
      if (res?.orderId) navigate(`/farmer/manager/quality/${res.orderId}`);
    } catch (err) {
      setQrError(err.message || "QR verification failed");
    } finally {
      setQrBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Quality & Grading · {meta.title}</h1>
        <p className={EXCEL_PAGE_SUB}>{meta.sub}</p>
      </div>

      <form onSubmit={scan} className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>Scan Order QR / Order Code</div>
        <div className="flex flex-wrap gap-2 p-3">
          <input className={`min-w-[240px] flex-1 ${EXCEL_INPUT}`} placeholder="Paste QR payload or order code" value={qr} onChange={(e) => setQr(e.target.value)} />
          <button type="submit" disabled={qrBusy || !qr.trim()} className={EXCEL_BTN_PRIMARY}>
            {qrBusy ? "Verifying…" : "Open Quality Check"}
          </button>
        </div>
        {qrError ? <p className="px-3 pb-3 text-[11px] text-red-600">{qrError}</p> : (
          <p className="px-3 pb-3 text-[11px] text-[#9CA3AF]">Verified on the server: order, farmer, product, batch, received, weight completed, not already graded.</p>
        )}
      </form>

      {loading ? (
        <p className="text-xs text-[#6B7280]">Loading inspections…</p>
      ) : rows.length === 0 ? (
        <EmptyState title="No orders" description={meta.empty} />
      ) : (
        <div className={EXCEL_WRAP}>
          <table className={EXCEL_TABLE}>
            <thead>
              <tr>
                {["Order ID", "Farmer", "Product", "Received Qty", "Centre", "Status", ""].map((h) => (
                  <th key={h} className={EXCEL_HEAD}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.inspectionId}>
                  <td className={EXCEL_CELL}>{r.orderDisplayId}</td>
                  <td className={EXCEL_CELL}>{r.farmerName}</td>
                  <td className={EXCEL_CELL}>{r.productName}</td>
                  <td className={EXCEL_CELL}>{r.receivedQuantity} {r.unit}</td>
                  <td className={EXCEL_CELL}>{r.collectionCentre}</td>
                  <td className={EXCEL_CELL}><StatusBadge status={r.status} /></td>
                  <td className={EXCEL_CELL}>
                    <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => navigate(`/farmer/manager/quality/${r.orderId}`)}>
                      {r.locked ? "View Report" : "Open"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
