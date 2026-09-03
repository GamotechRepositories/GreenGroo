import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { acceptMyOrder, getMyOrders, rejectMyOrder } from "../api/farmerApi";
import { usePolling } from "../hooks/usePolling";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import RejectOrderModal from "../components/orders/RejectOrderModal";
import { canAccept, canReject, formatMoney, formatOrderDate, orderTitle, rejectionText } from "../utils/orderDisplay";
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_PRIMARY,
  EXCEL_CELL,
  EXCEL_HEAD,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_TABLE,
  EXCEL_WRAP,
} from "../utils/excelStyles";

function gradeLine(order) {
  const grades = Array.isArray(order.grades) ? order.grades.filter((g) => Number(g.quantity || 0) > 0) : [];
  if (grades.length) {
    return grades.map((g) => `${g.label || g.name} ${Number(g.quantity || 0).toLocaleString("en-IN")}`).join(" · ");
  }
  return order.grade || "—";
}

function OrdersPage({ filter = "new" }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptId, setAcceptId] = useState("");
  const [rejectOrder, setRejectOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setOrders(await getMyOrders({ filter }));
    } catch (err) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  usePolling(() => {
    getMyOrders({ filter })
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter], 5000);

  const acceptTarget = orders.find((o) => (o.orderId || o.id) === acceptId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>{orderTitle(filter)}</h1>
        <p className={EXCEL_PAGE_SUB}>Orders for your farm only. Accept to reserve stock, then prepare for pickup.</p>
      </div>

      {loading ? (
        <LoadingState rows={6} />
      ) : orders.length === 0 ? (
        <EmptyState title={`No ${orderTitle(filter).toLowerCase()}`} description="Orders in this status will appear here." />
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            {orders.map((order) => {
              const id = order.orderId || order.id;
              return (
                <section key={id} className={`${EXCEL_PANEL} p-3 space-y-2`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold">{id}</p>
                      <p className="text-[11px] text-[#6B7280]">
                        {order.productName || "Product"}
                        {order.variety ? ` · ${order.variety}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] sm:grid-cols-3">
                    <p><span className="text-[#6B7280]">Qty: </span><span className="font-semibold">{order.orderedQuantity} {order.unit}</span></p>
                    <p className="col-span-2 sm:col-span-1"><span className="text-[#6B7280]">Grades: </span><span className="font-semibold">{gradeLine(order)}</span></p>
                    <p><span className="text-[#6B7280]">Value: </span><span className="font-semibold">{formatMoney(order.orderValue)}</span></p>
                    <p><span className="text-[#6B7280]">Required: </span>{formatOrderDate(order.requiredDate)}</p>
                    <p><span className="text-[#6B7280]">Pickup: </span>{formatOrderDate(order.pickupDate)}{order.pickupTime ? ` ${order.pickupTime}` : ""}</p>
                    <p><span className="text-[#6B7280]">Centre: </span>{order.collectionCentre || "—"}</p>
                  </div>
                  {rejectionText(order) ? (
                    <p className="text-[11px] font-semibold text-[#DC2626]">{rejectionText(order)}</p>
                  ) : null}
                  <p className="text-[11px] text-[#6B7280]">
                    {order.customerDeliveryArea || order.customerName || "—"}
                  </p>
                  {filter === "ready" ? (
                    <div className="space-y-1 text-[11px] text-[#6B7280]">
                      <p>Quantity {order.orderedQuantity} {order.unit} · Packages {order.pickup?.packageCount || order.packingDetails?.packageCount || 0}</p>
                      <p>Pickup Status: {String(order.pickup?.status || order.status).replace(/_/g, " ")}</p>
                      <p>Assigned Driver: {order.pickup?.driverName || "Not assigned"}</p>
                      <p>Driver Name: {order.pickup?.driverName || "—"} · Vehicle {order.pickup?.vehicleNumber || "—"}</p>
                      <p>Pickup {formatOrderDate(order.pickup?.pickupDate || order.pickupDate)} {order.pickup?.pickupTime || ""}</p>
                    </div>
                  ) : null}
                  <p className="text-[11px] text-[#6B7280]">
                    {order.customerName} • {order.customerDeliveryArea || "—"}
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    Required {formatOrderDate(order.requiredDate)} • Pickup {formatOrderDate(order.pickupDate)}
                  </p>
                  <OrderActions
                    order={order}
                    onAccept={() => setAcceptId(id)}
                    onReject={() => setRejectOrder(order)}
                  />
                </section>
              );
            })}
          </div>

          <div className={`${EXCEL_WRAP} hidden md:block`}>
            <table className={EXCEL_TABLE}>
              <thead>
                <tr>
                  {["Order ID", "Product", "Variety", "Grade", "Qty", "Value", "Customer", "Area", "Required", "Pickup", "Status", "Actions"].map((h) => (
                    <th key={h} className={EXCEL_HEAD}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const id = order.orderId || order.id;
                  return (
                    <tr key={`row-${id}`}>
                      <td className={`${EXCEL_CELL} font-semibold`}>{id}</td>
                      <td className={EXCEL_CELL}>{order.productName}</td>
                      <td className={EXCEL_CELL}>{order.variety || "—"}</td>
                      <td className={EXCEL_CELL}>{order.grade || "—"}</td>
                      <td className={EXCEL_CELL}>
                        {order.orderedQuantity} {order.unit}
                      </td>
                      <td className={EXCEL_CELL}>{formatMoney(order.orderValue)}</td>
                      <td className={EXCEL_CELL}>{order.customerName}</td>
                      <td className={EXCEL_CELL}>{order.customerDeliveryArea || "—"}</td>
                      <td className={EXCEL_CELL}>{formatOrderDate(order.requiredDate)}</td>
                      <td className={EXCEL_CELL}>{formatOrderDate(order.pickupDate)}</td>
                      <td className={EXCEL_CELL}>
                        <div className="flex flex-col gap-0.5">
                          <StatusBadge status={order.status} />
                          {rejectionText(order) ? (
                            <span className="text-[10px] text-[#DC2626]">{rejectionText(order)}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className={EXCEL_CELL}>
                        <OrderActions
                          compact
                          order={order}
                          onAccept={() => setAcceptId(id)}
                          onReject={() => setRejectOrder(order)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(acceptId)}
        title="Accept order?"
        message={`Confirm acceptance of this ${acceptTarget?.productName || "product"} order?`}
        confirmLabel="Confirm Accept"
        loading={busy}
        onClose={() => setAcceptId("")}
        onConfirm={async () => {
          setBusy(true);
          try {
            await acceptMyOrder(acceptId);
            toast.success(
              `तुम्ही ${acceptTarget?.orderedQuantity || ""} ${acceptTarget?.unit || "Kg"} ${acceptTarget?.productName || "product"} चा order स्वीकारला आहात`
            );
            setAcceptId("");
            await load();
          } catch (err) {
            toast.error(err.message || "Insufficient available stock.");
          } finally {
            setBusy(false);
          }
        }}
      />

      <RejectOrderModal
        open={Boolean(rejectOrder)}
        loading={busy}
        onClose={() => setRejectOrder(null)}
        onConfirm={async (payload) => {
          setBusy(true);
          try {
            await rejectMyOrder(rejectOrder.orderId || rejectOrder.id, payload);
            toast.success("Order rejected");
            setRejectOrder(null);
            await load();
          } catch (err) {
            toast.error(err.message || "Failed to reject order");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

function OrderActions({ order, onAccept, onReject, compact }) {
  const id = order.orderId || order.id;
  const cls = compact ? `${EXCEL_BTN} px-1 py-0.5 text-[10px]` : EXCEL_BTN;
  return (
    <div className="flex flex-wrap gap-1 pt-1">
      <Link to={`/farmer/orders/${id}`} className={cls}>
        View Order
      </Link>
      {canAccept(order.status) ? (
        <button type="button" className={compact ? `${EXCEL_BTN_PRIMARY} px-1 py-0.5 text-[10px]` : EXCEL_BTN_PRIMARY} onClick={onAccept}>
          Accept Order
        </button>
      ) : null}
      {canReject(order.status) ? (
        <button type="button" className={compact ? `${EXCEL_BTN_DANGER} px-1 py-0.5 text-[10px]` : EXCEL_BTN_DANGER} onClick={onReject}>
          Reject Order
        </button>
      ) : null}
      {order.status === "PREPARING" || order.status === "ACCEPTED" || order.status === "PACKING" ? (
        <Link to={`/farmer/orders/${id}/prepare`} className={cls}>
          Prepare
        </Link>
      ) : null}
      {["READY_FOR_PICKUP", "PICKUP_SCHEDULED", "DRIVER_ASSIGNED", "DISPATCHED", "DRIVER_ARRIVED", "ORDER_VERIFIED", "QR_VERIFIED"].includes(order.status) ? (
        <Link to={`/farmer/orders/${id}`} className={compact ? `${EXCEL_BTN_PRIMARY} px-1 py-0.5 text-[10px]` : EXCEL_BTN_PRIMARY}>
          View Pickup Details
        </Link>
      ) : null}
    </div>
  );
}

export default OrdersPage;
