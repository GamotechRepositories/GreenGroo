import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getManagerQuality,
  startManagerQuality,
  uploadManagerQualityPhotos,
  saveManagerQualityParameters,
  saveManagerQualityGrading,
  confirmManagerQuality,
} from "../../api/farmerApi";
import StatusBadge from "../../components/ui/StatusBadge";
import CopyId, { isCopyableId } from "../../components/ui/CopyId";
import QualityPhotos from "../../components/quality/QualityPhotos";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../../utils/excelStyles";

const PARAM_FIELDS = [
  { key: "freshness", label: "Freshness" },
  { key: "size", label: "Size" },
  { key: "colour", label: "Colour" },
  { key: "appearance", label: "Appearance" },
  { key: "cleanliness", label: "Cleanliness" },
  { key: "damage", label: "Damage" },
  { key: "moisture", label: "Moisture" },
  { key: "weight", label: "Weight" },
  { key: "overallQuality", label: "Overall Quality" },
];

const GRADE_ROWS = [
  { key: "gradeAQuantity", label: "Grade A", title: "GRADE A — PREMIUM" },
  { key: "gradeBQuantity", label: "Grade B", title: "GRADE B — STANDARD" },
  { key: "gradeCQuantity", label: "Grade C", title: "GRADE C — LOW GRADE" },
];

const GRADE_TONE = {
  "Grade A": "border-[#A7F3D0] bg-[#ECFDF5]",
  "Grade B": "border-[#BFDBFE] bg-[#EFF6FF]",
  "Grade C": "border-[#FDE68A] bg-[#FFFBEB]",
};

function emptyGradeRow() {
  return { parameters: {}, photos: [], remarks: "", rejectedQuantity: "", rejectionReason: "", rejectionRemarks: "" };
}

function hydrateGradeQuality(d = {}) {
  const src = d.gradeQuality && typeof d.gradeQuality === "object" ? d.gradeQuality : {};
  const out = {};
  GRADE_ROWS.forEach(({ label }) => {
    const row = src[label] && typeof src[label] === "object" ? src[label] : {};
    out[label] = {
      parameters: { ...(row.parameters || row.qualityParameters || {}) },
      photos: Array.isArray(row.photos) ? row.photos : [],
      remarks: row.remarks || "",
      rejectedQuantity: row.rejectedQuantity ?? "",
      rejectionReason: row.rejectionReason || "",
      rejectionRemarks: row.rejectionRemarks || "",
    };
  });
  const aParams = out["Grade A"].parameters;
  const aFilled = PARAM_FIELDS.every((f) => String(aParams[f.key] || "").trim());
  if (!aFilled && d.qualityParameters) {
    out["Grade A"].parameters = { ...(d.qualityParameters || {}) };
  }
  if (!out["Grade A"].photos.length && Array.isArray(d.qualityPhotos) && d.qualityPhotos.length) {
    out["Grade A"].photos = d.qualityPhotos;
  }
  return out;
}

function qtyPrefill(d, key, label) {
  const current = d[key];
  if (current != null && current !== "" && Number(current) > 0) return current;
  const match = (Array.isArray(d.grades) ? d.grades : []).find((g) => {
    const name = String(g.label || g.name || g.grade || "").trim();
    return name === label;
  });
  if (match && match.quantity != null && Number(match.quantity) > 0) return match.quantity;
  return current ?? "";
}

const QUALITY_TIMELINE = [
  { key: "RECEIVED", label: "Received" },
  { key: "QUALITY_CHECK", label: "Quality Check" },
  { key: "GRADING", label: "Grading" },
  { key: "GRADING_COMPLETED", label: "Grading Completed" },
];

function qualityTimelineIndex(status) {
  const s = String(status || "").toUpperCase();
  if (s === "GRADE_CONFIRMED" || s === "ORDER_COMPLETED") return 3;
  if (s === "GRADING") return 2;
  if (s === "INSPECTION" || s === "QUALITY_CHECK") return 1;
  return 0;
}

