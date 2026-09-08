const STEPS = [
  "READY_FOR_PICKUP",
  "DRIVER_ASSIGNED",
  "DISPATCHED",
  "DRIVER_ARRIVED",
  "ORDER_VERIFIED",
  "QR_VERIFIED",
  "PICKED_UP",
  "IN_TRANSIT",
  "COLLECTION_CENTRE_RECEIVED",
];

const ALIAS = {
  PICKUP_SCHEDULED: "DRIVER_ASSIGNED",
  ARRIVED: "DRIVER_ARRIVED",
  COMPLETED: "PICKED_UP",
  PICKUP_CONFIRMED: "PICKED_UP",
  RECEIVED_AT_COLLECTION_CENTRE: "COLLECTION_CENTRE_RECEIVED",
};

export const PICKUP_STATUS_LABELS = {
  READY_FOR_PICKUP: "Ready for pickup",
  DRIVER_ASSIGNED: "Assigned",
  PICKUP_SCHEDULED: "Assigned",
  DISPATCHED: "On the way to farm",
  DRIVER_ARRIVED: "Reached the farm",
  ARRIVED: "Reached the farm",
  ORDER_VERIFIED: "Order checked",
  QR_VERIFIED: "QR verified",
  PICKED_UP: "Pickup confirmed",
  PICKUP_CONFIRMED: "Pickup confirmed",
  IN_TRANSIT: "On the way to centre",
  COLLECTION_CENTRE_RECEIVED: "At collection centre",
  RECEIVED_AT_COLLECTION_CENTRE: "At collection centre",
};

const LIVE_ALIASES = {
  "Assigned — waiting to leave": "Assigned",
  "Checking the order": "Order checked",
  "QR verified — confirm pickup": "QR verified",
  "On the way to collection centre": "On the way to centre",
  "Delivered at collection centre": "At collection centre",
  Incoming: "On the way to centre",
};

export function pickupStatusLabel(status) {
  const key = String(status || "").trim();
  if (!key) return "";
  if (PICKUP_STATUS_LABELS[key]) return PICKUP_STATUS_LABELS[key];
  if (LIVE_ALIASES[key]) return LIVE_ALIASES[key];
  if (Object.values(PICKUP_STATUS_LABELS).includes(key)) return key;
  return key.replace(/_/g, " ");
}

export function pickupLiveLabel(pickup) {
  if (!pickup) return "";
  const key = String(pickup.status || "").trim();
  if (PICKUP_STATUS_LABELS[key]) return PICKUP_STATUS_LABELS[key];
  return pickupStatusLabel(pickup.liveStatus || pickup.status);
}

export function pickupFlowStatus(pickup, orderStatus) {
  return pickup?.status || orderStatus || "";
}

export function hasAssignedDriver(pickup) {
  return Boolean(pickup?.driverId || pickup?.driverName);
}

function DriverFact({ label, value }) {
  return (
    <div className="rounded-lg bg-[#F8FAF8] px-3 py-2">
      <p className="text-[10px] font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-0.5 break-words text-[13px] font-bold text-[#1F2937]">{value || "—"}</p>
    </div>
  );
}

export function DriverInfo({ pickup }) {
  if (!hasAssignedDriver(pickup)) return null;
  const name = pickup.driverName || pickup.driver?.name || "";
  const mobile = pickup.driverMobile || pickup.driver?.mobile || "";
  const vehicle = pickup.vehicleNumber || pickup.driver?.vehicleNumber || "";
  const vehicleType = pickup.vehicleType || pickup.driver?.vehicleType || "";
  const license = pickup.licenseNumber || pickup.driver?.licenseNumber || "";
  const area = pickup.assignedArea || pickup.driver?.assignedArea || "";
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <DriverFact label="Driver" value={name} />
      <DriverFact
        label="Mobile"
        value={
          mobile ? (
            <a href={`tel:${mobile}`} className="text-[#217346] underline-offset-2 hover:underline">
              {mobile}
            </a>
          ) : (
            "—"
          )
        }
      />
      <DriverFact label="Vehicle" value={vehicle} />
      <DriverFact label="Vehicle type" value={vehicleType} />
      <DriverFact label="License" value={license} />
      <DriverFact label="Area" value={area} />
    </div>
  );
}

export default function PickupTimeline({ status }) {
  const current = ALIAS[status] || status;
  const idx = STEPS.indexOf(current);

  return (
    <>
      <ol className="md:hidden">
        {STEPS.map((step, i) => {
          const done = idx >= 0 && i <= idx;
          const lineDone = idx >= 0 && i < idx;
          const last = i === STEPS.length - 1;
          return (
            <li key={step} className={`relative flex gap-3 ${last ? "" : "pb-3.5"}`}>
              {!last ? (
                <span
                  className={`absolute left-[8px] top-[18px] h-[calc(100%-4px)] w-[3px] ${
                    lineDone ? "bg-[#217346]" : "bg-[#C9E4D3]"
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[3px] bg-white ${
                  done ? "border-[#217346]" : "border-[#C9E4D3]"
                }`}
              >
                {done ? <span className="h-[6px] w-[6px] rounded-full bg-[#217346]" /> : null}
              </span>
              <p className={`min-w-0 pt-px text-[13px] font-semibold leading-snug ${done ? "text-[#217346]" : "text-[#9CA3AF]"}`}>
                {pickupStatusLabel(step)}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="hidden md:block">
        <ol className="flex w-full items-start">
          {STEPS.map((step, i) => {
            const done = idx >= 0 && i <= idx;
            const lineDone = idx >= 0 && i < idx;
            const last = i === STEPS.length - 1;
            return (
              <li key={step} className="relative flex min-w-0 flex-1 flex-col items-center px-0.5">
                {!last ? (
                  <span
                    className={`pointer-events-none absolute left-1/2 top-[8px] h-[3px] w-full ${
                      lineDone ? "bg-[#217346]" : "bg-[#C9E4D3]"
                    }`}
                  />
                ) : null}
                <span
                  className={`relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[3px] bg-white ${
                    done ? "border-[#217346]" : "border-[#C9E4D3]"
                  }`}
                >
                  {done ? <span className="h-[6px] w-[6px] rounded-full bg-[#217346]" /> : null}
                </span>
                <p
                  className={`mt-2 text-center text-[10px] font-semibold leading-tight ${
                    done ? "text-[#217346]" : "text-[#9CA3AF]"
                  }`}
                >
                  {pickupStatusLabel(step)}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
