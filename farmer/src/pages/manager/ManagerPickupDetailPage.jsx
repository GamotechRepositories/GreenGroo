import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getManagerPickup, assignManagerPickup, reassignManagerPickup } from "../../api/farmerApi";
import StatusBadge from "../../components/ui/StatusBadge";
import PickupTimeline from "../../components/pickup/PickupTimeline";
import { usePolling } from "../../hooks/usePolling";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../../utils/excelStyles";

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-[#1F2937]">{value || "—"}</p>
    </div>
  );
}

export default function ManagerPickupDetailPage() {
  const { pickupId } = useParams();
  const [pickup, setPickup] = useState(null);
  const [driverId, setDriverId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async (silent = false) => {
    try {
      const data = await getManagerPickup(pickupId);
      setPickup(data);
      setDriverId(data.availableDrivers?.[0]?.id || data.driverId || "");
      if (!silent) setError("");
    } catch (err) {
      setError(err.message || "Pickup not found");
    }
  };

  usePolling(() => load(true), [pickupId], 5000);

  if (!pickup && !error) return <p className="text-xs text-[#6B7280]">Loading pickup…</p>;
  if (!pickup) return <p className="text-xs text-red-600">{error}</p>;

  const canAssign = pickup.status === "READY_FOR_PICKUP";
  const canReassign = ["DRIVER_ASSIGNED", "PICKUP_SCHEDULED", "DISPATCHED"].includes(pickup.status) && !pickup.pickupConfirmed;
  const available = pickup.availableDrivers || [];

  const assign = async () => {
    if (!driverId) return;
    setBusy(true);
    try {
      if (canAssign) await assignManagerPickup(pickupId, driverId);
      else await reassignManagerPickup(pickupId, driverId);
      toast.success(canAssign ? "Driver assigned" : "Driver reassigned");
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message || "Could not assign driver");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Pickup {pickup.orderDisplayId}</h1>
          <p className={EXCEL_PAGE_SUB}>{pickup.farmerName} · {pickup.productName}</p>
        </div>
        <StatusBadge status={pickup.status} />
      </div>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Pickup Timeline</h2>
        <div className="p-3">
          <PickupTimeline status={pickup.status} />
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Ready for Pickup</h2>
        <div className="grid gap-3 p-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Order ID" value={pickup.orderDisplayId} />
          <Info label="Farmer Name" value={pickup.farmerName} />
          <Info label="Farmer Mobile" value={pickup.farmerMobile} />
          <Info label="Farmer Location" value={pickup.farmerLocation} />
          <Info label="Product" value={pickup.productName} />
          <Info label="Variety" value={pickup.variety} />
          <Info label="Grade" value={pickup.grade} />
          <Info label="Ordered Quantity" value={`${pickup.orderedQuantity} ${pickup.unit}`} />
          <Info label="Packed Quantity" value={`${pickup.packedQuantity} ${pickup.unit}`} />
          <Info label="Package Count" value={pickup.packageCount} />
          <Info label="Ready Date/Time" value={pickup.readyAt ? new Date(pickup.readyAt).toLocaleString("en-IN") : "—"} />
          <Info label="Pickup Status" value={pickup.status} />
          <Info label="Assigned Driver" value={pickup.driverName || "Not assigned"} />
          <Info label="Vehicle Number" value={pickup.vehicleNumber} />
        </div>
      </section>

      {(canAssign || canReassign) ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>{canAssign ? "Assign Driver" : "Reassign Driver"}</h2>
          <div className="p-3">
            <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => setModalOpen(true)}>
              {canAssign ? "Assign Driver" : "Reassign Driver"}
            </button>
          </div>
        </section>
      ) : null}

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Pickup Status</h2>
        <div className="space-y-2 p-3 text-xs text-[#6B7280]">
          <p>The assigned driver starts pickup, marks arrived, checks the order, scans the Farmer QR, and confirms pickup.</p>
          <p>Farmer managers cannot confirm pickup or scan QR.</p>
          {pickup.pickupConfirmed ? (
            <p className="font-semibold text-[#217346]">Picked up at {pickup.pickupConfirmedAt ? new Date(pickup.pickupConfirmedAt).toLocaleString("en-IN") : "—"}.</p>
          ) : null}
          {(pickup.confirmationPhotos || []).length ? (
            <div className="grid grid-cols-4 gap-2 pt-2">
              {pickup.confirmationPhotos.map((src, i) => (
                <img key={i} src={src} alt={`Pickup photo ${i + 1}`} className="h-16 w-full object-cover" />
              ))}
            </div>
          ) : null}
          <Link to="/farmer/manager/pickups/ready" className={EXCEL_BTN}>Back</Link>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-[#D4D4D4] bg-white">
            <div className="border-b border-[#D4D4D4] px-4 py-3">
              <p className="text-sm font-bold">Select Driver</p>
            </div>
            <div className="max-h-80 overflow-auto">
              {available.length === 0 ? (
                <p className="px-4 py-6 text-xs text-[#6B7280]">No available drivers.</p>
              ) : (
                available.map((d) => (
                  <label key={d.id} className={`flex cursor-pointer items-start gap-3 border-b border-[#F3F4F6] px-4 py-3 text-xs ${driverId === d.id ? "bg-[#E8F5E9]" : ""}`}>
                    <input type="radio" name="driver" checked={driverId === d.id} onChange={() => setDriverId(d.id)} />
                    <div>
                      <p className="font-semibold text-[#1F2937]">{d.name}</p>
                      <p className="text-[#6B7280]">Mobile {d.mobile}</p>
                      <p className="text-[#6B7280]">Vehicle {d.vehicleNumber || "—"} · {d.vehicleType || "—"}</p>
                      <p className="text-[#6B7280]">Status {d.status} · Location {d.currentLocation || d.assignedArea || "—"}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2 px-4 py-3">
              <button type="button" className={EXCEL_BTN} onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="button" disabled={busy || !driverId} className={EXCEL_BTN_PRIMARY} onClick={assign}>
                {busy ? "Assigning…" : "Assign Driver"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
