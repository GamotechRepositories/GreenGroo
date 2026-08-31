import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { driverApi } from "../../api/driverApi";
import PickupTimeline, { pickupStatusLabel } from "../../components/pickup/PickupTimeline";
import ConfirmPickupPhotos from "../../components/pickup/ConfirmPickupPhotos";
import { usePolling } from "../../hooks/usePolling";

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-gray-900">{value || "—"}</p>
    </div>
  );
}

function QrScanner({ onScan, disabled }) {
  const [raw, setRaw] = useState("");
  const [camError, setCamError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let active = true;
    const start = async () => {
      if (disabled || !("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        let found = false;
        const tick = async () => {
          if (!active || !videoRef.current || found) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes[0]?.rawValue) {
              found = true;
              onScanRef.current(codes[0].rawValue);
              return;
            }
          } catch {
            // keep scanning
          }
          if (active && !found) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } catch {
        setCamError("Camera unavailable. Paste the scanned Farmer QR below.");
      }
    };
    start();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [disabled]);

  return (
    <div className="space-y-3">
      <video ref={videoRef} className="h-44 w-full bg-black object-cover" muted playsInline />
      {camError ? <p className="text-[11px] text-amber-700">{camError}</p> : <p className="text-[11px] text-gray-500">Point the camera at the Farmer QR, or paste the scanned value.</p>}
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-200 px-3 py-1.5 text-xs"
          placeholder="Paste Farmer QR"
          value={raw}
          disabled={disabled}
          onChange={(e) => setRaw(e.target.value)}
        />
        <button
          type="button"
          disabled={disabled || !raw.trim()}
          className="bg-[#217346] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          onClick={() => onScan(raw.trim())}
        >
          Verify QR
        </button>
      </div>
    </div>
  );
}

