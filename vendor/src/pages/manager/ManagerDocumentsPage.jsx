import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getManagerAllDocuments,
  updateManagerFarmerDocumentStatus,
} from "../../api/managerPortApi";
import { DOCUMENT_TYPES } from "../../utils/constants";
import {
  EXCEL_PANEL,
  EXCEL_INPUT,
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
  EXCEL_BTN,
} from "../../utils/excelStyles";

const STATUS_COLORS = {
  Approved: "bg-green-100 text-green-700 border border-green-300",
  Pending: "bg-amber-100 text-amber-800 border border-amber-300",
  Rejected: "bg-red-100 text-red-700 border border-red-300",
  "Not Uploaded": "bg-gray-100 text-gray-500",
};

const REJECTION_PRESETS = [
  "अस्पष्ट किंवा अस्पष्ट वाचता येणारा फोटो (Unclear or blurry document photo)",
  "कागदपत्रावरील नाव शेतकरी नावाशी जुळत नाही (Name does not match farmer profile)",
  "कालबाह्य किंवा चुकीचे कागदपत्र (Invalid or expired document)",
  "कागदपत्राचा पूर्ण भाग दिसत नाही / कडा कापल्या आहेत (Incomplete page or edges cut off)",
  "चुकीच्या प्रकारात अपलोड केले आहे (Uploaded under wrong document category)",
];

function mergeFarmerDocs(docs = []) {
  const map = Object.fromEntries((docs || []).map((d) => [d.type, d]));
  return DOCUMENT_TYPES.map((t) => ({
    id: map[t.id]?.id || `missing-${t.id}`,
    type: t.id,
    name: t.name,
    fileName: map[t.id]?.fileName || "",
    fileUrl: map[t.id]?.fileUrl || "",
    uploadedAt: map[t.id]?.uploadedAt || null,
    status: map[t.id]?.status || "Not Uploaded",
    rejectionReason: map[t.id]?.rejectionReason || "",
  }));
}

