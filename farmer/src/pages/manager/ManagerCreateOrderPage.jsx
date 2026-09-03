import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { getManagerFarmers, getManagerFarmerProducts, createManagerOrder } from "../../api/farmerApi";
import { EXCEL_INPUT, EXCEL_BTN, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";
import toast from "react-hot-toast";

const UNIT_OPTIONS = ["Kg", "Crates", "Litre", "Bunch", "Boxes", "Quintal", "Dozen", "Packets"];

function getTodayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getNowTimeInput() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function dayNameFromISO(iso) {
  if (!iso) return "Today";
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return "Today";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(y, m - 1, d).getDay()] || "Today";
}

function formatDisplayDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function defaultGradeRows(fallbackPrice = 0) {
  const price = Number(fallbackPrice) || 0;
  return [
    { id: "g_a", name: "Grade A", quantity: "", price },
    { id: "g_b", name: "Grade B", quantity: "", price },
    { id: "g_c", name: "Grade C", quantity: "", price },
  ];
}

function gradesFromProduct(prod) {
  const fallback = Number(prod?.pricePerKg ?? prod?.sellingPrice ?? 0) || 0;
  if (Array.isArray(prod?.grades) && prod.grades.length > 0) {
    return prod.grades.map((g, idx) => ({
      id: `g_${idx}`,
      name: g.label || g.name || `Grade ${String.fromCharCode(65 + idx)}`,
      quantity: "",
      price: Number(g.price ?? g.rate ?? fallback) || 0,
    }));
  }
  return defaultGradeRows(fallback);
}

