import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getManagerFarmers, getManagerFarmerEarnings } from "../../api/farmerApi";
import StatusBadge from "../../components/ui/StatusBadge";
import {
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_INPUT,
  EXCEL_SELECT,
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_TABLE,
  EXCEL_WRAP,
  EXCEL_HEAD,
  EXCEL_CELL,
} from "../../utils/excelStyles";

export default function ManagerEarningsPage() {
  const [farmers, setFarmers] = useState([]);
  const [earningsByFarmer, setEarningsByFarmer] = useState({});
  const [loading, setLoading] = useState(true);

  // Selected Farmer for Spreadsheet Modal
  const [modalFarmer, setModalFarmer] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFarmerId, setSelectedFarmerId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  useEffect(() => {
    getManagerFarmers()
      .then(async (fs) => {
        const farmerList = Array.isArray(fs) ? fs : [];
        setFarmers(farmerList);
        const results = await Promise.all(
          farmerList.map((f) =>
            getManagerFarmerEarnings(f.id)
              .then((res) => {
                const list = Array.isArray(res)
                  ? res
                  : Array.isArray(res?.transactions)
                  ? res.transactions
                  : [];
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

  const allEarnings = useMemo(() => {
    return farmers.flatMap((f) => {
      const list = earningsByFarmer[f.id];
      const arr = Array.isArray(list)
        ? list
        : Array.isArray(list?.transactions)
        ? list.transactions
        : [];
      return arr.map((e) => ({
        ...e,
        farmerId: f.id,
        farmerName: f.name,
        farmerMobile: f.mobile,
      }));
    });
  }, [farmers, earningsByFarmer]);

  const filteredEarnings = useMemo(() => {
    return allEarnings.filter((e) => {
      const matchFarmer = selectedFarmerId === "ALL" || e.farmerId === selectedFarmerId;
      const matchStatus = selectedStatus === "ALL" || e.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        e.cropName?.toLowerCase().includes(q) ||
        e.farmerName?.toLowerCase().includes(q) ||
        e.date?.includes(q);

      return matchFarmer && matchStatus && matchSearch;
    });
  }, [allEarnings, selectedFarmerId, selectedStatus, searchQuery]);

  // Modal Farmer Earnings
  const modalFarmerEarnings = useMemo(() => {
    if (!modalFarmer) return [];
    return allEarnings.filter((e) => e.farmerId === modalFarmer.id);
  }, [modalFarmer, allEarnings]);

  const modalTotalEarnings = modalFarmerEarnings.reduce((s, e) => s + Number(e.netEarnings || 0), 0);
  const modalTotalGross = modalFarmerEarnings.reduce((s, e) => s + Number(e.grossEarnings || 0), 0);
  const modalTotalDeductions = modalFarmerEarnings.reduce((s, e) => s + Number(e.deductions || 0), 0);
  const modalTotalQuantity = modalFarmerEarnings.reduce((s, e) => s + Number(e.quantity || 0), 0);

  const totalEarnings = filteredEarnings.reduce((s, e) => s + Number(e.netEarnings || 0), 0);
  const totalGross = filteredEarnings.reduce((s, e) => s + Number(e.grossEarnings || 0), 0);
  const totalDeductions = filteredEarnings.reduce((s, e) => s + Number(e.deductions || 0), 0);
  const totalQuantity = filteredEarnings.reduce((s, e) => s + Number(e.quantity || 0), 0);
  const paidEarnings = filteredEarnings
    .filter((e) => e.status === "Paid")
    .reduce((s, e) => s + Number(e.netEarnings || 0), 0);
  const pendingEarnings = filteredEarnings
    .filter((e) => e.status === "Pending")
    .reduce((s, e) => s + Number(e.netEarnings || 0), 0);

  const handleExportCSV = (recordsToExport = filteredEarnings, fileName = "farmer_statements") => {
    const headers = [
      "Sr",
      "Date",
      "Farmer Name",
      "Crop Name",
      "Quantity (Kg)",
      "Rate Per Kg",
      "Gross Earnings",
      "Deductions",
      "Net Earnings",
      "Status",
    ];
    const csvRows = [headers.join(",")];

    recordsToExport.forEach((e, idx) => {
      csvRows.push(
        [
          idx + 1,
          `"${e.date}"`,
          `"${e.farmerName}"`,
          `"${e.cropName}"`,
          e.quantity,
          e.ratePerKg,
          e.grossEarnings,
          e.deductions,
          e.netEarnings,
          `"${e.status}"`,
        ].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Farmer Earnings & Statements</h1>
          <p className={EXCEL_PAGE_SUB}>
            Financial statements, settlements and payout records across all assigned farmers (Click any farmer to open statement)
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleExportCSV(filteredEarnings, "all_farmers_statements")}
          className={`${EXCEL_BTN} text-xs font-semibold`}
        >
          📥 Export Statements (CSV)
        </button>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Total Net Payout</p>
          <p className="text-lg font-bold text-[#217346]">₹{totalEarnings.toLocaleString("en-IN")}</p>
        </div>
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Paid Settlements</p>
          <p className="text-lg font-bold text-emerald-700">₹{paidEarnings.toLocaleString("en-IN")}</p>
        </div>
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Pending Settlements</p>
          <p className="text-lg font-bold text-amber-600">₹{pendingEarnings.toLocaleString("en-IN")}</p>
        </div>
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Total Volume Harvested</p>
          <p className="text-lg font-bold text-[#1F2937]">{totalQuantity.toLocaleString("en-IN")} Kg</p>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border border-[#D4D4D4] bg-[#F9F9F9] p-2.5 rounded-xs">
        <div className="relative min-w-[200px] flex-1">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crop, farmer name or date…"
            className={`${EXCEL_INPUT} w-full`}
          />
        </div>

        <select
          value={selectedFarmerId}
          onChange={(e) => setSelectedFarmerId(e.target.value)}
          className={`${EXCEL_SELECT} max-w-[200px] font-medium`}
        >
          <option value="ALL">All Farmers ({farmers.length})</option>
          {farmers.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className={`${EXCEL_SELECT} max-w-[150px] font-medium`}
        >
          <option value="ALL">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Available">Available</option>
        </select>
      </div>

      {/* 4. Master Spreadsheet Grid (Photo Replica) */}
      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
          <span className="font-bold text-[#1F2937]">Earnings & Statement Details</span>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#217346]">
              FINANCIAL SPREADSHEET
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Showing {filteredEarnings.length} Records (Click Farmer to Open Solo Statement)
            </span>
          </div>
        </div>

        <div className="p-3">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#6B7280]">
              Loading financial statements…
            </div>
          ) : filteredEarnings.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#6B7280]">
              No earnings or statements found matching the selected filters.
            </div>
          ) : (
            <div className={EXCEL_WRAP}>
              <table className={EXCEL_TABLE}>
                <thead>
                  <tr className="bg-[#F2F2F2]">
                    <th className={`${EXCEL_HEAD} text-center w-12`}>Sr.</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Date</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Farmer</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Crop / Product</th>
                    <th className={`${EXCEL_HEAD} text-right`}>Qty (Kg)</th>
                    <th className={`${EXCEL_HEAD} text-right`}>Rate / Kg</th>
                    <th className={`${EXCEL_HEAD} text-right`}>Gross Earnings</th>
                    <th className={`${EXCEL_HEAD} text-right text-[#DC2626]`}>Deductions</th>
                    <th className={`${EXCEL_HEAD} text-right text-[#217346]`}>Net Earnings</th>
                    <th className={`${EXCEL_HEAD} text-center`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEarnings.map((e, idx) => (
                    <tr key={e.id || idx} className="hover:bg-[#F9F9F9] transition-colors">
                      <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{idx + 1}</td>
                      <td className={`${EXCEL_CELL} font-medium whitespace-nowrap`}>{e.date || "—"}</td>
                      <td className={`${EXCEL_CELL}`}>
                        <Link
                          to={`/farmer/manager/farmers/${e.farmerId}`}
                          className="group flex flex-col text-left hover:opacity-80"
                          title={`Open ${e.farmerName}'s Profile & Statement Page`}
                        >
                          <span className="font-bold text-[#217346] hover:underline group-hover:text-[#1a5c38]">
                            {e.farmerName} ↗
                          </span>
                          {e.farmerMobile && (
                            <span className="text-[10px] font-normal text-[#6B7280]">
                              {e.farmerMobile}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className={`${EXCEL_CELL} font-bold text-[#1F2937]`}>{e.cropName}</td>
                      <td className={`${EXCEL_CELL} text-right font-semibold text-[#1F2937] tabular-nums`}>
                        {e.quantity} Kg
                      </td>
                      <td className={`${EXCEL_CELL} text-right text-[#4B5563] tabular-nums`}>
                        ₹{e.ratePerKg}
                      </td>
                      <td className={`${EXCEL_CELL} text-right font-medium text-[#1F2937] tabular-nums`}>
                        ₹{(e.grossEarnings || 0).toLocaleString("en-IN")}
                      </td>
                      <td className={`${EXCEL_CELL} text-right font-bold text-[#DC2626] tabular-nums`}>
                        -₹{(e.deductions || 0).toLocaleString("en-IN")}
                      </td>
                      <td className={`${EXCEL_CELL} text-right font-bold text-[#217346] tabular-nums`}>
                        ₹{(e.netEarnings || 0).toLocaleString("en-IN")}
                      </td>
                      <td className={`${EXCEL_CELL} text-center whitespace-nowrap`}>
                        <StatusBadge status={e.status || "Pending"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#EBF5EB] font-bold text-[#1F2937] border-t-2 border-[#217346]">
                    <td colSpan={4} className={`${EXCEL_CELL} text-right uppercase tracking-wider`}>
                      Grand Total:
                    </td>
                    <td className={`${EXCEL_CELL} text-right text-[#1F2937] tabular-nums`}>
                      {totalQuantity.toLocaleString("en-IN")} Kg
                    </td>
                    <td className={`${EXCEL_CELL}`}></td>
                    <td className={`${EXCEL_CELL} text-right text-[#1F2937] tabular-nums`}>
                      ₹{totalGross.toLocaleString("en-IN")}
                    </td>
                    <td className={`${EXCEL_CELL} text-right text-[#DC2626] tabular-nums`}>
                      -₹{totalDeductions.toLocaleString("en-IN")}
                    </td>
                    <td className={`${EXCEL_CELL} text-right text-[#217346] tabular-nums`}>
                      ₹{totalEarnings.toLocaleString("en-IN")}
                    </td>
                    <td className={`${EXCEL_CELL} text-center text-[#217346]`}>
                      {filteredEarnings.length} Statements
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. INDIVIDUAL FARMER EARNINGS STATEMENT MODAL                */}
      {/* ──────────────────────────────────────────────────────────── */}
      {modalFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col bg-white border border-[#D4D4D4] shadow-2xl rounded-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#D4D4D4] bg-[#F7FAF7] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center border border-[#217346] bg-[#E8F5E9] font-bold text-base text-[#217346] rounded-xs">
                  👨‍🌾
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[#1F2937]">
                    {modalFarmer.name} — Financial Earnings Statement
                  </h2>
                  <p className="text-[11px] text-[#6B7280]">
                    Mobile: {modalFarmer.mobile || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportCSV(modalFarmerEarnings, `${modalFarmer.name}_earnings_statement`)}
                  className={`${EXCEL_BTN} text-xs font-semibold text-[#217346]`}
                >
                  📥 Export (CSV)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFarmerId(modalFarmer.id);
                    setModalFarmer(null);
                  }}
                  className="border border-[#217346] bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#217346] hover:bg-[#c8e6c9]"
                >
                  Filter Main Page 🔍
                </button>
                <button
                  type="button"
                  onClick={() => setModalFarmer(null)}
                  className="rounded-xs border border-[#D4D4D4] bg-white px-2.5 py-1 text-xs font-bold text-[#6B7280] hover:bg-gray-100 hover:text-black"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Modal Mini Stats */}
            <div className="grid grid-cols-3 gap-2 border-b border-[#D4D4D4] bg-[#F9F9F9] p-3">
              <div className="border border-[#D4D4D4] bg-white p-2 text-center">
                <p className="text-[10px] font-semibold text-[#6B7280]">Total Harvest Qty</p>
                <p className="text-sm font-extrabold text-[#1F2937]">{modalTotalQuantity.toLocaleString("en-IN")} Kg</p>
              </div>
              <div className="border border-[#D4D4D4] bg-white p-2 text-center">
                <p className="text-[10px] font-semibold text-[#6B7280]">Total Deductions</p>
                <p className="text-sm font-extrabold text-[#DC2626]">-₹{modalTotalDeductions.toLocaleString("en-IN")}</p>
              </div>
              <div className="border border-[#D4D4D4] bg-white p-2 text-center">
                <p className="text-[10px] font-semibold text-[#6B7280]">Total Net Payout</p>
                <p className="text-sm font-extrabold text-[#217346]">₹{modalTotalEarnings.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-auto p-4">
              <section className={EXCEL_PANEL}>
                <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between`}>
                  <span className="font-bold text-[#1F2937]">Earnings Statement Details</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                    STATEMENT GRID
                  </span>
                </div>

                <div className="p-3">
                  {modalFarmerEarnings.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#6B7280]">
                      No statements found for {modalFarmer.name}.
                    </div>
                  ) : (
                    <div className={EXCEL_WRAP}>
                      <table className={EXCEL_TABLE}>
                        <thead>
                          <tr className="bg-[#F2F2F2]">
                            <th className={`${EXCEL_HEAD} text-center w-12`}>Sr.</th>
                            <th className={`${EXCEL_HEAD} text-left`}>Date</th>
                            <th className={`${EXCEL_HEAD} text-left`}>Crop / Product</th>
                            <th className={`${EXCEL_HEAD} text-right`}>Qty (Kg)</th>
                            <th className={`${EXCEL_HEAD} text-right`}>Rate / Kg</th>
                            <th className={`${EXCEL_HEAD} text-right`}>Gross</th>
                            <th className={`${EXCEL_HEAD} text-right text-[#DC2626]`}>Deductions</th>
                            <th className={`${EXCEL_HEAD} text-right text-[#217346]`}>Net Earnings</th>
                            <th className={`${EXCEL_HEAD} text-center`}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalFarmerEarnings.map((e, idx) => (
                            <tr key={idx} className="hover:bg-[#F9F9F9] transition-colors">
                              <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{idx + 1}</td>
                              <td className={`${EXCEL_CELL} font-medium whitespace-nowrap`}>{e.date || "—"}</td>
                              <td className={`${EXCEL_CELL} font-bold text-[#1F2937]`}>{e.cropName}</td>
                              <td className={`${EXCEL_CELL} text-right font-semibold text-[#1F2937] tabular-nums`}>
                                {e.quantity} Kg
                              </td>
                              <td className={`${EXCEL_CELL} text-right text-[#4B5563] tabular-nums`}>
                                ₹{e.ratePerKg}
                              </td>
                              <td className={`${EXCEL_CELL} text-right font-medium text-[#1F2937] tabular-nums`}>
                                ₹{(e.grossEarnings || 0).toLocaleString("en-IN")}
                              </td>
                              <td className={`${EXCEL_CELL} text-right font-bold text-[#DC2626] tabular-nums`}>
                                -₹{(e.deductions || 0).toLocaleString("en-IN")}
                              </td>
                              <td className={`${EXCEL_CELL} text-right font-bold text-[#217346] tabular-nums`}>
                                ₹{(e.netEarnings || 0).toLocaleString("en-IN")}
                              </td>
                              <td className={`${EXCEL_CELL} text-center whitespace-nowrap`}>
                                <StatusBadge status={e.status || "Pending"} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#EBF5EB] font-bold text-[#1F2937] border-t-2 border-[#217346]">
                            <td colSpan={3} className={`${EXCEL_CELL} text-right uppercase tracking-wider`}>
                              Total:
                            </td>
                            <td className={`${EXCEL_CELL} text-right text-[#1F2937]`}>
                              {modalTotalQuantity.toLocaleString("en-IN")} Kg
                            </td>
                            <td className={`${EXCEL_CELL}`}></td>
                            <td className={`${EXCEL_CELL} text-right text-[#1F2937]`}>
                              ₹{modalTotalGross.toLocaleString("en-IN")}
                            </td>
                            <td className={`${EXCEL_CELL} text-right text-[#DC2626]`}>
                              -₹{modalTotalDeductions.toLocaleString("en-IN")}
                            </td>
                            <td className={`${EXCEL_CELL} text-right text-[#217346]`}>
                              ₹{modalTotalEarnings.toLocaleString("en-IN")}
                            </td>
                            <td className={`${EXCEL_CELL} text-center text-[#217346]`}>
                              {modalFarmerEarnings.length} Records
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#D4D4D4] bg-[#F2F2F2] px-4 py-2.5">
              <Link
                to={`/farmer/manager/farmers/${modalFarmer.id}`}
                className="text-xs font-semibold text-[#217346] hover:underline"
              >
                Go to Full Farmer Profile →
              </Link>
              <button
                type="button"
                onClick={() => setModalFarmer(null)}
                className={`${EXCEL_BTN_PRIMARY} px-4 py-1 text-xs`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
