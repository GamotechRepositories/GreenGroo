import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getManagerAllDocuments,
  updateManagerFarmerDocumentStatus,
  uploadManagerFarmerDocument,
} from "../../api/farmerApi";
import { DOCUMENT_TYPES } from "../../utils/constants";
import {
  EXCEL_PANEL,
  EXCEL_INPUT,
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
} from "../../utils/excelStyles";

const STATUS_COLORS = {
  Approved: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Rejected: "bg-red-100 text-red-700",
  "Not Uploaded": "bg-gray-100 text-gray-500",
};

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
  return DOCUMENT_TYPES.map((t) => ({
    id: map[t.id]?.id || `missing-${t.id}`,
    type: t.id,
    name: t.name,
    fileName: map[t.id]?.fileName || "",
    fileUrl: map[t.id]?.fileUrl || "",
    uploadedAt: map[t.id]?.uploadedAt || null,
    status: map[t.id]?.status || "Not Uploaded",
  }));
}

export default function ManagerDocumentsPage() {
  const [farmers, setFarmers] = useState([]);
  const [docsByFarmer, setDocsByFarmer] = useState({});
  const [loading, setLoading] = useState(true);
  const [farmerFilter, setFarmerFilter] = useState("");
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

  const handleStatusChange = async (farmerId, docId, status) => {
    if (!docId || String(docId).startsWith("missing-")) {
      toast.error("Upload a file before approving");
      return;
    }
    try {
      await updateManagerFarmerDocumentStatus(farmerId, docId, status);
      toast.success("Document status updated");
      loadDocs();
    } catch (err) {
      toast.error(err?.message || "Failed");
    }
  };

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
      toast.success(`${file.name} uploaded`);
      await loadDocs();
    } catch (err) {
      toast.error(err?.message || "Failed to upload document");
    } finally {
      setUploadingKey("");
    }
  };

  const displayFarmers = farmerFilter ? farmers.filter((f) => f.id === farmerFilter) : farmers;

  return (
    <div className="space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Farmer Documents</h1>
        <p className={EXCEL_PAGE_SUB}>Upload, view and verify documents for your assigned farmers</p>
      </div>

      <div>
        <select
          value={farmerFilter}
          onChange={(e) => setFarmerFilter(e.target.value)}
          className={`${EXCEL_INPUT} max-w-xs`}
        >
          <option value="">All Farmers</option>
          {farmers.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-xs text-[#6B7280]">Loading…</p>}

      {!loading && farmers.length === 0 ? (
        <p className="text-xs text-[#6B7280]">No farmers are assigned to you yet.</p>
      ) : null}

      {displayFarmers.map((f) => {
        const docs = mergeFarmerDocs(docsByFarmer[f.id] || []);
        return (
          <div key={f.id} className={EXCEL_PANEL}>
            <div className="flex items-center justify-between border-b border-[#D4D4D4] px-4 py-2.5">
              <p className="text-xs font-bold text-[#1F2937]">{f.name}</p>
              <Link to={`/farmer/manager/farmers/${f.id}`} className={`${EXCEL_BTN} text-[10px]`}>
                View Profile
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F2F2F2] text-left">
                    {["Document", "Type", "File", "Upload Date", "Status", "Action"].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => {
                    const key = `${f.id}-${doc.type}`;
                    const busy = uploadingKey === key;
                    return (
                      <tr key={doc.type} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                        <td className="px-3 py-2.5 font-semibold">{doc.name}</td>
                        <td className="px-3 py-2.5 capitalize">{doc.type}</td>
                        <td className="px-3 py-2.5">
                          {doc.fileUrl ? (
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[#217346] underline text-[10px]">
                              {doc.fileName}
                            </a>
                          ) : (
                            <span className="text-[#6B7280]">Not Uploaded</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-[#6B7280]">
                          {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[doc.status] || "bg-gray-100 text-gray-600"}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap items-center gap-1">
                            <label className={`${EXCEL_BTN_PRIMARY} cursor-pointer px-2 py-1 text-[10px] ${busy ? "opacity-60" : ""}`}>
                              {busy ? "Uploading…" : doc.fileName ? "Replace" : "Upload"}
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                disabled={busy}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = "";
                                  handleUpload(f.id, doc.type, file);
                                }}
                              />
                            </label>
                            {doc.fileName && doc.status !== "Approved" ? (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(f.id, doc.id, "Approved")}
                                className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 hover:bg-green-200"
                              >
                                Approve
                              </button>
                            ) : null}
                            {doc.fileName && doc.status !== "Rejected" ? (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(f.id, doc.id, "Rejected")}
                                className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-200"
                              >
                                Reject
                              </button>
                            ) : null}
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
    </div>
  );
}
