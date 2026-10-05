import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getManagerAllStockHistory,
  getManagerAllInventory,
  adjustFarmerStockByManager,
} from "../../api/farmerApi";
import { CopyButton } from "../../components/ui/CopyId";
import EmptyState from "../../components/ui/EmptyState";
import {
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
  EXCEL_INPUT,
  EXCEL_PANEL,
  EXCEL_BTN,
} from "../../utils/excelStyles";
import { todayISODate, yesterdayISODate } from "../../utils/orderDisplay";

const FILTER_CTRL =
  "h-9 w-full min-w-0 rounded-lg border border-[#D1D5DB] bg-white px-2.5 text-[12px] text-[#1F2937] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#217346] focus:ring-2 focus:ring-[#217346]/20 font-medium";
const FILTER_CHIP =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-lg border px-3 text-[11px] font-semibold transition cursor-pointer";
const FILTER_CHIP_IDLE = `${FILTER_CHIP} border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F9FAFB]`;
const FILTER_CHIP_ACTIVE = `${FILTER_CHIP} border-[#217346] bg-[#217346] text-white shadow-sm`;
const FILTER_LABEL = "mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]";

const TH =
  "border border-[#E5E7EB] bg-[#F3F4F6] px-1 py-1.5 text-left text-[9px] font-semibold leading-tight text-[#374151] sm:px-2.5 sm:py-2 sm:text-[11px]";
const TD =
  "border border-[#E5E7EB] px-1 py-1.5 text-[9px] leading-tight text-[#1F2937] align-top sm:px-2.5 sm:py-2 sm:text-[11px]";
const GRADE_TH =
  "border px-1 py-1.5 text-center text-[9px] font-semibold leading-tight sm:px-2.5 sm:py-2 sm:text-[11px]";
const GRADE_TD = "border px-1 py-1.5 text-center text-[9px] sm:px-2.5 sm:py-2 sm:text-[11px]";

