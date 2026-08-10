import { useMemo, useState } from "react";
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

function DailyChartSection({ rows, unit, formatDate, formatRupee }) {
  const [query, setQuery] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [pageSize, setPageSize] = useState(24);

  const filteredRows = useMemo(() => {
    let list = [...rows];
    const needle = query.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (row) =>
          formatDate(row.date).toLowerCase().includes(needle) ||
          row.weekday?.toLowerCase().includes(needle) ||
          String(row.srNo).includes(needle)
      );
    }
    if (dayFilter) {
      list = list.filter((row) => row.weekday === dayFilter);
    }
    return list;
  }, [rows, query, dayFilter, formatDate]);

  const visibleRows = filteredRows.slice(0, pageSize);
  const days = [...new Set(rows.map((r) => r.weekday).filter(Boolean))];

  const totals = useMemo(() => {
    const gradeAQty = filteredRows.reduce((s, r) => s + Number(r.gradeAQty || 0), 0);
    const gradeBQty = filteredRows.reduce((s, r) => s + Number(r.gradeBQty || 0), 0);
    const aTotal = filteredRows.reduce((s, r) => s + Number(r.aTotal || 0), 0);
    const bTotal = filteredRows.reduce((s, r) => s + Number(r.bTotal || 0), 0);
    const abTotal = filteredRows.reduce((s, r) => s + Number(r.abTotal || 0), 0);
    const avgARate = gradeAQty > 0 ? Math.round(aTotal / gradeAQty) : 0;
    const avgBRate = gradeBQty > 0 ? Math.round(bTotal / gradeBQty) : 0;
    return { gradeAQty, gradeBQty, aTotal, bTotal, abTotal, avgARate, avgBRate };
  }, [filteredRows]);

  return (
    <div className="border border-[#D4D4D4] bg-white">
      <div className="border-b border-[#D4D4D4] bg-[#F2F2F2] px-3 py-2">
        <p className="text-xs font-semibold text-[#1F2937]">Daily Chart — Grade A / B</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[#D4D4D4] bg-white px-3 py-2">
        <div className="relative min-w-[200px] flex-1">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#6B7280]">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full border border-[#D4D4D4] bg-white py-1.5 pl-7 pr-2 text-xs text-[#1F2937] outline-none focus:border-[#217346]"
          />
        </div>
        <select
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          aria-label="Filter by day"
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
          aria-label="Rows per page"
          className="border border-[#D4D4D4] bg-white px-2 py-1.5 text-xs text-[#1F2937]"
        >
          <option value={10}>10 / page</option>
          <option value={24}>24 / page</option>
          <option value={50}>50 / page</option>
        </select>
        <button
          type="button"
          className="border border-[#D4D4D4] bg-[#F2F2F2] px-2 py-1.5 text-xs font-medium text-[#1F2937] hover:bg-[#E7E7E7]"
        >
          Export CSV
        </button>
      </div>

      <div className={EXCEL_WRAP}>
        <table className={`${EXCEL_TABLE} min-w-[900px]`}>
          <thead>
            <tr>
              <th className={`${EXCEL_HEAD} text-left`}>Sr.</th>
              <th className={`${EXCEL_HEAD} text-left`}>Date</th>
              <th className={`${EXCEL_HEAD} text-left`}>Day</th>
              <th className={`${EXCEL_HEAD} text-right`}>A Qty</th>
              <th className={`${EXCEL_HEAD} text-right`}>A Rate</th>
              <th className={`${EXCEL_HEAD} text-right`}>A Amount</th>
              <th className={`${EXCEL_HEAD} text-right`}>B Qty</th>
              <th className={`${EXCEL_HEAD} text-right`}>B Rate</th>
              <th className={`${EXCEL_HEAD} text-right`}>B Amount</th>
              <th className={`${EXCEL_HEAD} text-right text-red-600`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={10} className={`${EXCEL_CELL} py-6 text-center text-[#6B7280]`}>
                  No records found.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={`${row.date}-${row.srNo}`} className="hover:bg-[#F9F9F9]">
                  <td className={`${EXCEL_CELL} text-left`}>{row.srNo}</td>
                  <td className={`${EXCEL_CELL} whitespace-nowrap text-left`}>{formatDate(row.date)}</td>
                  <td className={`${EXCEL_CELL} text-left`}>{row.weekday}</td>
                  <td className={`${EXCEL_CELL} text-right`}>
                    {row.gradeAQty} {row.unit || unit}
                  </td>
                  <td className={`${EXCEL_CELL} text-right`}>{formatRupee(row.gradeARate)}</td>
                  <td className={`${EXCEL_CELL} text-right font-bold`}>{formatRupee(row.aTotal)}</td>
                  <td className={`${EXCEL_CELL} text-right`}>
                    {row.gradeBQty} {row.unit || unit}
                  </td>
                  <td className={`${EXCEL_CELL} text-right`}>{formatRupee(row.gradeBRate)}</td>
                  <td className={`${EXCEL_CELL} text-right font-bold`}>{formatRupee(row.bTotal)}</td>
                  <td className={`${EXCEL_CELL} text-right font-semibold text-red-600`}>
                    {formatRupee(row.abTotal)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {visibleRows.length > 0 ? (
            <tfoot>
              <tr className="bg-[#F2F2F2] font-semibold">
                <td className={`${EXCEL_CELL} text-left`} colSpan={3}>
                  Total
                </td>
                <td className={`${EXCEL_CELL} text-right`}>
                  {totals.gradeAQty} {unit}
                </td>
                <td className={`${EXCEL_CELL} text-right`}>{formatRupee(totals.avgARate)}</td>
                <td className={`${EXCEL_CELL} text-right font-bold`}>{formatRupee(totals.aTotal)}</td>
                <td className={`${EXCEL_CELL} text-right`}>
                  {totals.gradeBQty} {unit}
                </td>
                <td className={`${EXCEL_CELL} text-right`}>{formatRupee(totals.avgBRate)}</td>
                <td className={`${EXCEL_CELL} text-right font-bold`}>{formatRupee(totals.bTotal)}</td>
                <td className={`${EXCEL_CELL} text-right font-semibold text-red-600`}>
                  {formatRupee(totals.abTotal)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <div className="border-t border-[#D4D4D4] px-3 py-1.5 text-xs text-[#6B7280]">
        Showing {visibleRows.length} of {filteredRows.length} records
      </div>
    </div>
  );
}

function SalesSummarySection({
  grandAQty,
  grandBQty,
  grandATotal,
  grandBTotal,
  totalRupees,
  avgARate,
  avgBRate,
  unit,
  formatRupee,
}) {
  const totalQty = Number(grandAQty || 0) + Number(grandBQty || 0);
  const columns = [
    { header: "A Qty", value: `${grandAQty} ${unit}`, cellClass: "text-right tabular-nums" },
    { header: "A Rate", value: formatRupee(avgARate), cellClass: "text-right tabular-nums" },
    {
      header: "A Amount",
      value: formatRupee(grandATotal),
      cellClass: "text-right font-bold tabular-nums",
      headClass: "text-right",
    },
    { header: "B Qty", value: `${grandBQty} ${unit}`, cellClass: "text-right tabular-nums" },
    { header: "B Rate", value: formatRupee(avgBRate), cellClass: "text-right tabular-nums" },
    {
      header: "B Amount",
      value: formatRupee(grandBTotal),
      cellClass: "text-right font-bold tabular-nums",
      headClass: "text-right",
    },
    {
      header: "Total Qty",
      value: `${totalQty} ${unit}`,
      cellClass: "text-right font-semibold tabular-nums",
      headClass: "text-right",
    },
    {
      header: "Total",
      value: formatRupee(totalRupees),
      cellClass: "text-right text-red-600 font-semibold tabular-nums",
      headClass: "text-right text-red-600",
    },
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-[#1F2937]">Sales Summary</p>
      <div className={EXCEL_WRAP}>
        <table className={`${EXCEL_TABLE} min-w-[720px]`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.header} className={`${EXCEL_HEAD} ${col.headClass || col.cellClass}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {columns.map((col) => (
                <td key={col.header} className={`${EXCEL_CELL} ${col.cellClass}`}>
                  {col.value}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentOverviewSection({ totalRupees, deposited, balance, formatRupee }) {
  const columns = [
    {
      header: "Total Amount",
      value: formatRupee(totalRupees),
      cellClass: "text-left text-red-600 font-semibold",
      headClass: "text-left text-red-600",
    },
    {
      header: "Received",
      value: formatRupee(deposited),
      cellClass: "text-right text-emerald-700 font-semibold",
      headClass: "text-right text-emerald-700",
    },
    {
      header: "Pending",
      value: formatRupee(balance),
      cellClass: "text-right text-red-600 font-semibold",
      headClass: "text-right text-red-600",
    },
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-[#1F2937]">Payment Overview</p>
      <div className={EXCEL_WRAP}>
        <table className={EXCEL_TABLE}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.header} className={`${EXCEL_HEAD} ${col.headClass || col.cellClass}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {columns.map((col) => (
                <td key={col.header} className={`${EXCEL_CELL} ${col.cellClass}`}>
                  {col.value}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductGradeChart({
  rows = [],
  summary = { totalRupees: 0, deposited: 0, balance: 0 },
  title,
}) {
  if (!rows.length) {
    return (
      <div className="border border-[#D4D4D4] bg-white px-4 py-10 text-center text-xs text-[#6B7280]">
        {title ? `${title} — ` : ""}No Grade A / B chart available.
      </div>
    );
  }

  const grandAQty = rows.reduce((s, r) => s + Number(r.gradeAQty || 0), 0);
  const grandBQty = rows.reduce((s, r) => s + Number(r.gradeBQty || 0), 0);
  const grandATotal = rows.reduce((s, r) => s + Number(r.aTotal || 0), 0);
  const grandBTotal = rows.reduce((s, r) => s + Number(r.bTotal || 0), 0);
  const grandAB = grandATotal + grandBTotal;
  const unit = rows[0]?.unit || "Kg";
  const totalRupees = summary.totalRupees ?? grandAB;
  const deposited = summary.deposited ?? 0;
  const balance = summary.balance ?? Math.max(0, totalRupees - deposited);
  const avgARate = grandAQty > 0 ? Math.round(grandATotal / grandAQty) : 0;
  const avgBRate = grandBQty > 0 ? Math.round(grandBTotal / grandBQty) : 0;

  return (
    <section className="space-y-4">
      {title ? <h2 className="text-sm font-bold text-[#1F2937]">{title}</h2> : null}

      <PaymentOverviewSection
        totalRupees={totalRupees}
        deposited={deposited}
        balance={balance}
        formatRupee={formatRupee}
      />

      <SalesSummarySection
        grandAQty={grandAQty}
        grandBQty={grandBQty}
        grandATotal={grandATotal}
        grandBTotal={grandBTotal}
        totalRupees={totalRupees}
        avgARate={avgARate}
        avgBRate={avgBRate}
        unit={unit}
        formatRupee={formatRupee}
      />

      <DailyChartSection
        rows={rows}
        unit={unit}
        formatDate={formatDate}
        formatRupee={formatRupee}
      />
    </section>
  );
}

export default ProductGradeChart;
