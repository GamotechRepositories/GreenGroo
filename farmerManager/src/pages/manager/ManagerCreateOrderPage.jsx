import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { getManagerFarmers, getManagerFarmerProducts, createManagerOrder, getManagerFarmerOrderById, getManagerAllHarvestOrders, updateManagerFarmerOrder } from "../../api/farmerApi";
import { formatProductBusinessId, formatCropDate } from "../../utils/cropLinks";
import CopyId from "../../components/ui/CopyId";
import { EXCEL_INPUT, EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_PANEL } from "../../utils/excelStyles";
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

function farmLabel(farmer, product) {
  const loc = farmer?.farmLocation;
  if (loc && typeof loc === "object") {
    return loc.farmAddress || [loc.village, loc.taluka, loc.district, loc.pincode].filter(Boolean).join(", ");
  }
  const geo = farmer?.farmGeo || {};
  const addr = farmer?.address && typeof farmer.address === "object" ? farmer.address : {};
  return (
    geo.farmAddress ||
    farmer?.farmAddress ||
    [geo.village || addr.village, geo.taluka || addr.taluka, geo.district || addr.district, addr.state, geo.pincode || addr.pincode]
      .filter(Boolean)
      .join(", ") ||
    (typeof loc === "string" ? loc : "") ||
    product?.farmLocation ||
    ""
  );
}

function productNameOf(item = {}) {
  return item.productName || item.name || "Farm Produce";
}

function productQty(product) {
  const gradesSum = (product?.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
  return gradesSum || Number(product?.availableQuantity ?? product?.stock ?? product?.totalQuantity ?? 0);
}

function productMatches(product, needle) {
  const n = String(needle || "").trim().toLowerCase();
  if (!n) return false;
  return [product.id, product.productId, product._id].some((v) => String(v || "").trim().toLowerCase() === n);
}

function defaultGradeRows(fallbackPrice = 0) {
  const price = Number(fallbackPrice) || 0;
  return [
    { id: "g_a", name: "Grade A", quantity: "", price, available: 0 },
    { id: "g_b", name: "Grade B", quantity: "", price, available: 0 },
    { id: "g_c", name: "Grade C", quantity: "", price, available: 0 },
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
      available: Number(g.quantity ?? g.qty ?? 0) || 0,
    }));
  }
  const total = productQty(prod);
  return defaultGradeRows(fallback).map((g, idx) => ({
    ...g,
    available: idx === 0 ? total : 0,
  }));
}

function productImageOf(product) {
  return product?.image || product?.imageUrl || product?.images?.[0] || "";
}

