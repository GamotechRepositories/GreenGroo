import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getManagerAllDocuments,
  uploadManagerFarmerDocument,
} from "../../api/farmerApi";
import { DOCUMENT_TYPES } from "../../utils/constants";
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  CreditCard,
  Landmark,
  MapPin,
  File,
  Search,
  ShieldCheck,
  ArrowRight,
  Eye,
  RefreshCw,
  Upload,
  X,
  Phone,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mergeFarmerDocs(docs = []) {
  const map = Object.fromEntries((docs || []).map((d) => [d.type, d]));
  
  // All standard documents that a farmer can upload in the Farmer App
  const standardDocs = DOCUMENT_TYPES.map((t) => ({
    id: map[t.id]?.id || `missing-${t.id}`,
    type: t.id,
    name: t.name,
    marathi: t.marathi || "",
    fullName: t.marathi ? `${t.name} (${t.marathi})` : t.name,
    icon: t.icon || "📄",
    required: t.required || false,
    fileName: map[t.id]?.fileName || "",
    fileUrl: map[t.id]?.fileUrl || "",
    uploadedAt: map[t.id]?.uploadedAt || null,
    status: map[t.id]?.status || "Not Uploaded",
  }));

  // Extra documents/certificates uploaded by the farmer (e.g. soil report, organic cert)
  const standardIds = new Set(DOCUMENT_TYPES.map((t) => t.id));
  const extraDocs = (docs || [])
    .filter((d) => !standardIds.has(d.type))
    .map((d) => ({
      id: d.id || d._id || `extra-${d.type}`,
      type: d.type,
      name: d.name || d.type,
      marathi: "",
      fullName: d.name || d.type,
      icon: "📋",
      required: false,
      fileName: d.fileName || "",
      fileUrl: d.fileUrl || "",
      uploadedAt: d.uploadedAt || null,
      status: d.status || "Pending",
    }));

  return [...standardDocs, ...extraDocs];
}

function getFarmerDocSummary(docs = []) {
  const total = docs.length;
  const uploaded = docs.filter((d) => Boolean(d.fileName)).length;
  const approved = docs.filter((d) => d.status === "Approved").length;
  const pending = docs.filter((d) => d.status === "Pending").length;
  const rejected = docs.filter((d) => d.status === "Rejected").length;
  const missing = total - uploaded;

  return { total, uploaded, approved, pending, rejected, missing };
}