function QualityStatusTimeline({ status }) {
  const idx = qualityTimelineIndex(status);
  return (
    <ol className="flex w-full items-start">
      {QUALITY_TIMELINE.map((step, i) => {
        const done = i <= idx;
        const lineDone = i < idx;
        const last = i === QUALITY_TIMELINE.length - 1;
        return (
          <li key={step.key} className="relative flex min-w-0 flex-1 flex-col items-center px-0.5">
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
              className={`mt-2 text-center text-[10px] font-semibold leading-tight sm:text-[11px] ${
                done ? "text-[#217346]" : "text-[#9CA3AF]"
              }`}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">{label}</p>
      {isCopyableId(label, value) ? (
        <CopyId value={value} className="mt-0.5" textClassName="break-all font-mono text-xs font-semibold text-[#1F2937]" breakAll />
      ) : (
        <p className="mt-0.5 text-xs font-semibold text-[#1F2937]">{value ?? "—"}</p>
      )}
    </div>
  );
}

function GradeWeightTable({ rows, unit }) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left text-[10px] md:table-auto md:text-xs">
        <colgroup>
          <col className="w-[50%]" />
          <col className="w-[50%]" />
        </colgroup>
        <thead>
          <tr className="bg-[#F8FAF8] text-[9px] font-bold uppercase tracking-wide text-[#6B7280] md:text-[10px]">
            <th className="border border-[#E5E7EB] px-1 py-1.5 md:px-2 md:py-2">Grade</th>
            <th className="border border-[#E5E7EB] px-1 py-1.5 md:px-2 md:py-2">Weight</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => {
            const weight = g.acceptedWeight || g.actualWeight || g.expectedWeight;
            return (
              <tr key={g.label} className={GRADE_TONE[g.label] || ""}>
                <td className="border border-[#E5E7EB] px-1 py-1.5 font-semibold leading-tight text-[#1F2937] md:px-2 md:py-2">{g.label}</td>
                <td className="border border-[#E5E7EB] px-1 py-1.5 tabular-nums md:px-2 md:py-2">
                  {weight} {unit}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 text-[#6B7280] transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path fill="currentColor" d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
    </svg>
  );
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function weightGradeRows(data) {
  const fromApi = Array.isArray(data?.weightGrades) ? data.weightGrades : [];
  const rows = fromApi
    .map((g) => {
      const expectedWeight = num(g.expectedWeight);
      const actualWeight = num(g.actualWeight);
      const acceptedWeight = num(g.acceptedWeight);
      return {
        label: String(g.label || g.name || "").trim(),
        expectedWeight,
        actualWeight,
        acceptedWeight,
        difference: g.difference != null && g.difference !== "" ? num(g.difference) : acceptedWeight - expectedWeight,
      };
    })
    .filter((g) => g.label && (g.expectedWeight > 0 || g.actualWeight > 0 || g.acceptedWeight > 0));
  if (rows.length) return rows;
  const fromOrder = Array.isArray(data?.grades) ? data.grades : [];
  return fromOrder
    .map((g) => {
      const expectedWeight = num(g.quantity || g.qty);
      return {
        label: String(g.label || g.name || g.grade || "").trim(),
        expectedWeight,
        actualWeight: 0,
        acceptedWeight: 0,
        difference: 0 - expectedWeight,
      };
    })
    .filter((g) => g.label && g.expectedWeight > 0);
}

function gradeDisplayedWeight(label, weightRows, formQty) {
  const wr = (weightRows || []).find((g) => g.label === label);
  const fromWeight = wr ? wr.acceptedWeight || wr.actualWeight || wr.expectedWeight : 0;
  if (fromWeight > 0) return fromWeight;
  return num(formQty);
}

function gradeReceivedWeight(label, weightRows, formQty) {
  const wr = (weightRows || []).find((g) => g.label === label);
  if (wr) {
    if (wr.acceptedWeight > 0) return wr.acceptedWeight;
    if (wr.actualWeight > 0) return wr.actualWeight;
  }
  return num(formQty);
}

function assignQtyMap(data, weightRows, form) {
  const received = num(data?.receivedQuantity);
  const rows = GRADE_ROWS.map((row) => ({
    key: row.key,
    qty: gradeReceivedWeight(row.label, weightRows, form?.[row.key]),
  }));
  const sum = rows.reduce((total, row) => total + row.qty, 0);
  if (received > 0 && sum > received + 0.001 && sum > 0) {
    const scale = received / sum;
    rows.forEach((row) => {
      row.qty = Math.round(row.qty * scale * 1000) / 1000;
    });
    const drift = Math.round((received - rows.reduce((total, row) => total + row.qty, 0)) * 1000) / 1000;
    if (drift) {
      const top = rows.reduce((a, b) => (a.qty >= b.qty ? a : b));
      top.qty = Math.round((top.qty + drift) * 1000) / 1000;
    }
  }
  return Object.fromEntries(rows.map((row) => [row.key, row.qty]));
}

export default function ManagerQualityInspectionPage() {
  const { orderId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [openGrades, setOpenGrades] = useState({});
  const [form, setForm] = useState({
    qualityParameters: {},
    qualityRemarks: "",
    gradeAQuantity: "",
    gradeBQuantity: "",
    gradeCQuantity: "",
    rejectedQuantity: "",
    rejectionReason: "",
    rejectionRemarks: "",
    photos: [],
    gradeQuality: {
      "Grade A": emptyGradeRow(),
      "Grade B": emptyGradeRow(),
      "Grade C": emptyGradeRow(),
    },
  });

  const hydrate = (d) => {
    setData(d);
    setForm({
      qualityParameters: { ...(d.qualityParameters || {}) },
      qualityRemarks: d.qualityRemarks || "",
      gradeAQuantity: qtyPrefill(d, "gradeAQuantity", "Grade A"),
      gradeBQuantity: qtyPrefill(d, "gradeBQuantity", "Grade B"),
      gradeCQuantity: qtyPrefill(d, "gradeCQuantity", "Grade C"),
      rejectedQuantity: d.rejectedQuantity ?? "",
      rejectionReason: d.rejectionReason || "",
      rejectionRemarks: d.rejectionRemarks || "",
      photos: d.qualityPhotos || [],
      gradeQuality: hydrateGradeQuality(d),
    });
  };

  const load = async () => {
    try {
      hydrate(await getManagerQuality(orderId));
      setError("");
    } catch (err) {
      setError(err.message || "Quality inspection not found");
    }
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const locked = Boolean(data?.locked);
  const started = data && data.status !== "QUALITY_PENDING";
  const options = data?.paramOptions || {};
  const unit = data?.unit || "Kg";

  const weightRows = useMemo(() => weightGradeRows(data), [data]);
  const qualityGrades = GRADE_ROWS.filter(
    (row) => gradeDisplayedWeight(row.label, weightRows, form[row.key]) > 0
  );
  const paramsComplete =
    qualityGrades.length > 0 &&
    qualityGrades.every((row) =>
      PARAM_FIELDS.every((f) => String(form.gradeQuality[row.label]?.parameters?.[f.key] || "").trim())
    );
  const rejectionOk = qualityGrades.every((row) => {
    const rejected = num(form.gradeQuality[row.label]?.rejectedQuantity);
    if (!(rejected > 0)) return true;
    const reason = String(form.gradeQuality[row.label]?.rejectionReason || "").trim();
    if (!reason) return false;
    if (reason === "Other" && !String(form.gradeQuality[row.label]?.rejectionRemarks || "").trim()) return false;
    return true;
  });
  const canAssign = started && !locked && paramsComplete && rejectionOk;

  const assignQty = useMemo(() => assignQtyMap(data, weightRows, form), [data, weightRows, form]);
  const gradeAssignQty = (key) => num(assignQty[key]);
  const summaryRows = useMemo(() => {
    const orderedMap = {};
    (Array.isArray(data?.grades) ? data.grades : []).forEach((g) => {
      const label = String(g.label || g.name || g.grade || "").trim();
      if (!label) return;
      orderedMap[label] = (orderedMap[label] || 0) + num(g.quantity || g.qty);
    });
    const labels = new Set(GRADE_ROWS.map((row) => row.label));
    weightRows.forEach((g) => labels.add(g.label));
    Object.keys(orderedMap).forEach((label) => labels.add(label));
    const preferred = GRADE_ROWS.map((row) => row.label);
    const orderedLabels = [
      ...preferred.filter((label) => labels.has(label)),
      ...Array.from(labels).filter((label) => !preferred.includes(label)).sort(),
    ];
    return orderedLabels
      .map((label) => {
        const row = GRADE_ROWS.find((r) => r.label === label);
        const wr = weightRows.find((g) => g.label === label);
        const ordered = orderedMap[label] || wr?.expectedWeight || 0;
        const received = gradeReceivedWeight(label, weightRows, row ? form[row.key] : 0);
        const rejected = num(form.gradeQuality[label]?.rejectedQuantity);
        const base = received > 0 ? received : ordered;
        const finalReceived = Math.max(0, Math.round((base - rejected) * 1000) / 1000);
        return { label, ordered, received, rejected, finalReceived };
      })
      .filter((row) => row.ordered > 0 || row.received > 0 || row.rejected > 0);
  }, [data, weightRows, form]);
  const summaryTotals = useMemo(
    () =>
      summaryRows.reduce(
        (acc, row) => ({
          ordered: acc.ordered + row.ordered,
          received: acc.received + row.received,
          rejected: acc.rejected + row.rejected,
          finalReceived: acc.finalReceived + row.finalReceived,
        }),
        { ordered: 0, received: 0, rejected: 0, finalReceived: 0 }
      ),
    [summaryRows]
  );

  const setGradePatch = (label, patch) => {
    setForm((f) => ({
      ...f,
      gradeQuality: {
        ...f.gradeQuality,
        [label]: {
          ...emptyGradeRow(),
          ...(f.gradeQuality[label] || {}),
          ...patch,
        },
      },
    }));
  };

  const setGradeParam = (label, key, value) => {
    setForm((f) => ({
      ...f,
      gradeQuality: {
        ...f.gradeQuality,
        [label]: {
          ...emptyGradeRow(),
          ...(f.gradeQuality[label] || {}),
          parameters: { ...((f.gradeQuality[label] || {}).parameters || {}), [key]: value },
        },
      },
    }));
  };

  const run = async (key, fn, { keepForm = false } = {}) => {
    setBusy(key);
    setError("");
    try {
      const d = await fn();
      if (keepForm) setData(d);
      else hydrate(d);
      return d;
    } catch (err) {
      setError(err.message || "Action failed");
      throw err;
    } finally {
      setBusy("");
    }
  };

  const startCheck = () => run("start", () => startManagerQuality(orderId));

  const qualityCheckPayload = () => ({
    gradeQuality: Object.fromEntries(
      GRADE_ROWS.map((row) => [
        row.label,
        {
          parameters: form.gradeQuality[row.label]?.parameters || {},
          remarks: form.gradeQuality[row.label]?.remarks || "",
          rejectedQuantity: num(form.gradeQuality[row.label]?.rejectedQuantity),
          rejectionReason: form.gradeQuality[row.label]?.rejectionReason || "",
          rejectionRemarks: form.gradeQuality[row.label]?.rejectionRemarks || "",
        },
      ])
    ),
    qualityRemarks: form.qualityRemarks,
  });

  const saveGradeCheck = async (label) => {
    const gq = form.gradeQuality[label] || emptyGradeRow();
    try {
      await run(`save-${label}`, () =>
        saveManagerQualityParameters(orderId, {
          gradeQuality: {
            [label]: {
              parameters: gq.parameters || {},
              remarks: gq.remarks || "",
              rejectedQuantity: num(gq.rejectedQuantity),
              rejectionReason: gq.rejectionReason || "",
              rejectionRemarks: gq.rejectionRemarks || "",
            },
          },
        }),
        { keepForm: true }
      );
      toast.success(`${label} saved`);
    } catch {
      toast.error(`Failed to save ${label}`);
    }
  };

  const saveGradePhotos = (label, photos) => {
    setForm((f) => ({
      ...f,
      gradeQuality: {
        ...f.gradeQuality,
        [label]: {
          ...emptyGradeRow(),
          ...(f.gradeQuality[label] || {}),
          photos,
        },
      },
    }));
    uploadManagerQualityPhotos(orderId, { grade: label, photos, replace: true })
      .then((d) => setData(d))
      .catch((err) => setError(err.message || "Failed to save photos"));
  };

  const assignGrade = async () => {
    await run("params", () => saveManagerQualityParameters(orderId, qualityCheckPayload()));
    await run("grade", () =>
      saveManagerQualityGrading(orderId, {
        gradeAQuantity: gradeAssignQty("gradeAQuantity"),
        gradeBQuantity: gradeAssignQty("gradeBQuantity"),
        gradeCQuantity: gradeAssignQty("gradeCQuantity"),
        rejectedQuantity: GRADE_ROWS.reduce((sum, row) => sum + num(form.gradeQuality[row.label]?.rejectedQuantity), 0),
        rejectionReason: GRADE_ROWS.map((row) => form.gradeQuality[row.label]).find((g) => num(g?.rejectedQuantity) > 0)?.rejectionReason || "",
        rejectionRemarks: GRADE_ROWS.map((row) => form.gradeQuality[row.label]).find((g) => num(g?.rejectedQuantity) > 0)?.rejectionRemarks || "",
        gradeQuality: Object.fromEntries(
          GRADE_ROWS.map((row) => [
            row.label,
            {
              rejectedQuantity: num(form.gradeQuality[row.label]?.rejectedQuantity),
              rejectionReason: form.gradeQuality[row.label]?.rejectionReason || "",
              rejectionRemarks: form.gradeQuality[row.label]?.rejectionRemarks || "",
            },
          ])
        ),
        qualityRemarks: form.qualityRemarks,
      })
    );
    setConfirmOpen(true);
  };

  const confirmGrading = async () => {
    await run("confirm", () => confirmManagerQuality(orderId));
    setConfirmOpen(false);
  };

  if (!data && !error) return <p className="text-xs text-[#6B7280]">Loading quality inspection…</p>;
  if (!data) return <p className="text-xs text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      <p className="mb-1 break-words text-xs text-[#6B7280] print:hidden">
        <Link to="/manager/quality/pending" className="hover:text-[#217346]">Quality and Grading Manager</Link>
        <span> › {data.orderDisplayId}</span>
      </p>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <StatusBadge status={data.status} className="shrink-0" />
        <h1 className={`${EXCEL_PAGE_TITLE} min-w-0 shrink-0 text-[16px] sm:text-xl`}>Quality Inspection & Grading</h1>
        <p className={`${EXCEL_PAGE_SUB} min-w-0 truncate`}>{data.farmerName} · {data.productName}</p>
      </div>
      {data.status === "QUALITY_PENDING" ? (
        <div className="sticky top-0 z-10 -mx-3 bg-[#f3f6f4] px-3 py-2 print:hidden sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0">
          <button type="button" disabled={Boolean(busy)} className={`${EXCEL_BTN_PRIMARY} w-full sm:w-auto`} onClick={startCheck}>
            {busy === "start" ? "Starting…" : "Start Quality Check"}
          </button>
        </div>
      ) : null}
      <section className={EXCEL_PANEL}>
        <div className="px-2 py-3 sm:px-4">
          <QualityStatusTimeline status={data.status} />
        </div>
      </section>
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 print:hidden">{error}</div> : null}

      <section className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>1. Order Information</div>
        <div className="p-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Info label="Order ID" value={data.orderDisplayId} />
            <Info label="QR / Order Code" value={data.qrPayload} />
            <Info label="Farmer Name" value={data.farmerName} />
            <Info label="Product" value={data.productName} />
            <Info label="Variety" value={data.variety} />
            <Info label="Ordered Quantity" value={`${data.orderedQuantity} ${unit}`} />
            <Info label="Received Quantity" value={`${data.receivedQuantity} ${unit}`} />
            <Info label="Lot / Batch ID" value={data.batchId} />
            <Info label="Collection Centre" value={data.collectionCentre} />
            <Info label="Received Date" value={data.receivedDate} />
            <Info label="Received Time" value={data.receivedTime} />
            <Info label="Weight Verified" value={data.weightVerified ? "Yes" : "No"} />
          </div>
          {weightRows.length ? (
            <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Grade-wise Weight</p>
              <GradeWeightTable rows={weightRows} unit={unit} />
            </div>
          ) : null}
        </div>
      </section>

      <section className={`${EXCEL_PANEL} print:hidden`}>
        <div className={EXCEL_PANEL_HEAD}>2. Grade-wise Quality Check</div>
        <div className="space-y-2 p-3">
          {!started ? (
            <p className="text-[11px] text-[#9CA3AF]">Start quality check to inspect each grade.</p>
          ) : qualityGrades.length === 0 ? (
            <p className="text-[11px] text-[#9CA3AF]">No grades with weight to inspect.</p>
          ) : (
            qualityGrades.map((row) => {
              const gq = form.gradeQuality[row.label] || emptyGradeRow();
              const weight = gradeAssignQty(row.key) || gradeDisplayedWeight(row.label, weightRows, form[row.key]);
              const gradeOpen = Boolean(openGrades[row.label]);
              return (
                <div key={row.label} className={`overflow-hidden rounded-lg border ${GRADE_TONE[row.label] || "border-[#D4D4D4]"}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                    onClick={() =>
                      setOpenGrades((prev) => ({
                        ...prev,
                        [row.label]: !prev[row.label],
                      }))
                    }
                    aria-expanded={gradeOpen}
                  >
                    <p className="text-[13px] font-semibold text-[#1F2937]">{row.label}</p>
                    <span className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold tabular-nums text-[#1F2937]">
                        {weight} {unit}
                      </p>
                      <Chevron open={gradeOpen} />
                    </span>
                  </button>
                  {gradeOpen ? (
                  <div className="border-t border-black/5 px-2 pb-2">
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {PARAM_FIELDS.map((f) => (
                      <label key={f.key} className="text-[10px] font-semibold leading-tight text-[#4B5563]">
                        {f.label} *
                        <select
                          disabled={locked}
                          className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none focus:border-emerald-600"
                          value={gq.parameters[f.key] || ""}
                          onChange={(e) => setGradeParam(row.label, f.key, e.target.value)}
                        >
                          <option value="">Select</option>
                          {(options[f.key] || []).map((opt) => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                    <label className="text-[10px] font-semibold leading-tight text-[#4B5563]">
                      Rejected Quantity
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          disabled={locked}
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none focus:border-emerald-600"
                          inputMode="decimal"
                          value={gq.rejectedQuantity}
                          onChange={(e) => setGradePatch(row.label, { rejectedQuantity: e.target.value })}
                        />
                        <span className="shrink-0 text-[10px] text-[#6B7280]">{unit}</span>
                      </div>
                    </label>
                  </div>
                  {num(gq.rejectedQuantity) > 0 ? (
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                      <label className="text-[10px] font-semibold leading-tight text-[#4B5563]">
                        Reason *
                        <select
                          disabled={locked}
                          className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none focus:border-emerald-600"
                          value={gq.rejectionReason}
                          onChange={(e) => setGradePatch(row.label, { rejectionReason: e.target.value })}
                        >
                          <option value="">Select reason</option>
                          {(data.rejectionReasons || []).map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </label>
                      {gq.rejectionReason === "Other" ? (
                        <label className="text-[10px] font-semibold leading-tight text-[#4B5563]">
                          Other Reason *
                          <input
                            disabled={locked}
                            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none focus:border-emerald-600"
                            value={gq.rejectionRemarks}
                            onChange={(e) => setGradePatch(row.label, { rejectionRemarks: e.target.value })}
                          />
                        </label>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-1.5">
                    <p className="mb-1 text-[10px] font-semibold text-[#4B5563]">Photos</p>
                    <QualityPhotos
                      compact
                      photos={gq.photos || []}
                      onChange={(photos) => saveGradePhotos(row.label, photos)}
                      disabled={locked}
                    />
                    {!locked ? (
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        className={`${EXCEL_BTN_PRIMARY} mt-1.5 !min-h-8 w-full !rounded-lg !px-3 !py-1 !text-[11px] sm:w-auto`}
                        onClick={() => saveGradeCheck(row.label)}
                      >
                        {busy === `save-${row.label}` ? "Saving…" : "Save"}
                      </button>
                    ) : null}
                  </div>
                  </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className={`${EXCEL_PANEL} print:hidden`}>
        <div className={EXCEL_PANEL_HEAD}>3. Quality Remarks</div>
        <div className="p-3">
          <textarea disabled={locked || !started} rows={3} className={`w-full ${EXCEL_INPUT}`} placeholder="Additional observations" value={form.qualityRemarks} onChange={(e) => setForm((f) => ({ ...f, qualityRemarks: e.target.value }))} />
        </div>
      </section>

      <section id="final-report" className={EXCEL_PANEL}>
        <div className={EXCEL_PANEL_HEAD}>4. Final Summary</div>
        <div className="p-3">
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Info label="Order ID" value={data.orderDisplayId} />
            <Info label="Product" value={data.productName} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] table-fixed border-collapse text-left text-[10px] md:text-xs">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[26%]" />
                <col className="w-[26%]" />
                <col className="w-[26%]" />
              </colgroup>
              <thead>
                <tr className="bg-[#F8FAF8] text-[9px] font-bold uppercase tracking-wide text-[#6B7280] md:text-[10px]">
                  <th className="border border-[#E5E7EB] px-1.5 py-1.5 md:px-2 md:py-2">Grade</th>
                  <th className="border border-[#E5E7EB] px-1.5 py-1.5 text-right md:px-2 md:py-2">Ordered</th>
                  <th className="border border-[#E5E7EB] px-1.5 py-1.5 text-right md:px-2 md:py-2">Rejected</th>
                  <th className="border border-[#E5E7EB] px-1.5 py-1.5 text-right md:px-2 md:py-2">Final Received</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.length ? (
                  summaryRows.map((row) => (
                    <tr key={row.label} className={GRADE_TONE[row.label] || ""}>
                      <td className="border border-[#E5E7EB] px-1.5 py-1.5 font-semibold text-[#1F2937] md:px-2 md:py-2">{row.label}</td>
                      <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums md:px-2 md:py-2">
                        {row.ordered} {unit}
                      </td>
                      <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums md:px-2 md:py-2">
                        {row.rejected} {unit}
                      </td>
                      <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums md:px-2 md:py-2">
                        {row.finalReceived} {unit}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-[#9CA3AF] md:px-2 md:py-2" colSpan={4}>
                      No grade quantities yet.
                    </td>
                  </tr>
                )}
                <tr className="bg-[#F8FAF8] font-bold">
                  <td className="border border-[#E5E7EB] px-1.5 py-1.5 md:px-2 md:py-2">Total</td>
                  <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums md:px-2 md:py-2">
                    {(summaryTotals.ordered > 0 ? summaryTotals.ordered : data.orderedQuantity) || 0} {unit}
                  </td>
                  <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums md:px-2 md:py-2">
                    {summaryTotals.rejected} {unit}
                  </td>
                  <td className="border border-[#E5E7EB] px-1.5 py-1.5 text-right tabular-nums md:px-2 md:py-2">
                    {summaryTotals.finalReceived} {unit}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {started || locked ? (
        <div className="flex flex-col gap-2 print:hidden sm:flex-row sm:flex-wrap">
          {started && !locked ? (
            <button type="button" disabled={!canAssign || Boolean(busy)} className={`${EXCEL_BTN_PRIMARY} w-full sm:w-auto`} onClick={assignGrade}>
              Assign Grade
            </button>
          ) : null}
          {locked ? (
            <>
              <a href="#final-report" className={`${EXCEL_BTN} w-full sm:w-auto`}>View Final Report</a>
              <button type="button" className={`${EXCEL_BTN} w-full sm:w-auto`} onClick={() => window.print()}>Download Final Report</button>
            </>
          ) : null}
        </div>
      ) : null}

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
          <div className="w-full max-w-md border border-[#D4D4D4] bg-white p-5">
            <p className="text-sm font-bold text-[#1F2937]">Are you sure you want to assign these grades?</p>
            <div className="mt-3 space-y-1 text-xs text-[#374151]">
              {qualityGrades.map((row) => (
                <p key={`confirm-${row.label}`}>
                  {row.label} Quantity: {gradeAssignQty(row.key)} {unit} · Rejected: {num(form.gradeQuality[row.label]?.rejectedQuantity)} {unit} · Final: {Math.max(0, Math.round((gradeAssignQty(row.key) - num(form.gradeQuality[row.label]?.rejectedQuantity)) * 1000) / 1000)} {unit}
                </p>
              ))}
              <p>Total Rejected: {qualityGrades.reduce((sum, row) => sum + num(form.gradeQuality[row.label]?.rejectedQuantity), 0)} {unit}</p>
            </div>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={`${EXCEL_BTN} w-full sm:w-auto`} onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button type="button" disabled={Boolean(busy)} className={`${EXCEL_BTN_PRIMARY} w-full sm:w-auto`} onClick={confirmGrading}>
                {busy === "confirm" ? "Confirming…" : "Confirm Grading"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
