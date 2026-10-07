import { useMemo, useState } from "react";
import { PageShell } from "../../components/layout/ProductManagerLayout";
import { staffApi } from "../../api/staffApi";
import { usePreOrders } from "../../hooks/usePreOrders";

const TABS = [
  { id: "awaiting_vendor", label: "Awaiting vendor" },
  { id: "pending", label: "To prepare" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready to forward" },
  { id: "forwarded", label: "Forwarded" },
  { id: "all", label: "All" },
];

const stageStyles = {
  awaiting_vendor: "bg-orange-50 text-orange-700 ring-orange-200",
  pending: "bg-slate-50 text-slate-700 ring-slate-200",
  preparing: "bg-amber-50 text-amber-700 ring-amber-200",
  ready: "bg-sky-50 text-sky-700 ring-sky-200",
  forwarded: "bg-green-50 text-green-700 ring-green-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

const stageLabels = {
  awaiting_vendor: "Awaiting vendor",
  pending: "To prepare",
  preparing: "Preparing",
  ready: "Ready",
  forwarded: "Forwarded",
  cancelled: "Cancelled",
};

const btnPrimary =
  "rounded-lg bg-green-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-green-active disabled:opacity-50";
const btnSecondary =
  "rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50";
const btnDanger =
  "rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50";

const awaitingVendor = (order) => order.status === "preorder_hold" && order.vendorStatus !== "confirmed";

function stageOf(order) {
  if (order.status === "cancelled" && order.preOrderStage !== "forwarded") return "cancelled";
  if (awaitingVendor(order)) return "awaiting_vendor";
  return order.preOrderStage || "pending";
}

function matchesTab(order, tab) {
  if (tab === "all") return true;
  if (tab === "forwarded") return order.preOrderStage === "forwarded";
  if (tab === "awaiting_vendor") return awaitingVendor(order);
  return order.status === "preorder_hold" && !awaitingVendor(order) && (order.preOrderStage || "pending") === tab;
}

function deliveryStatusText(order) {
  switch (order.status) {
    case "packed":
      return order.storeReceivedAt ? "Received at dark store · awaiting rider" : "On the way to dark store";
    case "offered":
      return `Offer sent to ${order.offeredRider?.name || "rider"}`;
    case "assigned":
      return `Rider ${order.assignedRider?.name || ""} assigned`.trim();
    case "pickup_verified":
      return "Picked up from store";
    case "out_for_delivery":
      return "Out for delivery";
    case "delivered":
      return "Delivered";
    case "delivery_failed":
      return "Delivery failed";
    case "cancelled":
      return "Cancelled";
    default:
      return "";
  }
}

function formatDay(dateStr, today, tomorrow) {
  if (!dateStr) return "—";
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
}

function formatWhen(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PreOrdersPage() {
  const [date, setDate] = useState("");
  const [storeId, setStoreId] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState("");
  const [toast, setToast] = useState({ text: "", tone: "success" });
  const [showPrepList, setShowPrepList] = useState(true);

  const params = useMemo(
    () => ({ ...(date ? { date } : {}), ...(storeId ? { storeId } : {}) }),
    [date, storeId]
  );
  const { orders, stores, summary, today, tomorrow, loading, error, reload } = usePreOrders(params);

  const notify = (text, tone = "success") => {
    setToast({ text, tone });
    setTimeout(() => setToast({ text: "", tone: "success" }), 4500);
  };

  const counts = useMemo(() => {
    const c = {};
    for (const tab of TABS) c[tab.id] = orders.filter((o) => matchesTab(o, tab.id)).length;
    return c;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (!matchesTab(o, activeTab)) return false;
      if (!q) return true;
      return (
        (o.orderNumber || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerPhone || "").includes(q) ||
        (o.store?.storeName || "").toLowerCase().includes(q) ||
        (o.items || []).some((i) => (i.name || "").toLowerCase().includes(q))
      );
    });
  }, [orders, activeTab, search]);

  /** Everything still to be prepared (not forwarded, not cancelled), totalled per product. */
  const prepList = useMemo(() => {
    const map = new Map();
    for (const order of orders) {
      if (order.status !== "preorder_hold" || awaitingVendor(order)) continue;
      for (const item of order.items || []) {
        const key = `${item.sku || item.name}__${item.unit || "pcs"}`;
        const row = map.get(key) || {
          key,
          name: item.name,
          sku: item.sku,
          unit: item.unit || "pcs",
          quantity: 0,
          orders: new Set(),
        };
        row.quantity += Number(item.quantity) || 0;
        row.orders.add(order.id);
        map.set(key, row);
      }
    }
    return [...map.values()].sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const forwardable = (o) => o.status === "preorder_hold" && !awaitingVendor(o);
  const forwardableVisibleIds = visibleOrders.filter(forwardable).map((o) => o.id);
  const selectedReady = selected.filter((id) => orders.some((o) => o.id === id && forwardable(o)));

  const toggleSelected = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const runAction = async (key, fn) => {
    setBusyId(key);
    try {
      const res = await fn();
      notify(res.data?.message || "Done");
      await reload();
      return res;
    } catch (err) {
      notify(err.response?.data?.message || "Action failed", "error");
      return null;
    } finally {
      setBusyId("");
    }
  };

  const setStage = (order, stage) =>
    runAction(`${order.id}-${stage}`, () => staffApi.updatePreOrderStage(order.id, stage));

  const forward = async (ids) => {
    if (!ids.length) return;
    const res = await runAction(`forward-${ids.join(",")}`, async () => {
      if (ids.length <= 200) return staffApi.forwardPreOrders(ids, note);
      const merged = { forwarded: [], failed: [] };
      for (let i = 0; i < ids.length; i += 200) {
        const part = await staffApi.forwardPreOrders(ids.slice(i, i + 200), note);
        merged.forwarded.push(...(part.data?.forwarded || []));
        merged.failed.push(...(part.data?.failed || []));
      }
      merged.message = `${merged.forwarded.length} pre-orders forwarded to Delivery Manager${
        merged.failed.length ? ` · ${merged.failed.length} skipped` : ""
      }`;
      return { data: merged };
    });
    if (res) {
      setSelected((prev) => prev.filter((id) => !ids.includes(id)));
      setNote("");
      const failed = res.data?.failed || [];
      if (failed.length) {
        notify(
          `${res.data.message}. Skipped: ${failed.map((f) => `#${f.orderNumber || f.id} (${f.message})`).join(", ")}`,
          "error"
        );
      }
    }
  };

  const cancel = async (order) => {
    const reason = window.prompt(`Why are you cancelling pre-order #${order.orderNumber}? The customer will be notified.`);
    if (!reason || !reason.trim()) return;
    await runAction(`${order.id}-cancel`, () => staffApi.cancelPreOrder(order.id, reason.trim()));
  };

  const statCards = [
    {
      id: "awaiting_vendor",
      label: "Awaiting vendor",
      value: summary.awaitingVendor,
      hint: "Vendor must confirm first",
    },
    { id: "pending", label: "To prepare", value: summary.pending, hint: "Confirmed by vendor", highlight: summary.pending > 0 },
    { id: "preparing", label: "Preparing", value: summary.preparing, hint: "Work in progress" },
    { id: "ready", label: "Ready to forward", value: summary.ready, hint: "Send to Delivery Manager", highlight: summary.ready > 0 },
    {
      id: "forwarded",
      label: "Forwarded",
      value:
        summary.awaitingReceipt + summary.readyToAssign + summary.offered + summary.onTheWay + summary.delivered,
      hint: `${summary.awaitingReceipt} on the way to store · ${summary.readyToAssign + summary.offered} awaiting rider · ${summary.delivered} delivered`,
    },
  ];

  return (
    <PageShell
      title="Pre-Orders"
      subtitle="Prepare vendor-confirmed next-day slot orders and forward them to the dark store's Delivery Manager when ready."
    >
      {toast.text ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            toast.tone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {toast.text}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setActiveTab(card.id)}
            className={`rounded-xl border p-5 text-left shadow-sm transition ${
              card.highlight ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-white"
            } ${activeTab === card.id ? "ring-2 ring-green-primary" : "hover:shadow"}`}
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="mt-1 text-xs text-gray-400">{card.hint}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Delivery day</label>
          <select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">All upcoming & open</option>
            {today ? <option value={today}>Today ({today})</option> : null}
            {tomorrow ? <option value={tomorrow}>Tomorrow ({tomorrow})</option> : null}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Pick date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Dark store</label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">All stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.storeName} · {s.area}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-700">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order #, customer, product, store…"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <button type="button" onClick={reload} className={btnSecondary}>
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Prep list</h2>
            <p className="text-sm text-gray-500">
              Total quantity to prepare across {summary.pending + summary.preparing + summary.ready} open pre-order
              {summary.pending + summary.preparing + summary.ready === 1 ? "" : "s"} for the selected day / store.
            </p>
          </div>
          <button type="button" onClick={() => setShowPrepList((v) => !v)} className={btnSecondary}>
            {showPrepList ? "Hide" : "Show"}
          </button>
        </div>
        {showPrepList ? (
          prepList.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 font-medium">SKU</th>
                    <th className="px-5 py-3 font-medium">Total qty</th>
                    <th className="px-5 py-3 font-medium">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prepList.map((row) => (
                    <tr key={row.key} className="hover:bg-gray-50/80">
                      <td className="px-5 py-3 font-medium text-gray-900">{row.name}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{row.sku}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900">
                        {row.quantity} {row.unit}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{row.orders.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-6 text-sm text-gray-500">Nothing left to prepare.</p>
          )
        ) : null}
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 pt-4">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-t-lg px-4 py-2.5 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-b-2 border-green-primary bg-green-light/40 text-green-primary"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 ring-1 ring-gray-200">
                  {counts[tab.id] || 0}
                </span>
              </button>
            ))}
          </div>
          {forwardableVisibleIds.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelected((prev) => [...new Set([...prev, ...forwardableVisibleIds])])}
                className={btnSecondary}
              >
                Select all ({forwardableVisibleIds.length})
              </button>
              <button
                type="button"
                disabled={busyId.startsWith("forward-")}
                onClick={() => forward(forwardableVisibleIds)}
                className={btnPrimary}
              >
                {busyId.startsWith("forward-")
                  ? "Forwarding…"
                  : `Confirm & forward all ${forwardableVisibleIds.length}`}
              </button>
            </div>
          ) : null}
        </div>

        {selectedReady.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-green-light/40 px-5 py-3">
            <p className="text-sm font-medium text-green-primary">
              {selectedReady.length} selected
            </p>
            <input
              type="text"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for Delivery Manager (e.g. keep chilled, fragile)"
              className="min-w-[260px] flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              disabled={busyId.startsWith("forward-")}
              onClick={() => forward(selectedReady)}
              className={btnPrimary}
            >
              {busyId.startsWith("forward-") ? "Forwarding…" : `Forward ${selectedReady.length} to Delivery Manager`}
            </button>
            <button type="button" onClick={() => setSelected([])} className={btnSecondary}>
              Clear
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-10 px-5 py-3 font-medium" />
                <th className="px-5 py-3 font-medium">Order / Slot</th>
                <th className="px-5 py-3 font-medium">Customer & Store</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    Loading pre-orders…
                  </td>
                </tr>
              ) : visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No pre-orders in this view.
                  </td>
                </tr>
              ) : (
                visibleOrders.map((order) => {
                  const stage = stageOf(order);
                  const onHold = order.status === "preorder_hold";
                  const isReady = onHold && order.preOrderStage === "ready";
                  const canForward = forwardable(order);
                  return (
                    <tr key={order.id} className="align-top hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        {onHold ? (
                          <input
                            type="checkbox"
                            checked={selected.includes(order.id)}
                            disabled={!canForward}
                            title={canForward ? "Select to forward" : "Waiting for vendor confirmation"}
                            onChange={() => toggleSelected(order.id)}
                            className="h-4 w-4 accent-green-600"
                          />
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                        <p className="text-xs font-semibold text-green-primary">
                          {formatDay(order.preOrderDate, today, tomorrow)} · {order.preOrderSlot || "—"}
                        </p>
                        <p className="text-xs text-gray-400">Placed {formatWhen(order.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.customerPhone}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {order.store ? `${order.store.storeName} · ${order.store.area}` : "Unknown store"}
                        </p>
                      </td>
                      <td className="max-w-xs px-5 py-4">
                        <ul className="space-y-0.5 text-xs text-gray-700">
                          {(order.items || []).map((item) => (
                            <li key={item.id}>
                              <span className="font-semibold">{item.quantity} {item.unit}</span> · {item.name}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                            stageStyles[stage] || stageStyles.pending
                          }`}
                        >
                          {stageLabels[stage] || stage}
                        </span>
                        {order.preOrderStage === "forwarded" ? (
                          <>
                            <p className="mt-1 text-xs font-medium text-gray-700">{deliveryStatusText(order)}</p>
                            <p className="text-xs text-gray-400">
                              {formatWhen(order.forwardedAt)}
                              {order.forwardedByName ? ` · ${order.forwardedByName}` : ""}
                            </p>
                          </>
                        ) : null}
                        {order.vendorConfirmedAt ? (
                          <p className="mt-1 text-xs text-gray-400">
                            Vendor confirmed {formatWhen(order.vendorConfirmedAt)}
                            {order.vendorActionByName ? ` · ${order.vendorActionByName}` : ""}
                          </p>
                        ) : null}
                        {order.preOrderNote ? (
                          <p className="mt-1 max-w-[200px] text-xs italic text-gray-500">“{order.preOrderNote}”</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        {onHold && awaitingVendor(order) ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs text-orange-700">Waiting for the vendor to confirm</p>
                            <button
                              type="button"
                              disabled={busyId === `${order.id}-cancel`}
                              onClick={() => cancel(order)}
                              className={btnDanger}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : onHold ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busyId.startsWith("forward-")}
                              onClick={() => forward([order.id])}
                              title="Prepare and send to the dark store's Delivery Manager in one step"
                              className={btnPrimary}
                            >
                              Confirm & forward
                            </button>
                            {order.preOrderStage === "pending" ? (
                              <button
                                type="button"
                                disabled={busyId === `${order.id}-preparing`}
                                onClick={() => setStage(order, "preparing")}
                                className={btnSecondary}
                              >
                                Start preparing
                              </button>
                            ) : null}
                            {order.preOrderStage === "preparing" ? (
                              <button
                                type="button"
                                disabled={busyId === `${order.id}-ready`}
                                onClick={() => setStage(order, "ready")}
                                className={btnSecondary}
                              >
                                Mark ready
                              </button>
                            ) : null}
                            {isReady ? (
                              <button
                                type="button"
                                disabled={busyId === `${order.id}-preparing`}
                                onClick={() => setStage(order, "preparing")}
                                className={btnSecondary}
                              >
                                Reopen
                              </button>
                            ) : null}
                            <button
                              type="button"
                              disabled={busyId === `${order.id}-cancel`}
                              onClick={() => cancel(order)}
                              className={btnDanger}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">
                            {order.preOrderStage === "forwarded" ? "Handled by Delivery Manager" : "—"}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
