import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getManagerFarmerById,
  getManagerFarmerOrders,
  getManagerFarmerProducts,
  getHarvestOrders,
  updateManagerFarmerOrder,
} from "../../api/farmerApi";
import StatCard from "../../components/ui/StatCard";
import LoadingState from "../../components/ui/LoadingState";
import ProductGradeChart from "../../components/products/ProductGradeChart";
import {
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_SELECT,
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
} from "../../utils/excelStyles";

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function getDayName(dateStr) {
  if (!dateStr) return "Today";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const d = new Date(dateStr);
  return isNaN(d.getDay()) ? "Today" : days[d.getDay()];
}

export default function ManagerFarmerEarningsSpreadsheetPage() {
  const { farmerId } = useParams();

  const [farmer, setFarmer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [farmerRes, ordersRes, prodsRes, harvestOrdersRes] = await Promise.all([
          getManagerFarmerById(farmerId).catch(() => null),
          getManagerFarmerOrders(farmerId).catch(() => []),
          getManagerFarmerProducts(farmerId).catch(() => []),
          getHarvestOrders().catch(() => []),
        ]);

        setFarmer(farmerRes);

        const foList = Array.isArray(ordersRes) ? ordersRes : [];
        const hoList = Array.isArray(harvestOrdersRes)
          ? harvestOrdersRes.filter((ho) => ho.farmerId === farmerId || ho.farmerName === farmerRes?.name)
          : [];
        const prodList = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.products || []);

        // Combine all orders deduplicated by id
        const idMap = new Map();
        [...hoList, ...foList].forEach((o) => {
          const key = o.id || o.orderId || String(o._id);
          if (key && !idMap.has(key)) {
            idMap.set(key, o);
          }
        });

        const combined = Array.from(idMap.values()).sort(
          (a, b) =>
            new Date(b.harvestDate || b.date || b.orderDate || b.createdAt || 0) -
            new Date(a.harvestDate || a.date || a.orderDate || a.createdAt || 0)
        );

        setOrders(combined);
        setProducts(prodList);
      } catch (err) {
        toast.error(err?.message || "Failed to load farmer earnings statement");
      } finally {
        setLoading(false);
      }
    })();
  }, [farmerId]);

  // Handle live row updates when edited via spreadsheet
  const handleUpdateRow = async (updatedPayload) => {
    const orderId = updatedPayload.id || updatedPayload.orderId;
    try {
      const res = await updateManagerFarmerOrder(farmerId, orderId, updatedPayload);
      toast.success("Statement record updated successfully!");

      setOrders((prev) =>
        prev.map((o) => {
          const key = o.id || o.orderId || String(o._id);
          if (key === orderId || key === String(orderId)) {
            return {
              ...o,
              ...res,
              harvestDate: updatedPayload.harvestDate,
              date: updatedPayload.date,
              day: updatedPayload.day,
              weekday: updatedPayload.weekday,
              productName: updatedPayload.productName,
              unit: updatedPayload.unit,
              rejectionQty: updatedPayload.rejectionQty,
              status: updatedPayload.status,
              grades: updatedPayload.grades,
              products: updatedPayload.products,
              totalAmount: updatedPayload.totalAmount,
              amount: updatedPayload.totalAmount,
              totalQuantity: updatedPayload.totalQuantity,
            };
          }
          return o;
        })
      );
    } catch (err) {
      toast.error(err?.message || "Failed to update record in database");
      throw err;
    }
  };

  // Filter orders by selected product
  const filteredOrders = useMemo(() => {
    if (selectedProductId === "ALL") return orders;
    const target = selectedProductId.toLowerCase();

    return orders.filter((o) => {
      const pName = (o.productName || o.products?.[0]?.name || "").toLowerCase();
      return (
        o.productId === selectedProductId ||
        pName === target ||
        (o.products && o.products.some((p) => (p.name || "").toLowerCase() === target || p.id === selectedProductId))
      );
    });
  }, [orders, selectedProductId]);

  // Unique products list from orders & product catalog
  const availableProducts = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (p.name) map.set(p.name.toLowerCase(), p);
    });
    orders.forEach((o) => {
      const pName = o.productName || o.products?.[0]?.name;
      if (pName && !map.has(pName.toLowerCase())) {
        map.set(pName.toLowerCase(), { name: pName, category: o.category || "Produce" });
      }
    });
    return Array.from(map.values());
  }, [products, orders]);

  // Format rows for ProductGradeChart
  const chartRows = useMemo(() => {
    return filteredOrders.map((ho, idx) => {
      const firstProd = ho.products?.[0];
      const pName = ho.productName || firstProd?.name || "Farm Produce";
      const unit = ho.unit || firstProd?.unit || "Kg";
      const rawDate = ho.date || ho.harvestDate || ho.orderDate || ho.createdAt || "";
      const weekday = ho.day || ho.weekday || getDayName(rawDate);

      // Grades mapping
      const gradesList =
        ho.grades && ho.grades.length > 0
          ? ho.grades
          : firstProd?.grades && firstProd.grades.length > 0
          ? firstProd.grades
          : firstProd?.grade
          ? [{ name: firstProd.grade, label: firstProd.grade, quantity: firstProd.quantity, rate: firstProd.price || 0 }]
          : [];

      return {
        id: ho.id || ho.orderId || ho._id || idx,
        orderId: ho.id || ho.orderId || ho._id || idx,
        srNo: idx + 1,
        date: rawDate,
        weekday: weekday,
        productName: pName,
        unit: unit,
        status: ho.status || "Confirmed",
        grades: gradesList.map((g) => ({
          name: g.name || g.label,
          quantity: Number(g.quantity || 0),
          rate:
            g.rate !== null && g.rate !== undefined && g.rate !== ""
              ? Number(g.rate)
              : g.price !== null && g.price !== undefined && g.price !== ""
              ? Number(g.price)
              : null,
        })),
        rejectionQty: Number(ho.rejectionQty || 0),
      };
    });
  }, [filteredOrders]);

  // Calculate earnings dynamically across the displayed orders
  const totalEarnings = useMemo(() => {
    return filteredOrders.reduce((sum, ho) => {
      if (ho.totalAmount || ho.amount) {
        return sum + Number(ho.totalAmount || ho.amount || 0);
      }
      const gradeSum = (ho.grades || []).reduce((gSum, g) => {
        const q = Number(g.quantity) || 0;
        const r = Number(g.rate || g.price) || 0;
        return gSum + q * r;
      }, 0);
      return sum + gradeSum;
    }, 0);
  }, [filteredOrders]);

  const deposited = Math.round(totalEarnings * 0.7); // 70% deposited
  const pendingBalance = totalEarnings - deposited;   // 30% pending balance

  if (loading) return <LoadingState rows={6} />;

  if (!farmer) {
    return (
      <div className={`${EXCEL_PANEL} p-8 text-center text-xs text-[#DC2626] space-y-3`}>
        <p className="font-bold text-sm">Farmer not found</p>
        <Link to="/farmer/manager/earnings" className={`${EXCEL_BTN_PRIMARY} inline-block px-3 py-1.5`}>
          ← Back to Farmers Earnings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. Top Navigation & Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            to="/farmer/manager/earnings"
            className={`${EXCEL_BTN} inline-flex items-center gap-1 font-bold text-[#217346] hover:bg-[#E8F5E9]`}
          >
            ← Back to All Farmers
          </Link>
          <span className="text-gray-400">/</span>
          <span className="font-extrabold text-[#1F2937] text-sm">
            {farmer.name} — Earning Statement
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/farmer/manager/farmers/${farmer.id}`}
            className="border border-[#D4D4D4] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F2937] hover:bg-gray-50"
          >
            View Profile →
          </Link>
        </div>
      </div>

      {/* 2. Farmer Information Banner */}
      <div className={`${EXCEL_PANEL} p-4 bg-gradient-to-r from-[#F7FAF7] to-white border-l-4 border-l-[#217346]`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center border border-[#217346] bg-[#E8F5E9] font-bold text-xl text-[#217346] rounded-xs">
              👨‍🌾
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-[#1F2937]">{farmer.name}</h1>
                <span className="rounded bg-[#217346] px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                  FARMER: {farmer.name.toUpperCase()}
                </span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                  {farmer.farmerCode || "CODE-FRM"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#6B7280]">
                Mobile: <span className="font-bold text-gray-800">{farmer.mobile}</span> · Location: {farmer.farmLocation || farmer.address?.village || "Nashik"} · Farm: {farmer.farmName || "Organic Farm"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Summary Metric Cards */}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Statement Earnings" value={formatCurrency(totalEarnings)} />
        <StatCard title="Deposited (70%)" value={formatCurrency(deposited)} />
        <StatCard title="Pending Balance (30%)" value={formatCurrency(pendingBalance)} />
        <StatCard title="Total Harvest Orders" value={filteredOrders.length} />
      </div>

      {/* 4. Product-Wise Earning Spreadsheet Section (Photo Replica) */}
      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-3 bg-[#F2F8F3] px-3 py-2 border-b border-[#D4D4D4]`}>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-extrabold text-[#1F2937] text-sm">Product-Wise Earning Spreadsheet</span>
            <span className="rounded bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#217346]">
              {filteredOrders.length} Orders
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <span className="text-xs font-semibold text-[#6B7280] whitespace-nowrap">Select Product:</span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className={`${EXCEL_SELECT} text-black bg-white border border-[#D4D4D4] py-1.5 px-2.5 font-medium rounded-xs shadow-xs focus:border-[#217346]`}
            >
              <option value="ALL">All Products ({orders.length})</option>
              {availableProducts.map((item) => (
                <option key={item.id || item._id || item.name} value={item.name}>
                  {item.name} {item.category ? `(${item.category})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. Daily Chart Spreadsheet Table with Click-to-Edit */}
        <div className="p-3">
          <ProductGradeChart
            productName={selectedProductId !== "ALL" ? selectedProductId : "All Products"}
            showFarmerCol={false}
            onUpdateRow={handleUpdateRow}
            rows={chartRows}
            summary={{
              totalRupees: totalEarnings,
              deposited: deposited,
              balance: pendingBalance,
            }}
          />
        </div>
      </section>
    </div>
  );
}
