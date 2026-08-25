import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import PickupTimeline from "../../components/pickup/PickupTimeline";
import { usePolling } from "../../hooks/usePolling";

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-gray-900">{value || "—"}</p>
    </div>
  );
}

export default function VendorPickupDetailPage() {
  const { pickupId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    vendorApi
      .getPickup(pickupId)
      .then((r) => setData(r.data))
      .catch((err) => setError(err?.response?.data?.message || "Pickup not found"));
  };

  usePolling(load, [pickupId], 5000);

  const pickup = data?.pickup;

  if (!pickup && !error) return <p className="p-6 text-xs text-gray-400">Loading…</p>;
  if (!pickup) return <p className="p-6 text-xs text-red-500">{error}</p>;

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/vendor/pickups/assigned" className="hover:text-[#217346]">Assigned Pickups</Link>
        <span>›</span>
        <span className="font-semibold text-gray-700">{pickup.orderDisplayId}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pickup {pickup.pickupId}</h1>
          <p className="text-sm text-gray-500">Order {pickup.orderDisplayId} · {pickup.farmerName}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold uppercase text-gray-700">
          {String(pickup.status || "").replace(/_/g, " ")}
        </span>
      </div>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="border border-gray-200 bg-white p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">Pickup Request</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Info label="Order ID" value={pickup.orderDisplayId} />
              <Info label="Farmer" value={pickup.farmerName} />
              <Info label="Farmer Location" value={pickup.farmerLocation} />
              <Info label="Product" value={pickup.productName} />
              <Info label="Quantity" value={`${pickup.packedQuantity || pickup.expectedQuantity} ${pickup.unit}`} />
              <Info label="Packages" value={pickup.packageCount} />
              <Info label="Pickup Date" value={pickup.scheduledDate} />
              <Info label="Pickup Time" value={pickup.scheduledTime} />
              <Info label="Collection Centre" value={pickup.collectionCentreName} />
              <Info label="Farmer Manager" value={`${pickup.managerName || "—"} ${pickup.managerMobile ? `· ${pickup.managerMobile}` : ""}`} />
            </div>
          </div>

          <PickupTimeline status={pickup.status} />

          <div className="border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-600">Vendor view is monitoring only. Farmer Manager assigns the driver. The driver starts pickup, arrives, checks the order, scans Farmer QR, and confirms pickup.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 bg-white p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#217346]">Assigned Driver</p>
            <Info label="Name" value={pickup.driverName} />
            <div className="mt-2"><Info label="Mobile" value={pickup.driverMobile} /></div>
            <div className="mt-2"><Info label="Vehicle" value={pickup.vehicleNumber} /></div>
          </div>
          <div className="border border-amber-100 bg-amber-50 p-4 text-[11px] text-amber-800">
            Vendor monitors pickup status. Driver confirms pickup after Farmer QR verification.
          </div>
        </div>
      </div>
    </div>
  );
}
