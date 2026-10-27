import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getManagerAllCrops } from "../api/farmerApi";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import {
  createManagerProductPath,
  formatCropDate,
  formatCropBusinessId,
  managerCropPath,
} from "../utils/cropLinks";
import CopyId from "../components/ui/CopyId";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
} from "../utils/excelStyles";

function farmerIdOf(crop) {
  return String(crop.farmerId || "").trim();
}

function CropPlanningPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [crops, setCrops] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedFarmerId = searchParams.get("farmerId") || "";

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getManagerAllCrops();
        setCrops(Array.isArray(res) ? res : res?.crops || []);
        setFarmers(Array.isArray(res?.farmers) ? res.farmers : []);
      } catch (err) {
        toast.error(err.message || "Failed to load crop plans");
        setCrops([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!selectedFarmerId) return crops;
    return crops.filter((c) => farmerIdOf(c) === selectedFarmerId);
  }, [crops, selectedFarmerId]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const crop of filtered) {
      const key = farmerIdOf(crop) || crop.farmerName || "unknown";
      if (!map.has(key)) {
        map.set(key, { farmerId: farmerIdOf(crop), farmerName: crop.farmerName || "Farmer", items: [] });
      }
      map.get(key).items.push(crop);
    }
    return Array.from(map.values()).sort((a, b) => a.farmerName.localeCompare(b.farmerName));
  }, [filtered]);

  const addPath = selectedFarmerId
    ? `/manager/farmers/${encodeURIComponent(selectedFarmerId)}/crops/add`
    : "/manager/crops/add";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Crop Planning</h1>
          <p className={EXCEL_PAGE_SUB}>Plan production farmer-wise, same as the farmer app.</p>
        </div>
        <Link to={addPath} className={`${EXCEL_BTN_PRIMARY} px-4 py-2`}>
          Add Crop
        </Link>
      </div>

      <select
        className={`${EXCEL_INPUT} max-w-xs`}
        value={selectedFarmerId}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams);
          if (e.target.value) next.set("farmerId", e.target.value);
          else next.delete("farmerId");
          setSearchParams(next, { replace: true });
        }}
      >
        <option value="">All Farmers</option>
        {farmers.map((f) => (
          <option key={f.id || f.farmerId} value={f.id || f.farmerId}>
            {f.name}
          </option>
        ))}
      </select>

      {loading ? (
        <LoadingState rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No crop plans yet"
          description="Add a crop for a farmer first. A production plan is created automatically."
          action={
            <Link to={addPath} className={EXCEL_BTN_PRIMARY}>
              Add Crop
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.farmerId || group.farmerName} className="space-y-2">
              <Link
                to={group.farmerId ? `/manager/farmers/${encodeURIComponent(group.farmerId)}` : "/manager/farmers"}
                className="text-sm font-bold text-[#217346] hover:underline"
              >
                {group.farmerName}
              </Link>
              <div className="grid gap-3 lg:grid-cols-2">
                {group.items.map((crop) => {
                  const farmerId = farmerIdOf(crop);
                  const cropId = crop.cropId || crop.id;
                  return (
                    <article key={`${farmerId}-${cropId}`} className={`${EXCEL_PANEL} space-y-2 p-3`}>
                      <div>
                        <p className="text-xs font-bold text-[#1F2937]">{crop.cropName || crop.name || "Crop"}</p>
                        <CopyId
                          value={formatCropBusinessId(crop)}
                          className="mt-0.5"
                          textClassName="font-mono text-[11px] font-semibold tracking-wide text-emerald-700"
                        />
                        <p className="text-[11px] text-[#6B7280]">
                          {crop.variety || "—"} • Harvest {formatCropDate(crop.expectedHarvestDate)}
                          {crop.estimatedQuantity != null ? ` • ${crop.estimatedQuantity} ${crop.unit || "Kg"}` : ""}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                        <Link to={managerCropPath(farmerId, cropId, "/plan")} className={EXCEL_BTN}>
                          View Plan
                        </Link>
                        <Link to={managerCropPath(farmerId, cropId)} className={EXCEL_BTN}>
                          View Crop
                        </Link>
                        <Link to={createManagerProductPath(farmerId, crop)} className={EXCEL_BTN_PRIMARY}>
                          Create Product
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default CropPlanningPage;
