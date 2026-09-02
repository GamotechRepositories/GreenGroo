import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getCrop, getCropPlan, updateCropPlan } from "../api/farmerApi";
import LoadingState from "../components/ui/LoadingState";
import { createProductPath, formatCropDate, formatCropBusinessId } from "../utils/cropLinks";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_INPUT, EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL, EXCEL_PANEL_HEAD } from "../utils/excelStyles";

function CropPlanPage() {
  const { cropId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [crop, setCrop] = useState(null);
  const [form, setForm] = useState({
    estimatedProduction: "",
    expectedDemand: "",
    suggestedSaleQuantity: "",
  });
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const cropData = await getCrop(cropId);
      setCrop(cropData);
      const plan = cropData.plan || (await getCropPlan(cropId).catch(() => null));
      setForm({
        estimatedProduction: plan?.estimatedProduction ?? cropData.estimatedQuantity ?? "",
        expectedDemand: plan?.expectedDemand ?? "",
        suggestedSaleQuantity: plan?.suggestedSaleQuantity ?? "",
      });
    } catch (err) {
      toast.error(err.message || "Failed to load crop plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [cropId]);

  const onSave = async (e) => {
    e.preventDefault();
    const estimatedProduction = Number(form.estimatedProduction);
    const expectedDemand = Number(form.expectedDemand || 0);
    const suggestedSaleQuantity = Number(form.suggestedSaleQuantity || 0);
    if (!(estimatedProduction > 0)) {
      setError("Estimated production must be greater than 0");
      return;
    }
    if (suggestedSaleQuantity > estimatedProduction) {
      setError("Suggested sale quantity cannot be greater than estimated production");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updateCropPlan(crop.plan?.planId || crop.plan?.id || cropId, {
        estimatedProduction,
        expectedDemand,
        suggestedSaleQuantity,
        harvestDate: crop.expectedHarvestDate,
        unit: crop.unit,
      });
      toast.success("Crop plan updated");
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState rows={6} />;
  if (!crop) return null;

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Crop Plan — {crop.cropName}</h1>
        <p className={EXCEL_PAGE_SUB}>
          Variety {crop.variety} • Harvest {formatCropDate(crop.expectedHarvestDate)}
        </p>
        <p className="mt-1 font-mono text-[12px] font-semibold tracking-wide text-emerald-700">
          {formatCropBusinessId(crop)}
        </p>
      </div>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Production Plan</h2>
        <form onSubmit={onSave} className="grid gap-3 p-3 sm:grid-cols-2">
          <Read label="Crop" value={crop.cropName} />
          <Read label="Crop ID" value={formatCropBusinessId(crop)} />
          <Read label="Variety" value={crop.variety} />
          <Read label="Harvest Date" value={formatCropDate(crop.expectedHarvestDate)} />
          <Field
            label={`Estimated Production (${crop.unit})`}
            value={form.estimatedProduction}
            onChange={(v) => setForm((p) => ({ ...p, estimatedProduction: v }))}
          />
          <Field
            label={`Expected Demand (${crop.unit})`}
            value={form.expectedDemand}
            onChange={(v) => setForm((p) => ({ ...p, expectedDemand: v }))}
          />
          <Field
            label={`Suggested Sale Quantity (${crop.unit})`}
            value={form.suggestedSaleQuantity}
            onChange={(v) => setForm((p) => ({ ...p, suggestedSaleQuantity: v }))}
          />
          {error ? <p className="sm:col-span-2 text-xs text-[#DC2626]">{error}</p> : null}
          <div className="sm:col-span-2 grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
            <button type="submit" disabled={saving} className={EXCEL_BTN_PRIMARY}>
              {saving ? "Saving…" : "Update Quantity"}
            </button>
            <Link to={`/farmer/crops/${cropId}`} className={EXCEL_BTN}>
              View Crop
            </Link>
            <Link to={createProductPath(crop)} className={EXCEL_BTN}>
              Create Product
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}

function Read({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-[#6B7280]">{label}</p>
      <p className="text-xs font-bold text-[#1F2937]">{value || "—"}</p>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold">{label}</label>
      <input className={EXCEL_INPUT} type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default CropPlanPage;