function shortDate(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw) && !raw.includes("T") && raw.length <= 10) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const [y, m, day] = raw.slice(0, 10).split("-");
      return `${day}/${m}/${y}`;
    }
    return "—";
  }
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function fullDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatTime12h(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (/am|pm/i.test(raw) && !raw.includes("T")) {
    return raw.replace(/\s+/g, " ").replace(/am/i, "AM").replace(/pm/i, "PM");
  }
  const asDate = new Date(raw);
  if (!Number.isNaN(asDate.getTime()) && (raw.includes("T") || raw.length > 12)) {
    return asDate.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return raw;
  let hour = Number(m[1]);
  const min = m[2];
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return raw;
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${min} ${period}`;
}

function toISODateKey(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function ActionBadge({ action, changeQty }) {
  const text = String(action || "").trim();
  const lower = text.toLowerCase();
  const isDeduction = lower.includes("deduct") || lower.includes("reduced") || lower.includes("minus") || changeQty < 0;
  const isAdded = lower.includes("added") || lower.includes("inward") || changeQty > 0;

  if (isDeduction) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        {text || "Order Deduction"}
      </span>
    );
  }
  if (isAdded) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        {text || "Stock Added"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
      {text || "Manual Update"}
    </span>
  );
}

function formatGradeCell(qty, unit = "Kg") {
  const n = Number(qty ?? 0);
  return (
    <span className="font-bold tabular-nums text-[#111827] text-[11px] sm:text-[12px]">
      {n.toLocaleString("en-IN")}{" "}
      <span className="text-[9px] font-medium text-[#6B7280]">{unit}</span>
    </span>
  );
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

export default function ManagerInventoryHistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlFarmerId = searchParams.get("farmerId") || "";
  const productId = searchParams.get("productId") || "";
  const productName = searchParams.get("name") || "";

  const [loading, setLoading] = useState(true);
  const [stockHistoryRecords, setStockHistoryRecords] = useState([]);
  const [assignedFarmers, setAssignedFarmers] = useState([]);
  const [farmerLiveStockMap, setFarmerLiveStockMap] = useState(new Map());
  const [productMap, setProductMap] = useState(new Map());
  const [farmerProductsMap, setFarmerProductsMap] = useState(new Map());

  // Filters
  const [selectedFarmerId, setSelectedFarmerId] = useState(urlFarmerId);
  const [gradeFilter, setGradeFilter] = useState("all"); // "all" | "A" | "B" | "C"
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState("farmer"); // "farmer" | "table"

  // Update Stock Modal State
  const [updatingFarmer, setUpdatingFarmer] = useState(null);
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState("Grade A");
  const [adjustAction, setAdjustAction] = useState("add"); // "add" | "reduce"
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState("Harvest addition");
  const [customReason, setCustomReason] = useState("");
  const [submittingStock, setSubmittingStock] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const setDateRange = (from, to) => {
    setDateFrom(from || "");
    setDateTo(to || "");
  };
  const setTodayFilter = () => {
    const today = todayISODate();
    setDateRange(today, today);
  };
  const setYesterdayFilter = () => {
    const yesterday = yesterdayISODate();
    setDateRange(yesterday, yesterday);
  };
  const clearDateFilter = () => setDateRange("", "");

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getManagerAllStockHistory().catch(() => ({ farmers: [], history: [] })),
      getManagerAllInventory().catch(() => ({ farmers: [], inventory: [] })),
    ])
      .then(([stockData, invData]) => {
        const hist = Array.isArray(stockData?.history) ? stockData.history : [];
        const fList = Array.isArray(stockData?.farmers) ? stockData.farmers : [];
        const invProducts = Array.isArray(invData?.inventory) ? invData.inventory : [];

        // Build product map (Grade A, Grade B, Grade C, Total Stock)
        const pMap = new Map();
        const fProducts = new Map();
        const liveMap = new Map();

        invProducts.forEach((p) => {
          const fid = p.farmerId;
          const { gradeA, gradeB, gradeC, totalStock } = extractProductGrades(p);
          const data = {
            ...p,
            id: p.id || p.productId,
            productId: p.productId || p.id,
            productName: p.productName || p.name || "Produce",
            variety: p.variety || "—",
            gradeA,
            gradeB,
            gradeC,
            totalStock,
            unit: p.unit || "Kg",
            name: p.productName || p.name,
          };

          if (p.id) pMap.set(String(p.id), data);
          if (p.productId) pMap.set(String(p.productId), data);
          if (fid && (p.name || p.productName)) {
            const cleanName = String(p.name || p.productName).toLowerCase().trim();
            pMap.set(`${fid}_${cleanName}`, data);
            pMap.set(`${String(fid).toLowerCase()}_${cleanName}`, data);
          }

          if (fid) {
            if (!fProducts.has(fid)) fProducts.set(fid, []);
            fProducts.get(fid).push(data);

            if (!liveMap.has(fid)) {
              liveMap.set(fid, { gradeA: 0, gradeB: 0, gradeC: 0, totalStock: 0 });
            }
            const curr = liveMap.get(fid);
            curr.gradeA += gradeA;
            curr.gradeB += gradeB;
            curr.gradeC += gradeC;
            curr.totalStock += totalStock;
          }
        });

        setStockHistoryRecords(hist);
        setAssignedFarmers(fList);
        setFarmerLiveStockMap(liveMap);
        setProductMap(pMap);
        setFarmerProductsMap(fProducts);
      })
      .catch(() => {
        setStockHistoryRecords([]);
        setAssignedFarmers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selectedFarmerId if urlFarmerId changes
  useEffect(() => {
    if (urlFarmerId) {
      setSelectedFarmerId(urlFarmerId);
    }
  }, [urlFarmerId]);

  // Open Update Stock Modal for a Farmer
  const handleOpenUpdateStock = (farmer) => {
    const fid = farmer.id || farmer.farmerId;
    const prods = farmerProductsMap.get(fid) || [];
    setUpdatingFarmer(farmer);
    setFarmerProducts(prods);
    setSelectedProduct(prods[0] || null);
    setSelectedGrade("Grade A");
    setAdjustAction("add");
    setAdjustQuantity("");
    setAdjustReason("Harvest addition");
    setCustomReason("");
  };

  // Submit Stock Adjustment
  const handleStockUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updatingFarmer || !selectedProduct) {
      alert("Please select a valid product to adjust stock");
      return;
    }

    const qty = Number(adjustQuantity);
    if (!qty || qty <= 0) {
      alert("Please enter a valid quantity greater than 0");
      return;
    }

    const delta = adjustAction === "add" ? qty : -qty;
    const finalReason = adjustReason === "Other" ? customReason.trim() || "Manual adjustment" : adjustReason;
    const fid = updatingFarmer.id || updatingFarmer.farmerId;

    try {
      setSubmittingStock(true);
      await adjustFarmerStockByManager({
        farmerId: fid,
        productId: selectedProduct.id || selectedProduct.productId,
        change: delta,
        grade: selectedGrade,
        reason: finalReason,
        updatedBy: "Manager",
      });

      showToast(`✓ Successfully ${delta > 0 ? "added" : "reduced"} ${qty} Kg of ${selectedGrade} for ${selectedProduct.productName}`);
      setUpdatingFarmer(null);
      setAdjustQuantity("");
      loadData(); // reload history & inventory
    } catch (err) {
      alert(err.message || "Failed to update stock");
    } finally {
      setSubmittingStock(false);
    }
  };

  // Build farmers list
  const allFarmersList = useMemo(() => {
    const map = new Map();
    assignedFarmers.forEach((f) => {
      const id = f.id || f.farmerId;
      if (id && !map.has(id)) {
        map.set(id, {
          id,
          farmerId: f.farmerId || id,
          name: f.name || f.fullName || id,
          mobile: f.mobile || f.phone || "",
          village: f.village || f.location || "",
          district: f.district || "",
          avatarUrl: f.avatarUrl || f.photo || null,
        });
      }
    });

    stockHistoryRecords.forEach((h) => {
      const id = h.farmerId || "";
      if (id && !map.has(id)) {
        map.set(id, {
          id,
          farmerId: id,
          name: h.farmerName || id,
          mobile: "",
          village: "",
          district: "",
          avatarUrl: null,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignedFarmers, stockHistoryRecords]);

  // Process ONLY FARMER STOCK records (Exclude vendor quality inspection stock)
  const allUnifiedRecords = useMemo(() => {
    const rows = [];

    stockHistoryRecords.forEach((h) => {
      const reason = String(h.reason || "");
      const action = String(h.action || "");
      const updatedBy = String(h.updatedBy || "");

      // EXCLUDE VENDOR STOCK / QUALITY INSPECTION RECORDS
      const isVendorQuality =
        /quality|grading/i.test(reason) ||
        /quality/i.test(action) ||
        /inspector/i.test(updatedBy) ||
        h.sourceType === "Quality & Grading";

      if (isVendorQuality) {
        return; // Do not include vendor stock
      }

      const ref = String(h.reference || "").trim();
      const change = num(h.changedQuantity);
      const isOrder = /order/i.test(action) || /order/i.test(reason);

      let actionLabel = h.action || "Stock Updated";
      if (isOrder && !actionLabel.toLowerCase().includes("order")) {
        actionLabel = "Order Deduction";
      }

      // Calculate previousStock and newStock reliably
      let prevStock = h.previousStock != null ? num(h.previousStock) : null;
      let nxtStock = h.newStock != null ? num(h.newStock) : null;

      if (prevStock == null && nxtStock != null) {
        prevStock = Math.max(0, nxtStock - change);
      } else if (nxtStock == null && prevStock != null) {
        nxtStock = Math.max(0, prevStock + change);
      }

      // Lookup live product for base grade levels
      const fidLower = String(h.farmerId || "").toLowerCase().trim();
      const pNameLower = String(h.productName || "").toLowerCase().trim();
      const prod =
        productMap.get(String(h.productId || "")) ||
        productMap.get(`${h.farmerId}_${pNameLower}`) ||
        productMap.get(`${fidLower}_${pNameLower}`) ||
        null;

      let a = prod ? num(prod.gradeA) : 0;
      let b = prod ? num(prod.gradeB) : 0;
      let c = prod ? num(prod.gradeC) : 0;

      const rawGrade = String(h.grade || "").trim();
      const isA = /grade\s*a\b/i.test(rawGrade) || rawGrade.toUpperCase() === "A";
      const isB = /grade\s*b\b/i.test(rawGrade) || rawGrade.toUpperCase() === "B";
      const isC = /grade\s*c\b/i.test(rawGrade) || rawGrade.toUpperCase() === "C";

      // Show exact Updated Stock (After) matching the Audit Detail page
      if (isB) {
        if (nxtStock != null) b = nxtStock;
        else b = Math.max(0, b + change);
      } else if (isC) {
        if (nxtStock != null) c = nxtStock;
        else c = Math.max(0, c + change);
      } else {
        // Grade A or All Grades
        if (nxtStock != null) a = nxtStock;
        else a = Math.max(0, a + change);
      }

      const totalStock = a + b + c;
      if (prevStock == null) prevStock = Math.max(0, totalStock - change);
      if (nxtStock == null) nxtStock = totalStock;

      rows.push({
        id: h.id || `sh-${Math.random()}`,
        farmerId: h.farmerId,
        farmerName: h.farmerName || h.sourceFrom || h.farmerId || "—",
        productId: h.productId,
        productName: h.productName || "—",
        variety: h.variety || prod?.variety || "—",
        unit: h.unit || prod?.unit || "Kg",
        gradeA: a,
        gradeB: b,
        gradeC: c,
        totalStock,
        grade: h.grade || "All Grades",
        action: actionLabel,
        changeQty: change,
        previousStock: prevStock,
        newStock: nxtStock,
        reason: h.reason || "Manual Update",
        reference: h.reference || "STOCK",
        orderId: h.orderId || (ref && ref !== "—" ? ref : ""),
        batchId: h.batchId || "",
        updatedBy: h.updatedBy || "Farmer",
        date: h.at || h.createdAt || null,
        source: "Farmer Stock",
      });
    });

    // Sort descending by date
    return rows.sort((a, b) => {
      const ta = new Date(a.date || 0).getTime();
      const tb = new Date(b.date || 0).getTime();
      return tb - ta;
    });
  }, [stockHistoryRecords, productMap]);

  // Apply Search, Farmer & Grade Filters
  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    const wantFarmerId = selectedFarmerId ? String(selectedFarmerId).trim().toLowerCase() : "";

    return allUnifiedRecords.filter((row) => {
      // 1. Farmer Filter
      if (wantFarmerId) {
        const rowFid = String(row.farmerId || "").trim().toLowerCase();
        if (rowFid !== wantFarmerId && !rowFid.includes(wantFarmerId) && !wantFarmerId.includes(rowFid)) {
          return false;
        }
      }

      // 2. Grade Filter
      if (gradeFilter !== "all") {
        if (gradeFilter === "A" && row.gradeA <= 0) return false;
        if (gradeFilter === "B" && row.gradeB <= 0) return false;
        if (gradeFilter === "C" && row.gradeC <= 0) return false;
      }

      // 3. Action Filter
      if (actionFilter !== "all") {
        const act = String(row.action || "").toLowerCase();
        if (actionFilter === "order" && !act.includes("order") && !act.includes("deduct")) return false;
        if (actionFilter === "inward" && !act.includes("added") && !act.includes("inward") && row.changeQty <= 0)
          return false;
        if (actionFilter === "manual" && act.includes("order")) return false;
      }

      // 4. Date Range
      if (dateFrom || dateTo) {
        const dateKey = toISODateKey(row.date);
        if (!dateKey) return false;
        if (dateFrom && dateKey < dateFrom) return false;
        if (dateTo && dateKey > dateTo) return false;
      }

      // 5. Product parameters filter from URL
      if (productId || productName) {
        const pId = String(row.productId || "").toLowerCase();
        const pName = String(row.productName || "").toLowerCase();
        const wantId = String(productId || "").toLowerCase();
        const wantName = String(productName || "").toLowerCase();
        if (wantId && !pId.includes(wantId)) return false;
        if (wantName && !pName.includes(wantName)) return false;
      }

      // 6. Query Search
      if (q) {
        const hay = [
          row.farmerName,
          row.farmerId,
          row.productName,
          row.variety,
          row.orderId,
          row.reference,
          row.action,
          row.reason,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [allUnifiedRecords, selectedFarmerId, gradeFilter, actionFilter, dateFrom, dateTo, productId, productName, query]);

  // Group Records Farmer-Wise
  const farmerGroups = useMemo(() => {
    const groupMap = new Map();

    allFarmersList.forEach((f) => {
      const fid = f.id || f.farmerId;
      if (selectedFarmerId && fid !== selectedFarmerId && f.farmerId !== selectedFarmerId) {
        return;
      }
      const live = farmerLiveStockMap.get(fid) || { gradeA: 0, gradeB: 0, gradeC: 0, totalStock: 0 };

      groupMap.set(fid, {
        farmer: f,
        records: [],
        totalIn: 0,
        totalOut: 0,
        liveGradeA: live.gradeA,
        liveGradeB: live.gradeB,
        liveGradeC: live.gradeC,
        liveTotal: live.totalStock,
        latestDate: null,
      });
    });

    filteredRecords.forEach((r) => {
      let g = groupMap.get(r.farmerId);
      if (!g) {
        const matchedF = allFarmersList.find(
          (f) => f.id === r.farmerId || f.farmerId === r.farmerId || f.name === r.farmerName
        );
        const fObj = matchedF || {
          id: r.farmerId,
          farmerId: r.farmerId,
          name: r.farmerName || r.farmerId,
          mobile: "",
          village: "",
        };
        const live = farmerLiveStockMap.get(r.farmerId) || { gradeA: 0, gradeB: 0, gradeC: 0, totalStock: 0 };
        g = {
          farmer: fObj,
          records: [],
          totalIn: 0,
          totalOut: 0,
          liveGradeA: live.gradeA,
          liveGradeB: live.gradeB,
          liveGradeC: live.gradeC,
          liveTotal: live.totalStock,
          latestDate: null,
        };
        groupMap.set(r.farmerId, g);
      }

      g.records.push(r);
      if (r.changeQty > 0) g.totalIn += r.changeQty;
      else if (r.changeQty < 0) g.totalOut += Math.abs(r.changeQty);

      if (!g.latestDate && r.date) g.latestDate = r.date;
    });

    const groups = Array.from(groupMap.values());

    // Only show farmers with history records
    return groups
      .filter((g) => g.records.length > 0)
      .sort((a, b) => (a.farmer.name || "").localeCompare(b.farmer.name || ""));
  }, [allFarmersList, filteredRecords, selectedFarmerId, farmerLiveStockMap]);

  const todayKey = todayISODate();
  const yesterdayKey = yesterdayISODate();
  const isTodayActive = dateFrom === todayKey && dateTo === todayKey;
  const isYesterdayActive = dateFrom === yesterdayKey && dateTo === yesterdayKey;
  const hasActiveFilters = Boolean(selectedFarmerId || query || gradeFilter !== "all" || actionFilter !== "all" || dateFrom || dateTo);

  const resetAllFilters = () => {
    setSelectedFarmerId("");
    setGradeFilter("all");
    setQuery("");
    setActionFilter("all");
    setDateRange("", "");
    setSearchParams({});
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-[#217346] px-4 py-3 text-white text-xs font-semibold shadow-lg animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/manager/inventory"
            className="mb-1 inline-flex items-center gap-1 text-[12px] font-semibold text-[#217346] hover:underline"
          >
            ← Back to Farmer Inventory
          </Link>
          <h1 className={EXCEL_PAGE_TITLE}>Farmer Inventory History</h1>
          <p className={EXCEL_PAGE_SUB}>
            Farmer stock ledger with Grade A, Grade B, Grade C, and Total Stock
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="inline-flex rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("farmer")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                viewMode === "farmer"
                  ? "bg-white text-[#217346] shadow-sm font-bold"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Farmer View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-[#217346] shadow-sm font-bold"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Consolidated Table
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={`${EXCEL_PANEL} p-3 sm:p-4 space-y-3`}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Farmer Dropdown */}
          <div>
            <label className={FILTER_LABEL}>Farmer Filter</label>
            <select
              value={selectedFarmerId}
              onChange={(e) => setSelectedFarmerId(e.target.value)}
              className={FILTER_CTRL}
            >
              <option value="">All Farmers ({allFarmersList.length})</option>
              {allFarmersList.map((f) => {
                const fid = f.id || f.farmerId;
                const fname = f.name || f.fullName || fid;
                return (
                  <option key={fid} value={fid}>
                    {fname} ({fid})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <label className={FILTER_LABEL}>Grade Filter</label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className={FILTER_CTRL}
            >
              <option value="all">All Grades (A, B, C)</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
          </div>

          {/* Date Range: From / To */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className={FILTER_LABEL}>From Date</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateRange(e.target.value, dateTo)}
                className={FILTER_CTRL}
              />
            </div>
            <div>
              <label className={FILTER_LABEL}>To Date</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateRange(dateFrom, e.target.value)}
                className={FILTER_CTRL}
              />
            </div>
          </div>

          {/* Search bar */}
          <div className="flex flex-col justify-between">
            <label className={FILTER_LABEL}>Search Query</label>
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Product, Order, Reason…"
                className={FILTER_CTRL}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Date Chips & Reset Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F3F4F6] pt-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#6B7280] mr-1">Quick Dates:</span>
            <button
              type="button"
              onClick={setTodayFilter}
              className={isTodayActive ? FILTER_CHIP_ACTIVE : FILTER_CHIP_IDLE}
            >
              Today
            </button>
            <button
              type="button"
              onClick={setYesterdayFilter}
              className={isYesterdayActive ? FILTER_CHIP_ACTIVE : FILTER_CHIP_IDLE}
            >
              Yesterday
            </button>
            {dateFrom || dateTo ? (
              <button type="button" onClick={clearDateFilter} className={FILTER_CHIP_IDLE}>
                Clear Dates
              </button>
            ) : null}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
            >
              Reset All Filters ✕
            </button>
          )}
        </div>
      </div>

      {/* Click Row Tip Banner */}
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs text-[#065F46]">
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <span className="font-medium">
            <strong className="font-bold">Tip:</strong> Click on any row to open the complete Stock Change Audit History page (Previous Stock, Change, Updated Stock, Updated By, and Date & Time).
          </span>
        </div>
        <span className="hidden sm:inline-block rounded-md bg-[#217346] px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
          Click Row to Open Audit Page 📄
        </span>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#217346] border-r-transparent" />
          <p className="mt-3 text-sm font-semibold text-[#374151]">Loading farmer inventory history…</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className={`${EXCEL_PANEL} p-12 text-center`}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            📜
          </div>
          <p className="text-base font-bold text-slate-800">No Farmer Stock Records Found</p>
          <p className="mt-1 text-xs text-[#6B7280]">
            No farmer stock additions, reductions, or order deductions matched your search criteria.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-4 rounded-lg bg-[#217346] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1b5e39]"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "farmer" ? (
        /* ================= FARMER-WISE VIEW ================= */
        <div className="space-y-4">
          {farmerGroups.map((group) => {
            const { farmer, records, latestDate } = group;
            const fid = farmer.id || farmer.farmerId;
            const fname = farmer.name || farmer.fullName || fid;

            return (
              <div
                key={fid}
                className="overflow-hidden rounded-xl border border-[#D1D5DB] bg-white shadow-sm transition hover:border-[#217346]/40"
              >
                {/* Farmer Card Header */}
                <div className="border-b border-[#E5E7EB] bg-[#F8FAFC] p-3 sm:p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#217346] text-white font-bold text-sm shadow-sm">
                        {fname.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm sm:text-base font-bold text-[#111827] truncate">{fname}</h2>
                          <span className="inline-flex items-center gap-1 rounded bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-mono font-semibold text-[#065F46] border border-[#A7F3D0]">
                            {fid}
                            <CopyButton value={fid} />
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-[#6B7280]">
                          {farmer.mobile && <span>📞 {farmer.mobile}</span>}
                          {farmer.village && <span>📍 {farmer.village}</span>}
                          {latestDate && (
                            <span>
                              🕒 Latest: {shortDate(latestDate)} {formatTime12h(latestDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* UPDATE STOCK BUTTON (replaces Live Stock) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenUpdateStock(farmer)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#217346] bg-[#217346] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#1b5e39] transition cursor-pointer"
                      >
                        <span>✏️</span>
                        <span>Update Stock</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Farmer History Entries Table - GRADE A, B, C & TOTAL STOCK IN TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border-collapse">
                    <colgroup>
                      <col className="w-[12%]" />
                      <col className="w-[16%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className={TH}>Date & Time</th>
                        <th className={TH}>Product & Variety</th>
                        <th className={TH}>Action / Event</th>
                        <th className={`${GRADE_TH} border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]`}>
                          Grade A
                        </th>
                        <th className={`${GRADE_TH} border-[#BFDBFE] bg-[#DBEAFE] text-[#1E40AF]`}>
                          Grade B
                        </th>
                        <th className={`${GRADE_TH} border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]`}>
                          Grade C
                        </th>
                        <th className={`${TH} text-center bg-[#F1F5F9] font-black text-[#0F172A]`}>
                          Total Stock
                        </th>
                        <th className={TH}>Reference / Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, rIdx) => {
                        const isEven = rIdx % 2 === 0;
                        return (
                          <tr
                            key={r.id || rIdx}
                            onClick={() => {
                              const auditData = {
                                ...r,
                                farmerName: fname,
                                farmerMobile: farmer.mobile,
                                farmerVillage: farmer.village,
                                farmerId: fid,
                              };
                              navigate(`/manager/inventory/audit/${r.id}`, { state: { record: auditData } });
                            }}
                            className={`transition cursor-pointer hover:bg-emerald-50/70 hover:shadow-xs group ${
                              isEven ? "bg-white" : "bg-[#FBFDFB]"
                            }`}
                            title="Click row to open Stock Change Audit History on new page"
                          >
                            {/* Date & Time */}
                            <td className={TD}>
                              <p className="font-bold text-[#1F2937]">{shortDate(r.date)}</p>
                              <p className="text-[10px] text-[#6B7280]">{formatTime12h(r.date) || "—"}</p>
                            </td>

                            {/* Product & Variety */}
                            <td className={`${TD} break-words`}>
                              <p className="font-bold text-[#111827]">{r.productName}</p>
                              {r.variety && r.variety !== "—" ? (
                                <p className="text-[10px] font-medium text-[#6B7280]">{r.variety}</p>
                              ) : null}
                            </td>

                            {/* Action / Event */}
                            <td className={TD}>
                              <ActionBadge action={r.action} changeQty={r.changeQty} />
                            </td>

                            {/* Grade A */}
                            <td className={`${GRADE_TD} border-[#A7F3D0] bg-[#ECFDF5]`}>
                              {formatGradeCell(r.gradeA, r.unit)}
                            </td>

                            {/* Grade B */}
                            <td className={`${GRADE_TD} border-[#BFDBFE] bg-[#EFF6FF]`}>
                              {formatGradeCell(r.gradeB, r.unit)}
                            </td>

                            {/* Grade C */}
                            <td className={`${GRADE_TD} border-[#FDE68A] bg-[#FFFBEB]`}>
                              {formatGradeCell(r.gradeC, r.unit)}
                            </td>

                            {/* Total Stock */}
                            <td className={`${TD} text-center font-black text-slate-900 tabular-nums bg-slate-50/60`}>
                              {formatGradeCell(r.totalStock, r.unit)}
                            </td>

                            {/* Reference / Reason */}
                            <td className={`${TD} break-words`}>
                              {r.orderId ? (
                                <div
                                  className="flex items-center gap-1 font-mono text-[10px] font-semibold text-[#1E40AF]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="truncate" title={r.orderId}>
                                    {r.orderId}
                                  </span>
                                  <CopyButton value={r.orderId} />
                                </div>
                              ) : r.reference && r.reference !== "—" ? (
                                <div
                                  className="flex items-center gap-1 font-mono text-[10px] font-semibold text-[#4B5563]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="truncate" title={r.reference}>
                                    {r.reference}
                                  </span>
                                  <CopyButton value={r.reference} />
                                </div>
                              ) : null}
                              <p className="text-[10px] text-[#374151] line-clamp-1 mt-0.5" title={r.reason}>
                                {r.reason || "Manual Update"}
                              </p>
                              <div className="flex items-center justify-between text-[9px] mt-0.5">
                                <span className="font-semibold text-slate-700 bg-slate-100 px-1 rounded">
                                  By: {r.updatedBy}
                                </span>
                                <span className="text-[#217346] font-bold text-[9px] group-hover:underline flex items-center gap-0.5">
                                  Audit Page →
                                </span>
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
      ) : (
        /* ================= CONSOLIDATED TABLE VIEW ================= */
        <div className="overflow-hidden rounded-xl border border-[#D1D5DB] bg-white shadow-sm">
          {/* Mobile Card List */}
          <div className="divide-y divide-[#E5E7EB] md:hidden">
            {filteredRecords.map((r, idx) => (
              <div
                key={r.id || idx}
                onClick={() => navigate(`/manager/inventory/audit/${r.id}`, { state: { record: r } })}
                className="p-3 space-y-2 cursor-pointer hover:bg-emerald-50/50 transition"
                title="Click to open Stock Change Audit History on new page"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-[#217346]">{r.farmerName}</p>
                    <p className="text-xs font-bold text-[#111827]">
                      {r.productName} {r.variety && r.variety !== "—" ? `· ${r.variety}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">
                      Total: {r.totalStock?.toLocaleString("en-IN")} {r.unit}
                    </p>
                    <p className="text-[9px] text-[#6B7280]">
                      {shortDate(r.date)} {formatTime12h(r.date)}
                    </p>
                  </div>
                </div>

                {/* Grade breakdown in mobile */}
                <div className="grid grid-cols-3 gap-1 text-center pt-1">
                  <div className="rounded border border-[#A7F3D0] bg-[#ECFDF5] py-0.5 px-1">
                    <span className="text-[8px] font-bold text-[#065F46] block">Grade A</span>
                    <span className="text-[10px] font-black text-[#065F46]">{r.gradeA?.toLocaleString("en-IN")} {r.unit}</span>
                  </div>
                  <div className="rounded border border-[#BFDBFE] bg-[#EFF6FF] py-0.5 px-1">
                    <span className="text-[8px] font-bold text-[#1E40AF] block">Grade B</span>
                    <span className="text-[10px] font-black text-[#1E40AF]">{r.gradeB?.toLocaleString("en-IN")} {r.unit}</span>
                  </div>
                  <div className="rounded border border-[#FDE68A] bg-[#FFFBEB] py-0.5 px-1">
                    <span className="text-[8px] font-bold text-[#92400E] block">Grade C</span>
                    <span className="text-[10px] font-black text-[#92400E]">{r.gradeC?.toLocaleString("en-IN")} {r.unit}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1">
                  <ActionBadge action={r.action} changeQty={r.changeQty} />
                  {r.orderId && (
                    <span className="font-mono text-[9px] text-[#1E40AF] bg-blue-50 px-1 rounded">
                      Order: {r.orderId}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#6B7280]">
                  <p className="italic">
                    {r.reason} · <span className="font-medium text-[#374151]">By {r.updatedBy}</span>
                  </p>
                  <span className="text-[#217346] font-bold text-[9px]">Audit Page →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[3%]" />
                <col className="w-[9%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead>
                <tr>
                  <th className={`${TH} text-center`}>#</th>
                  <th className={TH}>Date & Time</th>
                  <th className={TH}>Farmer Name & ID</th>
                  <th className={TH}>Product & Variety</th>
                  <th className={TH}>Action / Event</th>
                  <th className={`${GRADE_TH} border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]`}>Grade A</th>
                  <th className={`${GRADE_TH} border-[#BFDBFE] bg-[#DBEAFE] text-[#1E40AF]`}>Grade B</th>
                  <th className={`${GRADE_TH} border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]`}>Grade C</th>
                  <th className={`${TH} text-center bg-[#F1F5F9] font-black text-[#0F172A]`}>Total Stock</th>
                  <th className={TH}>Reference / Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={r.id || idx}
                      onClick={() => navigate(`/manager/inventory/audit/${r.id}`, { state: { record: r } })}
                      className={`transition cursor-pointer hover:bg-emerald-50/70 hover:shadow-xs group ${
                        isEven ? "bg-white" : "bg-[#FBFDFB]"
                      }`}
                      title="Click row to open Stock Change Audit History on new page"
                    >
                      <td className={`${TD} text-center font-bold text-[#9CA3AF]`}>{idx + 1}</td>
                      <td className={TD}>
                        <p className="font-bold text-[#1F2937]">{shortDate(r.date)}</p>
                        <p className="text-[10px] text-[#6B7280]">{formatTime12h(r.date) || "—"}</p>
                      </td>
                      <td className={`${TD} break-words`}>
                        <p className="font-bold text-[#111827]">{r.farmerName}</p>
                        <p className="font-mono text-[9px] text-[#217346]">{r.farmerId}</p>
                      </td>
                      <td className={`${TD} break-words`}>
                        <p className="font-bold text-[#111827]">{r.productName}</p>
                        {r.variety && r.variety !== "—" ? (
                          <p className="text-[10px] font-medium text-[#6B7280]">{r.variety}</p>
                        ) : null}
                      </td>
                      <td className={TD}>
                        <ActionBadge action={r.action} changeQty={r.changeQty} />
                      </td>
                      <td className={`${GRADE_TD} border-[#A7F3D0] bg-[#ECFDF5]`}>
                        {formatGradeCell(r.gradeA, r.unit)}
                      </td>
                      <td className={`${GRADE_TD} border-[#BFDBFE] bg-[#EFF6FF]`}>
                        {formatGradeCell(r.gradeB, r.unit)}
                      </td>
                      <td className={`${GRADE_TD} border-[#FDE68A] bg-[#FFFBEB]`}>
                        {formatGradeCell(r.gradeC, r.unit)}
                      </td>
                      <td className={`${TD} text-center font-black text-slate-900 tabular-nums bg-slate-50/60`}>
                        {formatGradeCell(r.totalStock, r.unit)}
                      </td>
                      <td className={`${TD} break-words`}>
                        {r.orderId ? (
                          <div
                            className="flex items-center gap-1 font-mono text-[10px] font-semibold text-[#1E40AF]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="truncate" title={r.orderId}>
                              {r.orderId}
                            </span>
                            <CopyButton value={r.orderId} />
                          </div>
                        ) : r.reference && r.reference !== "—" ? (
                          <div
                            className="flex items-center gap-1 font-mono text-[10px] font-semibold text-[#4B5563]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="truncate" title={r.reference}>
                              {r.reference}
                            </span>
                            <CopyButton value={r.reference} />
                          </div>
                        ) : null}
                        <p className="text-[10px] text-[#374151] line-clamp-1 mt-0.5" title={r.reason}>
                          {r.reason || "Manual Update"}
                        </p>
                        <div className="flex items-center justify-between text-[9px] mt-0.5">
                          <span className="font-semibold text-slate-700 bg-slate-100 px-1 rounded">
                            By: {r.updatedBy}
                          </span>
                          <span className="text-[#217346] font-bold text-[9px] group-hover:underline flex items-center gap-0.5">
                            Audit Page →
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPDATE STOCK MODAL */}
      {updatingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Update Farmer Stock</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Farmer: <span className="font-semibold text-[#217346]">{updatingFarmer.name || updatingFarmer.fullName}</span> ({updatingFarmer.id || updatingFarmer.farmerId})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUpdatingFarmer(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStockUpdateSubmit} className="mt-4 space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Select Farmer Product
                </label>
                {farmerProducts.length === 0 ? (
                  <p className="text-xs text-red-500 font-semibold bg-red-50 p-2 rounded-lg">
                    No products found for this farmer in inventory.
                  </p>
                ) : (
                  <select
                    value={selectedProduct?.id || selectedProduct?.productId || ""}
                    onChange={(e) => {
                      const found = farmerProducts.find((p) => (p.id || p.productId) === e.target.value);
                      setSelectedProduct(found || null);
                    }}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#217346] cursor-pointer"
                  >
                    {farmerProducts.map((p) => (
                      <option key={p.id || p.productId} value={p.id || p.productId}>
                        {p.productName} {p.variety && p.variety !== "—" ? `(${p.variety})` : ""} · Total: {p.totalStock} {p.unit}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Grade Selection */}
              {selectedProduct && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                    Select Grade to Adjust
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Grade A", qty: selectedProduct.gradeA },
                      { label: "Grade B", qty: selectedProduct.gradeB },
                      { label: "Grade C", qty: selectedProduct.gradeC },
                    ].map((g) => (
                      <button
                        key={g.label}
                        type="button"
                        onClick={() => setSelectedGrade(g.label)}
                        className={`rounded-xl border p-2 text-center transition cursor-pointer ${
                          selectedGrade === g.label
                            ? "border-[#217346] bg-[#ECFDF5] font-bold text-[#065F46] ring-1 ring-[#217346]"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="block text-[11px] font-bold">{g.label}</span>
                        <span className="block text-[10px] text-slate-500 tabular-nums">
                          Curr: {g.qty} {selectedProduct.unit}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action: Add or Deduct */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustAction("add")}
                    className={`rounded-xl border py-2 text-xs font-bold transition cursor-pointer ${
                      adjustAction === "add"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    + Add Stock (Inward)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAction("reduce")}
                    className={`rounded-xl border py-2 text-xs font-bold transition cursor-pointer ${
                      adjustAction === "reduce"
                        ? "border-red-600 bg-red-50 text-red-800 ring-1 ring-red-600"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    - Deduct Stock (Outward)
                  </button>
                </div>
              </div>

              {/* Quantity input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Quantity ({selectedProduct?.unit || "Kg"})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder={`Enter ${selectedProduct?.unit || "Kg"} quantity...`}
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#217346] focus:ring-2 focus:ring-[#217346]/20"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-medium text-slate-900 outline-none focus:border-[#217346] cursor-pointer"
                >
                  <option value="Harvest addition">Harvest addition (Inward)</option>
                  <option value="Quality grading inward">Quality grading inward</option>
                  <option value="Physical count correction">Physical count correction</option>
                  <option value="Wastage / Damage">Wastage / Damage (Loss)</option>
                  <option value="Direct dispatch">Direct dispatch (Outward)</option>
                  <option value="Other">Other</option>
                </select>
                {adjustReason === "Other" && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter custom reason..."
                    className="mt-2 h-9 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 outline-none focus:border-[#217346]"
                  />
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUpdatingFarmer(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStock || !selectedProduct}
                  className="flex-1 rounded-xl bg-[#217346] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1b5e39] disabled:opacity-50 cursor-pointer"
                >
                  {submittingStock ? "Saving…" : "Confirm Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