function toISODate(value) {
  if (!value) return getTodayISODate();
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return getTodayISODate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTimeInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return getNowTimeInput();
  const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = Number(ampm[1]);
    const min = ampm[2];
    const p = ampm[3].toUpperCase();
    if (p === "PM" && h < 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${min}`;
  }
  const m24 = raw.match(/^(\d{1,2}):(\d{2})/);
  if (m24) return `${String(Number(m24[1])).padStart(2, "0")}:${m24[2]}`;
  return getNowTimeInput();
}

function mergeGradesFromOrder(productGrades, order) {
  const fromOrder = [];
  if (Array.isArray(order?.grades) && order.grades.length) {
    order.grades.forEach((g, idx) => {
      fromOrder.push({
        name: g.label || g.name || `Grade ${idx + 1}`,
        quantity: Number(g.quantity || 0) || "",
        price: Number(g.price ?? g.rate ?? 0) || 0,
      });
    });
  } else if (Array.isArray(order?.products) && order.products.length) {
    order.products.forEach((p, idx) => {
      fromOrder.push({
        name: p.grade || p.gradeName || p.name || `Grade ${idx + 1}`,
        quantity: Number(p.quantity || 0) || "",
        price: Number(p.price || p.rate || 0) || 0,
      });
    });
  }
  const leftover = new Map(fromOrder.map((g) => [String(g.name).trim().toLowerCase(), g]));
  const merged = (productGrades || []).map((g) => {
    const hit = leftover.get(String(g.name).trim().toLowerCase());
    if (!hit) return g;
    leftover.delete(String(g.name).trim().toLowerCase());
    return { ...g, quantity: hit.quantity, price: hit.price || g.price };
  });
  let i = 0;
  leftover.forEach((g) => {
    merged.push({ id: `ord_${i++}`, name: g.name, quantity: g.quantity, price: g.price, available: 0 });
  });
  return merged.length ? merged : productGrades;
}

export default function ManagerCreateOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetFarmerId = searchParams.get("farmerId") || "";
  const presetProductId = searchParams.get("productId") || "";
  const editOrderId = searchParams.get("edit") || "";
  const copyOrderId = searchParams.get("copy") || "";
  const sourceOrderId = editOrderId || copyOrderId;
  const isEdit = Boolean(editOrderId);
  const isCopy = Boolean(copyOrderId) && !isEdit;
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [sourceOrder, setSourceOrder] = useState(null);
  const [orderDate, setOrderDate] = useState(getTodayISODate());
  const [pickupDate, setPickupDate] = useState(getTodayISODate());
  const [pickupTime, setPickupTime] = useState(getNowTimeInput());
  const [day, setDay] = useState(dayNameFromISO(getTodayISODate()));
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productUnit, setProductUnit] = useState("Kg");
  const [grades, setGrades] = useState(() => defaultGradeRows(0));

  useEffect(() => {
    if (!sourceOrderId) return;
    let cancelled = false;
    (async () => {
      try {
        if (presetFarmerId) {
          const o = await getManagerFarmerOrderById(presetFarmerId, sourceOrderId);
          if (!cancelled) setSourceOrder(o);
          return;
        }
      } catch {
        /* fall through */
      }
      try {
        const data = await getManagerAllHarvestOrders();
        const list = Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : [];
        const found = list.find((o) => String(o.id || o.orderId) === String(sourceOrderId));
        if (!cancelled) setSourceOrder(found || null);
      } catch {
        if (!cancelled) setSourceOrder(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sourceOrderId, presetFarmerId]);

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
          const orderPid =
            sourceOrder?.productId || sourceOrder?.products?.[0]?.productId || sourceOrder?.products?.[0]?.id || "";
          const match =
            pList.find((p) => productMatches(p, orderPid || presetProductId)) ||
            pList.find((p) => productMatches(p, presetProductId)) ||
            pList[0];
          setSelectedProductId(match.id || match.productId);
          setProductUnit(sourceOrder?.unit || match.unit || "Kg");
          const base = gradesFromProduct(match);
          setGrades(sourceOrder ? mergeGradesFromOrder(base, sourceOrder) : base);
        } else {
          setSelectedProductId("");
          setGrades(defaultGradeRows(0));
        }
      })
      .catch(() => setFarmerProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [selectedFarmerId, sourceOrder]);

  useEffect(() => {
    if (!sourceOrder) return;
    if (farmers.length) {
      const fid = sourceOrder.farmerId;
      const match = farmers.find((f) => f.id === fid || f.farmerId === fid);
      if (match) setSelectedFarmerId(match.id);
    }
    const iso = toISODate(sourceOrder.pickupDate || sourceOrder.requiredDate || sourceOrder.harvestDate);
    setPickupDate(iso);
    setDay(sourceOrder.day || dayNameFromISO(iso));
    setPickupTime(toTimeInput(sourceOrder.pickupTime || sourceOrder.harvestTime));
    setOrderDate(toISODate(sourceOrder.orderDate || sourceOrder.harvestDate || iso));
  }, [sourceOrder, farmers]);

  const handleProductChange = (prodId) => {
    setSelectedProductId(prodId);
    const prod = farmerProducts.find((p) => productMatches(p, prodId));
    if (prod) {
      if (prod.unit) setProductUnit(prod.unit);
      setGrades(gradesFromProduct(prod));
    }
  };

  const selectedFarmer = farmers.find((f) => f.id === selectedFarmerId);
  const selectedProduct = farmerProducts.find((p) => productMatches(p, selectedProductId));
  const selectedProductName = productNameOf(selectedProduct || {});
  const selectedProductQty = productQty(selectedProduct || {});
  const selectedProductImg = productImageOf(selectedProduct || {});
  const selectedBusinessId = selectedProduct ? formatProductBusinessId(selectedProduct) : "";

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
      { id: `custom_${Date.now()}`, name: name.trim(), quantity: "", price: fallback, available: 0 },
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

    const orderProductId =
      selectedProduct?.productId || selectedProduct?.id || selectedProductId;
    const orderProductName = selectedProductName || "Produce";

    const orderProducts = grades
      .filter((g) => Number(g.quantity) > 0)
      .map((g) => {
        const qty = Number(g.quantity);
        const price = Number(g.price) || 0;
        return {
          id: selectedProduct?.id || orderProductId,
          productId: orderProductId,
          name: orderProductName,
          variety: selectedProduct?.variety || "",
          grade: g.name,
          quantity: qty,
          unit: productUnit,
          price,
          total: qty * price,
        };
      });

    setSubmitting(true);
    try {
      const payload = {
        productId: orderProductId,
        productName: orderProductName,
        customer: {
          name: "Daily Harvest Statement",
          phone: selectedFarmer?.mobile || "",
          address: farmLabel(selectedFarmer) || "Farm Gate",
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
        rejectionQty: Number(sourceOrder?.rejectionQty || 0),
        rejectionReason: sourceOrder?.rejectionReason || "",
        status: isEdit ? sourceOrder?.status || "NEW" : "NEW",
        paymentStatus: isEdit ? sourceOrder?.paymentStatus || "Pending" : "Pending",
        deliveryStatus: isEdit ? sourceOrder?.deliveryStatus || "Pending" : "Pending",
        variety: selectedProduct?.variety || sourceOrder?.variety || "",
        category: selectedProduct?.category || sourceOrder?.category || "",
      };
      if (isEdit) {
        await updateManagerFarmerOrder(selectedFarmerId, editOrderId, payload);
        toast.success("Order updated");
      } else {
        await createManagerOrder(selectedFarmerId, payload);
        toast.success(isCopy ? "Order copied" : `Order created for ${selectedFarmer?.name}`);
      }
      navigate("/manager/orders");
    } catch (err) {
      toast.error(err?.message || (isEdit ? "Failed to update order" : "Failed to create order"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-3 font-sans text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <Link to="/manager/orders" className="text-[11px] text-[#6B7280] hover:text-[#217346]">
            ← Orders
          </Link>
          <h1 className="text-base font-bold text-[#1F2937]">
            {isEdit ? "Edit Harvest Order" : isCopy ? "Copy Harvest Order" : "Create Harvest Order"}
          </h1>
        </div>
        <button type="button" onClick={() => navigate("/manager/orders")} className={`${EXCEL_BTN} !py-1`}>
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
                disabled={isEdit}
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
              ) : farmerProducts.length === 0 ? (
                <p className="py-2 text-[#DC2626]">No products for this farmer</p>
              ) : (
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className={`${EXCEL_INPUT} !py-2 font-semibold sm:!py-1.5`}
                  required
                  disabled={isEdit}
                >
                  {farmerProducts.map((p) => {
                    const qty = productQty(p);
                    const variety = p.variety ? ` (${p.variety})` : "";
                    return (
                      <option key={p.id || p.productId} value={p.id || p.productId}>
                        {productNameOf(p)}
                        {variety}
                        {qty ? ` · ${qty.toLocaleString("en-IN")} ${p.unit || "Kg"}` : ""}
                      </option>
                    );
                  })}
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

          {selectedProduct ? (
            <section className={`${EXCEL_PANEL} !rounded-lg border border-[#E5E7EB] p-2.5 sm:p-3`}>
              <p className="mb-2 text-[11px] font-bold text-[#1F2937]">Product details</p>
              <div className="flex items-start gap-3">
                {selectedProductImg ? (
                  <img
                    src={selectedProductImg}
                    alt={selectedProductName}
                    className="h-14 w-14 shrink-0 rounded-lg border border-[#D4D4D4] object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#E8F5E9] text-lg font-bold text-[#217346]">
                    {String(selectedProductName || "P").charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-[13px] font-bold text-[#1F2937]">{selectedProductName}</p>
                    {selectedProduct.status ? (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          selectedProduct.status === "Active" || selectedProduct.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {selectedProduct.status}
                      </span>
                    ) : null}
                  </div>
                  <CopyId value={selectedBusinessId} className="mt-0.5" textClassName="font-mono text-[10px] text-emerald-700" breakAll />
                  <p className="mt-1 text-[11px] text-[#6B7280]">
                    {[
                      selectedProduct.variety ? `Variety ${selectedProduct.variety}` : null,
                      [selectedProduct.category, selectedProduct.subCategory].filter(Boolean).join(" · ") || null,
                      selectedFarmer?.name ? `Farmer ${selectedFarmer.name}` : null,
                    ]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-md bg-[#F8FAF8] px-2 py-1.5">
                  <p className="text-[10px] font-semibold text-[#6B7280]">Available</p>
                  <p className="text-[12px] font-bold text-[#217346]">
                    {Number(selectedProductQty || 0).toLocaleString("en-IN")} {productUnit}
                  </p>
                </div>
                <div className="rounded-md bg-[#F8FAF8] px-2 py-1.5">
                  <p className="text-[10px] font-semibold text-[#6B7280]">Harvest</p>
                  <p className="text-[12px] font-bold text-[#1F2937]">
                    {formatCropDate(selectedProduct.harvestDate) || "—"}
                  </p>
                </div>
                <div className="rounded-md bg-[#F8FAF8] px-2 py-1.5">
                  <p className="text-[10px] font-semibold text-[#6B7280]">Unit</p>
                  <p className="text-[12px] font-bold text-[#1F2937]">{productUnit}</p>
                </div>
                <div className="rounded-md bg-[#F8FAF8] px-2 py-1.5">
                  <p className="text-[10px] font-semibold text-[#6B7280]">Farm</p>
                  <p className="truncate text-[12px] font-bold text-[#1F2937]">
                    {farmLabel(selectedFarmer, selectedProduct) || "—"}
                  </p>
                </div>
              </div>
              {grades.some((g) => Number(g.available) > 0) ? (
                <p className="mt-2 text-[11px] text-[#6B7280]">
                  Grade stock:{" "}
                  <span className="font-semibold text-[#1F2937]">
                    {grades
                      .filter((g) => Number(g.available) > 0)
                      .map((g) => `${g.name} ${Number(g.available).toLocaleString("en-IN")} ${productUnit}`)
                      .join(" · ")}
                  </span>
                </p>
              ) : null}
            </section>
          ) : null}

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
                  <span>Order qty</span>
                  <span>Price</span>
                  <span />
                </div>
                {grades.map((g) => {
                  const ordered = Number(g.quantity || 0);
                  const overAvail = Number(g.available) > 0 && ordered > Number(g.available);
                  return (
                    <div key={g.id} className="grid grid-cols-[4rem_1fr_1fr_1.5rem] items-start gap-1.5">
                      <div className="min-w-0 pt-2">
                        <span className="block truncate text-[11px] font-semibold text-[#217346]">{g.name}</span>
                        {Number(g.available) > 0 ? (
                          <span className="block text-[9px] text-[#6B7280]">
                            Avail {Number(g.available).toLocaleString("en-IN")}
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={g.quantity === "" || g.quantity === 0 ? "" : g.quantity}
                          onChange={(e) => handleGradeQtyChange(g.id, e.target.value)}
                          className={`${EXCEL_INPUT} !py-2 font-semibold sm:!py-1.5 ${overAvail ? "!border-amber-400" : ""}`}
                          placeholder="Qty"
                        />
                        {overAvail ? (
                          <p className="mt-0.5 text-[9px] text-amber-600">Over available</p>
                        ) : null}
                      </div>
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
                          className="pt-2 text-center text-[12px] font-bold text-red-500"
                          aria-label={`Remove ${g.name}`}
                        >
                          ✕
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-right text-[11px] font-bold text-[#1F2937]">
                {totalQty} {productUnit} · ₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[#E5E7EB] pt-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/manager/orders")}
              className={`${EXCEL_BTN} !min-h-10 w-full sm:w-auto`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || farmerProducts.length === 0}
              className={`${EXCEL_BTN_PRIMARY} !min-h-10 w-full sm:w-auto`}
            >
              {submitting ? "Saving…" : isEdit ? "Save Changes" : isCopy ? "Save Copy" : "Save Order"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
