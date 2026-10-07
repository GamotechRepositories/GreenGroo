import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { managerApi } from "../../api/managerApi";
import { subscribeToSocketEvent } from "../../services/socket";
import { useRiderLiveLocations } from "../../hooks/useRiderLiveLocations";

const DeliveryTrackingMap = lazy(() => import("./DeliveryTrackingMap"));
import {
  DeliveryDelayNotice,
  OrderStatusText,
  formatDelay,
  formatRupee,
  formatTripDuration,
  paymentMethodLabel,
} from "../../pages/orders/orderUtils";

const clock = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "—";

const dateClock = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const VEHICLE_LABELS = {
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  electric: "Electric scooter",
  van: "Van",
  no_vehicle: "On foot",
};

function DelayBadge({ minutes, live }) {
  if (minutes == null) return null;
  if (minutes > 0) {
    return (
      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-extrabold text-rose-700">
        {live ? "Running" : "Was"} {formatDelay(minutes)} late
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
      {minutes < 0 ? `${formatDelay(-minutes)} early` : "On time"}
    </span>
  );
}

function Section({ title, children, right }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{title}</h4>
        {right}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

/**
 * Side panel with everything about one delivery: live map + ETA + delay while the
 * rider is on the way, and the saved timings once the order is completed.
 */
export default function OrderTrackingDrawer({ orderId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await managerApi.orderTracking(orderId);
      setData(res.data.tracking);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load tracking");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    setLoading(true);
    setData(null);
    load();
  }, [load]);

  const isLive = data?.phase === "to_customer" || data?.phase === "to_store";

  useEffect(() => {
    if (!isLive) return undefined;
    const timer = setInterval(load, Math.max(20, data?.refreshSeconds || 45) * 1000);
    return () => clearInterval(timer);
  }, [isLive, load, data?.refreshSeconds]);

  useEffect(() => {
    const matches = (p = {}) => String(p.orderId || p._id || "") === String(orderId);
    const unsubs = [
      subscribeToSocketEvent("order_status_updated", (p) => matches(p) && load()),
      subscribeToSocketEvent("order_delay_reported", (p) => matches(p) && load()),
      subscribeToSocketEvent("pickup_verified", () => load()),
    ];
    return () => unsubs.forEach((u) => u());
  }, [load, orderId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const riderId = data?.rider?.id || "";
  const liveLocations = useRiderLiveLocations(riderId ? [riderId] : [], isLive);
  const liveRider = riderId ? liveLocations[riderId] : null;
  const riderPoint = useMemo(() => {
    if (!isLive) return null;
    if (liveRider) return { lat: liveRider.lat, lng: liveRider.lng, updatedAt: liveRider.updatedAt };
    return data?.lastLocation || null;
  }, [isLive, liveRider, data?.lastLocation]);

  const order = data?.order;
  const eta = data?.eta;
  const delay = data?.delay;
  const stats = data?.stats;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-slate-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Delivery tracking</p>
            <h3 className="text-lg font-black text-slate-900">
              {order ? `Order #${order.orderNumber}` : "Loading…"}
            </h3>
            {order ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <OrderStatusText status={order.status} order={order} />
                <span className="text-[11px] text-slate-500">
                  Placed {dateClock(order.createdAt)} · {paymentMethodLabel(order.paymentMethod)} ·{" "}
                  {formatRupee(order.orderTotal)}
                </span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loading && !data ? <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" /> : null}
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          {data ? (
            <>
              <div
                className={`rounded-2xl p-4 ${
                  data.phase === "done"
                    ? order.status === "delivered"
                      ? "bg-emerald-600 text-white"
                      : "bg-rose-600 text-white"
                    : "bg-slate-900 text-white"
                }`}
              >
                {data.phase === "to_customer" ? (
                  <>
                    <p className="text-xs font-semibold opacity-80">Rider is on the way to the customer</p>
                    <p className="mt-1 text-2xl font-black">
                      {eta ? `Arriving in ${eta.text}` : "Calculating ETA…"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      {eta ? <span>ETA {clock(eta.arrivalAt)}</span> : null}
                      {eta?.distanceMeters ? <span>· {(eta.distanceMeters / 1000).toFixed(1)} km left</span> : null}
                      {delay?.expectedAt ? <span>· promised by {clock(delay.expectedAt)}</span> : null}
                      <DelayBadge minutes={delay?.minutes} live />
                    </div>
                  </>
                ) : data.phase === "to_store" ? (
                  <>
                    <p className="text-xs font-semibold opacity-80">Rider assigned · heading to the store for pickup</p>
                    <p className="mt-1 text-2xl font-black">
                      {eta ? `Reaching store in ${eta.text}` : "Waiting for rider GPS…"}
                    </p>
                    {eta ? <p className="mt-1 text-xs font-semibold">At store around {clock(eta.arrivalAt)}</p> : null}
                  </>
                ) : data.phase === "done" ? (
                  <>
                    <p className="text-xs font-semibold opacity-80">
                      {order.status === "delivered" ? "Order completed" : "Order closed"}
                    </p>
                    <p className="mt-1 text-2xl font-black">
                      {order.status === "delivered"
                        ? `Delivered at ${clock(order.deliveredAt)}`
                        : order.status === "delivery_failed"
                          ? `Delivery failed at ${clock(order.failedAt)}`
                          : "Cancelled"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      {stats?.totalMinutes != null ? <span>Total {formatTripDuration(stats.totalMinutes)}</span> : null}
                      {delay?.expectedAt ? <span>· promised by {clock(delay.expectedAt)}</span> : null}
                      <DelayBadge minutes={delay?.minutes} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold opacity-80">Not dispatched yet</p>
                    <p className="mt-1 text-xl font-black">
                      {data.isPickup ? "Customer picks up at the store" : "Waiting for a rider"}
                    </p>
                  </>
                )}
              </div>

              {!data.isPickup && (data.destination || data.store) ? (
                <Section
                  title={isLive ? "Live map" : "Delivery map"}
                  right={
                    riderPoint?.updatedAt ? (
                      <span className="text-[10px] font-bold text-sky-700">GPS {clock(riderPoint.updatedAt)}</span>
                    ) : null
                  }
                >
                  <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-slate-100" />}>
                    <DeliveryTrackingMap
                      store={data.store}
                      destination={data.destination}
                      rider={riderPoint}
                      polyline={isLive ? data.route?.polyline : ""}
                    />
                  </Suspense>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500">
                    <span>🏪 Store</span>
                    <span>🏠 Customer</span>
                    {isLive ? <span>🛵 Rider (live)</span> : null}
                  </div>
                </Section>
              ) : null}

              {delay?.riderReported ? (
                <Section title="Rider-reported delay">
                  <p className="text-sm font-bold text-amber-800">
                    {formatDelay(delay.riderReported.minutes)} late
                    {delay.riderReported.reason ? ` · ${delay.riderReported.reason}` : ""}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Reported {dateClock(delay.riderReported.reportedAt)}
                    {delay.riderReported.customerNotifiedAt
                      ? ` · customer informed ${dateClock(delay.riderReported.customerNotifiedAt)}`
                      : " · customer not informed yet"}
                  </p>
                  <div className="mt-2">
                    <DeliveryDelayNotice order={order} />
                  </div>
                </Section>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Section title="Customer">
                  <p className="font-extrabold text-slate-900">{data.customer.name}</p>
                  {data.customer.phone ? (
                    <a href={`tel:${data.customer.phone}`} className="mt-0.5 block text-sm font-bold text-emerald-700">
                      📞 {data.customer.phone}
                    </a>
                  ) : null}
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {data.isPickup ? "Store pickup" : data.customer.address || "—"}
                  </p>
                </Section>
                <Section title="Delivery partner">
                  {data.rider ? (
                    <div className="flex items-start gap-3">
                      {data.rider.photo ? (
                        <img
                          src={data.rider.photo}
                          alt=""
                          className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-lg">🛵</div>
                      )}
                      <div>
                        <p className="font-extrabold text-slate-900">{data.rider.name}</p>
                        {data.rider.phone ? (
                          <a href={`tel:${data.rider.phone}`} className="block text-sm font-bold text-emerald-700">
                            📞 {data.rider.phone}
                          </a>
                        ) : null}
                        <p className="text-[11px] text-slate-500">
                          {VEHICLE_LABELS[data.rider.vehicleType] || "Vehicle not set"}
                          {data.rider.rating != null ? ` · ★ ${Number(data.rider.rating).toFixed(1)}` : ""}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No rider assigned</p>
                  )}
                </Section>
              </div>

              <Section title={`Items (${order.items.length})`} right={<span className="text-xs font-bold text-slate-700">{formatRupee(order.itemsTotal)}</span>}>
                <ul className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-2">
                      {item.image ? (
                        <img src={item.image} alt="" className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-lg">🛒</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.quantity} × {item.unit || "pcs"}
                          {item.price ? ` · ${formatRupee(item.price)} each` : ""}
                        </p>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {formatRupee((Number(item.price) || 0) * (item.quantity || 0))}
                      </p>
                    </li>
                  ))}
                </ul>
              </Section>

              {stats ? (
                <Section title={stats.completed ? "Delivery summary (saved)" : "Time so far"}>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Stat label="Packing" value={formatTripDuration(stats.packMinutes)} />
                    <Stat label="Rider assigned after" value={formatTripDuration(stats.riderAssignMinutes)} />
                    <Stat label="Rider to store & pickup" value={formatTripDuration(stats.riderToStoreMinutes)} />
                    <Stat label="Ride to customer" value={formatTripDuration(stats.rideMinutes)} />
                    <Stat label="Order to door" value={formatTripDuration(stats.totalMinutes)} />
                    <Stat
                      label="Distance"
                      value={stats.distanceKm ? `${Number(stats.distanceKm).toFixed(1)} km` : "—"}
                    />
                    {delay?.promisedMinutes != null ? (
                      <Stat label="Promised ride time" value={formatTripDuration(delay.promisedMinutes)} />
                    ) : null}
                    {delay?.minutes != null ? (
                      <Stat
                        label={delay.minutes > 0 ? "Delay" : "Ahead of promise"}
                        value={formatTripDuration(Math.abs(delay.minutes))}
                      />
                    ) : null}
                  </div>
                </Section>
              ) : null}

              <Section title="Timeline">
                <ol className="relative space-y-3 border-l-2 border-slate-200 pl-4">
                  {data.timeline.map((step) => (
                    <li key={step.key} className="relative">
                      <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                      <p className="text-sm font-bold text-slate-900">{step.label}</p>
                      <p className="text-[11px] text-slate-500">
                        {dateClock(step.at)}
                        {step.minutesFromPrevious != null ? ` · +${formatTripDuration(step.minutesFromPrevious)}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
                {order.deliveryComment ? (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    Rider note: {order.deliveryComment}
                  </p>
                ) : null}
                {order.failureReason ? (
                  <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    Failure reason: {order.failureReason}
                  </p>
                ) : null}
                {order.deliveryProofImageUrl ? (
                  <img
                    src={order.deliveryProofImageUrl}
                    alt="Delivery proof"
                    className="mt-3 h-32 w-32 rounded-xl border border-slate-200 object-cover"
                  />
                ) : null}
              </Section>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
