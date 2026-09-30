import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { vendorApi } from "../../api/vendorApi";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_INPUT } from "../../utils/excelStyles";

const FIELDS = [
  { key: "minGradeA", label: "Grade A below", tone: "text-[#065F46]" },
  { key: "minGradeB", label: "Grade B below", tone: "text-[#1E40AF]" },
  { key: "minGradeC", label: "Grade C below", tone: "text-[#92400E]" },
  { key: "minTotal", label: "Total stock below", tone: "text-[#111827]" },
];

function initialForm(alert) {
  return {
    minGradeA: alert?.minGradeA ? String(alert.minGradeA) : "",
    minGradeB: alert?.minGradeB ? String(alert.minGradeB) : "",
    minGradeC: alert?.minGradeC ? String(alert.minGradeC) : "",
    minTotal: alert?.minTotal ? String(alert.minTotal) : "",
    enabled: alert ? alert.enabled !== false : true,
  };
}

export default function InventoryAlertModal({ row, alert, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState(() => initialForm(alert));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async (e) => {
    e.preventDefault();
    const limits = Object.fromEntries(FIELDS.map((f) => [f.key, Number(form[f.key] || 0)]));
    if (Object.values(limits).some((v) => !Number.isFinite(v) || v < 0)) {
      toast.error("Enter valid quantities (0 or more)");
      return;
    }
    if (Object.values(limits).every((v) => v === 0)) {
      toast.error("Set at least one minimum quantity");
      return;
    }
    setSaving(true);
    try {
      const res = await vendorApi.saveInventoryAlert({
        productKey: row.key,
        productName: row.productLabel,
        variety: row.variety,
        enabled: form.enabled,
        ...limits,
      });
      toast.success("Stock alert saved");
      onSaved(res.data.item);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save alert");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await vendorApi.deleteInventoryAlert(alert._id);
      toast.success("Stock alert removed");
      onDeleted(alert);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove alert");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <h2 className="text-base font-bold text-slate-900">Stock alert</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {row.productLabel}
          {row.variety ? ` · ${row.variety}` : ""} · current A {row.gradeA} / B {row.gradeB} / C {row.gradeC} {row.unit}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          You will be alerted when stock drops below these quantities. Leave a box empty to skip it.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className={`text-xs font-semibold ${f.tone}`}>
                {f.label} ({row.unit || "Kg"})
              </span>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={form[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className={`${EXCEL_INPUT} mt-1`}
                placeholder="Off"
              />
            </label>
          ))}
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
            className="h-4 w-4 accent-emerald-700"
          />
          Alert is on
        </label>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {alert ? (
            <button
              type="button"
              disabled={saving}
              onClick={remove}
              className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-60"
            >
              Remove alert
            </button>
          ) : null}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className={EXCEL_BTN}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={EXCEL_BTN_PRIMARY}>
              {saving ? "Saving…" : "Save alert"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
