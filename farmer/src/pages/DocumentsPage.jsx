import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getDocuments } from "../api/farmerApi";
import { DOCUMENT_TYPES, VERIFICATION_STATUS } from "../utils/constants";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import {
  EXCEL_BTN,
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

function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState(null);

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
        uploadedAt: null,
        adminRemarks: "",
      }),
    }));
  }, [docs]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Farmer Documents</h1>
          <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>
            Verification status and record of submitted documents.
          </p>
        </div>
        <span className="rounded bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#217346]">
          Read-Only (Managed by Vendor Manager)
        </span>
      </div>

      {loading ? (
        <LoadingState rows={5} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {byType.map((doc) => (
            <div key={doc.id || doc.type} className={EXCEL_PANEL}>
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xs font-bold text-[#1F2937]">{doc.name}</h2>
                    <p className="mt-0.5 text-xs text-[#6B7280]">
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

                <div className="flex justify-end pt-1 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setViewDoc(doc)}
                    className={`${EXCEL_BTN} text-xs py-0.5 px-2`}
                  >
                    🔍 View Document Status
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(viewDoc)} title={viewDoc?.name || "Document Status"} onClose={() => setViewDoc(null)}>
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-[#1F2937]">Document: {viewDoc?.name}</p>
          <p className="text-[#6B7280]">File Name: {viewDoc?.fileName || "No document file uploaded"}</p>
          <p className="text-[#6B7280]">Verification Status: {viewDoc?.status || "Not Uploaded"}</p>
          <p className="text-[#6B7280]">Document modifications are controlled by your assigned Vendor / Farmer Manager.</p>
        </div>
      </Modal>
    </div>
  );
}

export default DocumentsPage;
