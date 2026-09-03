import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  deleteManagerFarmerOrder,
  getManagerAllHarvestOrders,
  updateManagerFarmerOrder,
} from "../../api/farmerApi";
import { formatProductBusinessId } from "../../utils/cropLinks";
import {
  EXCEL_PANEL,
  EXCEL_INPUT,
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
} from "../../utils/excelStyles";

const ORDER_STATUSES = [
  "Approved",
  "Confirmed",
  "Processing",
  "Ready for Pickup",
  "Delivered",
  "Completed",
  "Cancelled",
];

const UNIT_OPTIONS = ["Kg", "Litre", "Box", "Bundle", "Dozen", "Quintal", "Gram"];

function getDayName(dateStr) {
  if (!dateStr) return "Today";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const d = new Date(dateStr);
  return isNaN(d.getDay()) ? "Today" : days[d.getDay()];
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? String(dateStr).slice(0, 10) : d.toISOString().split("T")[0];
}

function matchesProduct(order, { productId, productName, productKey }) {
  const nameNeedle = String(productName || "").trim().toLowerCase();
  const idNeedle = String(productId || "").trim();
  const keyNeedle = decodeURIComponent(String(productKey || "")).trim().toLowerCase();
  const orderPid = String(order.productId || "").trim();
  const orderName = String(order.productName || "").trim().toLowerCase();

  if (idNeedle && (orderPid === idNeedle || orderPid.toLowerCase() === idNeedle.toLowerCase())) return true;
  if (nameNeedle && orderName === nameNeedle) return true;
  if (keyNeedle && (orderPid.toLowerCase() === keyNeedle || orderName === keyNeedle)) return true;

  const entries =
    Array.isArray(order.products) && order.products.length > 0
      ? order.products
      : [{ name: order.productName, productId: order.productId, id: order.productId }];

  return entries.some((p) => {
    const pid = String(p.productId || (String(p.id || "").length > 24 ? "" : p.id) || order.productId || "").trim();
    const pname = String(p.name || order.productName || "").trim().toLowerCase();
    if (idNeedle && pid && pid === idNeedle) return true;
    if (nameNeedle && pname === nameNeedle) return true;
    if (keyNeedle && (pid.toLowerCase() === keyNeedle || pname === keyNeedle)) return true;
    return false;
  });
}

