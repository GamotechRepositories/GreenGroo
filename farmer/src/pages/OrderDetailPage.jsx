import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getOrderById, updateOrderStatus } from "../api/farmerApi";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const ACTIONS = [
  { label: "Accept Order", status: "Confirmed", from: ["New"] },
  { label: "Reject Order", status: "Cancelled", from: ["New"], danger: true },
  { label: "Mark Processing", status: "Processing", from: ["Confirmed"] },
  { label: "Mark Ready for Pickup", status: "Ready for Pickup", from: ["Processing"] },
  { label: "Cancel Order", status: "Cancelled", from: ["Confirmed", "Processing"], danger: true },
];

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
  const [pendingStatus, setPendingStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setOrder(await getOrderById(id));
    } catch (err) {
      toast.error(err.message || "Order not found");
      navigate("/farmer/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <LoadingState />;
  if (!order) return null;

  const availableActions = ACTIONS.filter((a) => a.from.includes(order.status));

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Order {order.id}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="text-xs text-[#6B7280]">
              {new Date(order.orderDate).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => setPendingStatus(action)}
              className={action.danger ? EXCEL_BTN_DANGER : EXCEL_BTN_PRIMARY}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Customer details</h2>
          <div className="space-y-1 p-3 text-xs">
          <p>{order.customer.name}</p>
          <p className="text-[#6B7280]">{order.customer.mobile}</p>
          <p className="text-[#6B7280]">{order.customer.email}</p>
          <h3 className="pt-2 font-bold">Delivery address</h3>
          <p className="text-[#6B7280]">{order.address}</p>
          <p className="pt-1">
            Delivery type: <strong>{order.deliveryType}</strong>
          </p>
          </div>
        </section>

        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Ordered products</h2>
          <ul className="divide-y divide-[#D4D4D4] p-0">
            {order.products.map((p) => (
              <li key={p.productId} className="flex justify-between border border-[#D4D4D4] px-2 py-1.5 text-xs">
                <span>
                  {p.name} × {p.quantity}
                </span>
                <span className="font-semibold">₹{p.price * p.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-[#D4D4D4] p-2 text-right text-xs font-bold">
            Total: ₹{order.amount}
          </p>
        </section>
      </div>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Order timeline</h2>
        <ol className="space-y-0 p-0">
          {order.timeline.map((item, idx) => (
            <li key={`${item.status}-${idx}`} className="flex gap-2 border-b border-[#D4D4D4] px-2 py-1.5 text-xs">
              <span className="mt-0.5 h-2 w-2 shrink-0 bg-[#217346]" />
              <div>
                <p className="font-semibold">
                  {item.status}{" "}
                  <span className="font-normal text-[#6B7280]">
                    · {new Date(item.at).toLocaleString("en-IN")}
                  </span>
                </p>
                <p className="text-[#6B7280]">{item.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={pendingStatus?.label || "Update status"}
        message={
          pendingStatus?.status === "Ready for Pickup"
            ? "This will notify the delivery/operations system that the order is ready."
            : `Change order status to "${pendingStatus?.status}"?`
        }
        confirmLabel="Confirm"
        danger={pendingStatus?.danger}
        loading={busy}
        onClose={() => setPendingStatus(null)}
        onConfirm={async () => {
          setBusy(true);
          try {
            const updated = await updateOrderStatus(order.id, pendingStatus.status);
            setOrder(updated);
            toast.success(
              pendingStatus.status === "Ready for Pickup"
                ? "Marked ready — delivery notified"
                : "Order updated"
            );
            setPendingStatus(null);
          } catch (err) {
            toast.error(err.message || "Update failed");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

export default OrderDetailPage;
