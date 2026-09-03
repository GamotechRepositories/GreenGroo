import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { acceptMyOrder, getMyOrder, rejectMyOrder } from "../api/farmerApi";
import PickupTimeline from "../components/pickup/PickupTimeline";
import { usePolling } from "../hooks/usePolling";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import RejectOrderModal from "../components/orders/RejectOrderModal";
import OrderQrCode from "../components/orders/OrderQrCode";
import { canAccept, canPrepare, canReject, formatMoney, formatOrderDate, rejectionText } from "../utils/orderDisplay";
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_PRIMARY,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../utils/excelStyles";

function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  usePolling(() => {
    getMyOrder(id)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id], 5000);

  if (loading) return <LoadingState rows={8} />;
  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order may not belong to your farm."
        action={
          <Link to="/farmer/orders/new" className={EXCEL_BTN_PRIMARY}>
            Back to New Orders
          </Link>
        }
      />
    );
  }

  const stock = order.productStock;
  const sellable = order.availableStock ?? stock?.sellableQuantity ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Order {order.orderId || order.id}</h1>
          <p className={EXCEL_PAGE_SUB}>
            {order.productName} • {order.variety || "—"} • {order.grade || "—"}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Order Details</h2>
        <div className="grid gap-3 p-3 text-xs sm:grid-cols-2">
          <Info label="Order ID" value={order.orderId || order.id} />
          <Info label="Product" value={order.productName} />
          <Info label="Variety" value={order.variety} />
          <Info label="Grade" value={order.grade} />
          <Info label="Quantity" value={`${order.orderedQuantity} ${order.unit}`} />
          <Info label="Price" value={formatMoney(order.price)} />
          <Info label="Order Value" value={formatMoney(order.orderValue)} />
          <Info label="Customer" value={order.customerName} />
          <Info label="Customer Delivery Area" value={order.customerDeliveryArea} />
          <Info label="Required Date" value={formatOrderDate(order.requiredDate)} />
          <Info label="Pickup Date" value={formatOrderDate(order.pickupDate)} />
          <Info label="Collection Centre" value={order.collectionCentre} />
          <Info label="Order Status" value={order.status} />
          {rejectionText(order) ? <Info label="Rejection Reason" value={rejectionText(order)} /> : null}
        </div>
      </section>

      {order.pickup ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Pickup Details</h2>
          <div className="grid gap-3 p-3 text-xs sm:grid-cols-2">
            <Info label="Order ID" value={order.orderId || order.id} />
            <Info label="Product" value={order.productName} />
            <Info label="Variety" value={order.variety} />
            <Info label="Grade" value={order.grade} />
            <Info label="Ordered Quantity" value={`${order.orderedQuantity} ${order.unit}`} />
            <Info label="Packed Quantity" value={`${order.pickup.packedQuantity || order.packedQuantity || 0} ${order.unit}`} />
            <Info label="Number of Packages" value={order.pickup.packageCount || order.packingDetails?.packageCount || 0} />
            <Info label="Pickup Date" value={formatOrderDate(order.pickup.pickupDate || order.pickupDate)} />
            <Info label="Pickup Time" value={order.pickup.pickupTime || "—"} />
            <Info label="Pickup Location" value={order.pickup.pickupLocation} />
            <Info label="Collection Centre" value={order.collectionCentre} />
            <Info label="Pickup Status" value={order.pickup.liveStatus || order.pickup.status} />
            <Info label="Assigned Driver" value={order.pickup.driverName || "Not assigned"} />
            <Info label="Driver Name" value={order.pickup.driverName} />
            <Info label="Vehicle Number" value={order.pickup.vehicleNumber} />
            <Info label="Pickup Date/Time" value={`${formatOrderDate(order.pickup.pickupDate || order.pickupDate)} ${order.pickup.pickupTime || ""}`.trim()} />
          </div>
          <div className="px-3 pb-3">
            <PickupTimeline status={order.pickup.status || order.status} />
          </div>
        </section>
      ) : null}

      {order.pickup ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Driver Details</h2>
          <div className="grid gap-3 p-3 text-xs sm:grid-cols-2">
            <Info label="Assigned Driver" value={order.pickup.driverName || "Not assigned"} />
            <Info label="Driver Name" value={order.pickup.driverName} />
            <Info label="Driver Mobile" value={order.pickup.driverMobile} />
            <Info label="Vehicle Number" value={order.pickup.vehicleNumber} />
            <Info label="Driver Status" value={order.pickup.liveStatus || order.pickup.driverStatus || order.pickup.status} />
          </div>
          <p className="px-3 pb-3 text-[11px] text-[#6B7280]">You can view driver and pickup status. You cannot assign a driver or confirm pickup.</p>
          {(order.pickup.confirmationPhotos || []).length ? (
            <div className="grid grid-cols-4 gap-2 px-3 pb-3">
              {order.pickup.confirmationPhotos.map((src, i) => (
                <img key={i} src={src} alt={`Pickup photo ${i + 1}`} className="h-16 w-full object-cover" />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Available Stock</h2>
        <div className="grid gap-3 p-3 text-xs sm:grid-cols-3">
          <Info label="Physical Stock" value={`${stock?.availableQuantity ?? "—"} ${order.unit}`} />
          <Info label="Reserved" value={`${stock?.reservedQuantity ?? order.reservedQuantity ?? 0} ${order.unit}`} />
          <Info label="Available to Sell" value={`${sellable} ${order.unit}`} />
        </div>
        {canAccept(order.status) && sellable < Number(order.orderedQuantity) ? (
          <p className="px-3 pb-3 text-xs font-semibold text-[#DC2626]">Insufficient available stock for this order.</p>
        ) : null}
      </section>

      {order.pickup?.qrPayload || order.qrPayload ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Farmer QR</h2>
          <div className="p-3">
            <p className="mb-2 text-[11px] text-[#6B7280]">Show this QR to the driver at pickup. It identifies this farmer, order, and pickup without storing personal data in the code.</p>
            <OrderQrCode value={order.pickup?.qrPayload || order.qrPayload} />
          </div>
        </section>
      ) : null}

      {order.status === "REJECTED" ? (
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Rejection</h2>
          <div className="grid gap-3 p-3 text-xs sm:grid-cols-2">
            <Info label="Reason" value={order.rejectionReason} />
            <Info label="Note" value={order.rejectionNote} />
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canAccept(order.status) ? (
          <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => setAcceptOpen(true)}>
            Accept Order
          </button>
        ) : null}
        {canReject(order.status) ? (
          <button type="button" className={EXCEL_BTN_DANGER} onClick={() => setRejectOpen(true)}>
            Reject Order
          </button>
        ) : null}
        {canPrepare(order.status) ? (
          <Link to={`/farmer/orders/${id}/prepare`} className={EXCEL_BTN_PRIMARY}>
            Order Preparation
          </Link>
        ) : null}
        <Link to="/farmer/orders/new" className={EXCEL_BTN}>
          Back
        </Link>
      </div>

      <ConfirmDialog
        open={acceptOpen}
        title="Accept order?"
        message={`Confirm acceptance of this ${order.productName || "product"} order?`}
        confirmLabel="Confirm Accept"
        loading={busy}
        onClose={() => setAcceptOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            setOrder(await acceptMyOrder(id));
            toast.success("Order accepted. Stock reserved.");
            setAcceptOpen(false);
            navigate(`/farmer/orders/${id}/prepare`);
          } catch (err) {
            toast.error(err.message || "Insufficient available stock.");
          } finally {
            setBusy(false);
          }
        }}
      />

      <RejectOrderModal
        open={rejectOpen}
        loading={busy}
        onClose={() => setRejectOpen(false)}
        onConfirm={async (payload) => {
          setBusy(true);
          try {
            setOrder(await rejectMyOrder(id, payload));
            toast.success("Order rejected");
            setRejectOpen(false);
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

function Info({ label, value }) {
  return (
    <div>
      <p className="font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-0.5 font-semibold text-[#1F2937]">{value || "—"}</p>
    </div>
  );
}

export default OrderDetailPage;
