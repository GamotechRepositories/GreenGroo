import { Link } from "react-router-dom";
import { pickupStatusLabel, pickupLiveLabel } from "./PickupTimeline";
import BatchQrCode from "./BatchQrCode";
import BatchOrderChart from "./BatchOrderChart";
import CopyId, { isCopyableId, formatVehicleId } from "../ui/CopyId";

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      {isCopyableId(label, value) ? (
        <CopyId
          value={value}
          className="mt-0.5"
          textClassName="break-all font-mono text-[11px] font-semibold leading-snug text-gray-900 sm:text-xs"
          breakAll
        />
      ) : (
        <p className="mt-0.5 break-words text-[11px] font-semibold leading-snug text-gray-900 sm:text-xs">
          {value == null || value === "" ? "—" : value}
        </p>
      )}
    </div>
  );
}

function IdBlock({ label, value, large = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <CopyId
        value={value}
        className="mt-0.5"
        textClassName={
          large
            ? "break-all font-mono text-[13px] font-bold leading-snug text-[#217346] sm:text-base"
            : "break-all font-mono text-[11px] font-semibold leading-snug text-gray-900"
        }
        breakAll
      />
    </div>
  );
}

export default function BatchDetailView({ data, backTo, backLabel = "Back", onOpenOrder, action }) {
  const orders = data?.pickups || [];
  const first = orders[0] || {};
  const live = pickupLiveLabel(data) || pickupLiveLabel(first) || pickupStatusLabel(data?.status || first.status);
  const batchId = data?.batchId || data?.lotId || first.collectionBatchId || "";
  const driverName = data.driverName || first.driverName || first.driver?.name;
  const driverId = data.driverId || first.driverId || first.driver?.id || first.driver?.driverId;
  const driverMobile = data.driverMobile || first.driverMobile || first.driver?.mobile;
  const vehicleNumber = data.vehicleNumber || first.vehicleNumber || first.driver?.vehicleNumber;
  const vehicleType = data.vehicleType || first.driver?.vehicleType;
  const vehicleId = formatVehicleId(
    data.vehicleId || first.vehicleId || first.driver?.vehicleId,
    data.vehicleNumber || first.vehicleNumber || first.driver?.vehicleNumber
  );
  const centreName = data.collectionCentreName || first.collectionCentreName;
  const farmers = data.farmers?.length ? data.farmers : [...new Set(orders.map((p) => p.farmerName).filter(Boolean))];
  const products = data.products?.length ? data.products : [...new Set(orders.map((p) => p.productName).filter(Boolean))];

  return (
    <div className="space-y-3 p-3 pb-6 sm:space-y-5 sm:p-6">
      {backTo ? (
        <Link to={backTo} className="inline-block text-xs text-[#217346]">{backLabel}</Link>
      ) : null}
      {live ? (
        <span className="inline-flex max-w-full rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold leading-tight text-[#217346]">
          {live}
        </span>
      ) : null}

      <section className="overflow-hidden border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-3 py-2.5 sm:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Overview</p>
        </div>

        <div className="p-3 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-[8.25rem] shrink-0 sm:w-44 lg:w-52">
              <BatchQrCode value={data?.qrPayload || batchId} compact />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <IdBlock label="Lot / Batch ID" value={batchId} large />
              <IdBlock label="Driver ID" value={driverId} />
              <IdBlock label="Vehicle ID" value={vehicleId} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-gray-100 pt-3 sm:grid-cols-3 sm:gap-3">
            <Info label="Orders" value={String(orders.length)} />
            <Info label="Collection Centre" value={centreName} />
            <Info label="Driver" value={driverName} />
            <Info label="Driver Mobile" value={driverMobile} />
            <Info label="Vehicle" value={[vehicleNumber, vehicleType].filter(Boolean).join(" · ")} />
            <Info label="Farmers" value={farmers.join(", ")} />
            <Info label="Products" value={products.join(", ")} />
          </div>
        </div>
      </section>

      <BatchOrderChart orders={orders} onView={onOpenOrder} />
      {action ? (
        <button
          type="button"
          disabled={action.busy}
          className="w-full bg-[#217346] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
          onClick={action.onClick}
        >
          {action.busy ? "Updating…" : action.label}
        </button>
      ) : null}
    </div>
  );
}
