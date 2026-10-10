import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Truck,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Phone,
  MapPin,
  Calendar,
  Package,
  RefreshCw,
  UserPlus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Car,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  FolderKanban,
  Check,
} from "lucide-react";
import { getManagerPickups, getManagerDrivers } from "../../api/farmerApi";
import { vendorApi } from "../../api/vendorApi";
import CopyId, { CopyButton, formatVehicleId } from "../../components/ui/CopyId";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import { useLive } from "../../realtime/useLive";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PANEL,
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
} from "../../utils/excelStyles";
import {
  formatMoney,
  formatOrderDate,
  todayISODate,
  yesterdayISODate,
} from "../../utils/orderDisplay";
import { pickupStatusLabel, pickupLiveLabel } from "../../components/pickup/PickupTimeline";

const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];

function shortDate(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const fromId = String(value).match(/GGC-ORD-(\d{4})(\d{2})(\d{2})/i);
  if (fromId) return `${fromId[3]}/${fromId[2]}/${fromId[1]}`;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    const full = formatOrderDate(value);
    return full && full !== "—" ? full : "—";
  }
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatTime12h(value) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (/am|pm/i.test(raw)) return raw.replace(/\s+/g, " ");
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return raw;
  let hour = Number(m[1]);
  const min = m[2];
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return raw;
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${min} ${period}`;
}

function pickupLocation(pickup) {
  const geo = pickup?.farmGeo || {};
  const fromGeo = [geo.village, geo.taluka, geo.district, geo.pincode].filter(Boolean).join(", ");
  const candidates = [geo.farmAddress, pickup?.farmerLocation, pickup?.pickupLocation, fromGeo].filter(
    (v) => typeof v === "string" && v.trim()
  );
  if (!candidates.length) return "";
  return candidates.sort((a, b) => b.split(",").length - a.split(",").length || b.length - a.length)[0];
}

function gradeDetailMap(pickup) {
  const map = {};
  const unit = pickup.unit || "Kg";
  (Array.isArray(pickup.grades) ? pickup.grades : []).forEach((g) => {
    const label = String(g.label || g.name || "").trim();
    if (!label) return;
    const qty = Number(g.quantity || 0);
    const rate = Number(g.price ?? g.rate ?? g.pricePerKg ?? 0) || 0;
    if (!map[label]) map[label] = { qty: 0, rate: 0, unit };
    map[label].qty += qty;
    if (rate > 0) map[label].rate = rate;
  });
  if (!Object.keys(map).length) {
    const label = String(pickup.grade || "Grade A").split(",")[0].trim() || "Grade A";
    const qty = Number(pickup.packedQuantity || pickup.orderedQuantity || pickup.expectedQuantity || 0);
    map[label] = { qty, rate: Number(pickup.price || 0) || 0, unit };
  }
  return map;
}

/**
 * Extract driver rejection details from pickup timeline or flags
 */
export function getRejectionDetails(pickup) {
  const timeline = Array.isArray(pickup?.timeline) ? pickup.timeline : [];
  for (let i = timeline.length - 1; i >= 0; i--) {
    const entry = timeline[i];
    if (
      entry?.status === "DRIVER_REJECTED" ||
      (typeof entry?.note === "string" && /rejected by driver/i.test(entry.note))
    ) {
      const note = entry.note || "";
      let driverName = "";
      let reason = "";
      const match = note.match(/Rejected by driver\s+([^:.]+)(?::\s*([^.]+))?/i);
      if (match) {
        driverName = match[1]?.trim() || "";
        reason = match[2]?.trim() || "";
      }
      return {
        driverName: driverName || pickup?.lastDriverName || "Driver",
        reason: reason || "Rejected by driver",
        at: entry.at,
        note: entry.note,
      };
    }
  }
  if (pickup?.driverStatus === "DRIVER_REJECTED") {
    return {
      driverName: pickup?.driverName || "Driver",
      reason: pickup?.rejectionReason || "Pickup was rejected by driver",
      at: pickup?.updatedAt,
      note: "Driver rejected this pickup",
    };
  }
  return null;
}

/**
 * Categorize pickup according to user requested sections:
 * 1. all pickups (All pickup orders)
 * 2. driver assign pending (Driver assignment pending)
 * 3. driver assign (Driver assigned, awaiting response / in transit to farm)
 * 4. conform pickup (Driver accepted / confirmed)
 * 5. rejected pickup (Driver rejected)
 */
export function getPickupDriverCategory(pickup) {
  const driverStatus = String(pickup?.driverStatus || "").toUpperCase();
  const status = String(pickup?.status || "").toUpperCase();
  const timeline = Array.isArray(pickup?.timeline) ? pickup.timeline : [];

  const rejectionInfo = getRejectionDetails(pickup);
  const isRejected = Boolean(rejectionInfo) || driverStatus === "DRIVER_REJECTED";

  const isCompleted =
    [
      "COMPLETED",
      "PICKUP_COMPLETED",
      "COLLECTION_CENTRE_RECEIVED",
      "RECEIVED_AT_COLLECTION_CENTRE",
    ].includes(status) ||
    String(pickup?.receiving?.status || "").toUpperCase() === "RECEIVED" ||
    Boolean(pickup?.isCompleted) ||
    Boolean(pickup?.completedAt) ||
    timeline.some((t) =>
      [
        "COMPLETED",
        "PICKUP_COMPLETED",
        "COLLECTION_CENTRE_RECEIVED",
        "RECEIVED_AT_COLLECTION_CENTRE",
      ].includes(String(t?.status || "").toUpperCase())
    );

  const isAccepted =
    !isCompleted &&
    (driverStatus === "DRIVER_ACCEPTED" ||
      [
        "DISPATCHED",
        "DRIVER_ARRIVED",
        "ORDER_VERIFIED",
        "QR_VERIFIED",
        "PICKED_UP",
        "PICKUP_CONFIRMED",
        "IN_TRANSIT",
        "ARRIVED_AT_CENTRE",
      ].includes(status) ||
      Boolean(pickup?.pickupConfirmed) ||
      timeline.some((t) => t?.status === "DRIVER_ACCEPTED"));

  const hasDriverAssigned = Boolean(pickup?.driverId || pickup?.driverName);

  const isAssigned =
    hasDriverAssigned &&
    ["DRIVER_ASSIGNED", "PICKUP_SCHEDULED"].includes(status) &&
    !isAccepted &&
    !isCompleted &&
    driverStatus !== "DRIVER_REJECTED";

  const isPending =
    (!hasDriverAssigned ||
      status === "READY_FOR_PICKUP" ||
      driverStatus === "UNASSIGNED") &&
    !isAssigned &&
    !isAccepted &&
    !isCompleted &&
    !isRejected;

  return {
    isPending,
    isAssigned,
    isAccepted,
    isCompleted,
    isRejected,
    rejectionInfo,
  };
}

/**
 * Sub-stages for accepted & in-transit pickups
 */
function getDriverProgressStage(pickup) {
  const status = String(pickup?.status || "").toUpperCase();
  const driverStatus = String(pickup?.driverStatus || "").toUpperCase();

  if (
    ["COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE", "COMPLETED", "PICKUP_COMPLETED"].includes(status) ||
    pickup?.isCompleted
  ) {
    return { label: "Completed · Received", color: "bg-teal-100 text-teal-800 border-teal-300" };
  }
  if (status === "ARRIVED_AT_CENTRE") {
    return { label: "Arrived at Centre", color: "bg-indigo-100 text-indigo-800 border-indigo-300" };
  }
  if (status === "IN_TRANSIT") {
    return { label: "On the way to Centre", color: "bg-blue-100 text-blue-800 border-blue-300" };
  }
  if (["PICKED_UP", "PICKUP_CONFIRMED"].includes(status) || pickup?.pickupConfirmed) {
    return { label: "Pickup Confirmed", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  }
  if (status === "QR_VERIFIED") {
    return { label: "QR Verified at Farm", color: "bg-teal-100 text-teal-800 border-teal-300" };
  }
  if (status === "ORDER_VERIFIED") {
    return { label: "Order Verified", color: "bg-teal-100 text-teal-800 border-teal-300" };
  }
  if (status === "DRIVER_ARRIVED") {
    return { label: "Reached the Farm", color: "bg-amber-100 text-amber-800 border-amber-300" };
  }
  if (status === "DISPATCHED") {
    return { label: "Dispatched to Farm", color: "bg-sky-100 text-sky-800 border-sky-300" };
  }
  if (driverStatus === "DRIVER_ACCEPTED") {
    return { label: "Driver Accepted · Ready", color: "bg-green-100 text-green-800 border-green-300" };
  }
  return { label: "Accepted", color: "bg-green-100 text-green-800 border-green-300" };
}

/**
 * Group assigned pickup items into Batches
 */
export function groupAssignedPickupsByBatch(assignedItems) {
  const batchMap = new Map();
  const unbatchedList = [];

  assignedItems.forEach((item) => {
    const p = item.pickup;
    const bid = String(p.collectionBatchId || p.lotId || "").trim();
    if (bid) {
      if (!batchMap.has(bid)) {
        batchMap.set(bid, {
          batchId: bid,
          driverId: p.driverId || p.driver?.id || "",
          driverName: p.driverName || p.driver?.name || "Driver",
          driverMobile: p.driverMobile || p.driver?.mobile || "",
          vehicleNumber: p.vehicleNumber || p.driver?.vehicleNumber || "",
          assignedAt: p.assignedAt,
          items: [],
        });
      }
      batchMap.get(bid).items.push(item);
    } else {
      unbatchedList.push(item);
    }
  });

  const batches = Array.from(batchMap.values());

  // Group unbatched items by driver so each driver group appears like a structured batch
  if (unbatchedList.length > 0) {
    const unbatchedByDriver = new Map();
    unbatchedList.forEach((item) => {
      const p = item.pickup;
      const dKey = p.driverId || p.driverName || "unassigned";
      if (!unbatchedByDriver.has(dKey)) {
        unbatchedByDriver.set(dKey, {
          batchId: null,
          driverId: p.driverId || p.driver?.id || "",
          driverName: p.driverName || p.driver?.name || "Driver",
          driverMobile: p.driverMobile || p.driver?.mobile || "",
          vehicleNumber: p.vehicleNumber || p.driver?.vehicleNumber || "",
          assignedAt: p.assignedAt,
          items: [],
        });
      }
      unbatchedByDriver.get(dKey).items.push(item);
    });

    unbatchedByDriver.forEach((group) => {
      batches.push(group);
    });
  }

  // Calculate totals and metadata for each batch
  return batches.map((b) => {
    const farmers = [...new Set(b.items.map((i) => i.pickup.farmerName).filter(Boolean))];
    const products = [...new Set(b.items.map((i) => i.pickup.productName).filter(Boolean))];
    const totalQty = b.items.reduce(
      (sum, i) => sum + Number(i.pickup.packedQuantity || i.pickup.expectedQuantity || 0),
      0
    );
    const unit = b.items[0]?.pickup?.unit || "Kg";

    return {
      ...b,
      farmers,
      products,
      totalQty,
      unit,
      orderCount: b.items.length,
    };
  });
}

// --------------------------------------------------------------------------
// ASSIGN / REASSIGN DRIVER MODAL (Supports both Single Pickup and Batch)
// --------------------------------------------------------------------------
function AssignDriverModal({ target, pickup, isOpen, onClose, onAssigned }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentTarget = target || (pickup ? { type: "pickup", pickup } : null);
  const isBatch = currentTarget?.type === "batch";
  const currentPickup = isBatch ? null : currentTarget?.pickup || pickup;
  const currentBatch = isBatch ? currentTarget?.batch : null;

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");
    setSelectedDriverId(currentBatch?.driverId || currentPickup?.driverId || "");

    getManagerDrivers()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.drivers || [];
        setDrivers(list);
      })
      .catch((err) => {
        setError(err?.message || "Failed to load drivers");
      })
      .finally(() => setLoading(false));
  }, [isOpen, currentTarget, currentPickup, currentBatch]);

  if (!isOpen || (!currentPickup && !currentBatch)) return null;

  const orderId = currentPickup?.orderDisplayId || currentPickup?.orderId;
  const isReassign = Boolean(currentBatch?.driverId || currentPickup?.driverId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriverId) {
      toast.error("Please select a driver");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      if (isBatch && currentBatch?.batchId) {
        await vendorApi.assignPickupBatchDriver(currentBatch.batchId, selectedDriverId);
        toast.success(`Driver successfully assigned to Batch ${currentBatch.batchId}`);
      } else if (currentPickup) {
        if (isReassign && currentPickup.status !== "READY_FOR_PICKUP") {
          await vendorApi.reassignPickupDriver(currentPickup.id, selectedDriverId);
          toast.success(`Driver successfully reassigned to Order ${orderId}`);
        } else {
          await vendorApi.assignPickupDriver(currentPickup.id, selectedDriverId);
          toast.success(`Driver successfully assigned to Order ${orderId}`);
        }
      }
      onAssigned();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to assign driver";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const availableDrivers = drivers.filter(
    (d) => ["Active", "Available", "On Duty", "On Pickup"].includes(d.status || "Active")
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isBatch
                ? `Reassign Driver for Batch ${currentBatch.batchId || ""}`
                : isReassign
                ? "Reassign Driver"
                : "Assign Driver to Pickup"}
            </h3>
            <p className="text-xs text-slate-500">
              {isBatch ? (
                <span>
                  Batch contains <strong className="text-emerald-700">{currentBatch.orderCount} orders</strong>
                </span>
              ) : (
                <span>
                  Order <span className="font-mono font-semibold text-emerald-700">{orderId}</span>
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Details Brief */}
        <div className="border-b border-slate-100 bg-[#F9FAF8] px-5 py-3 text-xs">
          {isBatch ? (
            <div className="space-y-1 text-slate-600">
              <div className="flex items-center justify-between">
                <span>
                  <strong className="text-slate-800">Total Produce:</strong> {currentBatch.products.join(" · ")}
                </span>
                <span className="font-bold text-emerald-800">
                  {currentBatch.totalQty} {currentBatch.unit}
                </span>
              </div>
              <p className="truncate text-slate-500">
                <strong className="text-slate-800">Farmers:</strong> {currentBatch.farmers.join(", ")}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-2 text-slate-600 sm:grid-cols-3">
                <div>
                  <span className="font-semibold text-slate-800">Farmer:</span> {currentPickup?.farmerName || "—"}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Produce:</span> {currentPickup?.productName || "—"}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Quantity:</span>{" "}
                  {currentPickup?.packedQuantity || currentPickup?.expectedQuantity || 0} {currentPickup?.unit || "Kg"}
                </div>
              </div>
              <div className="mt-1 text-slate-500 truncate">
                <span className="font-semibold text-slate-800">Location:</span>{" "}
                {pickupLocation(currentPickup) || "Farm location"}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Select Driver ({availableDrivers.length} Available)
          </label>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-500">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin text-emerald-600" />
              Loading drivers...
            </div>
          ) : !availableDrivers.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-6 text-center text-xs text-slate-500">
              <p>No available drivers found.</p>
              <Link to="/vendor/drivers/add" className="mt-2 inline-block font-semibold text-emerald-700 hover:underline">
                + Add a new driver
              </Link>
            </div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {availableDrivers.map((d) => {
                const driverId = d.driverId || d.id;
                const isSelected = selectedDriverId === driverId;
                const isCurrent = (currentBatch?.driverId || currentPickup?.driverId) === driverId;
                return (
                  <label
                    key={driverId}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="radio"
                        name="selectedDriver"
                        value={driverId}
                        checked={isSelected}
                        onChange={() => setSelectedDriverId(driverId)}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-800">{d.name}</p>
                          {isCurrent && (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                              Current
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              d.status === "Available"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {d.status || "Active"}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                          {d.mobile && <span>📞 {d.mobile}</span>}
                          {d.vehicleNumber && <span>🚗 {d.vehicleNumber}</span>}
                          {d.assignedArea && <span>📍 {d.assignedArea}</span>}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedDriverId}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60 shadow-sm"
            >
              {submitting ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Assigning...
                </>
              ) : isReassign ? (
                "Confirm Reassign"
              ) : (
                "Confirm Assignment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// BATCH CONTAINER COMPONENT FOR DRIVER ASSIGNED & CONFIRMED / ACCEPTED
// --------------------------------------------------------------------------
function AssignedBatchCard({
  batch,
  index,
  variant = "assigned",
  onReassignBatch,
  onReassignOrder,
  onOpenOrder,
  onOpenPickup,
  onOpenBatch,
}) {
  const isAccepted = variant === "accepted";
  const isCompleted = variant === "completed";
  const [expanded, setExpanded] = useState(true);

  const containerBorder = isCompleted
    ? "border-teal-200/90"
    : isAccepted
    ? "border-emerald-200/90"
    : "border-blue-200/90";

  const headerBg = isCompleted
    ? "border-teal-100 bg-gradient-to-r from-teal-50/90 via-slate-50/80 to-white"
    : isAccepted
    ? "border-emerald-100 bg-gradient-to-r from-emerald-50/90 via-slate-50/80 to-white"
    : "border-blue-100 bg-gradient-to-r from-blue-50/90 via-slate-50/80 to-white";

  const iconBg = isCompleted
    ? "bg-teal-600 text-white"
    : isAccepted
    ? "bg-emerald-600 text-white"
    : "bg-blue-600 text-white";

  const batchTag = isCompleted
    ? "bg-teal-100 text-teal-800"
    : isAccepted
    ? "bg-emerald-100 text-emerald-800"
    : "bg-blue-100 text-blue-800";

  const batchText = isCompleted
    ? "font-mono text-sm font-bold text-teal-900"
    : isAccepted
    ? "font-mono text-sm font-bold text-emerald-900"
    : "font-mono text-sm font-bold text-blue-900";

  const reassignBtnClass = isCompleted
    ? "bg-teal-700 hover:bg-teal-800 text-white"
    : isAccepted
    ? "bg-emerald-700 hover:bg-emerald-800 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  const rowHover = isCompleted
    ? "hover:bg-teal-50/30"
    : isAccepted
    ? "hover:bg-emerald-50/30"
    : "hover:bg-blue-50/30";

  return (
    <div className={`overflow-hidden rounded-2xl border ${containerBorder} bg-white shadow-2xs transition`}>
      {/* Batch Header Bar */}
      <div className={`border-b ${headerBg} p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Batch & Driver Info */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} shadow-xs`}>
              {isAccepted || isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <FolderKanban className="h-5 w-5" />}
            </span>

            <div>
              <div className="flex items-center gap-2">
                {batch.batchId ? (
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded ${batchTag} px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide`}>
                      Batch #{index + 1}
                    </span>
                    <CopyId
                      value={batch.batchId}
                      textClassName={batchText}
                    />
                  </div>
                ) : (
                  <span className="rounded bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                    Direct Driver Assignment (Unbatched)
                  </span>
                )}

                {isCompleted ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-teal-300 bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed · Received
                  </span>
                ) : isAccepted ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    Confirmed / Accepted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                    <UserCheck className="h-3 w-3" />
                    Driver Assigned
                  </span>
                )}
              </div>

              {/* Driver Credentials */}
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  👤 Driver: {batch.driverName}
                </span>
                {batch.vehicleNumber && (
                  <span className="font-mono font-semibold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    🚗 {batch.vehicleNumber}
                  </span>
                )}
                {batch.driverMobile && (
                  <a
                    href={`tel:${batch.driverMobile}`}
                    className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {batch.driverMobile}
                  </a>
                )}
                {batch.assignedAt && (
                  <span className="text-slate-400">
                    🕒 {shortDate(batch.assignedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Batch Statistics & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-xl border ${
                isAccepted
                  ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                  : "border-blue-200 bg-blue-50/70 text-blue-900"
              } px-3 py-1.5 text-xs font-bold`}
            >
              📦 {batch.orderCount} Orders
            </span>
            <span className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-900">
              ⚖️ {batch.totalQty.toLocaleString("en-IN")} {batch.unit}
            </span>

            {batch.batchId && (
              <button
                type="button"
                onClick={() => onReassignBatch(batch)}
                className={`inline-flex h-8.5 items-center justify-center rounded-xl ${reassignBtnClass} px-3 text-xs font-bold shadow-2xs transition`}
              >
                Reassign Batch
              </button>
            )}

            {batch.batchId && (
              <button
                type="button"
                onClick={() => onOpenBatch(batch.batchId, batch.items.map((i) => i.pickup))}
                className="inline-flex h-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
              >
                Batch Details
              </button>
            )}

            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 transition shadow-2xs"
              title={expanded ? "Collapse Batch Table" : "Expand Batch Table"}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Batch Meta Sub-bar */}
        <div
          className={`mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 border-t ${
            isAccepted ? "border-emerald-100/60" : "border-blue-100/60"
          } pt-2`}
        >
          <span>
            <strong className="text-slate-700">Farmers in Batch:</strong> {batch.farmers.join(", ") || "—"}
          </span>
          <span>
            <strong className="text-slate-700">Produce:</strong> {batch.products.join(" · ") || "—"}
          </span>
        </div>
      </div>

      {/* Embedded Batch Orders Table */}
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-3.5 py-2.5 text-center w-10">#</th>
                <th className="px-3.5 py-2.5 min-w-[140px]">Order ID</th>
                <th className="px-3.5 py-2.5 min-w-[180px]">Farmer & Location</th>
                <th className="px-3.5 py-2.5 min-w-[180px]">Produce & Grades</th>
                <th className="px-3.5 py-2.5 min-w-[130px]">Pickup Schedule</th>
                <th className="px-3.5 py-2.5 min-w-[130px]">Status</th>
                <th className="px-3.5 py-2.5 text-right min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batch.items.map(({ pickup, categories }, oIdx) => {
                const orderId = pickup.orderDisplayId || pickup.orderId;
                const location = pickupLocation(pickup);
                const gradeMap = gradeDetailMap(pickup);
                const unit = pickup.unit || "Kg";

                return (
                  <tr key={pickup.id} className={`${rowHover} transition`}>
                    <td className="px-3.5 py-2.5 align-top text-center font-mono text-[11px] text-slate-400">
                      {oIdx + 1}
                    </td>

                    <td className="px-3.5 py-2.5 align-top">
                      <CopyId
                        value={orderId}
                        textClassName="font-mono text-xs font-bold text-emerald-800"
                      />
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Ordered: {shortDate(pickup.orderDate || pickup.createdAt)}
                      </p>
                    </td>

                    <td className="px-3.5 py-2.5 align-top">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-900">{pickup.farmerName || "Farmer"}</p>
                        {pickup.farmerMobile && (
                          <a
                            href={`tel:${pickup.farmerMobile}`}
                            className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                            title="Call Farmer"
                          >
                            <Phone className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-start gap-1 text-[11px] text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0 text-slate-400 mt-0.5" />
                        <span className="line-clamp-1">{location || "Location not set"}</span>
                      </p>
                    </td>

                    <td className="px-3.5 py-2.5 align-top">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          {pickup.productName}
                          {pickup.variety ? (
                            <span className="font-normal text-slate-500"> · {pickup.variety}</span>
                          ) : null}
                        </span>
                        <span className="font-black text-emerald-800 whitespace-nowrap">
                          {pickup.packedQuantity || pickup.expectedQuantity || 0} {unit}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-1">
                        {DEFAULT_GRADES.map((g) => {
                          const row = gradeMap[g];
                          const qty = Number(row?.qty || 0);
                          const rate = Number(row?.rate || 0);
                          if (!qty && !rate) return null;
                          return (
                            <span
                              key={g}
                              className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1 py-0.5 text-[9px] font-medium text-slate-700"
                            >
                              <strong className="font-bold">{g}:</strong> {qty} {unit}
                              {rate > 0 ? <span className="text-emerald-700 font-bold">₹{rate}</span> : null}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="px-3.5 py-2.5 align-top">
                      <p className="font-bold text-slate-800">
                        {shortDate(pickup.pickupDate || pickup.scheduledDate)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                        🕒 {formatTime12h(pickup.pickupTime || pickup.scheduledTime)}
                      </p>
                    </td>

                    <td className="px-3.5 py-2.5 align-top">
                      {isCompleted ? (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full border border-teal-300 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                          <p className="mt-0.5 text-[10px] text-teal-700 font-medium">Received at Centre</p>
                        </>
                      ) : isAccepted ? (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Driver Accepted
                          </span>
                          <p className="mt-0.5 text-[10px] text-emerald-700 font-medium">Ready for pickup</p>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                            <UserCheck className="h-3 w-3" />
                            Driver Assigned
                          </span>
                          <p className="mt-0.5 text-[10px] text-blue-600 font-medium">Waiting acceptance</p>
                        </>
                      )}
                    </td>

                    <td className="px-3.5 py-2.5 text-right align-top whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onReassignOrder(pickup)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        >
                          Reassign
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenPickup(pickup)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        >
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenOrder(pickup)}
                          className="rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                          title="View Order"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// MAIN DRIVER PICKUP ORDERS PAGE
// --------------------------------------------------------------------------
export default function DriverPickupOrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab from URL query params or default 'all'
  const activeTab = searchParams.get("tab") || "all";

  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [farmerFilter, setFarmerFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [assignedViewType, setAssignedViewType] = useState("batch"); // 'batch' | 'flat'
  const [acceptedViewType, setAcceptedViewType] = useState("batch"); // 'batch' | 'flat'
  const [completedViewType, setCompletedViewType] = useState("batch"); // 'batch' | 'flat'
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Modal target state: { type: 'pickup', pickup } or { type: 'batch', batch }
  const [assignModalTarget, setAssignModalTarget] = useState(null);

  // Load all pickups for vendor
  useLive(() => {
    let alive = true;
    setLoading(true);
    getManagerPickups({ filter: "all" })
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data)
          ? data
          : data?.pickups || (data?.farmers || []).flatMap((g) => g.pickups || []);
        setPickups(list);
      })
      .catch(() => {
        if (alive) setPickups([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [reloadTrigger]);

  // Categorize every pickup with memoization
  const categorized = useMemo(() => {
    return pickups.map((p) => ({
      pickup: p,
      categories: getPickupDriverCategory(p),
    }));
  }, [pickups]);

  // Tab Counts
  const counts = useMemo(() => {
    return {
      all: categorized.length,
      pending: categorized.filter((item) => item.categories.isPending).length,
      assigned: categorized.filter((item) => item.categories.isAssigned).length,
      accepted: categorized.filter((item) => item.categories.isAccepted).length,
      completed: categorized.filter((item) => item.categories.isCompleted).length,
      rejected: categorized.filter((item) => item.categories.isRejected).length,
    };
  }, [categorized]);

  // Unique products & farmers for filtering
  const filterOptions = useMemo(() => {
    const products = new Set();
    const farmers = new Set();
    pickups.forEach((p) => {
      if (p.productName) products.add(p.productName);
      if (p.farmerName) farmers.add(p.farmerName);
    });
    return {
      products: Array.from(products).sort(),
      farmers: Array.from(farmers).sort(),
    };
  }, [pickups]);

  // Filter based on activeTab and filters
  const displayedItems = useMemo(() => {
    return categorized.filter(({ pickup, categories }) => {
      // 1. Tab Filter
      if (activeTab === "pending" && !categories.isPending) return false;
      if (activeTab === "assigned" && !categories.isAssigned) return false;
      if (activeTab === "accepted" && !categories.isAccepted) return false;
      if (activeTab === "completed" && !categories.isCompleted) return false;
      if (activeTab === "rejected" && !categories.isRejected) return false;

      // 2. Date Filter
      if (dateFilter === "today") {
        const today = todayISODate();
        const pDate = String(pickup.pickupDate || pickup.scheduledDate || "").slice(0, 10);
        if (pDate !== today) return false;
      } else if (dateFilter === "yesterday") {
        const yesterday = yesterdayISODate();
        const pDate = String(pickup.pickupDate || pickup.scheduledDate || "").slice(0, 10);
        if (pDate !== yesterday) return false;
      }

      // 3. Product Filter
      if (productFilter !== "all" && pickup.productName !== productFilter) {
        return false;
      }

      // 4. Farmer Filter
      if (farmerFilter !== "all" && pickup.farmerName !== farmerFilter) {
        return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const haystack = [
          pickup.orderDisplayId,
          pickup.orderId,
          pickup.pickupId,
          pickup.id,
          pickup.farmerName,
          pickup.farmerMobile,
          pickup.driverName,
          pickup.driverMobile,
          pickup.vehicleNumber,
          pickup.productName,
          pickup.variety,
          pickup.collectionBatchId,
          pickupLocation(pickup),
          categories.rejectionInfo?.reason,
          categories.rejectionInfo?.driverName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [categorized, activeTab, dateFilter, productFilter, farmerFilter, searchQuery]);

  // Group Assigned items into Batches
  const assignedBatches = useMemo(() => {
    if (activeTab !== "assigned") return [];
    return groupAssignedPickupsByBatch(displayedItems);
  }, [activeTab, displayedItems]);

  // Group Confirmed / Accepted items into Batches
  const acceptedBatches = useMemo(() => {
    if (activeTab !== "accepted") return [];
    return groupAssignedPickupsByBatch(displayedItems);
  }, [activeTab, displayedItems]);

  // Group Completed items into Batches
  const completedBatches = useMemo(() => {
    if (activeTab !== "completed") return [];
    return groupAssignedPickupsByBatch(displayedItems);
  }, [activeTab, displayedItems]);

  const setTab = (tabKey) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tabKey);
      return next;
    });
  };

  const reloadData = () => {
    setReloadTrigger((v) => v + 1);
  };

  // Helper for Order details navigation
  const openOrder = (pickup) => {
    const id = pickup.orderDisplayId || pickup.orderId;
    navigate(`/vendor/orders/detail/${encodeURIComponent(id)}?from=driver-pickups`);
  };

  const openPickup = (pickup) => {
    navigate(`/vendor/pickups/${pickup.id}`);
  };

  const openBatch = (batchId, batchPickups) => {
    navigate(`/vendor/pickups/batches/${encodeURIComponent(batchId)}`, {
      state: { batchId, pickups: batchPickups, from: "assigned" },
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Truck className="h-5 w-5" />
            </span>
            <h1 className={EXCEL_PAGE_TITLE}>All Pickup Orders</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Manage all farmer pickup orders, driver assignment & live status tracking
          </p>
        </div>

        {/* Quick Driver Section Navigation Links */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={reloadData}
            title="Refresh Orders"
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            to="/vendor/drivers"
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            All Drivers
          </Link>
          <Link
            to="/vendor/drivers/add"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-700 px-3.5 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs transition"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Add Driver
          </Link>
        </div>
      </div>

      {/* KPI Cards Row (Proper Small & Neat 1-Row Tab Cards) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            id: "all",
            label: "All Pickups",
            count: counts.all,
            icon: Package,
            activeCls: "border-slate-900 bg-slate-900 text-white shadow-xs",
            inactiveCls: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            iconActiveCls: "bg-slate-800 text-slate-100",
            iconInactiveCls: "bg-slate-100 text-slate-600",
            countActiveCls: "text-white",
            countInactiveCls: "text-slate-900",
            labelActiveCls: "text-slate-300",
            labelInactiveCls: "text-slate-500",
          },
          {
            id: "pending",
            label: "Assign Pending",
            count: counts.pending,
            icon: Clock,
            activeCls: "border-amber-600 bg-amber-600 text-white shadow-xs",
            inactiveCls: "border-amber-200/80 bg-amber-50/40 text-amber-900 hover:border-amber-300 hover:bg-amber-50/80",
            iconActiveCls: "bg-amber-700 text-amber-100",
            iconInactiveCls: "bg-amber-100 text-amber-700",
            countActiveCls: "text-white",
            countInactiveCls: "text-amber-950",
            labelActiveCls: "text-amber-100",
            labelInactiveCls: "text-amber-700",
          },
          {
            id: "assigned",
            label: "Driver Assigned",
            count: counts.assigned,
            icon: UserCheck,
            activeCls: "border-blue-600 bg-blue-600 text-white shadow-xs",
            inactiveCls: "border-blue-200/80 bg-blue-50/40 text-blue-900 hover:border-blue-300 hover:bg-blue-50/80",
            iconActiveCls: "bg-blue-700 text-blue-100",
            iconInactiveCls: "bg-blue-100 text-blue-700",
            countActiveCls: "text-white",
            countInactiveCls: "text-blue-950",
            labelActiveCls: "text-blue-100",
            labelInactiveCls: "text-blue-700",
          },
          {
            id: "accepted",
            label: "Confirm (Batches)",
            count: counts.accepted,
            icon: CheckCircle2,
            activeCls: "border-emerald-600 bg-emerald-600 text-white shadow-xs",
            inactiveCls: "border-emerald-200/80 bg-emerald-50/40 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/80",
            iconActiveCls: "bg-emerald-700 text-emerald-100",
            iconInactiveCls: "bg-emerald-100 text-emerald-700",
            countActiveCls: "text-white",
            countInactiveCls: "text-emerald-950",
            labelActiveCls: "text-emerald-100",
            labelInactiveCls: "text-emerald-700",
          },
          {
            id: "completed",
            label: "Completed (Batches)",
            count: counts.completed,
            icon: CheckCircle2,
            activeCls: "border-teal-700 bg-teal-700 text-white shadow-xs",
            inactiveCls: "border-teal-200/80 bg-teal-50/40 text-teal-900 hover:border-teal-300 hover:bg-teal-50/80",
            iconActiveCls: "bg-teal-800 text-teal-100",
            iconInactiveCls: "bg-teal-100 text-teal-700",
            countActiveCls: "text-white",
            countInactiveCls: "text-teal-950",
            labelActiveCls: "text-teal-100",
            labelInactiveCls: "text-teal-700",
          },
          {
            id: "rejected",
            label: "Driver Rejected",
            count: counts.rejected,
            icon: XCircle,
            activeCls: "border-rose-600 bg-rose-600 text-white shadow-xs",
            inactiveCls: "border-rose-200/80 bg-rose-50/40 text-rose-900 hover:border-rose-300 hover:bg-rose-50/80",
            iconActiveCls: "bg-rose-700 text-rose-100",
            iconInactiveCls: "bg-rose-100 text-rose-700",
            countActiveCls: "text-white",
            countInactiveCls: "text-rose-950",
            labelActiveCls: "text-rose-100",
            labelInactiveCls: "text-rose-700",
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-all ${
                isActive ? tab.activeCls : tab.inactiveCls
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isActive ? tab.iconActiveCls : tab.iconInactiveCls
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className={`text-sm font-black tabular-nums ${isActive ? tab.countActiveCls : tab.countInactiveCls}`}>
                  {tab.count}
                </p>
                <p className={`text-[11px] font-semibold truncate ${isActive ? tab.labelActiveCls : tab.labelInactiveCls}`}>
                  {tab.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters, Search & View Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, Farmer, Driver, Produce, Batch ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2 text-xs text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
          >
            <option value="all">📅 All Dates</option>
            <option value="today">Today's Pickups</option>
            <option value="yesterday">Yesterday</option>
          </select>

          {/* Product filter */}
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
          >
            <option value="all">🌾 All Produce</option>
            {filterOptions.products.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Farmer filter */}
          <select
            value={farmerFilter}
            onChange={(e) => setFarmerFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
          >
            <option value="all">👨‍🌾 All Farmers</option>
            {filterOptions.farmers.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {(searchQuery || dateFilter !== "all" || productFilter !== "all" || farmerFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setDateFilter("all");
                setProductFilter("all");
                setFarmerFilter("all");
              }}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* View Controls & Sub-toggles for Assigned and Accepted tabs */}
        <div className="flex items-center gap-2 self-end lg:self-auto border-t border-slate-100 pt-2 lg:border-t-0 lg:pt-0">
          {/* If on Driver Assigned tab, allow switching between Batch View and Flat Table */}
          {activeTab === "assigned" && (
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setAssignedViewType("batch")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  assignedViewType === "batch"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FolderKanban className="h-3.5 w-3.5" />
                Batch View
              </button>
              <button
                type="button"
                onClick={() => setAssignedViewType("flat")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  assignedViewType === "flat"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                Table View
              </button>
            </div>
          )}

          {/* If on Confirm Pickup (Accepted) tab, allow switching between Batch View and Flat Table */}
          {activeTab === "accepted" && (
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setAcceptedViewType("batch")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  acceptedViewType === "batch"
                    ? "bg-emerald-700 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FolderKanban className="h-3.5 w-3.5" />
                Batch View
              </button>
              <button
                type="button"
                onClick={() => setAcceptedViewType("flat")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  acceptedViewType === "flat"
                    ? "bg-emerald-700 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                Table View
              </button>
            </div>
          )}

          {/* If on Completed Pickups tab, allow switching between Batch View and Flat Table */}
          {activeTab === "completed" && (
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setCompletedViewType("batch")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  completedViewType === "batch"
                    ? "bg-teal-700 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FolderKanban className="h-3.5 w-3.5" />
                Batch View
              </button>
              <button
                type="button"
                onClick={() => setCompletedViewType("flat")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  completedViewType === "flat"
                    ? "bg-teal-700 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                Table View
              </button>
            </div>
          )}

          <span className="mr-1 text-xs text-slate-500 font-medium whitespace-nowrap">
            {activeTab === "assigned" && assignedViewType === "batch" ? (
              <span>
                <strong className="text-slate-900">{assignedBatches.length}</strong> batches ·{" "}
                <strong className="text-slate-900">{displayedItems.length}</strong> orders
              </span>
            ) : activeTab === "accepted" && acceptedViewType === "batch" ? (
              <span>
                <strong className="text-slate-900">{acceptedBatches.length}</strong> batches ·{" "}
                <strong className="text-slate-900">{displayedItems.length}</strong> orders
              </span>
            ) : activeTab === "completed" && completedViewType === "batch" ? (
              <span>
                <strong className="text-slate-900">{completedBatches.length}</strong> batches ·{" "}
                <strong className="text-slate-900">{displayedItems.length}</strong> orders
              </span>
            ) : (
              <span>
                Showing <strong className="text-slate-900">{displayedItems.length}</strong> orders
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-16 text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm font-semibold">Loading pickup orders...</p>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8">
          <EmptyState
            title={
              activeTab === "pending"
                ? "No Pickups Pending Driver Assignment"
                : activeTab === "assigned"
                ? "No Driver Assigned Orders or Batches"
                : activeTab === "accepted"
                ? "No Confirmed / Accepted Pickups"
                : activeTab === "completed"
                ? "No Completed Pickups Found"
                : activeTab === "rejected"
                ? "No Rejected Pickups"
                : "No Pickup Orders Found"
            }
            subtitle="Try adjusting your filters or search query."
          />
        </div>
      ) : activeTab === "assigned" && assignedViewType === "batch" ? (
        /* BATCH VIEW FOR DRIVER ASSIGNED */
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-blue-50/70 border border-blue-200 px-4 py-2.5 text-xs text-blue-900">
            <span className="font-semibold flex items-center gap-1.5">
              <FolderKanban className="h-4 w-4 text-blue-700" />
              Driver Assigned Orders Grouped by Batch
            </span>
            <span className="font-bold">
              {assignedBatches.length} Batches ({displayedItems.length} Orders)
            </span>
          </div>

          {assignedBatches.map((batch, bIdx) => (
            <AssignedBatchCard
              key={batch.batchId || `unbatched-assigned-${bIdx}`}
              batch={batch}
              index={bIdx}
              variant="assigned"
              onReassignBatch={(b) => setAssignModalTarget({ type: "batch", batch: b })}
              onReassignOrder={(p) => setAssignModalTarget({ type: "pickup", pickup: p })}
              onOpenOrder={openOrder}
              onOpenPickup={openPickup}
              onOpenBatch={openBatch}
            />
          ))}
        </div>
      ) : activeTab === "accepted" && acceptedViewType === "batch" ? (
        /* BATCH VIEW FOR CONFIRM PICKUP (ACCEPTED) */
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-900">
            <span className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              Confirmed / Accepted Pickups Grouped by Batch
            </span>
            <span className="font-bold">
              {acceptedBatches.length} Batches ({displayedItems.length} Orders)
            </span>
          </div>

          {acceptedBatches.map((batch, bIdx) => (
            <AssignedBatchCard
              key={batch.batchId || `unbatched-accepted-${bIdx}`}
              batch={batch}
              index={bIdx}
              variant="accepted"
              onReassignBatch={(b) => setAssignModalTarget({ type: "batch", batch: b })}
              onReassignOrder={(p) => setAssignModalTarget({ type: "pickup", pickup: p })}
              onOpenOrder={openOrder}
              onOpenPickup={openPickup}
              onOpenBatch={openBatch}
            />
          ))}
        </div>
      ) : activeTab === "completed" && completedViewType === "batch" ? (
        /* BATCH VIEW FOR COMPLETED PICKUPS */
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-teal-50/70 border border-teal-200 px-4 py-2.5 text-xs text-teal-900">
            <span className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-teal-700" />
              Completed Pickups Grouped by Batch
            </span>
            <span className="font-bold">
              {completedBatches.length} Batches ({displayedItems.length} Orders)
            </span>
          </div>

          {completedBatches.map((batch, bIdx) => (
            <AssignedBatchCard
              key={batch.batchId || `unbatched-completed-${bIdx}`}
              batch={batch}
              index={bIdx}
              variant="completed"
              onReassignBatch={(b) => setAssignModalTarget({ type: "batch", batch: b })}
              onReassignOrder={(p) => setAssignModalTarget({ type: "pickup", pickup: p })}
              onOpenOrder={openOrder}
              onOpenPickup={openPickup}
              onOpenBatch={openBatch}
            />
          ))}
        </div>
      ) : (
        /* FULL TABLE VIEW (For All, Pending, Accepted, Rejected & Flat Assigned) */
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="px-3 py-3 text-center w-10">#</th>
                  <th className="px-3.5 py-3 min-w-[150px]">Order ID / Batch</th>
                  <th className="px-3.5 py-3 min-w-[180px]">Farmer & Location</th>
                  <th className="px-3.5 py-3 min-w-[200px]">Produce & Grades</th>
                  <th className="px-3.5 py-3 min-w-[140px]">Pickup Schedule</th>
                  <th className="px-3.5 py-3 min-w-[220px]">Driver Details</th>
                  <th className="px-3.5 py-3 min-w-[170px]">Status & Stage</th>
                  <th className="px-3.5 py-3 text-right min-w-[150px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedItems.map(({ pickup, categories }, idx) => {
                  const orderId = pickup.orderDisplayId || pickup.orderId;
                  const progress = categories.isAccepted ? getDriverProgressStage(pickup) : null;
                  const rejection = categories.rejectionInfo;
                  const location = pickupLocation(pickup);
                  const gradeMap = gradeDetailMap(pickup);
                  const unit = pickup.unit || "Kg";

                  return (
                    <tr
                      key={pickup.id}
                      className={`hover:bg-slate-50/80 transition ${
                        categories.isRejected
                          ? "bg-rose-50/20"
                          : categories.isPending
                          ? "bg-amber-50/20"
                          : categories.isAccepted
                          ? "bg-emerald-50/10"
                          : categories.isCompleted
                          ? "bg-teal-50/20"
                          : ""
                      }`}
                    >
                      {/* Sr. No. */}
                      <td className="px-3 py-3 align-top text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Order ID & Batch */}
                      <td className="px-3.5 py-3 align-top">
                        <div className="flex items-center gap-1.5">
                          <CopyId
                            value={orderId}
                            textClassName="font-mono text-xs font-bold text-emerald-800"
                          />
                        </div>
                        {pickup.collectionBatchId ? (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                              Batch: {pickup.collectionBatchId}
                            </span>
                          </div>
                        ) : null}
                        <p className="mt-1 text-[10px] text-slate-400">
                          Ordered: {shortDate(pickup.orderDate || pickup.createdAt)}
                        </p>
                      </td>

                      {/* Farmer & Location */}
                      <td className="px-3.5 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{pickup.farmerName || "Farmer"}</p>
                          {pickup.farmerMobile && (
                            <a
                              href={`tel:${pickup.farmerMobile}`}
                              className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                              title="Call Farmer"
                            >
                              <Phone className="h-2.5 w-2.5" />
                              {pickup.farmerMobile}
                            </a>
                          )}
                        </div>
                        <p className="mt-0.5 flex items-start gap-1 text-[11px] text-slate-500">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-400 mt-0.5" />
                          <span className="line-clamp-2">{location || "Location not set"}</span>
                        </p>
                      </td>

                      {/* Produce & Grades */}
                      <td className="px-3.5 py-3 align-top">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">
                            {pickup.productName}
                            {pickup.variety ? (
                              <span className="font-normal text-slate-500"> · {pickup.variety}</span>
                            ) : null}
                          </span>
                          <span className="font-black text-emerald-800 whitespace-nowrap">
                            {pickup.packedQuantity || pickup.expectedQuantity || 0} {unit}
                          </span>
                        </div>

                        {/* Grade breakdown pills */}
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {DEFAULT_GRADES.map((g) => {
                            const row = gradeMap[g];
                            const qty = Number(row?.qty || 0);
                            const rate = Number(row?.rate || 0);
                            if (!qty && !rate) return null;
                            return (
                              <span
                                key={g}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-700"
                              >
                                <strong className="font-bold">{g}:</strong> {qty} {unit}
                                {rate > 0 ? <span className="text-emerald-700 font-bold">₹{rate}</span> : null}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Scheduled Dates */}
                      <td className="px-3.5 py-3 align-top">
                        <p className="font-bold text-slate-800">
                          {shortDate(pickup.pickupDate || pickup.scheduledDate)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                          🕒 {formatTime12h(pickup.pickupTime || pickup.scheduledTime)}
                        </p>
                      </td>

                      {/* Driver Details */}
                      <td className="px-3.5 py-3 align-top">
                        {categories.isRejected && rejection ? (
                          <div className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900">
                            <div className="flex items-center gap-1 font-bold text-rose-800">
                              <XCircle className="h-3 w-3 shrink-0" />
                              <span>Rejected by {rejection.driverName}</span>
                            </div>
                            {rejection.reason && (
                              <p className="mt-0.5 text-[11px] text-rose-700 italic">
                                "{rejection.reason}"
                              </p>
                            )}
                            {rejection.at && (
                              <p className="mt-1 text-[9px] text-rose-500">
                                {new Date(rejection.at).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        ) : categories.isAssigned || categories.isAccepted || categories.isCompleted ? (
                          <div>
                            <div className="flex items-center justify-between gap-1.5">
                              <p className="font-bold text-slate-900 truncate">
                                {pickup.driverName || pickup.driver?.name || "Driver"}
                              </p>
                              {pickup.driverMobile && (
                                <a
                                  href={`tel:${pickup.driverMobile}`}
                                  className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 shrink-0"
                                  title="Call Driver"
                                >
                                  <Phone className="h-2.5 w-2.5" />
                                  Call
                                </a>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
                              {pickup.vehicleNumber && (
                                <span className="rounded bg-slate-100 px-1 py-0.5 font-mono font-semibold">
                                  🚗 {pickup.vehicleNumber}
                                </span>
                              )}
                              {pickup.assignedAt && (
                                <span className="text-slate-400">
                                  Assigned {shortDate(pickup.assignedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-2 py-1.5 text-[11px] text-amber-800">
                            <span className="font-bold">⚠️ Assign Pending</span>
                            <p className="text-[10px] text-amber-600">No driver assigned yet</p>
                          </div>
                        )}
                      </td>

                      {/* Status & Live Stage */}
                      <td className="px-3.5 py-3 align-top">
                        {categories.isRejected ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                              <XCircle className="h-3 w-3" />
                              Driver Rejected
                            </span>
                            <p className="text-[10px] text-rose-600 font-semibold">Reassignment Needed</p>
                          </div>
                        ) : categories.isCompleted ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-full border border-teal-300 bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </span>
                            <p className="text-[10px] text-teal-700 font-medium">Received at Centre</p>
                          </div>
                        ) : categories.isAccepted ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${progress?.color}`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {progress?.label}
                            </span>
                            <p className="text-[10px] text-emerald-700 font-medium">Driver Confirmed</p>
                          </div>
                        ) : categories.isAssigned ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                              <UserCheck className="h-3 w-3" />
                              Driver Assigned
                            </span>
                            <p className="text-[10px] text-blue-600 font-medium">Awaiting acceptance</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                              <Clock className="h-3 w-3" />
                              Assign Pending
                            </span>
                            <p className="text-[10px] text-amber-600 font-medium">Waiting for driver</p>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-3 text-right align-top whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {categories.isPending || categories.isRejected ? (
                            <button
                              type="button"
                              onClick={() => setAssignModalTarget({ type: "pickup", pickup })}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 shadow-2xs transition"
                            >
                              <UserPlus className="h-3 w-3" />
                              {categories.isRejected ? "Re-Assign" : "Assign"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAssignModalTarget({ type: "pickup", pickup })}
                              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                            >
                              Reassign
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openPickup(pickup)}
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                            title="View Pickup Details"
                          >
                            Details
                          </button>

                          <button
                            type="button"
                            onClick={() => openOrder(pickup)}
                            className="rounded-xl border border-slate-200 bg-white p-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                            title="View Order"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Total in table:</span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 font-bold text-slate-800">
                {displayedItems.length} orders
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span>Pending: <strong>{counts.pending}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span>Assigned: <strong>{counts.assigned}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Accepted: <strong>{counts.accepted}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <span>Rejected: <strong>{counts.rejected}</strong></span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Assign / Reassign Driver Modal */}
      <AssignDriverModal
        target={assignModalTarget}
        isOpen={Boolean(assignModalTarget)}
        onClose={() => setAssignModalTarget(null)}
        onAssigned={reloadData}
      />
    </div>
  );
}
