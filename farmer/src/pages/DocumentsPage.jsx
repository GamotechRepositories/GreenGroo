import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getDocuments, uploadDocument } from "../api/farmerApi";
import { DOCUMENT_TYPES, CERTIFICATE_TYPES, VERIFICATION_STATUS } from "../utils/constants";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import FileUpload from "../components/ui/FileUpload";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
} from "../utils/excelStyles";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState(null);
  const [uploadModalType, setUploadModalType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDocuments();
      setDocs(data);
    } catch (err) {
      toast.error(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const byType = useMemo(() => {
    const map = Object.fromEntries(docs.map((d) => [d.type, d]));
    return DOCUMENT_TYPES.map((t) => ({
      ...t,
      ...(map[t.id] || {
        status: VERIFICATION_STATUS.NOT_UPLOADED,
        fileName: "",
        fileUrl: "",
        uploadedAt: null,
        adminRemarks: "",
      }),
    }));
  }, [docs]);

  const identityDocs = useMemo(() => {
    return byType.filter(
      (d) =>
        ["aadhaar", "pan", "bank", "address"].includes(d.id) &&
        d.status !== VERIFICATION_STATUS.NOT_UPLOADED &&
        Boolean(d.fileUrl || d.fileName)
    );
  }, [byType]);

  const certificateDocs = useMemo(() => {
    return byType.filter(
      (d) =>
        !["aadhaar", "pan", "bank", "address"].includes(d.id) &&
        d.status !== VERIFICATION_STATUS.NOT_UPLOADED &&
        Boolean(d.fileUrl || d.fileName)
    );
  }, [byType]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadModalType || !selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }
    setUploading(true);
    try {
      const url = await fileToDataUrl(selectedFile);
      await uploadDocument(uploadModalType, { name: selectedFile.name, url });
      toast.success(`${selectedFile.name} uploaded successfully!`);
      setUploadModalType(null);
      setSelectedFile(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to upload certificate / document");
    } finally {
      setUploading(false);
    }
  };

  const openUpload = (type = "soil_report") => {
    setUploadModalType(type);
    setSelectedFile(null);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Farmer Documents & Certificates</h1>
          <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>
            Upload and manage agricultural certificates, soil reports, and KYC verification documents.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openUpload("soil_report")}
          className={`${EXCEL_BTN_PRIMARY} px-4 py-2 flex items-center gap-1.5 shadow-sm`}
        >
          📜 Upload Certificate / Document
        </button>
      </div>

      {loading ? (
        <LoadingState rows={5} />
      ) : (
        <>
          {/* Certificates Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <span>🌱</span> Agricultural Certificates & Reports (शेती व कृषी प्रमाणपत्रे)
              </h2>
              <button
                type="button"
                onClick={() => openUpload("soil_report")}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                + Upload New Certificate
              </button>
            </div>

            {certificateDocs.length === 0 ? (
              <div className="rounded border border-dashed border-[#D4D4D4] bg-[#FBFBFB] p-6 text-center text-xs text-[#6B7280]">
                कोणतेही शेती प्रमाणपत्र अद्याप अपलोड केलेले नाही. (No agricultural certificates uploaded yet)
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {certificateDocs.map((doc) => (
                  <div key={doc.id || doc.type} className={`${EXCEL_PANEL} hover:border-emerald-300 transition`}>
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-[#1F2937]">{doc.name}</h3>
                          <p className="mt-0.5 text-xs text-[#6B7280] truncate max-w-[200px]">
                            File: {doc.fileName || "Uploaded document"}
                          </p>
                          <p className="text-[10px] text-[#6B7280]">
                            Updated: {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                        <StatusBadge status={doc.status || VERIFICATION_STATUS.NOT_UPLOADED} />
                      </div>

                      {doc.adminRemarks ? (
                        <p className="border border-[#D4D4D4] bg-[#F2F2F2] p-1.5 text-xs text-[#1F2937]">
                          Remarks: {doc.adminRemarks}
                        </p>
                      ) : null}

                      <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                        <button
                          type="button"
                          onClick={() => openUpload(doc.id || doc.type)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                        >
                          📤 {doc.fileName ? "Replace File" : "Upload File"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewDoc(doc)}
                          className={`${EXCEL_BTN} text-xs py-0.5 px-2`}
                        >
                          🔍 View Status
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KYC Documents Section */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <span>🪪</span> Identity & Banking Documents (ओळख व बँक पुरावे)
            </h2>

            {identityDocs.length === 0 ? (
              <div className="rounded border border-dashed border-[#D4D4D4] bg-[#FBFBFB] p-6 text-center text-xs text-[#6B7280]">
                कोणतेही ओळख किंवा बँक कागदपत्र अद्याप अपलोड केलेले नाही. (No identity/banking documents uploaded yet)
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {identityDocs.map((doc) => (
                <div key={doc.id || doc.type} className={EXCEL_PANEL}>
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-[#1F2937]">{doc.name}</h3>
                        <p className="mt-0.5 text-xs text-[#6B7280] truncate max-w-[200px]">
                          File: {doc.fileName || "No document file uploaded"}
                        </p>
                        <p className="text-[10px] text-[#6B7280]">
                          Updated: {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                      <StatusBadge status={doc.status || VERIFICATION_STATUS.NOT_UPLOADED} />
                    </div>

                    {doc.adminRemarks ? (
                      <p className="border border-[#D4D4D4] bg-[#F2F2F2] p-1.5 text-xs text-[#1F2937]">
                        Remarks: {doc.adminRemarks}
                      </p>
                    ) : null}

                    <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                      <button
                        type="button"
                        onClick={() => openUpload(doc.id || doc.type)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        📤 {doc.fileName ? "Replace File" : "Upload File"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewDoc(doc)}
                        className={`${EXCEL_BTN} text-xs py-0.5 px-2`}
                      >
                        🔍 View Status
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </>
      )}

      {/* Upload Certificate / Document Modal */}
      <Modal
        open={Boolean(uploadModalType)}
        title="Upload Certificate / Document"
        onClose={() => setUploadModalType(null)}
      >
        <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-slate-700">Document / Certificate Type *</label>
            <select
              value={uploadModalType || "soil_report"}
              onChange={(e) => setUploadModalType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <optgroup label="🌱 Agricultural Certificates (कृषी प्रमाणपत्रे)">
                <option value="soil_report">🧪 Soil Testing Report (मृदा चाचणी अहवाल)</option>
                <option value="organic_cert">🌿 Organic Farming Certificate (सेंद्रिय शेती प्रमाणपत्र)</option>
                <option value="water_testing">💧 Water Testing Report (पाणी चाचणी अहवाल)</option>
                <option value="land_712">📜 7/12 & 8-A Land Extract (७/१२ व ८-अ उतारा)</option>
                <option value="crop_insurance">🛡️ Crop Insurance Certificate (पीक विमा पावती)</option>
                <option value="gap_cert">🏅 GAP / APEDA Quality Certificate (जीएपी / गुणवत्ता प्रमाणपत्र)</option>
                <option value="other">📄 Other Agricultural Certificate (इतर प्रमाणपत्र)</option>
              </optgroup>
              <optgroup label="🪪 Identity & KYC Documents (ओळख व केवायसी)">
                <option value="aadhaar">Aadhaar / ID Proof</option>
                <option value="pan">PAN Card</option>
                <option value="bank">Bank Passbook / Statement</option>
                <option value="address">Address Proof</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-slate-700">Select File (PDF / Image) *</label>
            <FileUpload
              label=""
              accept=".pdf,.jpg,.jpeg,.png"
              currentFileName={selectedFile?.name || ""}
              onSelect={(file) => setSelectedFile(file)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={uploading}
              onClick={() => setUploadModalType(null)}
              className={`${EXCEL_BTN} px-3 py-1.5`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className={`${EXCEL_BTN_PRIMARY} px-4 py-1.5 flex items-center gap-1`}
            >
              {uploading ? "Uploading…" : "Upload Now"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Document Details Modal */}
      <Modal open={Boolean(viewDoc)} title={viewDoc?.name || "Document Status"} onClose={() => setViewDoc(null)}>
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-[#1F2937]">Document: {viewDoc?.name}</p>
          <p className="text-[#6B7280]">File Name: {viewDoc?.fileName || "No document file uploaded"}</p>
          <p className="text-[#6B7280]">Verification Status: {viewDoc?.status || "Not Uploaded"}</p>
          {viewDoc?.fileUrl && (
            <div className="pt-2">
              <a
                href={viewDoc.fileUrl}
                download={viewDoc.fileName || "document"}
                target="_blank"
                rel="noreferrer"
                className={`${EXCEL_BTN_PRIMARY} px-3 py-1 text-xs inline-block`}
              >
                View / Download Document
              </a>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default DocumentsPage;
