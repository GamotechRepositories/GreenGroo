import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

function formatCropDate(value) {
  if (!value) return "—";
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split("-").map(Number);
  if (!year || !month || !day) return String(value);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Info({ label, value }) {
  return (
    <div>
      <p className="font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-0.5 font-semibold text-[#1F2937]">{value || "—"}</p>
    </div>
  );
}

export default function FarmerCropViewPage() {
  const { farmerId, cropId } = useParams();
  const [crop, setCrop] = useState(null);
  const [farmerName, setFarmerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      vendorApi.getFarmerCrop(farmerId, cropId).then((r) => r.data),
      vendorApi
        .getFarmerById(farmerId)
        .then((r) => r.data)
        .catch(() => null),
    ])
      .then(([cropData, farmer]) => {
        setCrop(cropData);
        setFarmerName(farmer?.name || "");
      })
      .catch((err) => setError(err?.response?.data?.message || "Failed to load crop"))
      .finally(() => setLoading(false));
  }, [farmerId, cropId]);

  if (loading) return <p className="p-6 text-xs text-[#6B7280]">Loading crop…</p>;
  if (error || !crop) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-xs text-[#DC2626]">{error || "Crop not found"}</p>
        <Link to={`/vendor/all-farmers/${farmerId}`} className="text-xs font-semibold text-[#217346]">
          Back to farmer
        </Link>
      </div>
    );
  }

  const cropIdLabel = crop.cropId || crop.id;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        <Link to="/vendor/all-farmers" className="hover:text-[#217346]">
          Farmers
        </Link>
        <span>›</span>
        <Link to={`/vendor/all-farmers/${farmerId}`} className="hover:text-[#217346]">
          {farmerName || "Farmer"}
        </Link>
        <span>›</span>
        <span className="font-semibold text-[#1F2937]">Crop</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#1F2937]">{crop.cropName}</h1>
          <p className="break-words text-sm text-[#6B7280]">
            {crop.variety} • {crop.farmName || "Farm"} {crop.farmLocation ? `• ${crop.farmLocation}` : ""}
          </p>
          <p className="mt-1 font-mono text-[12px] font-semibold tracking-wide text-emerald-700">{cropIdLabel}</p>
        </div>
        {crop.status ? (
          <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600">{crop.status}</span>
        ) : null}
      </div>

      <section className="border border-[#D4D4D4] bg-white">
        <h2 className="border-b border-[#D4D4D4] bg-[#F2F2F2] px-3 py-2 text-sm font-semibold">Crop Details</h2>
        <div className="grid grid-cols-1 gap-3 p-3 text-xs sm:grid-cols-2">
          <Info label="Crop Name" value={crop.cropName} />
          <Info label="Crop ID" value={cropIdLabel} />
          <Info label="Variety" value={crop.variety} />
          <Info label="Area" value={`${crop.area || ""} ${crop.areaUnit || ""}`.trim()} />
          <Info label="Sowing Date" value={formatCropDate(crop.sowingDate)} />
          <Info label="Expected Harvest Date" value={formatCropDate(crop.expectedHarvestDate)} />
          <Info label="Estimated Quantity" value={`${crop.estimatedQuantity || ""} ${crop.unit || ""}`.trim()} />
          <Info label="Farming Method" value={crop.farmingMethod} />
          <Info label="Irrigation Type" value={crop.irrigationType} />
          <Info label="Organic / Conventional" value={crop.farmingType} />
          <Info label="Farm Name" value={crop.farmName} />
          <Info label="Farm Location" value={crop.farmLocation} />
        </div>
      </section>

      <section className="border border-[#D4D4D4] bg-white">
        <h2 className="border-b border-[#D4D4D4] bg-[#F2F2F2] px-3 py-2 text-sm font-semibold">Crop Photos</h2>
        <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
          {crop.photos?.filter(Boolean).length ? (
            crop.photos.filter(Boolean).map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${crop.cropName} ${i + 1}`}
                className="h-28 w-full rounded-xl border border-slate-200 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ))
          ) : (
            <p className="col-span-full p-2 text-xs text-slate-500">No crop photos uploaded.</p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          to={`/vendor/all-farmers/${farmerId}/crops/${encodeURIComponent(crop.cropId || crop.id)}/edit`}
          className="bg-[#217346] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a5c38]"
        >
          Edit Crop
        </Link>
        <Link
          to={`/vendor/all-farmers/${farmerId}`}
          className="inline-flex border border-[#D4D4D4] bg-white px-3 py-1.5 text-xs font-semibold hover:bg-[#F2F2F2]"
        >
          Back to farmer
        </Link>
      </div>
    </div>
  );
}