export default function ManagerProductOrdersSpreadsheetPage() {
  const { productKey } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const productId = searchParams.get("productId") || "";
  const productNameParam = searchParams.get("name") || "";
  const farmerIdFilter = searchParams.get("farmerId") || "";

  const [farmers, setFarmers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedFarmerId, setSelectedFarmerId] = useState(farmerIdFilter);
  const [deletingId, setDeletingId] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    date: "",
    day: "",
    productName: "",
    unit: "Kg",
    rejectionQty: 0,
    status: "Approved",
    gradeMap: {},
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getManagerAllHarvestOrders();
      const farmerList = Array.isArray(data?.farmers) ? data.farmers : [];
      const orderList = Array.isArray(data?.orders) ? data.orders : [];
      setFarmers(farmerList);
      setOrders(
        orderList
          .filter((o) => matchesProduct(o, { productId, productName: productNameParam, productKey }))
          .sort(
            (a, b) =>
              new Date(b.harvestDate || b.orderDate || b.createdAt || 0) -
              new Date(a.harvestDate || a.orderDate || a.createdAt || 0)
          )
      );
    } catch (err) {
      toast.error(err?.message || "Failed to load product harvest orders");
      setFarmers([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productKey, productId, productNameParam]);

  const productTitle =
    productNameParam ||
    orders[0]?.productName ||
    orders[0]?.products?.[0]?.name ||
    decodeURIComponent(productKey || "Product");

  const displayProductId =
    productId || orders[0]?.productId || orders[0]?.products?.[0]?.productId || orders[0]?.products?.[0]?.id || "";

  const availableGrades = useMemo(() => {
    const gradeSet = new Set(["Grade A", "Grade B", "Grade C"]);
    orders.forEach((o) => {
      (o.grades || []).forEach((g) => {
        if (g.name || g.label) gradeSet.add(g.name || g.label);
      });
      (o.products || []).forEach((p) => {
        if (p.grade) gradeSet.add(p.grade);
        (p.grades || []).forEach((g) => {
          if (g.label || g.name) gradeSet.add(g.label || g.name);
        });
      });
    });
    return Array.from(gradeSet);
  }, [orders]);

  const spreadsheetRows = useMemo(() => {
    const rows = [];
    const q = searchQuery.toLowerCase().trim();

    orders.forEach((o) => {
      if (selectedFarmerId && o.farmerId !== selectedFarmerId) return;
      if (statusFilter !== "ALL" && o.status !== statusFilter) return;

      const farmerName = o.farmerName || farmers.find((f) => f.id === o.farmerId)?.name || "—";
      const orderProducts =
        o.products && o.products.length > 0
          ? o.products.filter((p) =>
              matchesProduct(
                { ...o, products: [p], productId: p.productId || p.id, productName: p.name },
                { productId, productName: productNameParam, productKey }
              )
            )
          : [{ name: o.productName || productTitle, quantity: o.totalQuantity || 0, unit: o.unit || "Kg" }];

      orderProducts.forEach((p, pIdx) => {
        const matchSearch =
          !q ||
          String(o.id || "").toLowerCase().includes(q) ||
          farmerName.toLowerCase().includes(q) ||
          String(p.name || "").toLowerCase().includes(q);

        if (!matchSearch) return;

        const dateStr = formatDate(o.harvestDate || o.date || o.orderDate || o.createdAt);
        const dayStr = o.day || getDayName(dateStr);
        const unit = p.unit || o.unit || "Kg";
        const rejectionQty = pIdx === 0 ? Number(o.rejectionQty || 0) : 0;

        const gradeMap = {};
        availableGrades.forEach((g) => {
          gradeMap[g] = 0;
        });

        if (Array.isArray(o.grades) && o.grades.length > 0) {
          o.grades.forEach((g) => {
            const gName = g.name || g.label || "Grade A";
            gradeMap[gName] = Number(g.quantity || 0);
          });
        } else if (Array.isArray(p.grades) && p.grades.length > 0) {
          p.grades.forEach((g) => {
            const gName = g.label || g.name || "Grade A";
            gradeMap[gName] = Number(g.quantity || 0);
          });
        } else {
          const pGrade = p.grade || "Grade A";
          gradeMap[pGrade] = Number(p.quantity || 0);
        }

        rows.push({
          orderId: o.id || o.orderId,
          farmerId: o.farmerId,
          farmerName,
          date: dateStr,
          day: dayStr,
          productName: p.name || o.productName || productTitle,
          unit,
          gradeMap,
          rejectionQty: `${rejectionQty} ${unit}`,
          rawRejectionQty: rejectionQty,
          totalQuantity: Object.values(gradeMap).reduce((s, n) => s + Number(n || 0), 0) || Number(p.quantity || 0),
          status: o.status || "Approved",
          rawOrder: o,
        });
      });
    });

    return rows;
  }, [
    orders,
    farmers,
    selectedFarmerId,
    statusFilter,
    searchQuery,
    availableGrades,
    productId,
    productNameParam,
    productKey,
    productTitle,
  ]);

  const totalVolume = spreadsheetRows.reduce((sum, r) => sum + r.totalQuantity, 0);
  const totalRejection = spreadsheetRows.reduce((sum, r) => sum + r.rawRejectionQty, 0);
  const uniqueFarmers = new Set(spreadsheetRows.map((r) => r.farmerId).filter(Boolean)).size;

  const gradeTotals = useMemo(() => {
    const totals = {};
    availableGrades.forEach((g) => {
      totals[g] = spreadsheetRows.reduce((sum, r) => sum + (r.gradeMap[g] || 0), 0);
    });
    return totals;
  }, [spreadsheetRows, availableGrades]);

  const handleOpenEdit = (row) => {
    setEditingOrder(row);
    setEditForm({
      date: row.date,
      day: row.day,
      productName: row.productName,
      unit: row.unit || "Kg",
      rejectionQty: row.rawRejectionQty || 0,
      status: row.status || "Approved",
      gradeMap: { ...row.gradeMap },
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    setSavingEdit(true);
    try {
      const totalQty = Object.values(editForm.gradeMap).reduce((sum, q) => sum + Number(q || 0), 0);
      const gradeList = Object.entries(editForm.gradeMap).map(([name, qty]) => ({
        label: name,
        name,
        quantity: Number(qty || 0),
      }));
      const payload = {
        harvestDate: editForm.date,
        day: editForm.day,
        unit: editForm.unit,
        rejectionQty: Number(editForm.rejectionQty || 0),
        status: editForm.status,
        grades: gradeList,
        products: [
          {
            name: editForm.productName,
            unit: editForm.unit,
            quantity: totalQty,
            grades: gradeList,
          },
        ],
      };
      await updateManagerFarmerOrder(editingOrder.farmerId, editingOrder.orderId, payload);
      toast.success("Harvest order updated");
      setEditingOrder(null);
      await loadData();
    } catch (err) {
      toast.error(err?.message || "Failed to update harvest order");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteOrder = async (row) => {
    if (!window.confirm("Delete this harvest order entry?")) return;
    setDeletingId(row.orderId);
    try {
      await deleteManagerFarmerOrder(row.farmerId, row.orderId);
      toast.success("Harvest order deleted");
      setOrders((prev) => prev.filter((o) => o.id !== row.orderId && o.orderId !== row.orderId));
    } catch (err) {
      toast.error(err?.message || "Failed to delete harvest order");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Sr",
      "Date",
      "Day",
      "Farmer",
      "Product",
      "Unit",
      ...availableGrades.map((g) => `${g} Qty`),
      "Rejection Qty",
      "Total Qty",
      "Status",
    ];
    const csvRows = [headers.join(",")];
    spreadsheetRows.forEach((r, idx) => {
      csvRows.push(
        [
          idx + 1,
          `"${r.date}"`,
          `"${r.day}"`,
          `"${r.farmerName}"`,
          `"${r.productName}"`,
          `"${r.unit}"`,
          ...availableGrades.map((g) => r.gradeMap[g] || 0),
          `"${r.rejectionQty}"`,
          r.totalQuantity,
          `"${r.status}"`,
        ].join(",")
      );
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product_harvest_${productTitle.replace(/\s+/g, "_")}_${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>Loading…</div>;
  }

  const createPath = `/farmer/manager/orders/create${productId ? `?productId=${encodeURIComponent(productId)}` : ""}`;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <Link to="/farmer/manager/orders" className="text-[11px] font-semibold text-[#217346] hover:underline">
            ← Orders
          </Link>
          <h1 className="mt-0.5 text-base font-bold text-slate-900 sm:text-xl">{productTitle}</h1>
          <p className="font-mono text-[11px] text-emerald-700">
            {formatProductBusinessId({ productId: displayProductId, id: displayProductId })}
            <span className="ml-2 font-sans text-[#9CA3AF]">
              {spreadsheetRows.length} orders · {uniqueFarmers} farmers · {totalVolume.toLocaleString("en-IN")} qty
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            CSV
          </button>
          <Link to={createPath} className={`${EXCEL_BTN_PRIMARY} !min-h-8 px-3 py-1.5 text-xs`}>
            + Order
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search farmer…"
          className={`${EXCEL_INPUT} max-w-[180px] !py-1.5 !text-xs`}
        />
        <select
          value={selectedFarmerId}
          onChange={(e) => setSelectedFarmerId(e.target.value)}
          className={`${EXCEL_INPUT} max-w-[160px] !py-1.5 !text-xs`}
        >
          <option value="">All Farmers</option>
          {farmers.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${EXCEL_INPUT} max-w-[140px] !py-1.5 !text-xs`}
        >
          <option value="ALL">All Status</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {spreadsheetRows.length === 0 ? (
        <div className={`${EXCEL_PANEL} space-y-2 p-6 text-center text-[#6B7280]`}>
          <p>No harvest orders for this product yet.</p>
          <button type="button" className={`${EXCEL_BTN_PRIMARY} !min-h-8 px-3 py-1.5 text-xs`} onClick={() => navigate(createPath)}>
            + Create Order
          </button>
        </div>
      ) : (
        <div className={`${EXCEL_PANEL} overflow-x-auto`}>
          <table className="w-full min-w-[720px] text-xs">
            <thead>
              <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                <th className="px-2 py-2 text-center font-semibold text-[#6B7280]">#</th>
                <th className="px-2 py-2 font-semibold text-[#6B7280]">Date</th>
                <th className="px-2 py-2 font-semibold text-[#6B7280]">Farmer</th>
                <th className="px-2 py-2 font-semibold text-[#6B7280]">Unit</th>
                {availableGrades.map((g) => (
                  <th key={g} className="px-2 py-2 text-right font-semibold text-[#6B7280]">
                    {g.replace("Grade ", "")}
                  </th>
                ))}
                <th className="px-2 py-2 text-right font-semibold text-[#6B7280]">Rej</th>
                <th className="px-2 py-2 text-right font-semibold text-[#6B7280]">Total</th>
                <th className="px-2 py-2 text-center font-semibold text-[#6B7280]">Status</th>
                <th className="sticky right-0 border-l border-[#D4D4D4] bg-[#F2F2F2] px-2 py-2 text-right font-semibold text-[#6B7280]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {spreadsheetRows.map((row, idx) => (
                <tr key={`${row.orderId}-${row.farmerId}-${idx}`} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                  <td className="px-2 py-1.5 text-center text-[#9CA3AF]">{idx + 1}</td>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    {row.date}
                    <span className="ml-1 text-[10px] text-[#9CA3AF]">{row.day?.slice(0, 3)}</span>
                  </td>
                  <td className="px-2 py-1.5 font-semibold">
                    <Link to={`/farmer/manager/orders/farmer/${row.farmerId}`} className="text-[#217346] hover:underline">
                      {row.farmerName}
                    </Link>
                  </td>
                  <td className="px-2 py-1.5">{row.unit}</td>
                  {availableGrades.map((g) => (
                    <td key={g} className="px-2 py-1.5 text-right tabular-nums">
                      {row.gradeMap[g] || 0}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right">{row.rawRejectionQty}</td>
                  <td className="px-2 py-1.5 text-right font-semibold">{row.totalQuantity}</td>
                  <td className="px-2 py-1.5 text-center">
                    <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                      {row.status}
                    </span>
                  </td>
                  <td className="sticky right-0 border-l border-[#D4D4D4] bg-white px-2 py-1.5 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold hover:bg-slate-50"
                        onClick={() => handleOpenEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === row.orderId}
                        className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        onClick={() => handleDeleteOrder(row)}
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#F2F8F3] font-bold">
                <td className="px-2 py-2" colSpan={3}>
                  Totals
                </td>
                <td className="px-2 py-2" />
                {availableGrades.map((g) => (
                  <td key={g} className="px-2 py-2 text-right">
                    {gradeTotals[g] || 0}
                  </td>
                ))}
                <td className="px-2 py-2 text-right">{totalRejection}</td>
                <td className="px-2 py-2 text-right text-[#217346]">{totalVolume}</td>
                <td className="px-2 py-2" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {editingOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSaveEdit} className="w-full max-w-md space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1F2937]">Edit Order</h2>
              <button type="button" className="text-[#6B7280]" onClick={() => setEditingOrder(null)}>
                ✕
              </button>
            </div>
            <p className="text-[11px] text-[#6B7280]">
              {editingOrder.farmerName} · {editingOrder.productName}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-0.5 block text-[11px] font-semibold">Date</label>
                <input
                  type="date"
                  className={`${EXCEL_INPUT} !py-1.5 !text-xs`}
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, date: e.target.value, day: getDayName(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] font-semibold">Unit</label>
                <select
                  className={`${EXCEL_INPUT} !py-1.5 !text-xs`}
                  value={editForm.unit}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, unit: e.target.value }))}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] font-semibold">Rejection</label>
                <input
                  type="number"
                  min="0"
                  className={`${EXCEL_INPUT} !py-1.5 !text-xs`}
                  value={editForm.rejectionQty}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, rejectionQty: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] font-semibold">Status</label>
                <select
                  className={`${EXCEL_INPUT} !py-1.5 !text-xs`}
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold">Grades</p>
              {availableGrades.map((g) => (
                <div key={g} className="grid grid-cols-[1fr_6rem] items-center gap-2">
                  <span className="text-[11px]">{g}</span>
                  <input
                    type="number"
                    min="0"
                    className={`${EXCEL_INPUT} !py-1 !text-xs`}
                    value={editForm.gradeMap[g] ?? 0}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        gradeMap: { ...prev.gradeMap, [g]: e.target.value },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className={EXCEL_BTN} onClick={() => setEditingOrder(null)}>
                Cancel
              </button>
              <button type="submit" disabled={savingEdit} className={EXCEL_BTN_PRIMARY}>
                {savingEdit ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
