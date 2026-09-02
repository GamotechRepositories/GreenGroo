
export const STATUS_LABELS = {
  order_received: { text: "NEW ORDER", className: "text-blue-700" },
  incoming: { text: "NEW ORDER", className: "text-blue-700" },
  packed: { text: "PACKED", className: "text-purple-700" },
  offered: { text: "SEARCHING DRIVER", className: "text-amber-700" },
  assigned: { text: "ASSIGNED", className: "text-teal-700" },
  out_for_delivery: { text: "OUT FOR DELIVERY", className: "text-emerald-700" },
  delivered: { text: "DELIVERED", className: "text-emerald-800" },
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
  { id: "active", label: "Active" },
  { id: "incoming", label: "New / Pack" },
  { id: "packed", label: "Packed" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "all", label: "All" },
];

export function matchesTab(order, tab) {
  const s = order.status;
  if (tab === "all") return true;
  if (tab === "active") {
    return ["incoming", "order_received", "stock_issue", "packed", "offered", "assigned", "out_for_delivery"].includes(s);
  }
  if (tab === "incoming") return ["incoming", "order_received", "stock_issue"].includes(s);
  if (tab === "packed") return ["packed", "offered"].includes(s);
  if (tab === "out_for_delivery") return ["assigned", "out_for_delivery"].includes(s);
  if (tab === "delivered") return s === "delivered";
  return true;
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
  "rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition whitespace-nowrap";
