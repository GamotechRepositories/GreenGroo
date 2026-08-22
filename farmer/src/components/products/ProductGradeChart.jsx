import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { EXCEL_CELL, EXCEL_HEAD, EXCEL_INPUT, EXCEL_SELECT, EXCEL_TABLE, EXCEL_WRAP, EXCEL_BTN, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";

function formatDate(isoDate) {
  if (!isoDate) return "—";
  const s = String(isoDate).split("T")[0];
  if (s.includes("-")) {
    const [y, m, d] = s.split("-");
    if (d && m && y) return `${d}/${m}/${y}`;
  }
  return isoDate;
}

function formatIsoDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  if (dateStr.includes("/") && dateStr.split("/").length === 3) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toISOString().split("T")[0];
}

function formatRupee(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getDayName(dateStr) {
  if (!dateStr) return "Today";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const d = new Date(dateStr);
  return isNaN(d.getDay()) ? "Today" : days[d.getDay()];
}

function SearchIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function getGradeData(row, gName) {
  if (Array.isArray(row.grades) && row.grades.length > 0) {
    const gObj = row.grades.find(
      (g) => (g.name || g.label) === gName || (g.name || g.label)?.toLowerCase() === gName?.toLowerCase()
    );
    const qty = gObj?.quantity != null ? Number(gObj.quantity) : 0;
    const rate = gObj?.rate !== null && gObj?.rate !== undefined && gObj?.rate !== ""
      ? Number(gObj.rate)
      : (gObj?.price !== null && gObj?.price !== undefined && gObj?.price !== "" ? Number(gObj.price) : null);
    return { qty, rate, amount: qty * (rate || 0) };
  }
  if (gName === "Grade A" || gName === "A Grade" || gName.startsWith("A")) {
    const qty = Number(row.gradeAQty || 0);
    const rate = row.gradeARate !== null && row.gradeARate !== undefined && row.gradeARate !== "" ? Number(row.gradeARate) : null;
    return { qty, rate, amount: qty * (rate || 0) };
  }
  if (gName === "Grade B" || gName === "B Grade" || gName.startsWith("B")) {
    const qty = Number(row.gradeBQty || 0);
    const rate = row.gradeBRate !== null && row.gradeBRate !== undefined && row.gradeBRate !== "" ? Number(row.gradeBRate) : null;
    return { qty, rate, amount: qty * (rate || 0) };
  }
  if (gName === "Grade C" || gName === "C Grade" || gName.startsWith("C")) {
    const qty = Number(row.gradeCQty || 0);
    const rate = row.gradeCRate !== null && row.gradeCRate !== undefined && row.gradeCRate !== "" ? Number(row.gradeCRate) : null;
    return { qty, rate, amount: qty * (rate || 0) };
  }
  return { qty: 0, rate: null, amount: 0 };
}

const UNIT_OPTIONS = ["Kg", "Litre", "Box", "Bundle", "Dozen", "Quintal", "Gram"];
const STATUS_OPTIONS = ["Confirmed", "Approved", "Processing", "Ready for Pickup", "Delivered", "Completed", "Pending"];

function DailyChartSection({ rows, unit, formatDate, formatRupee, showFarmerCol, onUpdateRow }) {
  const [query, setQuery] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [pageSize, setPageSize] = useState(50);

  // Edit Modal State
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({
    date: "",
    day: "",
    productName: "",
    unit: "Kg",
    rejectionQty: 0,
    status: "Confirmed",
    grades: {}, // { "Grade A": { qty: 10, rate: 20 }, ... }
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const hasFarmerCol = useMemo(() => {
    return showFarmerCol || rows.some((r) => r.farmerName);
  }, [rows, showFarmerCol]);

  const hasProductCol = useMemo(() => {
    return rows.some((r) => r.productName);
  }, [rows]);

  const dynamicGrades = useMemo(() => {
    const set = new Set(["Grade A", "Grade B", "Grade C"]);
    rows.forEach((r) => {
      if (Array.isArray(r.grades) && r.grades.length > 0) {
        r.grades.forEach((g) => {
          if (g.name || g.label) set.add(g.name || g.label);
        });
      } else {
        if (r.gradeAQty != null || r.gradeARate != null) set.add("Grade A");
        if (r.gradeBQty != null || r.gradeBRate != null) set.add("Grade B");
        if (r.gradeCQty != null || r.gradeCRate != null) set.add("Grade C");
      }
    });
    return Array.from(set);
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = [...rows];
    const needle = query.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (row) =>
          formatDate(row.date).toLowerCase().includes(needle) ||
          row.weekday?.toLowerCase().includes(needle) ||
          row.farmerName?.toLowerCase().includes(needle) ||
          row.productName?.toLowerCase().includes(needle) ||
          String(row.srNo).includes(needle)
      );
    }
    if (dayFilter) {
      list = list.filter((row) => row.weekday === dayFilter);
    }
    return list;
  }, [rows, query, dayFilter]);

  const visibleRows = filteredRows.slice(0, pageSize);
  const days = [...new Set(rows.map((r) => r.weekday).filter(Boolean))];

  const totals = useMemo(() => {
    const gradeTotals = {};
    dynamicGrades.forEach((gName) => {
      const gQty = filteredRows.reduce((sum, r) => sum + getGradeData(r, gName).qty, 0);
      const gAmt = filteredRows.reduce((sum, r) => sum + getGradeData(r, gName).amount, 0);
      const avgRate = gQty > 0 ? Math.round(gAmt / gQty) : 0;
      gradeTotals[gName] = { qty: gQty, rate: avgRate, amount: gAmt };
    });
    const totalRejection = filteredRows.reduce((sum, r) => sum + Number(r.rejectionQty || 0), 0);
    const grandTotal = dynamicGrades.reduce((sum, gName) => sum + gradeTotals[gName].amount, 0);

    return { gradeTotals, totalRejection, grandTotal };
  }, [filteredRows, dynamicGrades]);

  // Click on row to open Edit Modal
  const handleRowClick = (row) => {
    setEditingRow(row);

    const gradeMap = {};
    dynamicGrades.forEach((gName) => {
      const gData = getGradeData(row, gName);
      gradeMap[gName] = {
        qty: gData.qty,
        rate: gData.rate !== null && gData.rate !== undefined ? gData.rate : "",
      };
    });

    setEditForm({
      id: row.id || row.orderId,
      date: formatIsoDate(row.date),
      day: row.weekday || getDayName(row.date),
      productName: row.productName || "Farm Fresh Produce",
      unit: row.unit || unit || "Kg",
      rejectionQty: Number(row.rejectionQty || 0),
      status: row.status || "Confirmed",
      grades: gradeMap,
    });
  };

  // Save changes from Edit Modal
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRow) return;

    setSavingEdit(true);
    try {
      const gradesList = Object.entries(editForm.grades).map(([gName, gVal]) => ({
        name: gName,
        label: gName,
        quantity: Number(gVal.qty || 0),
        rate: gVal.rate !== "" && gVal.rate !== null && gVal.rate !== undefined ? Number(gVal.rate) : null,
      }));

      const totalQuantity = gradesList.reduce((sum, g) => sum + g.quantity, 0);
      const totalAmount = gradesList.reduce((sum, g) => sum + (g.quantity * (g.rate || 0)), 0);

      const updatedPayload = {
        id: editingRow.id || editingRow.orderId,
        orderId: editingRow.id || editingRow.orderId,
        harvestDate: editForm.date,
        date: editForm.date,
        day: editForm.day,
        weekday: editForm.day,
        productName: editForm.productName,
        unit: editForm.unit,
        rejectionQty: Number(editForm.rejectionQty || 0),
        status: editForm.status,
        grades: gradesList,
        totalQuantity,
        totalAmount,
        amount: totalAmount,
        products: [
          {
            name: editForm.productName,
            unit: editForm.unit,
            quantity: totalQuantity,
            grades: gradesList,
          },
        ],
      };

      if (onUpdateRow) {
        await onUpdateRow(updatedPayload);
      } else {
        // Fallback: update local row directly
        Object.assign(editingRow, {
          date: editForm.date,
          weekday: editForm.day,
          productName: editForm.productName,
          unit: editForm.unit,
          rejectionQty: Number(editForm.rejectionQty || 0),
          status: editForm.status,
          grades: gradesList,
        });
        toast.success("Statement row updated successfully!");
      }

      setEditingRow(null);
    } catch (err) {
      toast.error(err?.message || "Failed to update statement row");
    } finally {
      setSavingEdit(false);
    }
  };

  let colSpanCount = 3 + (hasFarmerCol ? 1 : 0) + (hasProductCol ? 1 : 0) + dynamicGrades.length * 3 + 2;

  // Real-time calculation for modal preview
  const modalTotalQty = Object.values(editForm.grades).reduce((sum, g) => sum + Number(g.qty || 0), 0);
  const modalTotalAmt = Object.values(editForm.grades).reduce(
    (sum, g) => sum + Number(g.qty || 0) * (Number(g.rate || 0)),
    0
  );

  return (
    <div className="border border-[#D4D4D4] bg-white">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#D4D4D4] bg-[#217346] px-3 py-2 text-white">
        <p className="text-xs font-bold flex items-center gap-1.5">
          <span>📊</span> Daily Chart — Dynamic Grades & Fixed Rejection (Statement)
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-semibold text-white">
            {filteredRows.length} Harvest Records
          </span>
          <span className="text-[10px] bg-amber-400/90 text-black font-extrabold px-2 py-0.5 rounded">
            ✏️ Click any row to edit all fields
          </span>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#D4D4D4] bg-[#F9F9F9] px-3 py-2">
        <div className="relative min-w-[200px] flex-1">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#6B7280]">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product, date, day..."
            className="w-full border border-[#D4D4D4] bg-white py-1.5 pl-7 pr-2 text-xs text-[#1F2937] outline-none focus:border-[#217346]"
          />
        </div>
        <select
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          className="border border-[#D4D4D4] bg-white px-2 py-1.5 text-xs text-[#1F2937]"
        >
          <option value="">All days</option>
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="border border-[#D4D4D4] bg-white px-2 py-1.5 text-xs text-[#1F2937]"
        >
          <option value={10}>10 / page</option>
          <option value={24}>24 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
        <button
          type="button"
          onClick={() => {
            const headerStr = ["Sr", "Date", "Day", ...(hasFarmerCol ? ["Farmer"] : []), ...(hasProductCol ? ["Product"] : []), ...dynamicGrades.flatMap(g => [`${g} Qty`, `${g} Rate`, `${g} Amt`]), "Rejection Qty", "Total"].join(",");
            const csvData = rows.map((r, i) => {
              const gVals = dynamicGrades.flatMap(g => {
                const data = getGradeData(r, g);
                return [data.qty, data.rate, data.amount];
              });
              const rowTot = dynamicGrades.reduce((sum, g) => sum + getGradeData(r, g).amount, 0);
              return [i + 1, r.date, r.weekday, ...(hasFarmerCol ? [`"${r.farmerName || ""}"`] : []), ...(hasProductCol ? [`"${r.productName || ""}"`] : []), ...gVals, r.rejectionQty || 0, rowTot].join(",");
            }).join("\n");
            const blob = new Blob([`${headerStr}\n${csvData}`], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "daily_chart_statement.csv";
            a.click();
            toast.success("CSV exported");
          }}
          className="border border-[#D4D4D4] bg-white px-2 py-1.5 text-xs font-medium text-[#1F2937] hover:bg-[#F3F4F6]"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Dynamic Excel Grid Table */}
      <div className={EXCEL_WRAP}>
        <table className="w-full border-collapse border border-[#D4D4D4] text-left text-xs min-w-[950px]">
          <thead>
            <tr className="bg-[#E6F2EB] text-[#1F2937] text-[11px] font-bold">
              <th className="border border-[#D4D4D4] px-2 py-2 text-center w-10">Sr.</th>
              <th className="border border-[#D4D4D4] px-2 py-2 text-left w-20">Date</th>
              <th className="border border-[#D4D4D4] px-2 py-2 text-left w-24">Day</th>
              {hasFarmerCol && (
                <th className="border border-[#D4D4D4] px-2 py-2 text-left w-36">Farmer</th>
              )}
              {hasProductCol && (
                <th className="border border-[#D4D4D4] px-2 py-2 text-left w-36">Product</th>
              )}
              {dynamicGrades.map((gName) => (
                <FragmentGroup key={gName} gName={gName} unit={unit} />
              ))}
              <th className="border border-[#D4D4D4] px-2 py-2 text-right text-red-600 w-24">Rejection Qty</th>
              <th className="border border-[#D4D4D4] px-2 py-2 text-right text-[#DC2626] w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={colSpanCount} className="border border-[#D4D4D4] py-8 text-center text-[#6B7280] bg-white">
                  No statement records available.
                </td>
              </tr>
            ) : (
              visibleRows.map((row, idx) => {
                let rowTotal = 0;
                const rUnit = row.unit || unit || "Kg";

                return (
                  <tr
                    key={row.id || row.srNo || idx}
                    onClick={() => handleRowClick(row)}
                    title="Click row to edit all fields (Date, Product, Grades Qty & Rates, Rejection)"
                    className={`cursor-pointer transition-colors group ${
                      idx % 2 === 0 ? "bg-white hover:bg-[#E8F5E9]" : "bg-[#F9FBF9] hover:bg-[#E8F5E9]"
                    }`}
                  >
                    <td className="border border-[#D4D4D4] px-2 py-1.5 text-center font-bold text-[#6B7280] bg-[#F2F2F2] group-hover:bg-[#d5ecd5] group-hover:text-[#217346]">
                      {idx + 1}
                    </td>
                    <td className="border border-[#D4D4D4] px-2 py-1.5 font-medium whitespace-nowrap">{formatDate(row.date)}</td>
                    <td className="border border-[#D4D4D4] px-2 py-1.5 text-[#6B7280]">{row.weekday || "—"}</td>
                    {hasFarmerCol && (
                      <td className="border border-[#D4D4D4] px-2 py-1.5 font-bold text-[#217346]">
                        {row.farmerName || "—"}
                      </td>
                    )}
                    {hasProductCol && (
                      <td className="border border-[#D4D4D4] px-2 py-1.5 font-bold text-[#1F2937]">
                        <span className="flex items-center justify-between gap-1">
                          <span>{row.productName || "Farm Produce"}</span>
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-[#217346] font-normal transition-opacity">
                            ✏️ Edit
                          </span>
                        </span>
                      </td>
                    )}
                    {dynamicGrades.map((gName) => {
                      const gData = getGradeData(row, gName);
                      rowTotal += gData.amount;
                      return (
                        <tr key={gName} className="contents">
                          <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-medium">
                            {gData.qty > 0 ? `${gData.qty} ${rUnit}` : "0"}
                          </td>
                          <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-medium">
                            {gData.rate !== null && gData.rate !== undefined && gData.rate !== "" ? (
                              formatRupee(gData.rate)
                            ) : (
                              <span className="text-[#B48846] text-[11px] font-normal">Pending</span>
                            )}
                          </td>
                          <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-bold text-[#1F2937] tabular-nums bg-[#F9F9F9] group-hover:bg-[#e4f4e4]">
                            {formatRupee(gData.amount)}
                          </td>
                        </tr>
                      );
                    })}
                    <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-bold text-red-600 tabular-nums bg-[#FEF2F2] group-hover:bg-[#ffe2e2]">
                      {row.rejectionQty || 0} {rUnit}
                    </td>
                    <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-extrabold text-[#DC2626] tabular-nums bg-[#FEF2F2] group-hover:bg-[#ffe2e2]">
                      {formatRupee(rowTotal)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {visibleRows.length > 0 ? (
            <tfoot>
              <tr className="bg-[#E6F2EB] font-bold text-xs">
                <td className="border border-[#D4D4D4] px-3 py-2 text-left" colSpan={3 + (hasFarmerCol ? 1 : 0) + (hasProductCol ? 1 : 0)}>
                  Grand Total Summary:
                </td>
                {dynamicGrades.map((gName) => {
                  const gTot = totals.gradeTotals[gName] || { qty: 0, rate: 0, amount: 0 };
                  return (
                    <tr key={gName} className="contents">
                      <td className="border border-[#D4D4D4] px-2 py-2 text-right tabular-nums">
                        {gTot.qty} {unit}
                      </td>
                      <td className="border border-[#D4D4D4] px-2 py-2 text-right tabular-nums">
                        {formatRupee(gTot.rate)}
                      </td>
                      <td className="border border-[#D4D4D4] px-2 py-2 text-right font-bold tabular-nums">
                        {formatRupee(gTot.amount)}
                      </td>
                    </tr>
                  );
                })}
                <td className="border border-[#D4D4D4] px-2 py-2 text-right font-bold text-red-600 tabular-nums">
                  {totals.totalRejection} {unit}
                </td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right font-extrabold text-[#DC2626] tabular-nums">
                  {formatRupee(totals.grandTotal)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <div className="border-t border-[#D4D4D4] px-3 py-2 text-xs text-[#6B7280] flex justify-between items-center bg-[#F9F9F9]">
        <span>Showing {visibleRows.length} of {filteredRows.length} statement records</span>
        <span className="font-semibold text-[#217346]">💡 Tip: Click any row above to edit all values</span>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* FULL ROW EDIT MODAL DIALOG                                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col bg-white border border-[#217346] shadow-2xl rounded-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#D4D4D4] bg-[#F2F8F3] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <div>
                  <h3 className="font-extrabold text-sm text-[#1F2937]">
                    Edit Statement Record — {editForm.productName}
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Modify produce harvest date, product name, quantities, dynamic grade rates and rejection
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="rounded-xs border border-[#D4D4D4] bg-white px-2.5 py-1 text-xs font-bold text-[#6B7280] hover:bg-gray-100 hover:text-black"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Row 1: Date & Day */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] mb-1">
                    Harvest Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editForm.date}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditForm((prev) => ({
                        ...prev,
                        date: val,
                        day: getDayName(val),
                      }));
                    }}
                    className={`${EXCEL_INPUT} w-full py-1.5`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Day / Weekday</label>
                  <input
                    type="text"
                    value={editForm.day}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, day: e.target.value }))}
                    className={`${EXCEL_INPUT} w-full py-1.5 bg-gray-50 font-medium`}
                  />
                </div>
              </div>

              {/* Row 2: Product Name, Unit & Status */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-[#4B5563] mb-1">
                    Product / Crop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.productName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, productName: e.target.value }))}
                    className={`${EXCEL_INPUT} w-full py-1.5 font-bold text-[#1F2937]`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Unit</label>
                  <select
                    value={editForm.unit}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, unit: e.target.value }))}
                    className={`${EXCEL_SELECT} w-full py-1.5`}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                    className={`${EXCEL_SELECT} w-full py-1.5 font-semibold text-[#217346]`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Grades Quantities & Rates Breakdown */}
              <div className="rounded-xs border border-[#217346]/40 bg-[#F2F8F3] p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#217346]/20 pb-2">
                  <p className="text-xs font-extrabold text-[#217346] flex items-center gap-1.5">
                    <span>🌾</span> Produce Grades Breakdown & Rates ({editForm.unit})
                  </p>
                  <span className="text-[10px] text-[#6B7280] font-medium">Leave rate blank for 'Pending'</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {dynamicGrades.map((gName) => {
                    const gData = editForm.grades[gName] || { qty: 0, rate: "" };
                    const lineAmt = Number(gData.qty || 0) * (Number(gData.rate || 0));

                    return (
                      <div key={gName} className="rounded-xs border border-[#D4D4D4] bg-white p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-[#1F2937]">{gName}</span>
                          <span className="text-[11px] font-bold text-[#217346]">
                            ₹{lineAmt.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">Quantity ({editForm.unit})</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={gData.qty}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditForm((prev) => ({
                                ...prev,
                                grades: {
                                  ...prev.grades,
                                  [gName]: {
                                    ...prev.grades[gName],
                                    qty: val === "" ? "" : Number(val),
                                  },
                                },
                              }));
                            }}
                            className={`${EXCEL_INPUT} w-full py-1 text-right font-semibold`}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">Rate per {editForm.unit} (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Pending"
                            value={gData.rate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditForm((prev) => ({
                                ...prev,
                                grades: {
                                  ...prev.grades,
                                  [gName]: {
                                    ...prev.grades[gName],
                                    rate: val === "" ? "" : Number(val),
                                  },
                                },
                              }));
                            }}
                            className={`${EXCEL_INPUT} w-full py-1 text-right font-semibold`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: Rejection Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xs border border-red-200 bg-red-50/50 p-3">
                  <label className="block text-[11px] font-bold text-[#DC2626] mb-1">
                    Rejection Quantity ({editForm.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.rejectionQty}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, rejectionQty: Number(e.target.value || 0) }))}
                    className={`${EXCEL_INPUT} w-full py-1.5 text-right font-bold text-[#DC2626] border-red-300`}
                  />
                </div>

                {/* Live Totals Preview */}
                <div className="rounded-xs border border-[#D4D4D4] bg-[#F9F9F9] p-3 flex flex-col justify-between">
                  <div className="flex justify-between text-xs font-semibold text-[#6B7280]">
                    <span>Total Harvest Volume:</span>
                    <span className="font-bold text-[#1F2937]">{modalTotalQty} {editForm.unit}</span>
                  </div>
                  <div className="flex justify-between text-xs font-extrabold text-[#217346] border-t border-[#E5E7EB] pt-1.5 mt-1">
                    <span>Calculated Row Total:</span>
                    <span>₹{modalTotalAmt.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-[#D4D4D4] pt-3">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="rounded-xs border border-[#D4D4D4] bg-white px-4 py-2 text-xs font-bold text-[#4B5563] hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className={`${EXCEL_BTN_PRIMARY} px-5 py-2 text-xs font-bold shadow-sm disabled:opacity-50`}
                >
                  {savingEdit ? "Saving Changes…" : "✓ Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FragmentGroup({ gName, unit }) {
  return (
    <>
      <th className="border border-[#D4D4D4] px-2 py-2 text-right w-24">{gName} Qty</th>
      <th className="border border-[#D4D4D4] px-2 py-2 text-right w-20">{gName} Rate</th>
      <th className="border border-[#D4D4D4] px-2 py-2 text-right w-24">{gName} Amt</th>
    </>
  );
}

function ProductGradeChart({
  rows = [],
  unit = "Kg",
  showFarmerCol = false,
  onUpdateRow,
  summary = {
    totalRupees: 0,
    deposited: 0,
    balance: 0,
  },
}) {
  return (
    <DailyChartSection
      rows={rows}
      unit={unit}
      showFarmerCol={showFarmerCol}
      onUpdateRow={onUpdateRow}
      formatDate={formatDate}
      formatRupee={formatRupee}
    />
  );
}

export default ProductGradeChart;
