import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getManagerAllInventory, adjustManagerFarmerStock } from "../../api/farmerApi";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_BTN, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";
import toast from "react-hot-toast";

function AdjustModal({ farmer, product, grade, onClose, onDone }) {
  const [mode, setMode] = useState("add");
  const [qty, setQty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentStock = grade?.quantity ?? product?.stock ?? 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    const n = Number(qty);
    if (!n || n <= 0) { toast.error("Enter a valid quantity"); return; }
    setSubmitting(true);
    try {
      await adjustManagerFarmerStock(farmer.id, {
        productId: product.id,
        change: mode === "add" ? n : -n,
        grade: grade?.label || "All",
        reason: "Manual Update",
        updatedBy: "Manager",
      });
      toast.success("Stock updated");
      onDone();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className={`${EXCEL_PANEL} w-full max-w-sm p-5`}>
        <p className="mb-3 text-sm font-bold text-[#1F2937]">
          Adjust Stock — {product.name} ({grade?.label || "All"})
        </p>
        <p className="mb-3 text-xs text-[#6B7280]">
          Current Stock: <span className="font-bold text-[#1F2937]">{currentStock} Kg</span>
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("add")}
              className={`flex-1 py-1.5 text-xs font-semibold border ${mode === "add" ? "border-[#217346] bg-[#E8F5E9] text-[#217346]" : "border-[#D4D4D4]"}`}
            >
              + Add Stock
            </button>
            <button
              type="button"
              onClick={() => setMode("remove")}
              className={`flex-1 py-1.5 text-xs font-semibold border ${mode === "remove" ? "border-[#DC2626] bg-red-50 text-[#DC2626]" : "border-[#D4D4D4]"}`}
            >
              − Remove Stock
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Quantity (Kg)</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className={EXCEL_INPUT}
              placeholder="Enter quantity"
            />
          </div>
          {qty && (
            <p className="text-xs text-[#6B7280]">
              Updated Total: <span className="font-bold text-[#1F2937]">
                {mode === "add" ? currentStock + Number(qty) : Math.max(0, currentStock - Number(qty))} Kg
              </span>
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className={`flex-1 ${EXCEL_BTN_PRIMARY} py-2`}>
              {submitting ? "Updating…" : "Update Stock"}
            </button>
            <button type="button" onClick={onClose} className={`flex-1 ${EXCEL_BTN} py-2`}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManagerInventoryPage() {
  const [farmers, setFarmers] = useState([]);
  const [inventoryByFarmer, setInventoryByFarmer] = useState({});
  const [loading, setLoading] = useState(true);
  const [adjustTarget, setAdjustTarget] = useState(null); // { farmer, product, grade }

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await getManagerAllInventory();
      const fs = Array.isArray(data?.farmers) ? data.farmers : [];
      const inventory = Array.isArray(data?.inventory) ? data.inventory : [];
      setFarmers(fs);
      const map = {};
      inventory.forEach((item) => {
        if (!map[item.farmerId]) map[item.farmerId] = [];
        map[item.farmerId].push(item);
      });
      setInventoryByFarmer(map);
    } catch {
      setFarmers([]);
      setInventoryByFarmer({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>All Inventory</h1>
        <p className={EXCEL_PAGE_SUB}>Inventory across all your assigned farmers</p>
      </div>

      {loading ? (
        <p className="text-xs text-[#6B7280]">Loading…</p>
      ) : (
        farmers.map((f) => {
          const inv = inventoryByFarmer[f.id] || [];
          return (
            <div key={f.id} className={EXCEL_PANEL}>
              <div className="flex items-center justify-between border-b border-[#D4D4D4] px-4 py-2.5">
                <div>
                  <p className="text-xs font-bold text-[#1F2937]">{f.name}</p>
                  <p className="text-[10px] text-[#6B7280]">{f.farmName || "—"} · {f.farmLocation || "—"}</p>
                </div>
                <Link to={`/farmer/manager/farmers/${f.id}`} className={`${EXCEL_BTN} text-[10px]`}>
                  View Farmer
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F2F2F2] text-left">
                      {["Product", "Grade", "Current Stock", "Total Stock", "Status", "Action"].map((h) => (
                        <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inv.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-4 text-center text-[#6B7280]">No inventory</td></tr>
                    ) : (
                      inv.flatMap((p) =>
                        (p.grades || [{ id: "all", label: "All", quantity: p.stock || 0 }]).map((g, gi) => (
                          <tr key={`${p.id}-${gi}`} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                            <td className="px-3 py-2 font-semibold">{gi === 0 ? p.name : ""}</td>
                            <td className="px-3 py-2">
                              <span className="rounded bg-[#E8F5E9] px-1.5 py-0.5 text-[10px] font-semibold text-[#217346]">{g.label}</span>
                            </td>
                            <td className="px-3 py-2">{g.quantity} Kg</td>
                            <td className="px-3 py-2">
                              {p.grades?.reduce((s, g) => s + Number(g.quantity || 0), 0) || p.stock || 0} Kg
                            </td>
                            <td className="px-3 py-2">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                g.quantity <= (p.lowStockLimit || 10) ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                              }`}>
                                {g.quantity <= (p.lowStockLimit || 10) ? "Low" : "OK"}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => setAdjustTarget({ farmer: f, product: p, grade: g })}
                                className={EXCEL_BTN}
                              >
                                Adjust
                              </button>
                            </td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      {adjustTarget && (
        <AdjustModal
          farmer={adjustTarget.farmer}
          product={adjustTarget.product}
          grade={adjustTarget.grade}
          onClose={() => setAdjustTarget(null)}
          onDone={loadAll}
        />
      )}
    </div>
  );
}
