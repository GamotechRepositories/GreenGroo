import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { getDocuments, submitFarmerKyc, uploadDocument } from "../api/farmerApi";
import { setFarmerProfile } from "../store/farmerSlice";
import { DOCUMENT_TYPES, KYC_STATUS, VERIFICATION_STATUS } from "../utils/constants";
import FileUpload from "../components/ui/FileUpload";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
} from "../utils/excelStyles";

const REQUIRED_KYC_TYPES = ["aadhaar", "pan", "address", "bank"];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function FarmerKycPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const farmer = useSelector((s) => s.farmer.farmer);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setDocs(await getDocuments());
    } catch (err) {
      toast.error(err.message || "Failed to load KYC documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const byType = useMemo(() => {
    const map = Object.fromEntries(docs.map((d) => [d.type, d]));
    return DOCUMENT_TYPES.filter((t) => t.id !== "other").map((t) => ({
      ...t,
      ...(map[t.id] || {
        status: VERIFICATION_STATUS.NOT_UPLOADED,
        fileName: "",
        uploadedAt: null,
      }),
    }));
  }, [docs]);

  const requiredReady = REQUIRED_KYC_TYPES.every((type) => {
    const doc = byType.find((d) => d.id === type || d.type === type);
    return doc?.fileName && doc.status !== VERIFICATION_STATUS.NOT_UPLOADED && doc.status !== "Not Uploaded";
  });

  const handleSelect = async (type, file) => {
    if (!file) return;
    setUploadingType(type);
    try {
      const url = await fileToDataUrl(file);
      await uploadDocument(type, { name: file.name, url });
      toast.success(`${file.name} uploaded`);
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploadingType("");
    }
  };

  const handleSubmitKyc = async () => {
    if (!requiredReady) {
      toast.error("Upload Aadhaar, PAN, Address Proof and Bank Details first");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitFarmerKyc();
      if (result?.farmer) {
        dispatch(setFarmerProfile(result.farmer));
      } else {
        dispatch(setFarmerProfile({ kycStatus: KYC_STATUS.SUBMITTED }));
      }
      toast.success("KYC submitted for verification");
      navigate("/farmer/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Failed to submit KYC");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Farmer KYC</h1>
        <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>
          Upload required documents to complete verification for {farmer?.name || "your account"}.
        </p>
        <p className="mt-1 text-xs font-semibold text-amber-700">
          KYC Status: {farmer?.kycStatus || KYC_STATUS.PENDING}
        </p>
      </div>

      {loading ? (
        <LoadingState rows={4} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {byType.map((doc) => (
            <div key={doc.id || doc.type} className={`${EXCEL_PANEL} p-3 space-y-2`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xs font-bold text-[#1F2937]">{doc.name}</h2>
                  <p className="mt-0.5 text-[10px] text-[#6B7280]">
                    {doc.fileName ? `File: ${doc.fileName}` : "Required document"}
                  </p>
                </div>
                <StatusBadge status={doc.status || VERIFICATION_STATUS.NOT_UPLOADED} />
              </div>
              <FileUpload
                label=""
                currentFileName={doc.fileName || ""}
                disabled={uploadingType === (doc.id || doc.type)}
                onSelect={(file) => handleSelect(doc.id || doc.type, file)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={submitting || loading}
          onClick={handleSubmitKyc}
          className={`${EXCEL_BTN_PRIMARY} px-5 py-2`}
        >
          {submitting ? "Submitting…" : "Submit KYC"}
        </button>
        <button type="button" onClick={() => navigate("/farmer/dashboard")} className={`${EXCEL_BTN} px-4 py-2`}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

export default FarmerKycPage;
