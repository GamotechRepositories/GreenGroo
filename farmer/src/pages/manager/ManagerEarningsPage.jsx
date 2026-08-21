import { useEffect, useState } from "react";
import { getManagerFarmers, getManagerFarmerEarnings } from "../../api/farmerApi";
import { EXCEL_PANEL, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB } from "../../utils/excelStyles";

export default function ManagerEarningsPage() {
  const [farmers, setFarmers] = useState([]);
  const [earningsByFarmer, setEarningsByFarmer] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getManagerFarmers()
      .then(async (fs) => {
        const farmerList = Array.isArray(fs) ? fs : [];
        setFarmers(farmerList);
        const results = await Promise.all(
          farmerList.map((f) =>
            getManagerFarmerEarnings(f.id)
              .then((res) => {
                const list = Array.isArray(res) ? res : (Array.isArray(res?.transactions) ? res.transactions : []);
                return { farmerId: f.id, earnings: list };
              })
              .catch(() => ({ farmerId: f.id, earnings: [] }))
          )
        );
        const map = {};
        results.forEach(({ farmerId, earnings }) => {
          map[farmerId] = earnings;
        });
        setEarningsByFarmer(map);
      })
      .catch(() => {
        setFarmers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const allEarnings = farmers.flatMap((f) => {
    const list = earningsByFarmer[f.id];
    const arr = Array.isArray(list) ? list : (Array.isArray(list?.transactions) ? list.transactions : []);
    return arr.map((e) => ({ ...e, farmerName: f.name }));
  });

  const totalEarnings = allEarnings.reduce((s, e) => s + Number(e.netEarnings || 0), 0);
  const pendingEarnings = allEarnings
    .filter((e) => e.status === "Pending")
    .reduce((s, e) => s + Number(e.netEarnings || 0), 0);
  const paidEarnings = allEarnings
    .filter((e) => e.status === "Paid")
    .reduce((s, e) => s + Number(e.netEarnings || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Earnings</h1>
        <p className={EXCEL_PAGE_SUB}>Earnings overview for all your assigned farmers</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Earnings", value: `₹${totalEarnings.toLocaleString("en-IN")}`, color: "text-[#217346]" },
          { label: "Paid", value: `₹${paidEarnings.toLocaleString("en-IN")}`, color: "text-emerald-600" },
          { label: "Pending", value: `₹${pendingEarnings.toLocaleString("en-IN")}`, color: "text-amber-600" },
          { label: "Transactions", value: allEarnings.length, color: "text-[#1F2937]" },
        ].map((c) => (
          <div key={c.label} className={`${EXCEL_PANEL} p-4`}>
            <p className="text-xs text-[#6B7280]">{c.label}</p>
            <p className={`mt-1 text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Per-farmer breakdown */}
      {farmers.map((f) => {
        const item = earningsByFarmer[f.id];
        const fe = Array.isArray(item) ? item : (Array.isArray(item?.transactions) ? item.transactions : []);
        const fTotal = fe.reduce((s, e) => s + Number(e.netEarnings || 0), 0);
        return (
          <div key={f.id} className={EXCEL_PANEL}>
            <div className="flex items-center justify-between border-b border-[#D4D4D4] px-4 py-2.5">
              <div>
                <p className="text-xs font-bold text-[#1F2937]">{f.name}</p>
                <p className="text-[10px] text-[#6B7280]">
                  Total: <span className="font-semibold text-[#217346]">₹{fTotal.toLocaleString("en-IN")}</span>
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F2F2F2] text-left">
                    {["Date", "Crop", "Qty (Kg)", "Rate/Kg", "Gross", "Deductions", "Net", "Status"].map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fe.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-4 text-center text-[#6B7280]">No earnings records for this farmer</td></tr>
                  ) : fe.map((e) => (
                    <tr key={e.id || `${e.date}-${e.cropName}`} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                      <td className="px-3 py-2">{e.date}</td>
                      <td className="px-3 py-2">{e.cropName}</td>
                      <td className="px-3 py-2">{e.quantity}</td>
                      <td className="px-3 py-2">₹{e.ratePerKg}</td>
                      <td className="px-3 py-2">₹{(e.grossEarnings || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-[#DC2626]">-₹{e.deductions || 0}</td>
                      <td className="px-3 py-2 font-semibold text-[#217346]">₹{(e.netEarnings || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          e.status === "Paid" ? "bg-green-100 text-green-700" :
                          e.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{e.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {loading && <p className="text-xs text-[#6B7280]">Loading…</p>}
    </div>
  );
}