export default function ManagerDocumentsPage() {
  const [farmers, setFarmers] = useState([]);
  const [docsByFarmer, setDocsByFarmer] = useState({});
  const [loading, setLoading] = useState(true);
  const [farmerFilter, setFarmerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [viewDoc, setViewDoc] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { farmerId, farmerName, docId, docName }
  const [rejectReason, setRejectReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await getManagerAllDocuments();
      const fs = Array.isArray(data?.farmers) ? data.farmers : [];
      const docs = Array.isArray(data?.documents) ? data.documents : [];
      setFarmers(fs);
      const map = {};
      docs.forEach((doc) => {
        if (!map[doc.farmerId]) map[doc.farmerId] = [];
        map[doc.farmerId].push(doc);
      });
      setDocsByFarmer(map);
    } catch {
      setFarmers([]);
      setDocsByFarmer({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleApprove = async (farmerId, docId, docName) => {
    if (!docId || String(docId).startsWith("missing-")) {
      toast.error("Upload a file before approving");
      return;
    }
    setSubmittingAction(true);
    try {
      await updateManagerFarmerDocumentStatus(farmerId, docId, "Approved", "");
      toast.success(`${docName} approved successfully ✓`);
      await loadDocs();
    } catch (err) {
      toast.error(err?.message || "Failed to approve document");
    } finally {
      setSubmittingAction(false);
    }
  };

  const openRejectModal = (farmerId, farmerName, docId, docName) => {
    if (!docId || String(docId).startsWith("missing-")) {
      toast.error("Cannot reject a document that is not uploaded");
      return;
    }
    setRejectModal({ farmerId, farmerName, docId, docName });
    setRejectReason("");
  };

  const handleConfirmReject = async (e) => {
    e?.preventDefault();
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      toast.error("कृपया रिजेक्शनचे कारण निवडा किंवा लिहा (Please provide a rejection reason)");
      return;
    }
    setSubmittingAction(true);
    try {
      await updateManagerFarmerDocumentStatus(
        rejectModal.farmerId,
        rejectModal.docId,
        "Rejected",
        rejectReason.trim()
      );
      toast.success(`${rejectModal.docName} rejected with reason`);
      setRejectModal(null);
      setRejectReason("");
      await loadDocs();
    } catch (err) {
      toast.error(err?.message || "Failed to reject document");
    } finally {
      setSubmittingAction(false);
    }
  };

  const displayFarmers = farmerFilter ? farmers.filter((f) => f.id === farmerFilter) : farmers;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Farmer Documents & Verification (कागदपत्र पडताळणी)</h1>
          <p className={EXCEL_PAGE_SUB}>
            Review farmer KYC documents, Approve, or Reject with specific feedback reasons
          </p>
        </div>
        <button
          onClick={loadDocs}
          disabled={loading}
          className={`${EXCEL_BTN} self-start text-xs font-semibold`}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={farmerFilter}
          onChange={(e) => setFarmerFilter(e.target.value)}
          className={`${EXCEL_INPUT} max-w-xs`}
        >
          <option value="">All Farmers ({farmers.length})</option>
          {farmers.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.id})
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${EXCEL_INPUT} max-w-xs`}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending Review ⏳</option>
          <option value="Approved">Approved ✓</option>
          <option value="Rejected">Rejected ❌</option>
          <option value="Not Uploaded">Not Uploaded ⚠️</option>
        </select>
      </div>

      {loading && <p className="text-xs text-[#6B7280]">Loading documents…</p>}

      {!loading && farmers.length === 0 ? (
        <p className="text-xs text-[#6B7280]">No farmers found.</p>
      ) : null}

      {displayFarmers.map((f) => {
        let docs = mergeFarmerDocs(docsByFarmer[f.id] || []);
        if (statusFilter) {
          docs = docs.filter((d) => d.status === statusFilter);
        }
        if (docs.length === 0 && statusFilter) return null;

        const approvedCount = docs.filter((d) => d.status === "Approved").length;
        const pendingCount = docs.filter((d) => d.status === "Pending").length;
        const rejectedCount = docs.filter((d) => d.status === "Rejected").length;

        return (
          <div key={f.id} className={EXCEL_PANEL}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4D4D4] bg-[#F8FAFC] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🧑‍🌾</span>
                <div>
                  <p className="text-xs font-bold text-[#1F2937]">{f.name}</p>
                  <p className="text-[10px] text-[#64748B]">
                    Farmer ID: {f.id} • {approvedCount} Approved • {pendingCount} Pending • {rejectedCount} Rejected
                  </p>
                </div>
              </div>
              <Link to={`/vendor/all-farmers/${f.id}`} className={`${EXCEL_BTN} text-[10px]`}>
                View Profile →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F2F2F2] text-left">
                    {["Document", "Type", "File & Preview", "Upload Date", "Status & Feedback", "Verification Actions"].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => {
                    const busy = submittingAction;
                    const isPdf = doc.fileName?.toLowerCase().endsWith(".pdf") || doc.fileUrl?.startsWith("data:application/pdf");

                    return (
                      <tr key={doc.type} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                        <td className="px-3 py-2.5 font-semibold text-[#0F172A]">{doc.name}</td>
                        <td className="px-3 py-2.5 capitalize text-[#475569]">{doc.type}</td>
                        <td className="px-3 py-2.5">
                          {doc.fileUrl ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{isPdf ? "📄" : "🖼️"}</span>
                              <button
                                type="button"
                                onClick={() => setViewDoc({ ...doc, farmerId: f.id, farmerName: f.name })}
                                className="text-xs font-medium text-[#217346] underline hover:text-[#165030] text-left truncate max-w-[150px]"
                                title={doc.fileName || "View Document"}
                              >
                                {doc.fileName || "View File"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#94A3B8] italic">कागदपत्र अपलोड केलेले नाही</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-[#6B7280]">
                          {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="space-y-1">
                            <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[doc.status] || "bg-gray-100 text-gray-600"}`}>
                              {doc.status}
                            </span>
                            {doc.status === "Rejected" && doc.rejectionReason && (
                              <p className="text-[10px] text-red-600 font-medium bg-red-50 p-1 rounded border border-red-200">
                                <strong>Reason:</strong> {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {doc.fileUrl ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setViewDoc({ ...doc, farmerId: f.id, farmerName: f.name })}
                                  className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300"
                                >
                                  👁️ View
                                </button>

                                {doc.status !== "Approved" && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleApprove(f.id, doc.id, doc.name)}
                                    className="rounded bg-green-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-green-700 shadow-sm disabled:opacity-50"
                                  >
                                    ✓ Approve
                                  </button>
                                )}

                                {doc.status !== "Rejected" && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => openRejectModal(f.id, f.name, doc.id, doc.name)}
                                    className="rounded bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-700 shadow-sm disabled:opacity-50"
                                  >
                                    ✕ Reject
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-[10.5px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                ⏳ शेतकरी अपलोड प्रलंबित
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* View Document Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">{viewDoc.name}</h3>
                <p className="text-[11px] text-[#64748B]">Farmer: {viewDoc.farmerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewDoc(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-50 flex items-center justify-center min-h-[300px]">
              {viewDoc.fileUrl?.startsWith("data:application/pdf") || viewDoc.fileName?.toLowerCase().endsWith(".pdf") ? (
                <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-red-200 max-w-md">
                  <span className="text-5xl">📄</span>
                  <h4 className="mt-3 text-sm font-bold text-slate-800">{viewDoc.fileName || "PDF Document"}</h4>
                  <p className="mt-1 text-xs text-slate-500">PDF File Document</p>
                  <a
                    href={viewDoc.fileUrl}
                    download={viewDoc.fileName || `${viewDoc.type}.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#217346] px-4 py-2 text-xs font-bold text-white hover:bg-[#165030]"
                  >
                    ⬇️ Download / Open PDF
                  </a>
                </div>
              ) : (
                <img
                  src={viewDoc.fileUrl}
                  alt={viewDoc.name}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-sm border border-slate-200"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[viewDoc.status] || "bg-gray-100"}`}>
                  Status: {viewDoc.status}
                </span>
                {viewDoc.status === "Rejected" && viewDoc.rejectionReason && (
                  <span className="text-xs text-red-600">Reason: {viewDoc.rejectionReason}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {viewDoc.status !== "Approved" && (
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => {
                      handleApprove(viewDoc.farmerId, viewDoc.id, viewDoc.name);
                      setViewDoc(null);
                    }}
                    className="rounded bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 shadow-sm disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                )}
                {viewDoc.status !== "Rejected" && (
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => {
                      const fId = viewDoc.farmerId;
                      const fName = viewDoc.farmerName;
                      const dId = viewDoc.id;
                      const dName = viewDoc.name;
                      setViewDoc(null);
                      openRejectModal(fId, fName, dId, dName);
                    }}
                    className="rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm disabled:opacity-50"
                  >
                    ✕ Reject
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewDoc(null)}
                  className={`${EXCEL_BTN} text-xs`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Document Modal with Rejection Reason */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="text-sm font-bold text-red-800">
                    Reject Document (कागदपत्र अमान्य करा)
                  </h3>
                  <p className="text-[11px] text-red-600">
                    {rejectModal.docName} • Farmer: {rejectModal.farmerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Quick Reason Presets (नमुना कारण निवडा):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REJECTION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectReason(preset)}
                      className={`text-left text-[11px] px-2 py-1 rounded-md border transition-colors ${
                        rejectReason === preset
                          ? "bg-red-600 text-white border-red-600 font-bold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Rejection Reason Details (शेतकऱ्यास दाखवायचे अचूक कारण) *:
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="उदा. आधार कार्डवरील फोटो किंवा जन्मतारीख स्पष्ट दिसत नाही, कृपया स्पष्ट फोटो अपलोड करा..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className={`${EXCEL_BTN} text-xs`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !rejectReason.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 shadow-sm"
                >
                  {submittingAction ? "Rejecting…" : "Confirm Reject (अमान्य करा ❌)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
