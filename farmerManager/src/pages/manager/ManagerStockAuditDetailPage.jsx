import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getManagerAllInventory, getManagerAllStockHistory } from "../../api/farmerApi";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
} from "../../utils/excelStyles";

function shortDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatTime12h(value) {
  if (!value) return "—";
  const asDate = new Date(value);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  return String(value);
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function extractProductGrades(p = {}) {
  let gradeA = Number(p.gradeAQty ?? p.gradeA ?? 0);
  let gradeB = Number(p.gradeBQty ?? p.gradeB ?? 0);
  let gradeC = Number(p.gradeCQty ?? p.gradeC ?? 0);

  if (Array.isArray(p.grades) && p.grades.length > 0) {
    p.grades.forEach((g) => {
      const label = String(g.label || g.grade || g.name || "").trim().toUpperCase();
      const q = Number(g.quantity ?? g.qty ?? 0);
      if (label.includes("A") && (q > 0 || gradeA === 0)) gradeA = q;
      else if (label.includes("B") && (q > 0 || gradeB === 0)) gradeB = q;
      else if (label.includes("C") && (q > 0 || gradeC === 0)) gradeC = q;
    });
  }

  const gradesTotal = gradeA + gradeB + gradeC;
  const stock = gradesTotal > 0 ? gradesTotal : Number(p.totalQuantity || p.totalStock || p.stock || p.availableQuantity || 0);
  return { gradeA, gradeB, gradeC, totalStock: stock };
}

const TABLE_TH =
  "border border-[#D1D5DB] bg-[#F8FAFC] px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap";
const TABLE_SUBTH =
  "border border-[#E5E7EB] bg-[#F1F5F9] px-2 py-1 text-[11px] font-bold tracking-tight whitespace-nowrap";
const TABLE_TD =
  "border border-[#E5E7EB] px-2 py-1.5 text-xs font-medium text-slate-800 align-middle whitespace-nowrap";

export default function ManagerStockAuditDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(location.state?.record || null);
  const [auditRows, setAuditRows] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getManagerAllStockHistory().catch(() => ({ history: [], farmers: [] })),
      getManagerAllInventory().catch(() => ({ inventory: [] })),
    ])
      .then(([stockData, invData]) => {
        const hist = Array.isArray(stockData?.history) ? stockData.history : [];
        const farmers = Array.isArray(stockData?.farmers) ? stockData.farmers : [];
        const inv = Array.isArray(invData?.inventory) ? invData.inventory : [];

        // Find primary record
        let target = record;
        if (!target) {
          const found = hist.find((h) => String(h.id) === String(id) || String(h._id) === String(id));
          if (found) {
            const fid = found.farmerId;
            const farmerObj = farmers.find((f) => String(f.id || f.farmerId) === String(fid));
            const prodObj = inv.find(
              (p) =>
                String(p.id) === String(found.productId) ||
                String(p.productId) === String(found.productId) ||
                (p.farmerId === fid &&
                  String(p.name || p.productName).toLowerCase() === String(found.productName).toLowerCase())
            );

            const change = num(found.changedQuantity);
            let prev = found.previousStock != null ? num(found.previousStock) : null;
            let nxt = found.newStock != null ? num(found.newStock) : null;
            if (prev == null && nxt != null) prev = Math.max(0, nxt - change);
            if (nxt == null && prev != null) nxt = Math.max(0, prev + change);

            target = {
              id: found.id || id,
              farmerId: fid,
              farmerName: farmerObj?.name || farmerObj?.fullName || found.farmerName || fid,
              productId: found.productId,
              productName: found.productName || prodObj?.name || prodObj?.productName || "Produce",
              variety: found.variety || prodObj?.variety || "—",
              unit: found.unit || prodObj?.unit || "Kg",
              grade: found.grade || "All Grades",
              changeQty: change,
              previousStock: prev,
              newStock: nxt,
              updatedBy: found.updatedBy || "Farmer",
              date: found.at || found.createdAt || null,
            };
            setRecord(target);
          }
        }

        if (target) {
          // Find matching product in inventory to get live grade breakdown
          const fid = String(target.farmerId || "").trim().toLowerCase();
          const targetPid = String(target.productId || "").trim();
          const targetPName = String(target.productName || "").trim().toLowerCase();

          const prodObj = inv.find((p) => {
            const pFid = String(p.farmerId || "").trim().toLowerCase();
            const pId = String(p.id || p.productId || "").trim();
            const pName = String(p.name || p.productName || "").trim().toLowerCase();
            if (targetPid && (pId === targetPid || String(p.id) === targetPid || String(p.productId) === targetPid)) return true;
            if (fid && pFid === fid && targetPName && pName === targetPName) return true;
            return false;
          });

          let liveGrades = extractProductGrades(prodObj || {});
          if (liveGrades.gradeA === 0 && liveGrades.gradeB === 0 && liveGrades.gradeC === 0) {
            liveGrades = extractProductGrades(location.state?.record || target || {});
          }

          // Find all audit history records for this farmer & product
          const matched = hist.filter(
            (h) =>
              h.farmerId === target.farmerId &&
              (String(h.productId) === String(target.productId) ||
                String(h.productName || "").toLowerCase().trim() ===
                  String(target.productName || "").toLowerCase().trim())
          );

          if (matched.length > 0) {
            // Sort descending by date (newest first)
            const sortedDesc = [...matched].sort(
              (a, b) => new Date(b.at || b.createdAt || 0).getTime() - new Date(a.at || a.createdAt || 0).getTime()
            );

            // Reconstruct running grade stock backwards from live grades
            let curA = liveGrades.gradeA;
            let curB = liveGrades.gradeB;
            let curC = liveGrades.gradeC;

            if (curA === 0 && curB === 0 && curC === 0 && sortedDesc.length > 0) {
              const newest = sortedDesc[0];
              const newestGrade = String(newest.grade || "").trim().toUpperCase();
              const nxt = newest.newStock != null ? num(newest.newStock) : num(newest.previousStock) + num(newest.changedQuantity);
              if (newestGrade.includes("B")) curB = nxt;
              else if (newestGrade.includes("C")) curC = nxt;
              else curA = nxt;
            }

            const formatted = sortedDesc.map((h) => {
              const rawGrade = String(h.grade || "").trim();
              const isA = /grade\s*a\b/i.test(rawGrade) || rawGrade.toUpperCase() === "A";
              const isB = /grade\s*b\b/i.test(rawGrade) || rawGrade.toUpperCase() === "B";
              const isC = /grade\s*c\b/i.test(rawGrade) || rawGrade.toUpperCase() === "C";

              const change = num(h.changedQuantity);
              let prevA = curA;
              let prevB = curB;
              let prevC = curC;
              let chgA = 0;
              let chgB = 0;
              let chgC = 0;
              let newA = curA;
              let newB = curB;
              let newC = curC;

              if (isB) {
                chgB = change;
                newB = h.newStock != null ? num(h.newStock) : curB;
                prevB = h.previousStock != null ? num(h.previousStock) : Math.max(0, newB - chgB);
                newB = prevB + chgB; // strict formula
                curB = prevB; // for next older transaction
              } else if (isC) {
                chgC = change;
                newC = h.newStock != null ? num(h.newStock) : curC;
                prevC = h.previousStock != null ? num(h.previousStock) : Math.max(0, newC - chgC);
                newC = prevC + chgC; // strict formula
                curC = prevC; // for next older transaction
              } else {
                // Grade A or All Grades
                chgA = change;
                newA = h.newStock != null ? num(h.newStock) : curA;
                prevA = h.previousStock != null ? num(h.previousStock) : Math.max(0, newA - chgA);
                newA = prevA + chgA; // strict formula
                curA = prevA; // for next older transaction
              }

              const totalPrev = prevA + prevB + prevC;
              const totalChange = chgA + chgB + chgC;
              const totalAfter = newA + newB + newC;

              return {
                id: h.id || `sh-${Math.random()}`,
                date: h.at || h.createdAt || null,
                grade: h.grade || "All Grades",
                prevA,
                prevB,
                prevC,
                totalPrev,
                chgA,
                chgB,
                chgC,
                totalChange,
                changeQty: change,
                newA,
                newB,
                newC,
                totalAfter,
                updatedBy: h.updatedBy || "Farmer",
                unit: h.unit || target.unit || "Kg",
                isCurrentTarget: String(h.id) === String(target.id) || String(h.id) === String(id),
              };
            });

            setAuditRows(formatted);
          } else {
            // Single target fallback
            const rawGrade = String(target.grade || "").trim();
            const isA = /grade\s*a\b/i.test(rawGrade) || rawGrade.toUpperCase() === "A";
            const isB = /grade\s*b\b/i.test(rawGrade) || rawGrade.toUpperCase() === "B";
            const isC = /grade\s*c\b/i.test(rawGrade) || rawGrade.toUpperCase() === "C";

            const change = num(target.changeQty);
            let prevA = liveGrades.gradeA;
            let prevB = liveGrades.gradeB;
            let prevC = liveGrades.gradeC;
            let chgA = 0;
            let chgB = 0;
            let chgC = 0;

            if (isB) {
              chgB = change;
              if (target.previousStock != null) prevB = num(target.previousStock);
            } else if (isC) {
              chgC = change;
              if (target.previousStock != null) prevC = num(target.previousStock);
            } else {
              chgA = change;
              if (target.previousStock != null) prevA = num(target.previousStock);
            }

            const newA = Math.max(0, prevA + chgA);
            const newB = Math.max(0, prevB + chgB);
            const newC = Math.max(0, prevC + chgC);
            const totalPrev = prevA + prevB + prevC;
            const totalChange = chgA + chgB + chgC;
            const totalAfter = newA + newB + newC;

            setAuditRows([
              {
                id: target.id || id,
                date: target.date,
                grade: target.grade || "All Grades",
                prevA,
                prevB,
                prevC,
                totalPrev,
                chgA,
                chgB,
                chgC,
                totalChange,
                changeQty: change,
                newA,
                newB,
                newC,
                totalAfter,
                updatedBy: target.updatedBy || "Farmer",
                unit: target.unit || "Kg",
                isCurrentTarget: true,
              },
            ]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#217346] border-r-transparent" />
        <p className="mt-4 text-sm font-bold text-slate-700">Loading stock change audit history…</p>
      </div>
    );
  }

  if (!record && auditRows.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-900">Audit Record Not Found</h2>
        <p className="text-sm text-slate-500">
          No stock history record was found for ID: <code className="font-mono bg-slate-100 px-2 py-0.5 rounded">{id}</code>
        </p>
        <div className="pt-2">
          <Link
            to="/manager/inventory/history"
            className="inline-flex items-center gap-2 rounded-xl bg-[#217346] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1b5e39]"
          >
            ← Back to Inventory History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#217346] hover:underline cursor-pointer"
          >
            ← Back to Inventory History
          </button>
          <div className="flex items-center gap-3">
            <h1 className={EXCEL_PAGE_TITLE}>Stock Change Audit History</h1>
          </div>
          {record && (
            <p className={EXCEL_PAGE_SUB}>
              Farmer: <strong className="text-slate-800">{record.farmerName}</strong> ({record.farmerId}) · Produce:{" "}
              <strong className="text-slate-800">{record.productName}</strong>
              {record.variety && record.variety !== "—" ? ` (${record.variety})` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className={`${EXCEL_BTN} text-xs font-bold cursor-pointer`}
          >
            🖨️ Print
          </button>
          {record?.farmerId && (
            <Link
              to={`/manager/inventory/history?farmerId=${record.farmerId}`}
              className={`${EXCEL_BTN_PRIMARY} text-xs font-bold`}
            >
              View Farmer Ledger →
            </Link>
          )}
        </div>
      </div>

      {/* Top Updated Stock (After) Data Summary */}
      {auditRows[0] && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-white p-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Grade A Stock</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-1 text-xl font-black text-emerald-950 tabular-nums">
              {auditRows[0].newA != null ? auditRows[0].newA.toLocaleString("en-IN") : 0}{" "}
              <span className="text-xs font-semibold text-slate-500">{record?.unit || "Kg"}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Updated Stock (After)</p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-white p-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Grade B Stock</span>
              <span className="h-2 w-2 rounded-full bg-blue-500" />
            </div>
            <p className="mt-1 text-xl font-black text-blue-950 tabular-nums">
              {auditRows[0].newB != null ? auditRows[0].newB.toLocaleString("en-IN") : 0}{" "}
              <span className="text-xs font-semibold text-slate-500">{record?.unit || "Kg"}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Updated Stock (After)</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white p-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Grade C Stock</span>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
            <p className="mt-1 text-xl font-black text-amber-950 tabular-nums">
              {auditRows[0].newC != null ? auditRows[0].newC.toLocaleString("en-IN") : 0}{" "}
              <span className="text-xs font-semibold text-slate-500">{record?.unit || "Kg"}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Updated Stock (After)</p>
          </div>

          <div className="rounded-xl border border-slate-300 bg-emerald-50/50 p-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">Total Updated Stock</span>
              <span className="h-2 w-2 rounded-full bg-[#217346]" />
            </div>
            <p className="mt-1 text-xl font-black text-[#1b5e39] tabular-nums">
              {auditRows[0].totalAfter != null ? auditRows[0].totalAfter.toLocaleString("en-IN") : 0}{" "}
              <span className="text-xs font-semibold text-emerald-700">{record?.unit || "Kg"}</span>
            </p>
            <p className="text-[10px] text-emerald-700 font-medium">Total (After Change)</p>
          </div>
        </div>
      )}

      {/* ONLY 1 TABLE: Grade-wise Previous Stock, Quantity Change, and Updated Stock */}
      <div className={`${EXCEL_PANEL} overflow-hidden shadow-sm`}>
        <div className="w-full">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th colSpan={4} className={`${TABLE_TH} text-center bg-slate-100/90 text-slate-800`}>
                  Previous Stock
                </th>
                <th colSpan={4} className={`${TABLE_TH} text-center bg-slate-100/90 text-slate-800`}>
                  Quantity Change
                </th>
                <th colSpan={4} className={`${TABLE_TH} text-center bg-slate-100/90 text-slate-800`}>
                  Updated Stock (After)
                </th>
                <th rowSpan={2} className={`${TABLE_TH} text-center`}>
                  Time
                </th>
                <th rowSpan={2} className={`${TABLE_TH} text-center`}>
                  Date
                </th>
                <th rowSpan={2} className={`${TABLE_TH} text-center`}>
                  Updated By
                </th>
              </tr>
              <tr className="bg-slate-50 text-[11px]">
                {/* Previous Stock columns */}
                <th className={`${TABLE_SUBTH} text-right text-emerald-800 font-extrabold`}>Grade A</th>
                <th className={`${TABLE_SUBTH} text-right text-blue-800 font-extrabold`}>Grade B</th>
                <th className={`${TABLE_SUBTH} text-right text-amber-800 font-extrabold`}>Grade C</th>
                <th className={`${TABLE_SUBTH} text-right text-slate-900 font-extrabold bg-slate-200/50`}>Total</th>

                {/* Quantity Change columns */}
                <th className={`${TABLE_SUBTH} text-right text-emerald-800 font-extrabold`}>Grade A</th>
                <th className={`${TABLE_SUBTH} text-right text-blue-800 font-extrabold`}>Grade B</th>
                <th className={`${TABLE_SUBTH} text-right text-amber-800 font-extrabold`}>Grade C</th>
                <th className={`${TABLE_SUBTH} text-right text-slate-900 font-extrabold bg-slate-200/50`}>Total</th>

                {/* Updated Stock columns */}
                <th className={`${TABLE_SUBTH} text-right text-emerald-800 font-extrabold`}>Grade A</th>
                <th className={`${TABLE_SUBTH} text-right text-blue-800 font-extrabold`}>Grade B</th>
                <th className={`${TABLE_SUBTH} text-right text-amber-800 font-extrabold`}>Grade C</th>
                <th className={`${TABLE_SUBTH} text-right text-slate-900 font-extrabold bg-slate-200/70`}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditRows.map((r, idx) => (
                <tr
                  key={r.id || idx}
                  className={`transition ${
                    r.isCurrentTarget ? "bg-emerald-50/40 hover:bg-emerald-50/70" : "bg-white hover:bg-slate-50/80"
                  }`}
                >
                  {/* Previous Stock: Grade A */}
                  <td className={`${TABLE_TD} text-right font-semibold text-slate-700 tabular-nums`}>
                    {r.prevA != null ? r.prevA.toLocaleString("en-IN") : "0"}{" "}
                    <span className="text-[10px] text-slate-400 font-normal">{r.unit || "Kg"}</span>
                  </td>
                  {/* Previous Stock: Grade B */}
                  <td className={`${TABLE_TD} text-right font-semibold text-slate-700 tabular-nums`}>
                    {r.prevB != null ? r.prevB.toLocaleString("en-IN") : "0"}{" "}
                    <span className="text-[10px] text-slate-400 font-normal">{r.unit || "Kg"}</span>
                  </td>
                  {/* Previous Stock: Grade C */}
                  <td className={`${TABLE_TD} text-right font-semibold text-slate-700 tabular-nums`}>
                    {r.prevC != null ? r.prevC.toLocaleString("en-IN") : "0"}{" "}
                    <span className="text-[10px] text-slate-400 font-normal">{r.unit || "Kg"}</span>
                  </td>
                  {/* Previous Stock: Total */}
                  <td className={`${TABLE_TD} text-right font-bold text-slate-800 bg-slate-50/70 tabular-nums`}>
                    {r.totalPrev != null ? r.totalPrev.toLocaleString("en-IN") : "0"}{" "}
                    <span className="text-[10px] text-slate-500 font-normal">{r.unit || "Kg"}</span>
                  </td>

                  {/* Quantity Change: Grade A */}
                  <td className={`${TABLE_TD} text-right tabular-nums`}>
                    {r.chgA !== 0 ? (
                      <span className={`font-bold text-xs ${r.chgA > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {r.chgA > 0 ? "+" : ""}
                        {r.chgA.toLocaleString("en-IN")}{" "}
                        <span className="text-[10px] font-normal text-slate-500">{r.unit || "Kg"}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </td>
                  {/* Quantity Change: Grade B */}
                  <td className={`${TABLE_TD} text-right tabular-nums`}>
                    {r.chgB !== 0 ? (
                      <span className={`font-bold text-xs ${r.chgB > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {r.chgB > 0 ? "+" : ""}
                        {r.chgB.toLocaleString("en-IN")}{" "}
                        <span className="text-[10px] font-normal text-slate-500">{r.unit || "Kg"}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </td>
                  {/* Quantity Change: Grade C */}
                  <td className={`${TABLE_TD} text-right tabular-nums`}>
                    {r.chgC !== 0 ? (
                      <span className={`font-bold text-xs ${r.chgC > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {r.chgC > 0 ? "+" : ""}
                        {r.chgC.toLocaleString("en-IN")}{" "}
                        <span className="text-[10px] font-normal text-slate-500">{r.unit || "Kg"}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </td>
                  {/* Quantity Change: Total */}
                  <td className={`${TABLE_TD} text-right bg-slate-50/70 tabular-nums`}>
                    {r.totalChange !== 0 ? (
                      <span className={`font-bold text-xs ${r.totalChange > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {r.totalChange > 0 ? "+" : ""}
                        {r.totalChange.toLocaleString("en-IN")}{" "}
                        <span className="text-[10px] font-normal text-slate-500">{r.unit || "Kg"}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </td>

                  {/* Updated Stock: Grade A */}
                  <td className={`${TABLE_TD} text-right font-bold text-slate-900 tabular-nums`}>
                    {r.newA != null ? r.newA.toLocaleString("en-IN") : "0"}{" "}
                    <span className="text-[10px] text-slate-500 font-normal">{r.unit || "Kg"}</span>
                  </td>
                  {/* Updated Stock: Grade B */}
                  <td className={`${TABLE_TD} text-right font-bold text-slate-900 tabular-nums`}>
                    {r.newB != null ? r.newB.toLocaleString("en-IN") : "0"}{" "}
                    <span className="text-[10px] text-slate-500 font-normal">{r.unit || "Kg"}</span>
                  </td>
                  {/* Updated Stock: Grade C */}
                  <td className={`${TABLE_TD} text-right font-bold text-slate-900 tabular-nums`}>
                    {r.newC != null ? r.newC.toLocaleString("en-IN") : "0"}{" "}
                    <span className="text-[10px] text-slate-500 font-normal">{r.unit || "Kg"}</span>
                  </td>
                  {/* Updated Stock: Total */}
                  <td className={`${TABLE_TD} text-right font-black text-emerald-700 bg-emerald-50/40 tabular-nums`}>
                    {r.totalAfter != null ? r.totalAfter.toLocaleString("en-IN") : "0"}{" "}
                    <span className="text-[10px] text-emerald-600 font-semibold">{r.unit || "Kg"}</span>
                  </td>

                  {/* Time */}
                  <td className={`${TABLE_TD} text-center`}>
                    <span className="text-slate-700 font-medium">{formatTime12h(r.date)}</span>
                  </td>

                  {/* Date */}
                  <td className={`${TABLE_TD} text-center`}>
                    <span className="font-bold text-slate-900">{shortDate(r.date)}</span>
                  </td>

                  {/* Updated By */}
                  <td className={`${TABLE_TD} text-center font-semibold text-slate-700`}>
                    {r.updatedBy || "Farmer"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
