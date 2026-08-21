import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { EXCEL_CELL, EXCEL_HEAD, EXCEL_TABLE, EXCEL_WRAP } from "../../utils/excelStyles";

function formatDate(isoDate) {
  if (!isoDate) return "—";
  const [y, m, d] = String(isoDate).split("-");
  if (!d) return isoDate;
  return `${d}/${m}/${y}`;
}

function formatRupee(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
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
    const rate = gObj?.rate != null && gObj?.rate !== "" ? Number(gObj.rate) : null;
    return { qty, rate, amount: qty * (rate || 0) };
  }
  if (gName === "Grade A" || gName === "A Grade" || gName.startsWith("A")) {
    const qty = Number(row.gradeAQty || 0);
    const rate = row.gradeARate != null && row.gradeARate !== "" ? Number(row.gradeARate) : null;
    return { qty, rate, amount: qty * (rate || 0) };
  }
  if (gName === "Grade B" || gName === "B Grade" || gName.startsWith("B")) {
    const qty = Number(row.gradeBQty || 0);
    const rate = row.gradeBRate != null && row.gradeBRate !== "" ? Number(row.gradeBRate) : null;
    return { qty, rate, amount: qty * (rate || 0) };
  }
  return { qty: 0, rate: null, amount: 0 };
}

function DailyChartSection({ rows, unit, formatDate, formatRupee }) {
  const [query, setQuery] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [pageSize, setPageSize] = useState(50);

  const hasProductCol = useMemo(() => {
    return rows.some((r) => r.productName);
  }, [rows]);

  const dynamicGrades = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (Array.isArray(r.grades) && r.grades.length > 0) {
        r.grades.forEach((g) => {
          if (g.name || g.label) set.add(g.name || g.label);
        });
      } else {
        if (r.gradeAQty != null || r.gradeARate != null) set.add("Grade A");
        if (r.gradeBQty != null || r.gradeBRate != null) set.add("Grade B");
      }
    });
    if (set.size === 0) {
      set.add("Grade A");
      set.add("Grade B");
      set.add("Grade C");
    }
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

  const colSpanCount = (hasProductCol ? 4 : 3) + dynamicGrades.length * 3 + 2;

  return (
    <div className="border border-[#D4D4D4] bg-white">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#D4D4D4] bg-[#217346] px-3 py-2 text-white">
        <p className="text-xs font-bold flex items-center gap-1.5">
          <span>📊</span> Daily Chart — Dynamic Grades & Fixed Rejection (Statement)
        </p>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-semibold text-white">
          {filteredRows.length} Harvest Records
        </span>
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
            const headerStr = ["Sr", "Date", "Day", ...(hasProductCol ? ["Product"] : []), ...dynamicGrades.flatMap(g => [`${g} Qty`, `${g} Rate`, `${g} Amt`]), "Rejection Qty", "Total"].join(",");
            const csvData = rows.map((r, i) => {
              const gVals = dynamicGrades.flatMap(g => {
                const data = getGradeData(r, g);
                return [data.qty, data.rate, data.amount];
              });
              const rowTot = dynamicGrades.reduce((sum, g) => sum + getGradeData(r, g).amount, 0);
              return [i + 1, r.date, r.weekday, ...(hasProductCol ? [`"${r.productName || ""}"`] : []), ...gVals, r.rejectionQty || 0, rowTot].join(",");
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
                  <tr key={row.id || row.srNo || idx} className={idx % 2 === 0 ? "bg-white" : "bg-[#F9FBF9]"}>
                    <td className="border border-[#D4D4D4] px-2 py-1.5 text-center font-bold text-[#6B7280] bg-[#F2F2F2]">
                      {idx + 1}
                    </td>
                    <td className="border border-[#D4D4D4] px-2 py-1.5 font-medium whitespace-nowrap">{formatDate(row.date)}</td>
                    <td className="border border-[#D4D4D4] px-2 py-1.5 text-[#6B7280]">{row.weekday || "—"}</td>
                    {hasProductCol && (
                      <td className="border border-[#D4D4D4] px-2 py-1.5 font-bold text-[#1F2937]">
                        {row.productName || "Farm Produce"}
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
                            {gData.rate !== null && gData.rate !== "" ? (
                              formatRupee(gData.rate)
                            ) : (
                              <span className="text-[#B48846] text-[11px] font-normal">Pending</span>
                            )}
                          </td>
                          <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-bold text-[#1F2937] tabular-nums bg-[#F9F9F9]">
                            {formatRupee(gData.amount)}
                          </td>
                        </tr>
                      );
                    })}
                    <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-bold text-red-600 tabular-nums bg-[#FEF2F2]">
                      {row.rejectionQty || 0} {rUnit}
                    </td>
                    <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-extrabold text-[#DC2626] tabular-nums bg-[#FEF2F2]">
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
                <td className="border border-[#D4D4D4] px-3 py-2 text-left" colSpan={hasProductCol ? 4 : 3}>
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
      </div>
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
      formatDate={formatDate}
      formatRupee={formatRupee}
    />
  );
}

export default ProductGradeChart;
