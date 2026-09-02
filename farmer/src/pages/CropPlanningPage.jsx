import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getCropPlans, updateCropPlan } from "../api/farmerApi";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import { createProductPath, formatCropDate, formatCropBusinessId } from "../utils/cropLinks";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
} from "../utils/excelStyles";

function CropPlanningPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [edits, setEdits] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCropPlans();
      setPlans(data);
      setEdits(
        Object.fromEntries(
          data.map((p) => [
            p.planId || p.id,
            {
              estimatedProduction: p.estimatedProduction ?? "",
              expectedDemand: p.expectedDemand ?? "",
              suggestedSaleQuantity: p.suggestedSaleQuantity ?? "",
            },
          ])
        )
      );
    } catch (err) {
      toast.error(err.message || "Failed to load crop plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const savePlan = async (plan) => {
    const id = plan.planId || plan.id;
    const values = edits[id] || {};
    const estimatedProduction = Number(values.estimatedProduction);
    const expectedDemand = Number(values.expectedDemand || 0);
    const suggestedSaleQuantity = Number(values.suggestedSaleQuantity || 0);
    if (!(estimatedProduction > 0)) {
      toast.error("Estimated production must be greater than 0");
      return;
    }
    if (suggestedSaleQuantity > estimatedProduction) {
      toast.error("Suggested sale quantity cannot be greater than estimated production");
      return;
    }
    setSavingId(id);
    try {
      await updateCropPlan(id, { estimatedProduction, expectedDemand, suggestedSaleQuantity });
      toast.success("Plan updated");
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to update plan");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Crop Planning</h1>
          <p className={EXCEL_PAGE_SUB}>Plan expected production and future sale quantity for each crop.</p>
        </div>
        <Link to="/farmer/crops/add" className={`${EXCEL_BTN_PRIMARY} px-4 py-2`}>
          Add Crop
        </Link>
      </div>

      {loading ? (
        <LoadingState rows={6} />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No crop plans yet"
          description="Add a crop first. A production plan is created automatically."
          action={
            <Link to="/farmer/crops/add" className={EXCEL_BTN_PRIMARY}>
              Add Crop
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {plans.map((plan) => {
            const id = plan.planId || plan.id;
            const values = edits[id] || {};
            return (
              <section key={id} className={`${EXCEL_PANEL} p-3 space-y-2`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#1F2937]">{plan.cropName || "Crop"}</p>
                    <p className="mt-0.5 font-mono text-[11px] font-semibold tracking-wide text-emerald-700">
                      {formatCropBusinessId(plan)}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">
                      {plan.variety || "—"} • Harvest {formatCropDate(plan.harvestDate)}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase text-[#6B7280]">{plan.status}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <MiniField
                    label={`Estimated Production (${plan.unit})`}
                    value={values.estimatedProduction}
                    onChange={(v) => setEdits((prev) => ({ ...prev, [id]: { ...prev[id], estimatedProduction: v } }))}
                  />
                  <MiniField
                    label={`Expected Demand (${plan.unit})`}
                    value={values.expectedDemand}
                    onChange={(v) => setEdits((prev) => ({ ...prev, [id]: { ...prev[id], expectedDemand: v } }))}
                  />
                  <MiniField
                    label={`Suggested Sale (${plan.unit})`}
                    value={values.suggestedSaleQuantity}
                    onChange={(v) => setEdits((prev) => ({ ...prev, [id]: { ...prev[id], suggestedSaleQuantity: v } }))}
                  />
                </div>
                <div className="grid grid-cols-1 gap-1.5 pt-1 sm:grid-cols-3">
                  <Link to={`/farmer/crops/${plan.cropId}/plan`} className={EXCEL_BTN}>
                    View Plan
                  </Link>
                  <button type="button" className={EXCEL_BTN} disabled={savingId === id} onClick={() => savePlan(plan)}>
                    {savingId === id ? "Saving…" : "Update"}
                  </button>
                  <Link
                    to={createProductPath({
                      cropName: plan.cropName,
                      variety: plan.variety,
                      expectedHarvestDate: plan.harvestDate,
                      unit: plan.unit,
                      cropId: plan.cropId,
                    })}
                    className={EXCEL_BTN_PRIMARY}
                  >
                    Create Product
                  </Link>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-[#6B7280]">{label}</label>
      <input className={EXCEL_INPUT} type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default CropPlanningPage;