export default function ManagerDocumentsPage() {
  const [farmers, setFarmers] = useState([]);
  const [docsByFarmer, setDocsByFarmer] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFarmerForModal, setSelectedFarmerForModal] = useState(null);
  const [uploadingKey, setUploadingKey] = useState("");

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

  const handleUpload = async (farmerId, type, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be 5MB or smaller");
      return;
    }
    const key = `${farmerId}-${type}`;
    setUploadingKey(key);
    try {
      const url = await fileToDataUrl(file);
      await uploadManagerFarmerDocument(farmerId, type, { name: file.name, url });
      toast.success(`${file.name} uploaded successfully!`);
      await loadDocs();
    } catch (err) {
      toast.error(err?.message || "Failed to upload document");
    } finally {
      setUploadingKey("");
    }
  };

  // Filtered farmers
  const filteredFarmers = useMemo(() => {
    return farmers.filter((f) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = f.name?.toLowerCase().includes(q);
        const matchesLocation = f.farmLocation?.toLowerCase().includes(q) || f.location?.toLowerCase().includes(q);
        const matchesPhone = f.phone?.toLowerCase().includes(q);
        const matchesCode = (f.farmerCode || f.id || "").toLowerCase().includes(q);
        if (!matchesName && !matchesLocation && !matchesPhone && !matchesCode) return false;
      }
      if (statusFilter !== "all") {
        const fDocs = mergeFarmerDocs(docsByFarmer[f.id] || []);
        const summary = getFarmerDocSummary(fDocs);
        if (statusFilter === "verified" && summary.approved !== summary.total) return false;
        if (statusFilter === "pending" && summary.pending === 0) return false;
        if (statusFilter === "missing" && summary.missing === 0) return false;
      }
      return true;
    });
  }, [farmers, searchQuery, statusFilter, docsByFarmer]);

  // Overall Statistics for KPI strip
  const stats = useMemo(() => {
    let totalUploaded = 0;
    let totalApproved = 0;
    let totalPending = 0;
    let totalMissing = 0;

    farmers.forEach((f) => {
      const fDocs = mergeFarmerDocs(docsByFarmer[f.id] || []);
      fDocs.forEach((d) => {
        if (d.status === "Approved") totalApproved += 1;
        else if (d.status === "Pending") totalPending += 1;
        else totalMissing += 1;
        if (d.fileName) totalUploaded += 1;
      });
    });

    return { totalUploaded, totalApproved, totalPending, totalMissing };
  }, [farmers, docsByFarmer]);

  // Selected farmer docs for modal
  const modalFarmerDocs = useMemo(() => {
    if (!selectedFarmerForModal) return [];
    return mergeFarmerDocs(docsByFarmer[selectedFarmerForModal.id] || []);
  }, [selectedFarmerForModal, docsByFarmer]);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-[#217346]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900 sm:text-lg">
              Farmer Documents & KYC Hub
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            View all documents uploaded by farmers from the Farmer App (7/12 उतारा, 8-A, आधार, बँक पासबुक, शेतकरी ID). Verification is conducted by Admin.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDocs}
          className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#217346]" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
            <span>Total Farmers</span>
            <Users className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">{farmers.length}</p>
          <p className="text-[10px] text-slate-500">Assigned farmers</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
            <span>Uploaded Files</span>
            <FileText className="h-3.5 w-3.5 text-[#217346]" />
          </div>
          <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">{stats.totalUploaded}</p>
          <p className="text-[10px] text-emerald-700 font-medium">Uploaded by farmers</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
            <span>Admin Approved</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-emerald-700 tabular-nums">{stats.totalApproved}</p>
          <p className="text-[10px] text-slate-500">Compliant & verified</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
            <span>Pending Review</span>
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-amber-700 tabular-nums">{stats.totalPending}</p>
          <p className="text-[10px] text-amber-800 font-medium">Awaiting admin review</p>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search farmers by name, location, mobile, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#217346] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-[#217346] focus:outline-none font-medium"
          >
            <option value="all">All Farmers ({farmers.length})</option>
            <option value="pending">Pending Admin Review</option>
            <option value="missing">Needs Document Uploads</option>
            <option value="verified">Fully Verified</option>
          </select>
        </div>
      </div>

      {/* Loading & Empty States */}
      {loading && (
        <div className="py-12 text-center text-xs text-slate-500">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#217346] mb-2" />
          Loading farmer documents…
        </div>
      )}

      {!loading && filteredFarmers.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
          No farmers found matching the search criteria.
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4 FARMER CARDS IN 1 ROW (Showing All Farmer App Documents)               */}
      {/* ========================================================================= */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFarmers.map((farmer) => {
            const docs = mergeFarmerDocs(docsByFarmer[farmer.id] || []);
            const summary = getFarmerDocSummary(docs);
            const isFullyVerified = summary.approved === summary.total && summary.total > 0;
            const completionPct = Math.round((summary.uploaded / summary.total) * 100);

            return (
              <div
                key={farmer.id}
                className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-md transition-all hover:border-[#217346]/40 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Avatar, Name & Overall Status */}
                  <div className="flex items-start justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[#217346] border border-emerald-200/70 font-bold text-sm shadow-2xs">
                        {farmer.name?.charAt(0)?.toUpperCase() || "F"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate" title={farmer.name}>
                          {farmer.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{farmer.farmLocation || farmer.location || "Nashik Region"}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase border ${
                        isFullyVerified
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : summary.pending > 0
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {isFullyVerified
                        ? "Verified"
                        : summary.pending > 0
                        ? "Pending"
                        : `${summary.missing} Missing`}
                    </span>
                  </div>

                  {/* Progress Strip */}
                  <div className="mb-2.5 rounded-lg bg-slate-50/80 p-2 border border-slate-100">
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="font-semibold text-slate-600">Farmer App KYC Status</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {summary.uploaded}/{summary.total} Uploaded ({completionPct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFullyVerified
                            ? "bg-emerald-600"
                            : summary.uploaded === summary.total
                            ? "bg-amber-500"
                            : "bg-[#217346]"
                        }`}
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </div>

                  {/* ALL FARMER APP DOCUMENTS LIST (7/12, 8A, Aadhaar, Bank, Farmer ID, PAN, Photo, etc.) */}
                  <div className="space-y-1.5 text-xs mb-3 max-h-[360px] overflow-y-auto pr-0.5">
                    {docs.map((doc) => {
                      const key = `${farmer.id}-${doc.type}`;
                      const busy = uploadingKey === key;
                      const isUploaded = Boolean(doc.fileName);

                      return (
                        <div
                          key={doc.type}
                          className="flex items-center justify-between p-1.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 transition gap-1.5 text-[11px]"
                        >
                          {/* Left: Icon + Doc Name */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm shrink-0" role="img" aria-label={doc.name}>
                              {doc.icon}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate leading-tight" title={doc.fullName}>
                                {doc.name}
                              </p>
                              {doc.marathi && (
                                <p className="text-[10px] text-slate-500 truncate leading-none mt-0.5">
                                  {doc.marathi}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Status Pill & View/Upload Action */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isUploaded ? (
                              <>
                                {doc.status === "Approved" ? (
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    Approved
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    Pending
                                  </span>
                                )}

                                {doc.fileUrl ? (
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-0.5 rounded bg-emerald-100 text-[#217346] px-1.5 py-0.5 text-[10px] font-bold hover:bg-emerald-200 transition"
                                    title={`View ${doc.fileName}`}
                                  >
                                    <Eye className="h-3 w-3" /> View
                                  </a>
                                ) : null}

                                <label
                                  className={`cursor-pointer rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 hover:bg-slate-50 ${
                                    busy ? "opacity-50 pointer-events-none" : ""
                                  }`}
                                  title="Replace Document"
                                >
                                  {busy ? "…" : "Replace"}
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    disabled={busy}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      e.target.value = "";
                                      handleUpload(farmer.id, doc.type, file);
                                    }}
                                  />
                                </label>
                              </>
                            ) : (
                              <>
                                <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Missing
                                </span>
                                <label
                                  className={`cursor-pointer inline-flex items-center gap-0.5 rounded bg-[#217346] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-2xs hover:bg-[#1a5c38] transition active:scale-95 ${
                                    busy ? "opacity-50 pointer-events-none" : ""
                                  }`}
                                  title="Upload Document"
                                >
                                  <Upload className="h-2.5 w-2.5" />
                                  <span>{busy ? "…" : "Upload"}</span>
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    disabled={busy}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      e.target.value = "";
                                      handleUpload(farmer.id, doc.type, file);
                                    }}
                                  />
                                </label>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFarmerForModal(farmer)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 text-xs font-bold text-[#217346] shadow-2xs hover:bg-emerald-100 transition active:scale-[0.98]"
                  >
                    <Upload className="h-3 w-3" />
                    <span>Upload & Manage</span>
                  </button>
                  <Link
                    to={`/manager/farmers/${farmer.id}`}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#217346] hover:bg-slate-50 transition shadow-2xs flex items-center gap-1"
                    title="View Farmer Profile"
                  >
                    <span>Profile</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPLOAD & MANAGE MODAL                                                     */}
      {/* ========================================================================= */}
      {selectedFarmerForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-[#217346] font-bold text-sm">
                  {selectedFarmerForModal.name?.charAt(0)?.toUpperCase() || "F"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                    {selectedFarmerForModal.name} — All Farmer Documents
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Location: {selectedFarmerForModal.farmLocation || selectedFarmerForModal.location || "Nashik"} · Contact: {selectedFarmerForModal.phone || "—"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFarmerForModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-3">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200/80 p-2.5 text-xs text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#217346] shrink-0" />
                <span>
                  Upload or replace documents on behalf of this farmer. Document approval is performed by the Admin team.
                </span>
              </div>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
                {modalFarmerDocs.map((doc) => {
                  const key = `${selectedFarmerForModal.id}-${doc.type}`;
                  const busy = uploadingKey === key;

                  return (
                    <div
                      key={doc.type}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 hover:bg-slate-50/70 transition"
                    >
                      {/* Left: Icon + Doc Info */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-base">
                          {doc.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {doc.name}
                            </span>
                            {doc.marathi && (
                              <span className="text-xs text-slate-500 font-medium">
                                ({doc.marathi})
                              </span>
                            )}
                            {doc.status === "Approved" ? (
                              <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                                ✓ Approved
                              </span>
                            ) : doc.status === "Pending" ? (
                              <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[10px] font-bold text-amber-700">
                                ⏳ Pending Review
                              </span>
                            ) : doc.status === "Rejected" ? (
                              <span className="rounded bg-red-50 border border-red-200 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                                ✕ Rejected
                              </span>
                            ) : (
                              <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[10px] font-medium text-slate-500">
                                Not Uploaded
                              </span>
                            )}
                          </div>

                          {doc.fileName ? (
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                              <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={doc.fileName}>
                                {doc.fileName}
                              </span>
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#217346] hover:underline font-bold inline-flex items-center gap-0.5"
                                >
                                  <Eye className="h-3 w-3" /> View File
                                </a>
                              )}
                              <span className="text-[10px] text-slate-400">
                                • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-IN") : "Uploaded"}
                              </span>
                            </div>
                          ) : (
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              Not uploaded yet by farmer in Farmer App.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Upload Button */}
                      <div className="shrink-0 self-end sm:self-center">
                        <label
                          className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-[#217346] bg-[#217346] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1a5c38] transition active:scale-[0.98] ${
                            busy ? "opacity-60 pointer-events-none" : ""
                          }`}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>{busy ? "Uploading…" : doc.fileName ? "Replace File" : "Upload File"}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            disabled={busy}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              handleUpload(selectedFarmerForModal.id, doc.type, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedFarmerForModal(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
