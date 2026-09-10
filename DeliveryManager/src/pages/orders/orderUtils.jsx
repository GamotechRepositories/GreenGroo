
export const STATUS_LABELS = {
  order_received: { text: "NEW ORDER", className: "text-blue-700" },
  incoming: { text: "NEW ORDER", className: "text-blue-700" },
  packed: { text: "PACKED", className: "text-purple-700" },
  offered: { text: "SEARCHING DRIVER", className: "text-amber-700" },
  assigned: { text: "ASSIGNED", className: "text-teal-700" },
  out_for_delivery: { text: "OUT FOR DELIVERY", className: "text-emerald-700" },
  delivered: { text: "DELIVERED", className: "text-emerald-800" },
  cancelled: { text: "CANCELLED", className: "text-rose-700" },
  pickup_verified: { text: "PICKUP VERIFIED", className: "text-sky-700" },
  stock_issue: { text: "STOCK ISSUE", className: "text-rose-700" },
};

export function OrderStatusText({ status }) {
  const label = STATUS_LABELS[status] || {
    text: (status || "").toUpperCase().replace(/_/g, " "),
    className: "text-slate-600",
  };

  return (
    <span className={`text-xs font-bold ${label.className}`}>
      {label.text}
    </span>
  );
}

export function DriverAssignmentText({ order }) {
  if (order.assignedRider) {
    return (
      <div>
        <p className="text-[11px] font-bold text-teal-800">
          {order.assignedRider.name || order.assignedRider.phone}
        </p>
        {order.pickupProofStatus === "pending" ? (
          <p className="mt-1 text-[10px] font-semibold text-amber-700">Item proof pending approval</p>
        ) : order.pickupVerified ? (
          <p className="mt-1 text-[10px] font-semibold text-emerald-700">Pickup verified</p>
        ) : order.pickupQrScanned ? (
          <p className="mt-1 text-[10px] font-semibold text-violet-700">QR scanned — awaiting item photo</p>
        ) : null}
      </div>
    );
  }

  if (order.offeredRider) {
    return (
      <p className="text-[11px] font-bold text-amber-800">
        Offering {order.offeredRider.name || order.offeredRider.phone}
      </p>
    );
  }

  if (order.assignmentStatus === "WAITING_FOR_DRIVER") {
    return (
      <p className="text-[11px] font-semibold text-amber-700 italic">
        Waiting for nearby Delivery Partner…
      </p>
    );
  }

  return <p className="text-[11px] italic text-slate-500">Unassigned</p>;
}

/** @deprecated Use OrderStatusText */
export const STATUS_BADGE = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([key, value]) => [
    key,
    <span key={key} className={`text-xs font-bold ${value.className}`}>{value.text}</span>,
  ])
);

export const STATUS_TABS = [
  { id: "incoming", label: "Incoming" },
  { id: "ongoing", label: "Ongoing" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

export function matchesTab(order, tab) {
  const s = order.status;
  if (tab === "all") return true;
  // New / pack queue awaiting action
  if (tab === "incoming") {
    return ["incoming", "order_received", "stock_issue", "packed", "offered"].includes(s);
  }
  // Assigned / out for delivery
  if (tab === "ongoing") {
    return ["assigned", "pickup_verified", "out_for_delivery"].includes(s);
  }
  if (tab === "delivered") return s === "delivered";
  if (tab === "cancelled") return s === "cancelled";
  // legacy aliases
  if (tab === "active") {
    return ["incoming", "order_received", "stock_issue", "packed", "offered", "assigned", "out_for_delivery", "pickup_verified"].includes(s);
  }
  if (tab === "packed") return ["packed", "offered"].includes(s);
  if (tab === "out_for_delivery") return ["assigned", "pickup_verified", "out_for_delivery"].includes(s);
  return true;
}

export function countBySummaryBucket(orders = []) {
  return {
    incoming: orders.filter((o) => matchesTab(o, "incoming")).length,
    ongoing: orders.filter((o) => matchesTab(o, "ongoing")).length,
    delivered: orders.filter((o) => matchesTab(o, "delivered")).length,
    cancelled: orders.filter((o) => matchesTab(o, "cancelled")).length,
  };
}

export function formatOrderTime(value) {
  if (!value) return "Just now";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRupee(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatTripDuration(minutes) {
  if (minutes == null || Number.isNaN(Number(minutes))) return "—";
  const m = Math.max(0, Math.round(Number(minutes)));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

export function paymentMethodLabel(method) {
  const m = String(method || "").toUpperCase();
  if (m === "COD") return "COD (Physical cash)";
  if (m === "ONLINE") return "Online payment";
  if (m === "WALLET") return "Wallet";
  return method ? String(method) : "Not set";
}

export function isCodPayment(method) {
  return String(method || "").toUpperCase() === "COD";
}

export function getOrderItemsTotal(order) {
  if (order?.itemsTotal != null) return Number(order.itemsTotal) || 0;
  return (order?.items || []).reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 0),
    0
  );
}

export function getOrderDeliveryFee(order) {
  if (order?.deliveryFee != null) return Number(order.deliveryFee) || 0;
  const amount = Number(order?.amountToCollect) || 0;
  const itemsTotal = getOrderItemsTotal(order);
  return Math.max(0, Math.round(amount - itemsTotal));
}

export function isInitialOrderStatus(status) {
  return ["incoming", "order_received", "stock_issue"].includes(status);
}

export function allItemsAvailable(order) {
  return (order?.items || []).every(
    (item) => item.stockStatus === "available" || item.customerInformed
  );
}

export const actionBtnOutline =
  "rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap";

export const actionBtnPrimary =
  "rounded-xl border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition whitespace-nowrap";

export const actionBtnDanger =
  "rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition whitespace-nowrap";
