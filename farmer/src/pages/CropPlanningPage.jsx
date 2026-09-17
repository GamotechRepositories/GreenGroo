import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getCropPlans, updateCropPlan, updateCrop } from "../api/farmerApi";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import { formatCropDate, formatCropBusinessId } from "../utils/cropLinks";
import CopyId from "../components/ui/CopyId";
import { CROP_STATUSES, CERTIFICATE_TYPES } from "../utils/constants";
import Modal from "../components/ui/Modal";
import FileUpload from "../components/ui/FileUpload";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
} from "../utils/excelStyles";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getCertIcon(type = "") {
  const t = String(type).toLowerCase();
  if (t.includes("soil")) return "🧪";
  if (t.includes("organic")) return "🌿";
  if (t.includes("water")) return "💧";
  if (t.includes("insurance")) return "🛡️";
  if (t.includes("7/12") || t.includes("land")) return "📜";
  if (t.includes("pesticide") || t.includes("residue")) return "🌱";
  if (t.includes("gap") || t.includes("apeda") || t.includes("quality")) return "🏅";
  if (t.includes("harvest") || t.includes("inspection")) return "📋";
  return "📄";
}

function CropPlanningPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [expandedTimeline, setExpandedTimeline] = useState({});

  // Certificate upload modal state
  const [certModalPlan, setCertModalPlan] = useState(null);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [previewCert, setPreviewCert] = useState(null);
  const [certForm, setCertForm] = useState({
    type: "Soil Testing Report",
    name: "",
    certNumber: "",
    labName: "",
    issueDate: new Date().toISOString().slice(0, 10),
    file: null,
    fileName: "",
    fileUrl: "",
    autoAdvanceStage: true,
  });

  const openCertModal = (plan, preselectedType = "Soil Testing Report") => {
    setCertModalPlan(plan);
    setCertForm({
      type: preselectedType,
      name: "",
      certNumber: "",
      labName: "",
      issueDate: new Date().toISOString().slice(0, 10),
      file: null,
      fileName: "",
      fileUrl: "",
      autoAdvanceStage: true,
    });
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCropPlans();
      setPlans(data);
    } catch (err) {
      toast.error(err.message || "Failed to load crop plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleTimeline = (id) => {
    setExpandedTimeline((prev) => ({ ...prev, [id]: prev[id] === false }));
  };

  const handleUpdateStatus = async (plan, newStatus) => {
    const id = plan.planId || plan.id;
    if (plan.status === newStatus) return;
    setUpdatingId(id);
    try {
      await updateCropPlan(id, { status: newStatus });
      setPlans((prev) =>
        prev.map((p) =>
          (p.planId === id || p.id === id) ? { ...p, status: newStatus } : p
        )
      );
      toast.success(`Stage updated to "${newStatus}"`);
    } catch (err) {
      try {
        if (plan.cropId) {
          await updateCrop(plan.cropId, { status: newStatus });
          setPlans((prev) =>
            prev.map((p) =>
              (p.planId === id || p.id === id) ? { ...p, status: newStatus } : p
            )
          );
          toast.success(`Stage updated to "${newStatus}"`);
          return;
        }
      } catch {}
      toast.error(err.message || "Failed to update stage");
    } finally {
      setUpdatingId("");
    }
  };

  const handleUploadCert = async (e) => {
    e.preventDefault();
    if (!certModalPlan) return;
    if (!certForm.fileName && !certForm.file) {
      toast.error("Please select a file to upload");
      return;
    }
    setUploadingCert(true);
    try {
      let fileUrl = certForm.fileUrl;
      if (certForm.file && !fileUrl) {
        fileUrl = await fileToDataUrl(certForm.file);
      }
      const newCert = {
        id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: certForm.type,
        name: certForm.name || certForm.type,
        fileName: certForm.fileName || certForm.file?.name || "document.pdf",
        fileUrl,
        certNumber: certForm.certNumber || "",
        labName: certForm.labName || "",
        issueDate: certForm.issueDate || new Date().toISOString().slice(0, 10),
        uploadedAt: new Date().toISOString(),
      };

      const planId = certModalPlan.planId || certModalPlan.id;
      const currentCerts = certModalPlan.certificates || [];
      const updatedCerts = [newCert, ...currentCerts];

      const payload = { certificates: updatedCerts };
      let updatedStatus = certModalPlan.status;
      if (certForm.autoAdvanceStage && certForm.type.toLowerCase().includes("soil")) {
        payload.status = "Soil Report Uploaded";
        updatedStatus = "Soil Report Uploaded";
      }

      await updateCropPlan(planId, payload);

      setPlans((prev) =>
        prev.map((p) =>
          (p.planId === planId || p.id === planId)
            ? { ...p, certificates: updatedCerts, status: updatedStatus }
            : p
        )
      );

      toast.success(`${certForm.type} uploaded successfully!`);
      setCertModalPlan(null);
    } catch (err) {
      toast.error(err.message || "Failed to upload certificate");
    } finally {
      setUploadingCert(false);
    }
  };

  const handleDeleteCert = async (plan, certId) => {
    if (!window.confirm("Are you sure you want to remove this certificate?")) return;
    const planId = plan.planId || plan.id;
    const updatedCerts = (plan.certificates || []).filter((c) => c.id !== certId);
    try {
      await updateCropPlan(planId, { certificates: updatedCerts });
      setPlans((prev) =>
        prev.map((p) =>
          (p.planId === planId || p.id === planId)
            ? { ...p, certificates: updatedCerts }
            : p
        )
      );
      toast.success("Certificate removed");
    } catch (err) {
      toast.error(err.message || "Failed to remove certificate");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Crop Planning</h1>
          <p className={EXCEL_PAGE_SUB}>Track and update lifecycle stages for each crop plan (all 28 stages workable).</p>
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
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => {
            const id = plan.planId || plan.id;
            const isTimelineOpen = expandedTimeline[id] !== false;
            const currentIdx = CROP_STATUSES.indexOf(plan.status);
            const isUpdating = updatingId === id;

            return (
              <section key={id} className={`${EXCEL_PANEL} p-3.5 space-y-3`}>
                {/* Crop info & quick stage actions */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#1F2937]">{plan.cropName || "Crop"}</p>
                      <PlanningStatusBadge status={plan.status} />
                    </div>
                    <CopyId value={formatCropBusinessId(plan)} className="mt-0.5" textClassName="font-mono text-[11px] font-semibold tracking-wide text-emerald-700" />
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      {plan.variety || "—"} • Sowing {formatCropDate(plan.sowingDate)} • Harvest{" "}
                      {formatCropDate(plan.harvestDate || plan.expectedHarvestDate)}
                    </p>
                  </div>

                  {/* Stage Dropdown, Next Stage & Certificate Upload Button */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <select
                      value={plan.status || "Planning Created"}
                      disabled={isUpdating}
                      onChange={(e) => handleUpdateStatus(plan, e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 shadow-xs transition hover:border-emerald-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 max-w-[170px]"
                      title="Select any of the 28 stages"
                    >
                      {CROP_STATUSES.map((st, sIdx) => (
                        <option key={st} value={st}>
                          {sIdx + 1}. {st}
                        </option>
                      ))}
                    </select>

                    {currentIdx >= 0 && currentIdx < CROP_STATUSES.length - 1 && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(plan, CROP_STATUSES[currentIdx + 1])}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[11px] font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-60"
                        title={`Advance to ${CROP_STATUSES[currentIdx + 1]}`}
                      >
                        {isUpdating ? (
                          "Updating…"
                        ) : (
                          <>
                            Next Stage
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => openCertModal(plan)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 bg-emerald-50 px-2 py-1.5 text-[11px] font-bold text-emerald-800 shadow-xs transition hover:bg-emerald-100 disabled:opacity-60"
                      title="Upload Certificate / Soil Report"
                    >
                      📜 Certificate
                    </button>
                  </div>
                </div>

                {/* Uploaded Certificates List for this crop */}
                {plan.certificates && plan.certificates.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        📜 Uploaded Certificates & Reports ({plan.certificates.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => openCertModal(plan)}
                        className="text-[10px] font-semibold text-emerald-700 hover:underline"
                      >
                        + Upload Another
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.certificates.map((cert) => (
                        <div
                          key={cert.id}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] shadow-2xs"
                        >
                          <span>{getCertIcon(cert.type)}</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[150px]">{cert.name || cert.type}</span>
                          {cert.certNumber && (
                            <span className="text-[10px] text-slate-400">#{cert.certNumber}</span>
                          )}
                          {cert.fileUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewCert(cert)}
                              className="text-[10px] font-bold text-emerald-700 hover:underline ml-1"
                            >
                              View
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteCert(plan, cert.id)}
                            className="text-slate-400 hover:text-red-500 font-bold ml-1 text-xs"
                            title="Delete certificate"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Planning Status Timeline Toggle */}
                <button
                  type="button"
                  onClick={() => toggleTimeline(id)}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  <svg className={`h-3.5 w-3.5 shrink-0 transition-transform ${isTimelineOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="flex-1 text-left">Planning Status Timeline (Click any stage to update)</span>
                  <PlanningProgress status={plan.status} />
                </button>

                {isTimelineOpen && (
                  <PlanningTimeline
                    currentStatus={plan.status}
                    isUpdating={isUpdating}
                    onSelectStatus={(st) => handleUpdateStatus(plan, st)}
                    onOpenCertModal={(type) => openCertModal(plan, type)}
                  />
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Upload Certificate Modal */}
      <Modal
        open={Boolean(certModalPlan)}
        title={`Upload Certificate / Report — ${certModalPlan?.cropName || "Crop"}`}
        onClose={() => setCertModalPlan(null)}
      >
        <form onSubmit={handleUploadCert} className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-slate-700">Certificate / Document Type *</label>
            <select
              value={certForm.type}
              onChange={(e) => setCertForm((p) => ({ ...p, type: e.target.value, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Soil Testing Report">🧪 Soil Testing Report (मृदा चाचणी अहवाल)</option>
              <option value="Organic Farming Certificate">🌿 Organic Farming Certificate (सेंद्रिय शेती प्रमाणपत्र)</option>
              <option value="Water Testing Report">💧 Water Testing Report (पाणी चाचणी अहवाल)</option>
              <option value="7/12 & 8-A Land Extract">📜 7/12 & 8-A Extract (७/१२ व ८-अ उतारा)</option>
              <option value="Crop Insurance Certificate">🛡️ Crop Insurance Certificate (पीक विमा पावती)</option>
              <option value="Pesticide Residue Free Certificate">🌱 Pesticide Residue Free Certificate (कीटकनाशक अवशेषमुक्त अहवाल)</option>
              <option value="GAP / APEDA Quality Certificate">🏅 GAP / APEDA Quality Certificate (जीएपी / गुणवत्ता प्रमाणपत्र)</option>
              <option value="Pre-Harvest Inspection Report">📋 Pre-Harvest Inspection Report (कापणीपूर्व तपासणी अहवाल)</option>
              <option value="Other Agricultural Certificate">📄 Other Agricultural Certificate (इतर कृषी प्रमाणपत्र)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold text-slate-700">Testing Lab / Authority Name</label>
              <input
                type="text"
                value={certForm.labName}
                onChange={(e) => setCertForm((p) => ({ ...p, labName: e.target.value }))}
                placeholder="e.g. Krishi Vigyan Kendra"
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-700">Certificate / Report Number</label>
              <input
                type="text"
                value={certForm.certNumber}
                onChange={(e) => setCertForm((p) => ({ ...p, certNumber: e.target.value }))}
                placeholder="e.g. STR-2026-0042"
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">Issue / Testing Date</label>
            <input
              type="date"
              value={certForm.issueDate}
              onChange={(e) => setCertForm((p) => ({ ...p, issueDate: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">Select Certificate File (PDF / Image) *</label>
            <FileUpload
              label=""
              accept=".pdf,.jpg,.jpeg,.png"
              currentFileName={certForm.fileName}
              onSelect={(file) => setCertForm((p) => ({ ...p, file, fileName: file.name }))}
            />
          </div>

          {certForm.type.toLowerCase().includes("soil") && (
            <label className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-800 border border-emerald-200 cursor-pointer">
              <input
                type="checkbox"
                checked={certForm.autoAdvanceStage}
                onChange={(e) => setCertForm((p) => ({ ...p, autoAdvanceStage: e.target.checked }))}
                className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
              />
              Automatically advance crop stage to "Soil Report Uploaded"
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={uploadingCert}
              onClick={() => setCertModalPlan(null)}
              className={`${EXCEL_BTN} px-3 py-1.5`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingCert || !certForm.fileName}
              className={`${EXCEL_BTN_PRIMARY} px-4 py-1.5 flex items-center gap-1`}
            >
              {uploadingCert ? "Uploading…" : "Upload Certificate"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Certificate Preview Modal */}
      <Modal
        open={Boolean(previewCert)}
        title={previewCert?.name || "Certificate Preview"}
        onClose={() => setPreviewCert(null)}
        size="lg"
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <p className="font-bold text-slate-900 text-sm">{previewCert?.name}</p>
              <p className="text-slate-500">{previewCert?.labName ? `Lab: ${previewCert.labName} • ` : ""}Issued: {previewCert?.issueDate}</p>
            </div>
            {previewCert?.fileUrl && (
              <a
                href={previewCert.fileUrl}
                download={previewCert.fileName || "certificate"}
                target="_blank"
                rel="noreferrer"
                className={`${EXCEL_BTN_PRIMARY} px-2.5 py-1 text-[11px]`}
              >
                Download / Open
              </a>
            )}
          </div>
          {previewCert?.fileUrl?.startsWith("data:image/") ? (
            <img src={previewCert.fileUrl} alt={previewCert.name} className="max-h-[500px] w-full object-contain rounded-lg border border-slate-200" />
          ) : previewCert?.fileUrl ? (
            <iframe src={previewCert.fileUrl} title={previewCert.name} className="h-[450px] w-full rounded-lg border border-slate-200" />
          ) : (
            <p className="text-slate-400 py-8 text-center">No file preview available.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ─── Status badge with color ─── */
const STATUS_COLORS = {
  "Planning Created": { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  "Soil Testing Pending": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Soil Testing Completed": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Soil Report Uploaded": { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  "Soil Report Under Review": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Soil Report Approved": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Land Preparation": { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  "Crop & Variety Selected": { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  "Seed/Input Planning": { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  "Sowing/Plantation Started": { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  "Sowing/Plantation Completed": { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  "Crop Growing": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "Irrigation in Progress": { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  "Fertilizer Application": { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  "Pesticide Application": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Pest/Disease Monitoring": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Field Inspection Pending": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Field Inspection Completed": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Crop Growth Monitoring": { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  "Pre-Harvest Inspection": { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  "Harvest Readiness": { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  "Ready for Harvest": { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  "Harvesting Started": { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  "Harvesting In Progress": { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  "Harvesting Completed": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Harvest Quantity Recorded": { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  "Harvest Batch Created": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Completed": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};
const DEFAULT_COLOR = { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };

function PlanningStatusBadge({ status }) {
  const c = STATUS_COLORS[status] || DEFAULT_COLOR;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status || "—"}
    </span>
  );
}

/* ─── Progress indicator ─── */
function PlanningProgress({ status }) {
  const currentIdx = CROP_STATUSES.indexOf(status);
  const total = CROP_STATUSES.length;
  const completed = currentIdx >= 0 ? currentIdx + 1 : 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
      {completed}/{total}
      <span className="inline-block h-1.5 w-12 rounded-full bg-slate-200 overflow-hidden">
        <span
          className="block h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}

/* ─── Planning timeline stepper (Workable) ─── */
function PlanningTimeline({ currentStatus, onSelectStatus, isUpdating, onOpenCertModal }) {
  const currentIdx = CROP_STATUSES.indexOf(currentStatus);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 max-h-[360px] overflow-y-auto farmer-scrollbar shadow-inner">
      <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5 text-[11px] font-semibold text-slate-500">
        <span>Click any stage below to set current status:</span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          28 Workable Stages
        </span>
      </div>

      <div className="space-y-0.5">
        {CROP_STATUSES.map((status, i) => {
          const isCompleted = currentIdx >= 0 && i < currentIdx;
          const isCurrent = i === currentIdx;
          const isUpcoming = currentIdx >= 0 ? i > currentIdx : true;

          return (
            <div
              key={status}
              onClick={() => !isCurrent && !isUpdating && onSelectStatus(status)}
              className={`group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-all ${
                isCurrent
                  ? "bg-emerald-50/90 border border-emerald-300 shadow-xs"
                  : isUpdating
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-slate-50 cursor-pointer"
              }`}
              title={isCurrent ? "Current active stage" : `Click to set status to "${status}"`}
            >
              {/* Left indicator + label */}
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Dot / Number / Check indicator */}
                <div
                  className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCompleted
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isCurrent
                        ? "border-emerald-600 bg-white shadow-xs"
                        : "border-slate-300 bg-white group-hover:border-emerald-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent ? (
                    <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-emerald-600">
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Stage title */}
                <span
                  className={`text-[11px] leading-tight truncate ${
                    isCurrent
                      ? "font-bold text-emerald-950"
                      : isCompleted
                        ? "font-semibold text-emerald-700"
                        : "font-medium text-slate-600 group-hover:text-slate-900"
                  }`}
                >
                  {i + 1}. {status}
                </span>
              </div>

              {/* Right Action / Badge */}
              <div className="shrink-0 flex items-center gap-1.5">
                {status === "Soil Report Uploaded" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCertModal?.("Soil Testing Report");
                    }}
                    className="rounded-md border border-emerald-600 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 hover:bg-emerald-100"
                    title="Upload Soil Testing Report"
                  >
                    + Soil Report
                  </button>
                )}
                {status === "Pre-Harvest Inspection" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCertModal?.("Pre-Harvest Inspection Report");
                    }}
                    className="rounded-md border border-purple-600 bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 hover:bg-purple-100"
                    title="Upload Pre-Harvest Inspection Report"
                  >
                    + Inspection Report
                  </button>
                )}

                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    Current Stage
                  </span>
                ) : isCompleted ? (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStatus(status);
                    }}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    Move Here
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStatus(status);
                    }}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition rounded-md border border-emerald-600 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white"
                  >
                    Set Active
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CropPlanningPage;
