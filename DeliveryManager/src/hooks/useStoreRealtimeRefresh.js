import { useEffect, useRef } from "react";
import { subscribeToSocketEvent } from "../services/socket";

/** Events that mean store dashboard data may have changed. */
export const STORE_LIVE_EVENTS = [
  "new_order_received",
  "order_status_updated",
  "order_packed",
  "driver_assigned",
  "search_driver",
  "dispatch_no_riders_available",
  "pickup_verified",
  "pickup_qr_scanned",
  "pickup_proof_submitted",
  "order_out_for_delivery",
  "order_delivered",
  "rider_status_updated",
  "rider_document_updated",
  "rider_shift_booked",
  "rider_shift_cancelled",
];

export const RIDER_LIVE_EVENTS = [
  "rider_status_updated",
  "rider_document_updated",
  "driver_assigned",
  "rider_shift_booked",
  "rider_shift_cancelled",
];

export const KYC_LIVE_EVENTS = [
  "rider_document_updated",
  "rider_status_updated",
];

export const DRIVER_DETAIL_LIVE_EVENTS = [
  "rider_status_updated",
  "rider_document_updated",
  "rider_shift_booked",
  "rider_shift_cancelled",
];

  /// Refresh when the store room gets a socket event — no REST polling.
  /// Debounces bursts (many emits during dispatch) into one silent reload.
  ///
  /// @param {() => void | Promise<void>} onRefresh
  /// @param {{ events?: string[], backupMs?: number | null }} [options]
  ///   backupMs defaults to null (no timed pull). Pass a ms value only if you need a safety net.
  export function useStoreRealtimeRefresh(onRefresh, options = {}) {
  const events = options.events || STORE_LIVE_EVENTS;
  const backupMs = options.backupMs === undefined ? null : options.backupMs;
  const eventKey = events.join("|");

  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    let debounceTimer = null;
    let cancelled = false;
    const list = eventKey.split("|").filter(Boolean);

    const run = () => {
      if (cancelled) return;
      Promise.resolve(refreshRef.current()).catch(() => {});
    };

    const schedule = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(run, 250);
    };

    const unsubs = list.map((event) =>
      subscribeToSocketEvent(event, schedule)
    );

    // Rare backup only (missed sockets) — not continuous live polling
    const backupId =
      backupMs != null && backupMs > 0
        ? setInterval(run, backupMs)
        : null;

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (backupId) clearInterval(backupId);
      unsubs.forEach((u) => u());
    };
  }, [eventKey, backupMs]);
}
