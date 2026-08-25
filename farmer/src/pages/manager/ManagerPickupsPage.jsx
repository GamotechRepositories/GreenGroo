import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getManagerPickups } from "../../api/farmerApi";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import { usePolling } from "../../hooks/usePolling";
import { formatOrderDate } from "../../utils/orderDisplay";
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
  EXCEL_BTN,
} from "../../utils/excelStyles";

const COPY = {
  ready: { title: "Ready for Pickup", sub: "Orders from your assigned farmers waiting for a driver.", filter: "ready", empty: "No ready-for-pickup orders yet." },
  assigned: { title: "Assigned Pickups", sub: "Pickups with a driver assigned.", filter: "assigned", empty: "No assigned pickups." },
  requests: { title: "Ready for Pickup", sub: "Orders from your assigned farmers waiting for a driver.", filter: "ready", empty: "No ready-for-pickup orders yet." },
  today: { title: "Today's Pickups", sub: "Scheduled for today.", filter: "today", empty: "No pickups scheduled today." },
  active: { title: "Active Pickups", sub: "In-progress pickups for your farmers.", filter: "active", empty: "No active pickups." },
  completed: { title: "Picked Up", sub: "Confirmed pickups.", filter: "history", empty: "No completed pickups yet." },
  history: { title: "Picked Up", sub: "Completed pickup history for your farmers.", filter: "history", empty: "No pickup history yet." },
};

const READY_HEADS = [
  "Order ID",
  "Farmer Name",
  "Farmer Mobile",
  "Farmer Location",
  "Product",
  "Variety",
  "Grade",
  "Ordered Qty",
  "Packed Qty",
  "Packages",
  "Ready Date/Time",
  "Pickup Status",
  "",
];

export default function ManagerPickupsPage({ mode = "ready" }) {
  const meta = COPY[mode] || COPY.ready;
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  usePolling(() => {
    getManagerPickups({ filter: meta.filter })
      .then((data) => setGroups(data?.farmers || []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [meta.filter], 5000);

  const isReady = meta.filter === "ready";

  return (
    <div className="space-y-5">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>{meta.title}</h1>
        <p className={EXCEL_PAGE_SUB}>{meta.sub}</p>
      </div>

      {loading ? (
        <p className="text-xs text-[#6B7280]">Loading pickups…</p>
      ) : groups.length === 0 ? (
        <EmptyState title="No pickups" description={meta.empty} />
      ) : (
        groups.map((g) => (
          <div key={g.farmerId} className={EXCEL_PANEL}>
            <div className={EXCEL_PANEL_HEAD}>
              {g.farmerName} · {g.pickups.length} order{g.pickups.length === 1 ? "" : "s"}
            </div>
            <div className={EXCEL_WRAP}>
              <table className={EXCEL_TABLE}>
                <thead>
                  <tr>
                    {(isReady ? READY_HEADS : ["Order ID", "Product", "Qty", "Packages", "Driver", "Vehicle", "Pickup", "Status", ""]).map((h) => (
                      <th key={h} className={EXCEL_HEAD}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.pickups.map((p) => (
                    <tr key={p.id}>
                      {isReady ? (
                        <>
                          <td className={EXCEL_CELL}>{p.orderDisplayId}</td>
                          <td className={EXCEL_CELL}>{p.farmerName}</td>
                          <td className={EXCEL_CELL}>{p.farmerMobile || "—"}</td>
                          <td className={`${EXCEL_CELL} max-w-[160px] truncate`}>{p.farmerLocation || "—"}</td>
                          <td className={EXCEL_CELL}>{p.productName}</td>
                          <td className={EXCEL_CELL}>{p.variety || "—"}</td>
                          <td className={EXCEL_CELL}>{p.grade || "—"}</td>
                          <td className={EXCEL_CELL}>{p.orderedQuantity} {p.unit}</td>
                          <td className={EXCEL_CELL}>{p.packedQuantity || p.expectedQuantity} {p.unit}</td>
                          <td className={EXCEL_CELL}>{p.packageCount || 0}</td>
                          <td className={EXCEL_CELL}>{p.readyAt ? new Date(p.readyAt).toLocaleString("en-IN") : formatOrderDate(p.pickupDate)}</td>
                          <td className={EXCEL_CELL}><StatusBadge status={p.status} /></td>
                          <td className={EXCEL_CELL}>
                            <button
                              type="button"
                              className={p.status === "READY_FOR_PICKUP" ? EXCEL_BTN_PRIMARY : EXCEL_BTN}
                              onClick={() => navigate(`/farmer/manager/pickups/${p.id}`)}
                            >
                              {p.status === "READY_FOR_PICKUP" ? "Assign Driver" : "Open"}
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className={EXCEL_CELL}>{p.orderDisplayId}</td>
                          <td className={EXCEL_CELL}>{p.productName}</td>
                          <td className={EXCEL_CELL}>{p.packedQuantity || p.expectedQuantity} {p.unit}</td>
                          <td className={EXCEL_CELL}>{p.packageCount || 0}</td>
                          <td className={EXCEL_CELL}>{p.driverName || "Not assigned"}</td>
                          <td className={EXCEL_CELL}>{p.vehicleNumber || "—"}</td>
                          <td className={EXCEL_CELL}>{p.scheduledDate || "—"} {p.scheduledTime || ""}</td>
                          <td className={EXCEL_CELL}><StatusBadge status={p.status} /></td>
                          <td className={EXCEL_CELL}>
                            <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => navigate(`/farmer/manager/pickups/${p.id}`)}>
                              Open
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
