import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  assignManagerPickup,
  deleteManagerFarmerOrder,
  getManagerAllHarvestOrders,
  getManagerFarmerById,
  getManagerFarmerOrderById,
  getManagerPickup,
  reassignManagerPickup,
} from "../../api/farmerApi";
import PickupTimeline, { pickupStatusLabel } from "../../components/pickup/PickupTimeline";
import { usePolling } from "../../hooks/usePolling";
import StatusBadge from "../../components/ui/StatusBadge";
import CopyId, { isCopyableId } from "../../components/ui/CopyId";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import { formatMoney, formatOrderDate, rejectionText } from "../../utils/orderDisplay";
import { formatProductBusinessId } from "../../utils/cropLinks";
import FarmLocationMap from "../../components/profile/FarmLocationMap";
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";

const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];

function dateDMY(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    const full = formatOrderDate(value);
    return full && full !== "—" ? full : "—";
  }
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function time12h(value) {
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

function gradeRows(order) {
  const unit = order.unit || "Kg";
  const map = {};
  (Array.isArray(order.grades) ? order.grades : []).forEach((g) => {
    const label = String(g.label || g.name || "").trim();
    if (!label) return;
    if (!map[label]) map[label] = { qty: 0, rate: 0 };
    map[label].qty += Number(g.quantity || 0);
    const rate = Number(g.price ?? g.rate ?? g.pricePerKg ?? 0) || 0;
    if (rate > 0) map[label].rate = rate;
  });
  if (!Object.keys(map).length) {
    const label = String(order.grade || "Grade A").trim() || "Grade A";
    map[label] = {
      qty: Number(order.orderedQuantity || order.totalQuantity || 0),
      rate: Number(order.price || 0) || 0,
    };
  }
  const extras = Object.keys(map).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
  const ordered = [...DEFAULT_GRADES, ...extras]
    .filter((label) => Number(map[label]?.qty || 0) > 0)
    .map((label) => ({
      label,
      qty: map[label].qty,
      rate: map[label].rate,
      amount: Number(map[label].qty || 0) * Number(map[label].rate || 0),
      unit,
    }));
  return ordered.length
    ? ordered
    : [{ label: "Total", qty: Number(order.orderedQuantity || order.totalQuantity || 0), rate: 0, amount: 0, unit }];
}

function matchesOrderId(row, orderId) {
  const target = String(orderId || "");
  return [row?.id, row?.orderId].some((v) => String(v || "") === target);
}

function farmCoords(...sources) {
  for (const src of sources) {
    if (src == null) continue;
    const obj = typeof src === "object" ? src : null;
    if (!obj) continue;
    const lat = Number(obj.latitude ?? obj.lat);
    const lng = Number(obj.longitude ?? obj.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
      return { latitude: lat, longitude: lng };
    }
  }
  return null;
}

function exactMapsUrl(coords, address) {
  if (coords) {
    return `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
  }
  if (address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return "";
}

function locationLabel(farmer, order) {
  const geo = farmer?.farmGeo || order?.farmGeo || {};
  const loc = farmer?.farmLocation;
  const addr = farmer?.address && typeof farmer.address === "object" ? farmer.address : {};
  const fromObj =
    loc && typeof loc === "object"
      ? loc.farmAddress || [loc.village, loc.taluka, loc.district, loc.pincode].filter(Boolean).join(", ")
      : "";
  const fromParts = [
    geo.village || addr.village,
    geo.taluka || addr.taluka,
    geo.district || addr.district,
    addr.state || farmer?.state,
    geo.pincode || addr.pincode,
  ]
    .filter(Boolean)
    .join(", ");
  const farmAddr = typeof farmer?.farmAddress === "string" ? farmer.farmAddress : "";
  const orderLoc = typeof order?.farmerLocation === "string" ? order.farmerLocation : "";
  const short = typeof loc === "string" ? loc : "";
  return (
    [geo.farmAddress, farmAddr, fromObj, fromParts, orderLoc, short]
      .filter((v) => typeof v === "string" && v.trim())
      .sort((a, b) => {
        const pa = a.split(",").map((s) => s.trim()).filter(Boolean).length;
        const pb = b.split(",").map((s) => s.trim()).filter(Boolean).length;
        if (pb !== pa) return pb - pa;
        return b.length - a.length;
      })[0] || ""
  );
}

async function loadManagerOrder(farmerId, orderId) {
  let order = null;
  if (farmerId) {
    try {
      const data = await getManagerFarmerOrderById(farmerId, orderId);
      order = data?.order || data;
      if (order && !(matchesOrderId(order, orderId) || order.farmerId)) order = null;
    } catch {
      order = null;
    }
  }
  if (!order) {
    const list = await getManagerAllHarvestOrders().catch(() => ({ orders: [] }));
    const orders = Array.isArray(list?.orders) ? list.orders : [];
    order =
      orders.find((o) => matchesOrderId(o, orderId) && (!farmerId || o.farmerId === farmerId)) ||
      orders.find((o) => matchesOrderId(o, orderId)) ||
      null;
  }
  if (!order) return null;

  const resolvedFarmerId = order.farmerId || farmerId;
  if (!resolvedFarmerId) return order;

  try {
    const farmer = await getManagerFarmerById(resolvedFarmerId);
    const name = farmer?.name || farmer?.farmer?.name || farmer?.data?.name || "";
    const vendorId = farmer?.vendorId || farmer?.farmer?.vendorId || order.vendorId || "";
    const locObj = typeof farmer?.farmLocation === "object" ? farmer.farmLocation : null;
    const coords = farmCoords(order, order.farmGeo, locObj, farmer?.farmGeo, farmer?.farmer?.farmGeo);
    return {
      ...order,
      farmerName: order.farmerName || name || "",
      farmerId: resolvedFarmerId,
      vendorId: order.vendorId || vendorId || "",
      farmerMobile: order.farmerMobile || farmer?.mobile || farmer?.farmer?.mobile || "",
      farmerLocation: locationLabel(farmer, order) || order.farmerLocation || "",
      farmGeo: coords || order.farmGeo || locObj || farmer?.farmGeo || {},
      latitude: coords?.latitude ?? order.latitude,
      longitude: coords?.longitude ?? order.longitude,
      mapsUrl: exactMapsUrl(coords, locationLabel(farmer, order) || order.farmerLocation),
      collectionCentre: order.collectionCentre || "",
      collectionCentreId: order.collectionCentreId || "",
    };
  } catch {
    return { ...order, farmerId: resolvedFarmerId };
  }
}

function Fact({ label, value }) {
  return (
    <div className="rounded-lg bg-[#F8FAF8] px-3 py-2">
      <p className="text-[10px] font-semibold text-[#6B7280]">{label}</p>
      {isCopyableId(label, value) ? (
        <CopyId value={value} className="mt-0.5" textClassName="break-all font-mono text-[13px] font-bold text-[#1F2937]" breakAll />
      ) : (
        <p className="mt-0.5 text-[13px] font-bold text-[#1F2937]">{value || "—"}</p>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      {title ? (
        <p className="border-b border-[#F3F4F6] px-3 py-2 text-[12px] font-bold text-[#1F2937]">{title}</p>
      ) : null}
      <div className="px-3 py-2.5">{children}</div>
    </section>
  );
}

export default function ManagerOrderDetailPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const farmerId = searchParams.get("farmerId") || "";
  const [order, setOrder] = useState(null);
  const [pickupDetail, setPickupDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [driverId, setDriverId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);

  usePolling(() => {
    if (!orderId) {
      setLoading(false);
      setOrder(null);
      setPickupDetail(null);
      return;
    }
    loadManagerOrder(farmerId, decodeURIComponent(orderId))
      .then(async (data) => {
        setOrder(data);
        const pid = data?.pickup?.id || data?.pickup?.pickupId || data?.id || data?.orderId;
        if (!pid) {
          setPickupDetail(null);
          setLoading(false);
          return;
        }
        try {
          setPickupDetail(await getManagerPickup(pid));
        } catch {
          setPickupDetail(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setOrder(null);
        setPickupDetail(null);
        setLoading(false);
      });
  }, [farmerId, orderId], 5000);

  const grades = useMemo(() => (order ? gradeRows(order) : []), [order]);

  if (loading) return <LoadingState rows={6} />;
  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order could not be loaded."
        action={
          <Link to="/farmer/manager/orders" className={EXCEL_BTN_PRIMARY}>
            Back to Orders
          </Link>
        }
      />
    );
  }

  const unit = order.unit || "Kg";
  const displayId = order.orderId || order.id || orderId;
  const resolvedFarmerId = order.farmerId || farmerId;
  const farmerName = order.farmerName || order.farmer?.name || "—";
  const productName = order.productName || order.name || "Harvest Order";
  const productId = formatProductBusinessId({
    productId: order.productId,
    name: productName,
    productName,
    variety: order.variety,
    category: order.category,
  });
  const totalQty =
    Number(order.orderedQuantity || order.totalQuantity || 0) ||
    grades.reduce((s, g) => s + Number(g.qty || 0), 0);
  const orderValue = Number(order.orderValue || order.totalAmount || order.amount || 0);
  const reason = rejectionText(order);
  const pickup = pickupDetail || order.pickup;
  const packing = order.packingDetails || pickup || {};
  const geo = order.farmGeo || {};
  const pin = farmCoords(order, geo, pickup?.farmGeo);
  const locationText =
    (typeof order.farmerLocation === "string" && order.farmerLocation) ||
    order.farmAddress ||
    pickup?.farmerLocation ||
    [geo.village, geo.taluka, geo.district, geo.pincode].filter(Boolean).join(", ") ||
    "";
  const mapsUrl = exactMapsUrl(pin, locationText);
  const fromPickups = searchParams.get("from") === "pickups";
  const backTo = fromPickups ? "/farmer/manager/pickups/ready" : "/farmer/manager/orders";
  const backLabel = fromPickups ? "← Ready for Pickup" : "← Orders";
  const pickupKey = pickup?.id || pickup?.pickupId || order.id || order.orderId || "";
  const pickupStatus = String(pickup?.status || order.status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  const canAssign = pickupStatus === "READY_FOR_PICKUP";
  const canReassign =
    ["DRIVER_ASSIGNED", "PICKUP_SCHEDULED", "DISPATCHED"].includes(pickupStatus) && !pickup?.pickupConfirmed;
  const showAssign = Boolean(pickupKey && (canAssign || canReassign));
  const availableDrivers = pickup?.availableDrivers || [];
  const formParams = new URLSearchParams();
  if (resolvedFarmerId) formParams.set("farmerId", resolvedFarmerId);
  if (order.productId) formParams.set("productId", order.productId);
  formParams.set("edit", displayId);
  const editPath = `/farmer/manager/orders/create?${formParams.toString()}`;

  const openAssign = () => {
    const first = availableDrivers[0];
    setDriverId(pickup?.driverId || first?.id || first?.driverId || "");
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!pickupKey || !driverId) return;
    setAssignBusy(true);
    try {
      if (canAssign) await assignManagerPickup(pickupKey, driverId);
      else await reassignManagerPickup(pickupKey, driverId);
      toast.success(canReassign && pickup?.driverName ? "Driver reassigned" : "Driver assigned");
      setAssignOpen(false);
      setPickupDetail(await getManagerPickup(pickupKey));
    } catch (err) {
      toast.error(err.message || "Could not assign driver");
    } finally {
      setAssignBusy(false);
    }
  };

  const handleDelete = async () => {
    const id = order.orderId || order.id || orderId;
    if (!resolvedFarmerId || !id) {
      toast.error("Cannot delete: farmer or order id missing");
      return;
    }
    if (!window.confirm(`Delete order ${id}?`)) return;
    setDeleting(true);
    try {
      await deleteManagerFarmerOrder(resolvedFarmerId, id);
      toast.success("Order deleted");
      navigate("/farmer/manager/orders");
    } catch (err) {
      toast.error(err?.message || "Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <Link to={backTo} className="text-[11px] font-semibold text-[#217346] hover:underline">
        {backLabel}
      </Link>
      <StatusBadge status={pickup?.status || order.status} />
      <div className="min-w-0">
        <h1 className="text-lg font-bold text-[#1F2937]">{productName}</h1>
        <CopyId value={displayId} className="mt-0.5" textClassName="font-mono text-[11px] text-[#6B7280]" />
      </div>

      {reason ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-[#DC2626]">
          Rejected: {reason}
        </div>
      ) : null}

      <Card title="Product">
        <p className="text-[15px] font-bold text-[#1F2937]">{productName}</p>
        {order.variety ? <p className="mt-0.5 text-[12px] text-[#6B7280]">Variety: {order.variety}</p> : null}
        <CopyId value={productId} className="mt-0.5" textClassName="font-mono text-[11px] text-emerald-700" breakAll />
        <p className="mt-1 text-[12px] text-[#6B7280]">
          Farmer: <span className="font-semibold text-[#1F2937]">{farmerName}</span>
          {order.farmerMobile ? (
            <>
              {" · "}
              <a href={`tel:${order.farmerMobile}`} className="font-semibold text-[#217346]">
                {order.farmerMobile}
              </a>
            </>
          ) : null}
        </p>
        <p className="mt-0.5 text-[12px] text-[#6B7280]">
          Location: <span className="font-semibold text-[#1F2937]">{locationText || "—"}</span>
        </p>
        {order.collectionCentre || order.collectionCentreId ? (
          <p className="mt-0.5 text-[11px] text-[#6B7280]">
            Centre: {order.collectionCentre || order.collectionCentreId}
          </p>
        ) : null}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Fact label="Order date" value={dateDMY(order.orderDate || order.harvestDate || order.date || order.createdAt)} />
        <Fact label="Pickup date" value={dateDMY(order.pickupDate)} />
        <Fact label="Pickup time" value={time12h(order.pickupTime)} />
        <Fact label="Total qty" value={`${totalQty.toLocaleString("en-IN")} ${unit}`} />
      </div>

      <Card title="Grades">
        <div className="-mx-3 -my-2.5 overflow-x-auto">
          <table className="w-full min-w-[280px] border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#F8FAF8] text-[10px] font-bold text-[#6B7280]">
                <th className="px-3 py-1.5 text-left">Grade</th>
                <th className="px-3 py-1.5 text-right">Qty</th>
                <th className="px-3 py-1.5 text-right">Rate</th>
                <th className="px-3 py-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.label} className="border-t border-[#F3F4F6]">
                  <td className="px-3 py-2 font-semibold text-[#1F2937]">{g.label}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-[#217346]">
                    {Number(g.qty).toLocaleString("en-IN")} {g.unit}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-[#6B7280]">
                    {Number(g.rate) > 0 ? `${formatMoney(g.rate)}/${g.unit}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-[#1F2937]">
                    {Number(g.amount) > 0 ? formatMoney(g.amount) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#E5E7EB] bg-[#F8FAF8]">
                <td className="px-3 py-2 font-semibold text-[#6B7280]" colSpan={3}>
                  Order value
                </td>
                <td className="px-3 py-2 text-right text-[14px] font-bold tabular-nums text-[#1F2937]">
                  {formatMoney(orderValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card title="Packing">
        <div className="grid grid-cols-2 gap-2">
          <Fact label="Packed qty" value={order.packedQuantity ? `${order.packedQuantity} ${unit}` : packing.packedQuantity ? `${packing.packedQuantity} ${unit}` : "—"} />
          <Fact label="Packages" value={packing.packageCount || "—"} />
          <Fact label="Type" value={packing.packageType || "—"} />
          <Fact label="Weight" value={packing.packageWeight ? `${packing.packageWeight} ${unit}` : "—"} />
        </div>
        {packing.notes ? <p className="mt-2 text-[12px] text-[#6B7280]">{packing.notes}</p> : null}
      </Card>

      <Card title="Location">
        <Fact label="Farm location" value={locationText || "—"} />
        {pin ? (
          <div className="mt-2 overflow-hidden rounded-lg">
            <FarmLocationMap latitude={pin.latitude} longitude={pin.longitude} interactive={false} />
          </div>
        ) : null}
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className={`${EXCEL_BTN_PRIMARY} mt-3 w-full`}
          >
            Open exact farm pin in Google Maps
          </a>
        ) : (
          <p className="mt-2 text-[12px] text-[#6B7280]">This farmer has not pinned an exact farm location yet.</p>
        )}
      </Card>

      {pickup ? (
        <Card title="Pickup">
          <div className="grid grid-cols-2 gap-2">
            <Fact label="Driver" value={pickup.driverName || "Not assigned"} />
            <Fact
              label="Mobile"
              value={
                pickup.driverMobile ? (
                  <a href={`tel:${pickup.driverMobile}`} className="text-[#217346]">
                    {pickup.driverMobile}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Fact label="Vehicle" value={pickup.vehicleNumber || "—"} />
            <Fact label="Lot / Batch ID" value={pickup.collectionBatchId || "—"} />
            <Fact label="Status" value={pickupStatusLabel(pickup.status || pickup.liveStatus)} />
          </div>
          <div className="mt-3">
            <PickupTimeline status={pickup.status || order.status} />
          </div>
          {showAssign ? (
            <button type="button" className={`${EXCEL_BTN_PRIMARY} mt-3 w-full`} onClick={openAssign}>
              {canReassign && pickup.driverName ? "Reassign Driver" : "Assign Driver"}
            </button>
          ) : null}
        </Card>
      ) : showAssign ? (
        <Card title="Pickup">
          <p className="text-[12px] text-[#6B7280]">No driver assigned yet.</p>
          <button type="button" className={`${EXCEL_BTN_PRIMARY} mt-3 w-full`} onClick={openAssign}>
            Assign Driver
          </button>
        </Card>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Link to={backTo} className={`${EXCEL_BTN} !min-h-10 w-full sm:w-auto`}>
          Back
        </Link>
        {showAssign ? (
          <button type="button" className={`${EXCEL_BTN_PRIMARY} !min-h-10 w-full sm:w-auto`} onClick={openAssign}>
            {canReassign && pickup?.driverName ? "Reassign Driver" : "Assign Driver"}
          </button>
        ) : null}
        <Link to={editPath} className={`${EXCEL_BTN_PRIMARY} !min-h-10 w-full sm:w-auto`}>
          Edit
        </Link>
        <button
          type="button"
          className={`${EXCEL_BTN_DANGER} !min-h-10 w-full sm:w-auto`}
          disabled={deleting || !resolvedFarmerId}
          onClick={handleDelete}
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      <Modal
        open={assignOpen}
        title={canReassign && pickup?.driverName ? "Reassign Driver" : "Assign Driver"}
        onClose={() => !assignBusy && setAssignOpen(false)}
        footer={
          <>
            <button type="button" className={EXCEL_BTN} disabled={assignBusy} onClick={() => setAssignOpen(false)}>
              Cancel
            </button>
            <button type="button" className={EXCEL_BTN_PRIMARY} disabled={assignBusy || !driverId} onClick={handleAssign}>
              {assignBusy ? "Assigning…" : canReassign && pickup?.driverName ? "Reassign Driver" : "Assign Driver"}
            </button>
          </>
        }
      >
        {availableDrivers.length === 0 ? (
          <p className="text-[12px] text-[#6B7280]">No available drivers.</p>
        ) : (
          <div className="-mx-4 -my-4">
            {availableDrivers.map((d) => {
              const id = d.id || d.driverId;
              return (
              <label
                key={id}
                className={`flex cursor-pointer items-start gap-3 border-b border-[#F3F4F6] px-4 py-3 text-xs ${
                  driverId === id ? "bg-[#E8F5E9]" : ""
                }`}
              >
                <input type="radio" name="order-driver" checked={driverId === id} onChange={() => setDriverId(id)} />
                <div>
                  <p className="font-semibold text-[#1F2937]">{d.name}</p>
                  <p className="text-[#6B7280]">Mobile {d.mobile}</p>
                  <p className="text-[#6B7280]">
                    Vehicle {d.vehicleNumber || "—"} · {d.vehicleType || "—"}
                  </p>
                  <p className="text-[#6B7280]">
                    Status {d.status} · Location {d.currentLocation || d.assignedArea || "—"}
                  </p>
                </div>
              </label>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
