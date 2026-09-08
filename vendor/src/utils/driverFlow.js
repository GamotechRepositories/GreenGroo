export function driverNextStep(pickup) {
  const status = pickup?.status;
  if (["DRIVER_ASSIGNED", "PICKUP_SCHEDULED"].includes(status)) {
    return { key: "start", label: "Left for pickup", hint: "Status will become On the way to farm" };
  }
  if (status === "DISPATCHED") {
    return { key: "arrive", label: "Reached the farm", hint: "Status will become Reached the farm" };
  }
  if (status === "DRIVER_ARRIVED") {
    return { key: "check", label: "Check order", hint: "Open pickup to verify the order" };
  }
  if (status === "ORDER_VERIFIED") {
    return { key: "scan", label: "Scan Farmer QR", hint: "Open pickup to scan QR" };
  }
  if (status === "QR_VERIFIED") {
    return { key: "confirm", label: "Confirm pickup", hint: "Open pickup to confirm with photo" };
  }
  if (status === "IN_TRANSIT") {
    return { key: "arriveCentre", label: "Reached collection centre", hint: "Status will become At collection centre" };
  }
  if (status === "PICKED_UP" || status === "PICKUP_CONFIRMED" || (pickup?.pickupConfirmed && status !== "IN_TRANSIT" && status !== "ARRIVED_AT_CENTRE")) {
    if (["IN_TRANSIT", "ARRIVED_AT_CENTRE", "COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE"].includes(status)) return null;
    return { key: "transit", label: "On the way to centre", hint: "Status will become On the way to centre" };
  }
  return null;
}

export function canRunFromList(key) {
  return key === "start" || key === "arrive" || key === "transit" || key === "arriveCentre";
}
