import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  deleteDocument,
  getDocuments,
  submitDocumentsForVerification,
  uploadDocument,
} from "../api/farmerApi";
import { DOCUMENT_TYPES, VERIFICATION_STATUS } from "../utils/constants";
import { fetchDocuments, fetchFarmerProfile } from "../store/farmerSlice";
import StatusBadge from "../components/ui/StatusBadge";
import FileUpload from "../components/ui/FileUpload";
import LoadingState from "../components/ui/LoadingState";
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_OUTLINE,
  EXCEL_BTN_PRIMARY,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../utils/excelStyles";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Modal from "../components/ui/Modal";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DocumentsPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadType, setUploadType] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDocuments();
      setDocs(data);
      dispatch(fetchDocuments());
    } catch (err) {
      toast.error(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (location.state?.blocked) {
      toast.error("Complete document verification to access selling features");
    }
  }, [location.state]);

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

  const handleUpload = async (file) => {
    if (!uploadType) return;
    setBusy(true);
    try {
      await uploadDocument(uploadType, { name: file.name, file });
      toast.success("Document uploaded");
      setUploadType(null);
      await load();
      dispatch(fetchFarmerProfile());
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteDocument(deleteId);
      toast.success("Document removed");
      setDeleteId(null);
      await load();
      dispatch(fetchFarmerProfile());
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await submitDocumentsForVerification();
      toast.success("Submitted for verification");
      await load();
      dispatch(fetchFarmerProfile());
    } catch (err) {
      toast.error(err.message || "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Documents</h1>
          <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>
            Upload and track verification of your farm documents.
          </p>
        </div>
        <button type="button" disabled={busy} onClick={handleSubmit} className={EXCEL_BTN_PRIMARY}>
          Submit for verification
        </button>
      </div>

      {loading ? (
        <LoadingState rows={5} />
      ) : (
        <div className="grid gap-4">
          {byType.map((doc) => (
            <div key={doc.id || doc.type} className={EXCEL_PANEL}>
              <div className="flex flex-wrap items-start justify-between gap-3 p-3">
                <div>
                  <h2 className="text-xs font-bold text-[#1F2937]">
                    {doc.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#6B7280]">
                    File: {doc.fileName || "Not uploaded"} · Uploaded: {formatDate(doc.uploadedAt)}
                  </p>
                </div>
                <StatusBadge status={doc.status} />
              </div>

              {doc.status === VERIFICATION_STATUS.REJECTED && doc.adminRemarks ? (
                <p className="mx-3 mb-3 border border-[#D4D4D4] bg-[#F2F2F2] px-2 py-1.5 text-xs text-red-700">
                  Admin remarks: {doc.adminRemarks}
                </p>
              ) : doc.adminRemarks ? (
                <p className="mt-3 text-sm text-[#6B7280]">Admin remarks: {doc.adminRemarks}</p>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-[#D4D4D4] p-3">
                <button type="button" onClick={() => setUploadType(doc.type)} className={EXCEL_BTN_OUTLINE}>
                  {doc.fileName ? "Replace" : "Upload"}
                </button>
                {doc.fileName ? (
                  <>
                    <button type="button" onClick={() => setViewDoc(doc)} className={EXCEL_BTN}>
                      View
                    </button>
                    <a href={doc.fileUrl || "#"} download={doc.fileName} className={EXCEL_BTN}>
                      Download
                    </a>
                    {doc.status !== VERIFICATION_STATUS.APPROVED ? (
                      <button type="button" onClick={() => setDeleteId(doc.id)} className={EXCEL_BTN_DANGER}>
                        Delete
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(uploadType)}
        title="Upload document"
        onClose={() => setUploadType(null)}
      >
        <FileUpload onSelect={handleUpload} disabled={busy} />
      </Modal>

      <Modal open={Boolean(viewDoc)} title={viewDoc?.name || "Document"} onClose={() => setViewDoc(null)}>
        <p className="text-sm text-[#6B7280]">File name: {viewDoc?.fileName}</p>
        <p className="mt-2 text-sm text-[#6B7280]">
          Preview is simulated in demo mode. Connect storage URLs for real viewing.
        </p>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete document?"
        message="You can delete this document only before approval."
        confirmLabel="Delete"
        danger
        loading={busy}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default DocumentsPage;
