import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getManagerFarmers, getManagerFarmerProducts, createManagerOrder } from "../../api/farmerApi";
import { EXCEL_INPUT, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_BTN, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";
import toast from "react-hot-toast";

const UNIT_OPTIONS = ["Kg", "Crates", "Litre", "Bunch", "Boxes", "Quintal", "Dozen", "Packets"];
const DAY_OPTIONS = ["Today", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getTodayISODate() {
  return new Date().toISOString().split("T")[0];
}

function getTodayTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getTodayDayName() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

export default function ManagerCreateOrderPage() {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Harvest Order Fields
  const [harvestDate, setHarvestDate] = useState(getTodayISODate());
  const [harvestTime, setHarvestTime] = useState(getTodayTime());
  const [day, setDay] = useState(getTodayDayName());
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productUnit, setProductUnit] = useState("Kg");
  const [rejectionQty, setRejectionQty] = useState(0);
  const [rejectionReason, setRejectionReason] = useState("");

  // Dynamic Grades
  const [grades, setGrades] = useState([
    { id: "g_a", name: "Grade A", quantity: 0 },
    { id: "g_b", name: "Grade B", quantity: 0 },
    { id: "g_c", name: "Grade C", quantity: 0 },
  ]);

  // Load Farmers
  useEffect(() => {
    getManagerFarmers({ lite: true })
      .then((fs) => {
        const list = Array.isArray(fs) ? fs : [];
        setFarmers(list);
        if (list.length > 0) {
          setSelectedFarmerId(list[0].id);
        }
      })
      .catch(() => setFarmers([]))
      .finally(() => setLoadingFarmers(false));
  }, []);

  // Load Products when farmer changes
  useEffect(() => {
    if (!selectedFarmerId) {
      setFarmerProducts([]);
      return;
    }
    setLoadingProducts(true);
    getManagerFarmerProducts(selectedFarmerId)
      .then((prods) => {
        const pList = Array.isArray(prods) ? prods : [];
        setFarmerProducts(pList);
        if (pList.length > 0) {
          const first = pList[0];
          setSelectedProductId(first.id);
          setProductUnit(first.unit || "Kg");

          if (first.grades && first.grades.length > 0) {
            setGrades(
              first.grades.map((g, idx) => ({
                id: `g_${idx}`,
                name: g.label || `Grade ${String.fromCharCode(65 + idx)}`,
                quantity: 0,
              }))
            );
          }
        }
      })
      .catch(() => setFarmerProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [selectedFarmerId]);

  const handleProductChange = (prodId) => {
    setSelectedProductId(prodId);
    const prod = farmerProducts.find((p) => p.id === prodId);
    if (prod) {
      if (prod.unit) setProductUnit(prod.unit);
      if (prod.grades && prod.grades.length > 0) {
        setGrades(
          prod.grades.map((g, idx) => ({
            id: `g_${idx}`,
            name: g.label || `Grade ${String.fromCharCode(65 + idx)}`,
            quantity: 0,
          }))
        );
      }
    }
  };

  const selectedFarmer = farmers.find((f) => f.id === selectedFarmerId);
  const selectedProduct = farmerProducts.find((p) => p.id === selectedProductId);

  const handleGradeQtyChange = (gradeId, qty) => {
    setGrades((prev) =>
      prev.map((g) => (g.id === gradeId ? { ...g, quantity: Number(qty) || 0 } : g))
    );
  };

  const handleAddCustomGrade = () => {
    const name = window.prompt("Enter Grade Name (e.g. Export Grade, Super A, 1st Quality):");
    if (!name || !name.trim()) return;
    setGrades((prev) => [...prev, { id: `custom_${Date.now()}`, name: name.trim(), quantity: 0 }]);
  };

  const handleRemoveGrade = (gradeId) => {
    if (grades.length <= 1) return;
    setGrades((prev) => prev.filter((g) => g.id !== gradeId));
  };

  const totalAcceptedQty = grades.reduce((sum, g) => sum + Number(g.quantity || 0), 0);
  const totalGrossHarvest = totalAcceptedQty + Number(rejectionQty || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFarmerId) {
      toast.error("Please select a farmer");
      return;
    }
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }
    if (totalAcceptedQty <= 0) {
      toast.error("Please enter quantity for at least one grade");
      return;
    }

    const orderProducts = grades
      .filter((g) => Number(g.quantity) > 0)
      .map((g) => ({
        id: selectedProductId,
        productId: selectedProductId,
        name: selectedProduct?.name || "Produce",
        grade: g.name,
        quantity: Number(g.quantity),
        unit: productUnit,
        price: 0,
        total: 0,
      }));

    setSubmitting(true);
    try {
      await createManagerOrder(selectedFarmerId, {
        customer: {
          name: "Daily Harvest Statement",
          phone: selectedFarmer?.mobile || "",
          address: selectedFarmer?.farmLocation || "Farm Gate",
        },
        products: orderProducts,
        harvestDate,
        harvestTime,
        day,
        unit: productUnit,
        rejectionQty: Number(rejectionQty || 0),
        rejectionReason,
        status: "Confirmed",
      });
      toast.success(`Harvest order placed for ${selectedFarmer?.name}!`);
      navigate("/farmer/manager/orders");
    } catch (err) {
      toast.error(err?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2.5 font-sans text-xs">
      {/* 1. Compact Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4D4D4] pb-2">
        <div className="flex items-center gap-2">
          <Link to="/farmer/manager/orders" className="text-xs text-[#6B7280] hover:text-[#217346]">Orders</Link>
          <span className="text-[#9CA3AF]">›</span>
          <h1 className="text-sm font-bold text-[#1F2937]">Create Harvest Order</h1>
          <span className="rounded bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#217346] border border-[#C4DBC4]">
            Single-Screen Form
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/farmer/manager/orders")}
          className={`${EXCEL_BTN} py-1 text-xs`}
        >
          ✕ Close
        </button>
      </div>

      {loadingFarmers ? (
        <div className="border border-[#D4D4D4] bg-white p-8 text-center text-xs text-[#6B7280]">
          Loading assigned farmers…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* Main One-Screen Card */}
          <div className="border border-[#217346] bg-white rounded shadow-xs overflow-hidden">
            {/* Green Excel Header */}
            <div className="flex items-center justify-between border-b border-[#217346] bg-[#217346] px-3 py-1.5 text-white">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <span>🌾</span> Harvest Order & Produce Grading Statement
              </span>
              <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded">
                Live Entry
              </span>
            </div>

            {/* Row 1: Farmer, Product, Unit Selector Strip */}
            <div className="grid grid-cols-1 gap-2.5 border-b border-[#D4D4D4] bg-[#F8FAF8] p-2.5 sm:grid-cols-3">
              {/* Farmer Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#1F2937] mb-0.5">
                  👨‍🌾 Farmer Name *
                </label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className={`${EXCEL_INPUT} py-1 font-semibold text-xs`}
                  required
                >
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.mobile}) {f.farmName ? `· ${f.farmName}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#1F2937] mb-0.5">
                  📦 Product Name *
                </label>
                {loadingProducts ? (
                  <p className="text-xs text-gray-500 py-1">Loading…</p>
                ) : (
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className={`${EXCEL_INPUT} py-1 font-semibold text-xs`}
                    required
                  >
                    {farmerProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Product Unit */}
              <div>
                <label className="block text-[11px] font-bold text-[#1F2937] mb-0.5">
                  ⚖️ Product Unit *
                </label>
                <select
                  value={productUnit}
                  onChange={(e) => setProductUnit(e.target.value)}
                  className={`${EXCEL_INPUT} py-1 font-bold text-[#217346] text-xs`}
                  required
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Two-Column Side-by-Side Content */}
            <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-12">
              {/* Left Column (5 Cols): Timing, Rejection, and Summary */}
              <div className="space-y-2.5 md:col-span-5 border-r border-[#E5E7EB] pr-0 md:pr-3">
                {/* Timing Row */}
                <div className="border border-[#D4D4D4] bg-[#FAFAFA] p-2 rounded">
                  <p className="text-[10px] font-bold uppercase text-[#217346] mb-1.5">
                    1. Schedule & Timing
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-700">Date *</label>
                      <input
                        type="date"
                        value={harvestDate}
                        onChange={(e) => {
                          setHarvestDate(e.target.value);
                          if (e.target.value) {
                            const d = new Date(e.target.value);
                            const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                            setDay(dayNames[d.getDay()]);
                          }
                        }}
                        className={`${EXCEL_INPUT} py-1 text-[11px]`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-700">Time *</label>
                      <input
                        type="text"
                        value={harvestTime}
                        onChange={(e) => setHarvestTime(e.target.value)}
                        className={`${EXCEL_INPUT} py-1 text-[11px]`}
                        placeholder="07:30 AM"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-700">Day *</label>
                      <select
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        className={`${EXCEL_INPUT} py-1 text-[11px]`}
                        required
                      >
                        {DAY_OPTIONS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rejections */}
                <div className="border border-red-200 bg-[#FFF9F9] p-2 rounded">
                  <p className="text-[10px] font-bold uppercase text-[#DC2626] mb-1">
                    2. Rejection / Wastage
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#DC2626]">
                        Rejection ({productUnit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={rejectionQty}
                        onChange={(e) => setRejectionQty(Number(e.target.value) || 0)}
                        className={`${EXCEL_INPUT} py-1 font-bold text-[#DC2626] text-xs`}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600">Reason</label>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g. damaged"
                        className={`${EXCEL_INPUT} py-1 text-[11px]`}
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time Summary Box */}
                <div className="border border-[#C4DBC4] bg-[#F2F8F2] p-2.5 rounded">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 font-semibold">Accepted Produce:</span>
                    <span className="font-bold text-[#217346]">{totalAcceptedQty} {productUnit}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-600 font-semibold">Rejection Qty:</span>
                    <span className="font-bold text-[#DC2626]">{rejectionQty} {productUnit}</span>
                  </div>
                  <div className="border-t border-[#C4DBC4] pt-1.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">Gross Harvest:</span>
                    <span className="text-sm font-extrabold text-[#217346]">{totalGrossHarvest} {productUnit}</span>
                  </div>
                </div>
              </div>

              {/* Right Column (7 Cols): Produce Grades Breakdown Table */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-bold uppercase text-[#217346]">
                      3. Grades Breakdown ({productUnit})
                    </p>
                    <button
                      type="button"
                      onClick={handleAddCustomGrade}
                      className="border border-[#217346] bg-[#E8F5E9] hover:bg-emerald-100 text-[#217346] text-[10px] font-bold px-2 py-0.5 rounded"
                    >
                      + Add Grade
                    </button>
                  </div>

                  <div className="border border-[#D4D4D4] rounded overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#EBF5EB] text-left border-b border-[#D4D4D4]">
                          <th className="px-2.5 py-1.5 font-bold text-gray-700 w-8 text-center">#</th>
                          <th className="px-2.5 py-1.5 font-bold text-[#1F2937]">Grade</th>
                          <th className="px-2.5 py-1.5 font-bold text-right text-[#1F2937]">Quantity ({productUnit})</th>
                          <th className="px-2 py-1.5 text-center text-gray-400 w-10">✕</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((g, idx) => (
                          <tr key={g.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FBF9]">
                            <td className="px-2 py-1 text-center text-gray-400 font-semibold text-[11px]">{idx + 1}</td>
                            <td className="px-2.5 py-1 font-bold text-[#217346]">{g.name}</td>
                            <td className="px-2.5 py-1 text-right">
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={g.quantity === 0 ? "0" : g.quantity}
                                  onChange={(e) => handleGradeQtyChange(g.id, e.target.value)}
                                  className={`${EXCEL_INPUT} py-0.5 px-2 font-bold text-[#1F2937] text-right w-24 text-xs`}
                                  placeholder="0"
                                />
                                <span className="text-[10px] font-semibold text-gray-500">{productUnit}</span>
                              </div>
                            </td>
                            <td className="px-2 py-1 text-center">
                              {grades.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGrade(g.id)}
                                  className="text-red-500 hover:text-red-700 font-bold text-[10px]"
                                  title="Remove"
                                >
                                  ✕
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#EBF5EB] border-t border-[#C4DBC4] font-bold text-xs">
                          <td colSpan={2} className="px-2.5 py-1.5 text-[#1F2937]">
                            Total Accepted:
                          </td>
                          <td className="px-2.5 py-1.5 text-right text-sm font-extrabold text-[#217346]">
                            {totalAcceptedQty} {productUnit}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Bottom Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => navigate("/farmer/manager/orders")}
                    className={`${EXCEL_BTN} px-4 py-1.5 text-xs`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || farmerProducts.length === 0}
                    className={`${EXCEL_BTN_PRIMARY} px-6 py-1.5 text-xs font-bold shadow-xs`}
                  >
                    {submitting ? "Saving…" : "💾 Save Harvest Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
