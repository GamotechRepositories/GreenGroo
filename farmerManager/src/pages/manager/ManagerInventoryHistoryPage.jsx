import { useEffect, useState } from "react";
import { getManagerAllStockHistory } from "../../api/farmerApi";
import { EXCEL_PANEL, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_INPUT } from "../../utils/excelStyles";

const ACTION_COLORS = {
  "Stock Added": "bg-green-100 text-green-700",
  "Stock Reduced": "bg-red-100 text-red-700",
  "Order Deduction": "bg-orange-100 text-orange-700",
  "System Update": "bg-blue-100 text-blue-700",
};

export default function ManagerInventoryHistoryPage() {
  const [history, setHistory] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmerFilter, setFarmerFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    getManagerAllStockHistory({ farmerId: farmerFilter })
      .then((data) => {
        const fs = Array.isArray(data?.farmers) ? data.farmers : [];
        const rows = Array.isArray(data?.history) ? data.history : [];
        setFarmers(fs);
        setHistory(
          rows.map((entry) => ({
            ...entry,
            _farmerName: entry.farmerName || fs.find((f) => f.id === entry.farmerId)?.name || entry.farmerId,
          }))
        );
      })
      .catch(() => {
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, [farmerFilter]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Inventory History</h1>
        <p className={EXCEL_PAGE_SUB}>Stock movement log for all your assigned farmers</p>
      </div>

      <div>
        <select
          value={farmerFilter}
          onChange={(e) => setFarmerFilter(e.target.value)}
          className={`${EXCEL_INPUT} max-w-xs`}
        >
          <option value="">All Farmers</option>
          {farmers.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div className={EXCEL_PANEL}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F2F2F2] text-left">
                {["Date & Time", "Farmer", "Product", "Grade", "Prev Stock", "Action", "Changed Qty", "New Stock", "Updated By"].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-[#6B7280]">Loading…</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-[#6B7280]">No history found</td></tr>
              ) : (
                history.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                    <td className="px-3 py-2 whitespace-nowrap text-[#6B7280]">
                      {entry.at ? new Date(entry.at).toLocaleString("en-IN") : "—"}
                    </td>
                    <td className="px-3 py-2">{entry._farmerName}</td>
                    <td className="px-3 py-2 font-semibold">{entry.productName || "—"}</td>
                    <td className="px-3 py-2">{entry.grade}</td>
                    <td className="px-3 py-2">{entry.previousStock} Kg</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${ACTION_COLORS[entry.action] || "bg-gray-100 text-gray-600"}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className={`px-3 py-2 font-semibold ${entry.changedQuantity >= 0 ? "text-[#217346]" : "text-[#DC2626]"}`}>
                      {entry.changedQuantity >= 0 ? "+" : ""}{entry.changedQuantity} Kg
                    </td>
                    <td className="px-3 py-2 font-semibold">{entry.newStock} Kg</td>
                    <td className="px-3 py-2 text-[#6B7280]">{entry.updatedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
