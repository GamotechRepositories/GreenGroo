import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { driverApi } from "../../api/driverApi";
import BatchDetailView from "../../components/pickup/BatchDetailView";
import { formatVehicleId } from "../../components/ui/CopyId";
import { usePolling } from "../../hooks/usePolling";
import { buildBatchQrPayload } from "../../utils/batchQr";

function payloadFromPickups(batchId, pickups = []) {
  const first = pickups[0] || {};
  const driver = first.driver || {};
  const farmers = [...new Set(pickups.map((p) => p.farmerName).filter(Boolean))];
  const products = [...new Set(pickups.map((p) => p.productName).filter(Boolean))];
  const vehicleId = formatVehicleId(first.vehicleId || driver.vehicleId, first.vehicleNumber || driver.vehicleNumber);
  return {
    batchId,
    lotId: batchId,
    qrPayload: buildBatchQrPayload({
      ...first,
      batchId,
      pickups,
      driverId: first.driverId || driver.id,
      driverName: first.driverName || driver.name,
      vehicleId,
      vehicleNumber: first.vehicleNumber || driver.vehicleNumber,
      collectionCentreName: first.collectionCentreName,
      farmers,
      products,
    }),
    liveStatus: first.liveStatus || "",
    status: first.status || "",
    collectionCentreName: first.collectionCentreName || "",
    driverName: first.driverName || driver.name || "",
    driverId: first.driverId || driver.id || driver.driverId || "",
    driverMobile: first.driverMobile || driver.mobile || "",
    vehicleNumber: first.vehicleNumber || driver.vehicleNumber || "",
    vehicleType: first.vehicleType || driver.vehicleType || "",
    vehicleId,
    farmers,
    products,
    pickups,
  };
}

export default function DriverBatchPage() {
  const { batchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const id = decodeURIComponent(String(batchId || "").trim());
  const seedPickups = Array.isArray(location.state?.pickups) ? location.state.pickups : [];
  const [data, setData] = useState(() =>
    seedPickups.length ? payloadFromPickups(location.state?.batchId || id, seedPickups) : null
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  usePolling(() => {
    driverApi
      .getBatch(id)
      .then((r) => {
        const payload = r.data;
        const apiOrders = Array.isArray(payload?.pickups) ? payload.pickups : [];
        setData((prev) => {
          if (apiOrders.length >= (prev?.pickups?.length || 0)) return payload;
          if (prev?.pickups?.length) return { ...payload, pickups: prev.pickups };
          return payload;
        });
        setError("");
      })
      .catch((err) => {
        if (!seedPickups.length) setError(err?.response?.data?.message || "Batch not found");
      });
  }, [id], 5000);

  if (!data && !error) return <p className="p-6 text-xs text-gray-400">Loading…</p>;
  if (!data) return <p className="p-6 text-xs text-red-500">{error}</p>;

  const orders = data.pickups || [];
  const arrivePickup = orders.find((p) => p.status === "IN_TRANSIT");
  const markArrived = async () => {
    if (!arrivePickup || busy) return;
    setBusy(true);
    setError("");
    try {
      await driverApi.arriveCentre(arrivePickup.id);
      const r = await driverApi.getBatch(id);
      setData(r.data || data);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update status");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {error ? <div className="mx-6 mt-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}
      <BatchDetailView
        data={data}
        backTo="/driver/progress"
        backLabel="← In Progress"
        onOpenOrder={(p) => navigate(`/driver/pickups/${p.id}`)}
        action={
          arrivePickup
            ? { label: "Reached collection centre", busy, onClick: markArrived }
            : null
        }
      />
    </>
  );
}
