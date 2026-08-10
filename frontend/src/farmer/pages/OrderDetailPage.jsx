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
          <h1 className="text-2xl font-extrabold">Order {order.id}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="text-sm text-[#6B7280]">
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
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                action.danger
                  ? "border border-red-200 text-[#DC2626] hover:bg-red-50"
                  : "bg-[#2E7D32] text-white hover:bg-[#256628]"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="font-bold">Customer details</h2>
          <p className="mt-2 text-sm">{order.customer.name}</p>
          <p className="text-sm text-[#6B7280]">{order.customer.mobile}</p>
          <p className="text-sm text-[#6B7280]">{order.customer.email}</p>
          <h3 className="mt-4 font-bold">Delivery address</h3>
          <p className="mt-1 text-sm text-[#6B7280]">{order.address}</p>
          <p className="mt-2 text-sm">
            Delivery type: <strong>{order.deliveryType}</strong>
          </p>
        </section>

        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="font-bold">Ordered products</h2>
          <ul className="mt-3 space-y-2">
            {order.products.map((p) => (
              <li key={p.productId} className="flex justify-between text-sm">
                <span>
                  {p.name} × {p.quantity}
                </span>
                <span className="font-semibold">₹{p.price * p.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-[#E5E7EB] pt-3 text-right text-base font-extrabold">
            Total: ₹{order.amount}
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <h2 className="font-bold">Order timeline</h2>
        <ol className="mt-4 space-y-3">
          {order.timeline.map((item, idx) => (
            <li key={`${item.status}-${idx}`} className="flex gap-3 text-sm">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#2E7D32]" />
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
