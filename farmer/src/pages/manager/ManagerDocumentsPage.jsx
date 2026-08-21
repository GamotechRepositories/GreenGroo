import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getManagerFarmers, getManagerFarmerDocuments, updateManagerFarmerDocumentStatus } from "../../api/farmerApi";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_BTN } from "../../utils/excelStyles";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  Approved: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Rejected: "bg-red-100 text-red-700",
  "Not Uploaded": "bg-gray-100 text-gray-500",
};

export default function ManagerDocumentsPage() {
  const [farmers, setFarmers] = useState([]);
  const [docsByFarmer, setDocsByFarmer] = useState({});
  const [loading, setLoading] = useState(true);
  const [farmerFilter, setFarmerFilter] = useState("");

  const loadDocs = async () => {
    setLoading(true);
    const fs = await getManagerFarmers().catch(() => []);
    setFarmers(fs);
    const ids = farmerFilter ? [farmerFilter] : fs.map((f) => f.id);
    const results = await Promise.all(
      ids.map((fid) =>
        getManagerFarmerDocuments(fid)
          .then((docs) => ({ farmerId: fid, docs }))
          .catch(() => ({ farmerId: fid, docs: [] }))
      )
    );
    const map = {};
    results.forEach(({ farmerId, docs }) => { map[farmerId] = docs; });
    setDocsByFarmer(map);
    setLoading(false);
  };

  useEffect(() => { loadDocs(); }, [farmerFilter]);

  const handleStatusChange = async (farmerId, docId, status) => {
    try {
      await updateManagerFarmerDocumentStatus(farmerId, docId, status);
      toast.success("Document status updated");
      loadDocs();
    } catch (err) {
      toast.error(err?.message || "Failed");
    }
  };

  const displayFarmers = farmerFilter ? farmers.filter((f) => f.id === farmerFilter) : farmers;

  return (
    <div className="space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Farmer Documents</h1>
        <p className={EXCEL_PAGE_SUB}>View and verify documents for your assigned farmers</p>
      </div>

      <div>
        <select
          value={farmerFilter}
          onChange={(e) => setFarmerFilter(e.target.value)}
          className={`${EXCEL_INPUT} max-w-xs`}
        >
          <option value="">All Farmers</option>
          {farmers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {loading && <p className="text-xs text-[#6B7280]">Loading…</p>}

      {displayFarmers.map((f) => {
        const docs = docsByFarmer[f.id] || [];
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
                      <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-4 text-center text-[#6B7280]">No documents</td></tr>
                  ) : docs.map((doc) => (
                    <tr key={doc.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                      <td className="px-3 py-2.5 font-semibold">{doc.name}</td>
                      <td className="px-3 py-2.5 capitalize">{doc.type}</td>
                      <td className="px-3 py-2.5">
                        {doc.fileUrl ? (
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[#217346] underline text-[10px]">
                            📎 {doc.fileName}
                          </a>
                        ) : <span className="text-[#6B7280]">Not Uploaded</span>}
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
                        {doc.status !== "Not Uploaded" && (
                          <div className="flex gap-1">
                            {doc.status !== "Approved" && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(f.id, doc.id, "Approved")}
                                className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 hover:bg-green-200"
                              >
                                Approve
                              </button>
                            )}
                            {doc.status !== "Rejected" && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(f.id, doc.id, "Rejected")}
                                className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-200"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