export default function ManagerCreateOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetFarmerId = searchParams.get("farmerId") || "";
  const presetProductId = searchParams.get("productId") || "";
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [orderDate] = useState(getTodayISODate());
  const [pickupDate, setPickupDate] = useState(getTodayISODate());
  const [pickupTime, setPickupTime] = useState(getNowTimeInput());
  const [day, setDay] = useState(dayNameFromISO(getTodayISODate()));
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productUnit, setProductUnit] = useState("Kg");
  const [grades, setGrades] = useState(() => defaultGradeRows(0));

  useEffect(() => {
    getManagerFarmers({ lite: true })
      .then((fs) => {
        const list = Array.isArray(fs) ? fs : [];
        setFarmers(list);
        if (list.length > 0) {
          const match = list.find((f) => f.id === presetFarmerId || f.farmerId === presetFarmerId);
          setSelectedFarmerId(match?.id || list[0].id);
        }
      })
      .catch(() => setFarmers([]))
      .finally(() => setLoadingFarmers(false));
  }, []);

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
          const match =
            pList.find((p) => p.id === presetProductId || p.productId === presetProductId) || pList[0];
          setSelectedProductId(match.id || match.productId);
          setProductUnit(match.unit || "Kg");
          setGrades(gradesFromProduct(match));
        }
      })
      .catch(() => setFarmerProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [selectedFarmerId]);

  const handleProductChange = (prodId) => {
    setSelectedProductId(prodId);
    const prod = farmerProducts.find((p) => p.id === prodId || p.productId === prodId);
    if (prod) {
      if (prod.unit) setProductUnit(prod.unit);
      setGrades(gradesFromProduct(prod));
    }
  };

  const selectedFarmer = farmers.find((f) => f.id === selectedFarmerId);
  const selectedProduct = farmerProducts.find(
    (p) => p.id === selectedProductId || p.productId === selectedProductId
  );

  const handleGradeQtyChange = (gradeId, qty) => {
    const raw = String(qty ?? "").trim();
    setGrades((prev) =>
      prev.map((g) => (g.id === gradeId ? { ...g, quantity: raw === "" ? "" : Number(raw) || 0 } : g))
    );
  };

  const handleGradePriceChange = (gradeId, price) => {
    setGrades((prev) =>
      prev.map((g) => (g.id === gradeId ? { ...g, price: Number(price) || 0 } : g))
    );
  };

  const handleAddCustomGrade = () => {
    const name = window.prompt("Grade name");
    if (!name || !name.trim()) return;
    const fallback =
      Number(selectedProduct?.pricePerKg ?? selectedProduct?.sellingPrice ?? 0) ||
      Number(grades[0]?.price || 0) ||
      0;
    setGrades((prev) => [
      ...prev,
      { id: `custom_${Date.now()}`, name: name.trim(), quantity: "", price: fallback },
    ]);
  };

  const handleRemoveGrade = (gradeId) => {
    if (grades.length <= 1) return;
    setGrades((prev) => prev.filter((g) => g.id !== gradeId));
  };

  const totalQty = grades.reduce((sum, g) => sum + Number(g.quantity || 0), 0);
  const totalValue = grades.reduce(
    (sum, g) => sum + Number(g.quantity || 0) * Number(g.price || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFarmerId) {
      toast.error("Select farmer");
      return;
    }
    if (!selectedProductId) {
      toast.error("Select product");
      return;
    }
    if (totalQty <= 0) {
      toast.error("Enter quantity for at least one grade");
      return;
    }
    if (grades.some((g) => Number(g.quantity) > 0 && !(Number(g.price) > 0))) {
      toast.error("Enter price for every grade with quantity");
      return;
    }

    const orderProducts = grades
      .filter((g) => Number(g.quantity) > 0)
      .map((g) => {
        const qty = Number(g.quantity);
        const price = Number(g.price) || 0;
        return {
          id: selectedProductId,
          productId: selectedProductId,
          name: selectedProduct?.productName || selectedProduct?.name || "Produce",
          grade: g.name,
          quantity: qty,
          unit: productUnit,
          price,
          total: qty * price,
        };
      });

    setSubmitting(true);
    try {
      await createManagerOrder(selectedFarmerId, {
        productId: selectedProductId,
        productName: selectedProduct?.productName || selectedProduct?.name || "Produce",
        customer: {
          name: "Daily Harvest Statement",
          phone: selectedFarmer?.mobile || "",
          address: selectedFarmer?.farmLocation || "Farm Gate",
        },
        products: orderProducts,
        grades: grades
          .filter((g) => Number(g.quantity) > 0)
          .map((g) => {
            const qty = Number(g.quantity);
            const price = Number(g.price) || 0;
            return {
              name: g.name,
              label: g.name,
              quantity: qty,
              rate: price,
              price,
              amount: qty * price,
            };
          }),
        harvestDate: orderDate,
        harvestTime: pickupTime,
        orderDate,
        pickupDate,
        requiredDate: pickupDate,
        pickupTime,
        day,
        unit: productUnit,
        rejectionQty: 0,
        rejectionReason: "",
        status: "NEW",
        paymentStatus: "Pending",
        deliveryStatus: "Pending",
        variety: selectedProduct?.variety || "",
      });
      toast.success(`Order created for ${selectedFarmer?.name}`);
      navigate("/farmer/manager/orders");
    } catch (err) {
      toast.error(err?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-3 font-sans text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <Link to="/farmer/manager/orders" className="text-[11px] text-[#6B7280] hover:text-[#217346]">
            ← Orders
          </Link>
          <h1 className="text-base font-bold text-[#1F2937]">Create Harvest Order</h1>
        </div>
        <button type="button" onClick={() => navigate("/farmer/manager/orders")} className={`${EXCEL_BTN} !py-1`}>
          Close
        </button>
      </div>

      {loadingFarmers ? (
        <div className="rounded border border-[#D4D4D4] bg-white p-6 text-center text-[#6B7280]">Loading…</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-[#D4D4D4] bg-white p-3 sm:p-4">
          {/* Farmer · Product · Unit — 1 row on desktop */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5.5rem]">
            <label className="block min-w-0">
              <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">Farmer</span>
              <select
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                className={`${EXCEL_INPUT} !py-2 font-semibold sm:!py-1.5`}
                required
              >
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.mobile})
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">Product</span>
              {loadingProducts ? (
                <p className="py-2 text-[#6B7280]">…</p>
              ) : (
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className={`${EXCEL_INPUT} !py-2 font-semibold sm:!py-1.5`}
                  required
                >
                  {farmerProducts.map((p) => (
                    <option key={p.id || p.productId} value={p.id || p.productId}>
                      {p.productName || p.name}
                    </option>
                  ))}
                </select>
              )}
            </label>
            <label className="block min-w-0">
              <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">Unit</span>
              <select
                value={productUnit}
                onChange={(e) => setProductUnit(e.target.value)}
                className={`${EXCEL_INPUT} !py-2 font-semibold sm:!py-1.5`}
                required
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Left: schedule · Right: grades */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div className="space-y-2 rounded-lg border border-[#E5E7EB] p-2.5 sm:p-3">
              <p className="text-[11px] font-bold text-[#1F2937]">Schedule</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="block min-w-0">
                  <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">Order date</span>
                  <input
                    type="text"
                    value={formatDisplayDate(orderDate)}
                    readOnly
                    className={`${EXCEL_INPUT} !py-2 bg-[#F3F4F6] sm:!py-1.5`}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">Pickup date</span>
                  <input
                    type="date"
                    value={pickupDate}
                    min={orderDate}
                    onChange={(e) => {
                      setPickupDate(e.target.value);
                      setDay(dayNameFromISO(e.target.value));
                    }}
                    className={`${EXCEL_INPUT} !py-2 sm:!py-1.5`}
                    required
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">Pickup time</span>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className={`${EXCEL_INPUT} !py-2 sm:!py-1.5`}
                    required
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">Day</span>
                  <input
                    type="text"
                    value={day}
                    readOnly
                    className={`${EXCEL_INPUT} !py-2 bg-[#F3F4F6] sm:!py-1.5`}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-[#E5E7EB] p-2.5 sm:p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-[#1F2937]">Grades</p>
                <button
                  type="button"
                  onClick={handleAddCustomGrade}
                  className="text-[11px] font-semibold text-[#217346]"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="grid grid-cols-[4rem_1fr_1fr_1.5rem] gap-1.5 px-0.5 text-[10px] font-semibold text-[#6B7280]">
                  <span>Grade</span>
                  <span>Qty</span>
                  <span>Price</span>
                  <span />
                </div>
                {grades.map((g) => (
                  <div key={g.id} className="grid grid-cols-[4rem_1fr_1fr_1.5rem] items-center gap-1.5">
                    <span className="truncate text-[11px] font-semibold text-[#217346]">{g.name}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={g.quantity === "" || g.quantity === 0 ? "" : g.quantity}
                      onChange={(e) => handleGradeQtyChange(g.id, e.target.value)}
                      className={`${EXCEL_INPUT} !py-2 font-semibold sm:!py-1.5`}
                      placeholder="Qty"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={g.price === 0 ? "" : g.price}
                      onChange={(e) => handleGradePriceChange(g.id, e.target.value)}
                      className={`${EXCEL_INPUT} !py-2 font-semibold sm:!py-1.5`}
                      placeholder="₹"
                    />
                    {grades.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveGrade(g.id)}
                        className="text-center text-[12px] font-bold text-red-500"
                        aria-label={`Remove ${g.name}`}
                      >
                        ✕
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
              </div>

              <p className="text-right text-[11px] font-bold text-[#1F2937]">
                {totalQty} {productUnit} · ₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[#E5E7EB] pt-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/farmer/manager/orders")}
              className={`${EXCEL_BTN} !min-h-10 w-full sm:w-auto`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || farmerProducts.length === 0}
              className={`${EXCEL_BTN_PRIMARY} !min-h-10 w-full sm:w-auto`}
            >
              {submitting ? "Saving…" : "Save Order"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