export default function DriverPickupPage() {
  const { pickupId } = useParams();
  const [pickup, setPickup] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPhotos, setConfirmPhotos] = useState([]);

  const load = (silent = false) => {
    driverApi
      .getPickup(pickupId)
      .then((r) => {
        setPickup(r.data);
        if (!silent) setError("");
      })
      .catch((err) => setError(err?.response?.data?.message || "Pickup not found"));
  };

  usePolling(() => load(true), [pickupId], 5000);

  const run = async (fn, okMessage) => {
    setBusy(true);
    setError("");
    try {
      const res = await fn();
      setPickup(res.data);
      if (okMessage) setSuccess(okMessage);
    } catch (err) {
      setError(err?.response?.data?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!pickup && !error) return <p className="p-6 text-xs text-gray-400">Loading…</p>;
  if (!pickup) return <p className="p-6 text-xs text-red-500">{error}</p>;

  const status = pickup.status;
  const canStart = ["DRIVER_ASSIGNED", "PICKUP_SCHEDULED"].includes(status);
  const canArrive = status === "DISPATCHED";
  const canCheck = status === "DRIVER_ARRIVED";
  const canScan = status === "ORDER_VERIFIED";
  const canConfirm = status === "QR_VERIFIED" && pickup.qrVerified && !pickup.pickupConfirmed;
  const canTransit =
    (status === "PICKED_UP" || status === "PICKUP_CONFIRMED" || pickup.pickupConfirmed) &&
    !["IN_TRANSIT", "COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE"].includes(status);
  const liveStatus = pickup.liveStatus || pickupStatusLabel(status);

  return (
    <div className="space-y-5 p-6">
      <Link to="/driver/assigned" className="text-xs text-[#217346]">← Pickup Orders</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order {pickup.orderDisplayId}</h1>
          <p className="text-sm text-gray-500">{pickup.farmerName} · {pickup.productName}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold uppercase">{pickupStatusLabel(status)}</span>
      </div>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}
      {success ? <div className="border border-green-200 bg-green-50 px-3 py-2 text-xs text-[#217346]">{success}</div> : null}

      <PickupTimeline status={status} />

      <div className="border border-[#217346] bg-[#E8F5E9] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#217346]">Your current status</p>
        <p className="mt-1 text-base font-bold text-gray-900">{liveStatus}</p>
        <p className="mt-1 text-xs text-gray-600">Update the step below so farmer, manager and vendor can see what you are doing.</p>
      </div>

      <div className="border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">Pickup Details</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Info label="Order ID" value={pickup.orderDisplayId} />
          <Info label="Farmer Name" value={pickup.farmerName} />
          <Info label="Farmer Location" value={pickup.farmerLocation} />
          <Info label="Product" value={pickup.productName} />
          <Info label="Quantity" value={`${pickup.packedQuantity || pickup.expectedQuantity} ${pickup.unit}`} />
          <Info label="Package Count" value={pickup.packageCount} />
          <Info label="Pickup Date/Time" value={`${pickup.pickupDate || pickup.scheduledDate || ""} ${pickup.pickupTime || pickup.scheduledTime || ""}`.trim()} />
          <Info label="Pickup Instructions" value={pickup.pickupInstructions || "Follow farm access and packing notes."} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {pickup.farmerMobile ? <a className="border border-gray-200 px-3 py-1.5 text-xs" href={`tel:${pickup.farmerMobile}`}>Contact Farmer</a> : null}
          {pickup.mapsUrl ? <a className="border border-gray-200 px-3 py-1.5 text-xs" href={pickup.mapsUrl} target="_blank" rel="noreferrer">View Location</a> : null}
        </div>
      </div>

      {canStart ? (
        <button type="button" disabled={busy} className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60" onClick={() => run(() => driverApi.start(pickup.id), "Left for pickup. Status is On the way to farm.")}>
          {busy ? "Updating…" : "Left for pickup — On the way"}
        </button>
      ) : null}

      {canArrive ? (
        <button type="button" disabled={busy} className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60" onClick={() => run(() => driverApi.arrive(pickup.id), "Reached the farm.")}>
          {busy ? "Updating…" : "Reached the order"}
        </button>
      ) : null}

      {status === "DRIVER_ARRIVED" || status === "ORDER_VERIFIED" || status === "QR_VERIFIED" ? (
        <p className="text-sm font-semibold text-[#217346]">Driver has arrived at pickup location.</p>
      ) : null}

      {canCheck || ["ORDER_VERIFIED", "QR_VERIFIED", "PICKED_UP", "IN_TRANSIT"].includes(status) ? (
        <div className="border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">Order Verification</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Info label="Order ID" value={pickup.orderDisplayId} />
            <Info label="Farmer Name" value={pickup.farmerName} />
            <Info label="Product Name" value={pickup.productName} />
            <Info label="Variety" value={pickup.variety} />
            <Info label="Grade" value={pickup.grade} />
            <Info label="Ordered Quantity" value={`${pickup.orderedQuantity} ${pickup.unit}`} />
            <Info label="Packed Quantity" value={`${pickup.packedQuantity} ${pickup.unit}`} />
            <Info label="Package Count" value={pickup.packageCount} />
            <Info label="Pickup Location" value={pickup.farmerLocation} />
          </div>
          {canCheck ? (
            <button type="button" disabled={busy} className="mt-4 border border-gray-200 px-3 py-1.5 text-xs font-semibold" onClick={() => run(() => driverApi.checkOrder(pickup.id), "Order checked. Scan Farmer QR next.")}>
              Check Order
            </button>
          ) : null}
        </div>
      ) : null}

      {canScan ? (
        <div className="border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">Scan Farmer QR</p>
          <QrScanner
            disabled={busy}
            onScan={(value) => run(() => driverApi.verifyQr(pickup.id, { qrPayload: value }), "QR Verified Successfully")}
          />
        </div>
      ) : null}

      {status === "QR_VERIFIED" || status === "PICKED_UP" || status === "IN_TRANSIT" ? (
        <div className="border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">Order Summary</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Info label="Order ID" value={pickup.orderDisplayId} />
            <Info label="Farmer" value={pickup.farmerName} />
            <Info label="Product" value={pickup.productName} />
            <Info label="Quantity" value={`${pickup.packedQuantity || pickup.expectedQuantity} ${pickup.unit}`} />
            <Info label="Package Count" value={pickup.packageCount} />
            <Info label="Driver" value={pickup.driverName} />
            <Info label="Vehicle Number" value={pickup.vehicleNumber} />
          </div>
          {canConfirm ? (
            <button type="button" disabled={busy} className="mt-4 bg-[#217346] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60" onClick={() => { setConfirmPhotos([]); setConfirmOpen(true); }}>
              Confirm order pickup
            </button>
          ) : null}
          {pickup.pickupConfirmed ? <p className="mt-3 text-sm font-semibold text-[#217346]">Pickup confirmed from farmer.</p> : null}
          {(pickup.confirmationPhotos || []).length ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {pickup.confirmationPhotos.map((src, i) => (
                <img key={i} src={src} alt={`Confirm ${i + 1}`} className="h-16 w-full object-cover" />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {canTransit ? (
        <button type="button" disabled={busy} className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60" onClick={() => run(() => driverApi.transit(pickup.id), "On the way to collection centre.")}>
          {busy ? "Updating…" : "On the way back to collection centre"}
        </button>
      ) : null}

      {status === "IN_TRANSIT" ? (
        <p className="text-sm font-semibold text-[#217346]">On the way to collection centre. Waiting for centre receiving.</p>
      ) : null}

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 bg-white p-5">
            <p className="text-sm font-bold text-gray-900">Confirm Pickup</p>
            <p className="mt-2 text-xs text-gray-600">Confirm that you have received this order from the farmer?</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Info label="Order ID" value={pickup.orderDisplayId} />
              <Info label="Farmer" value={pickup.farmerName} />
              <Info label="Product" value={pickup.productName} />
              <Info label="Quantity" value={`${pickup.packedQuantity} ${pickup.unit}`} />
              <Info label="Package Count" value={pickup.packageCount} />
              <Info label="Driver" value={pickup.driverName} />
              <Info label="Vehicle Number" value={pickup.vehicleNumber} />
            </div>
            <ConfirmPickupPhotos photos={confirmPhotos} onChange={setConfirmPhotos} disabled={busy} />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="border border-gray-200 px-3 py-1.5 text-xs" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button
                type="button"
                disabled={busy || confirmPhotos.length === 0}
                className="bg-[#217346] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                onClick={async () => {
                  await run(() => driverApi.confirm(pickup.id, { photos: confirmPhotos }), "Pickup confirmed. Status is PICKED UP.");
                  setConfirmOpen(false);
                  setConfirmPhotos([]);
                }}
              >
                Confirm Pickup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
