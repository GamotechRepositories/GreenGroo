import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getDashboardCharts, getHarvestOrders } from "../api/farmerApi";
import StatCard from "../components/ui/StatCard";
import LoadingState from "../components/ui/LoadingState";
import ProductGradeChart from "../components/products/ProductGradeChart";
import DashboardMarketPricesWidget from "../components/market/DashboardMarketPricesWidget";
import {
  EXCEL_BTN,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_SELECT,
} from "../utils/excelStyles";

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function DashboardPage() {
  const [data, setData] = useState(null);
  const [harvestOrders, setHarvestOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [result, hoList] = await Promise.all([
          getDashboardCharts().catch(() => ({ stats: {}, all: { rows: [] }, products: [] })),
          getHarvestOrders().catch(() => []),
        ]);
        setData(result);
        setHarvestOrders(hoList);
        if (result.products && result.products.length > 0) {
          setSelectedProductId(result.products[0].productId);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState rows={6} />;
  if (!data) return null;

  const { stats, all, products = [] } = data;
  const selectedProduct =
    products.find((item) => item.productId === selectedProductId) || products[0] || null;

  const totalHarvestOrders = harvestOrders.length;
  const pendingHarvest = harvestOrders.filter((h) => h.status === "Pending" || h.status === "In Progress").length;
  const totalQuantity = stats.availableStock || stats.totalQuantity || "0 Kg";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className={EXCEL_PAGE_TITLE}>Farmer Dashboard</h1>
        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Dynamic Backend Connected
        </span>
      </div>

      {/* Dynamic Requirement Cards */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Products" value={stats.totalProducts || products.length || 0} />
        <StatCard title="Total Harvest Orders" value={totalHarvestOrders} />
        <StatCard title="Pending Harvest" value={pendingHarvest} />
        <StatCard title="Total Quantity" value={totalQuantity} />
        <StatCard title="Total Earnings" value={formatCurrency(stats.totalEarnings || 0)} />
        <StatCard title="Pending Earnings" value={formatCurrency(stats.pendingEarnings || stats.pendingPayments || 0)} />
      </div>

      {/* Live Mandi Market Prices Widget */}
      <DashboardMarketPricesWidget />

      <section className={`${EXCEL_PANEL} p-3`}>
        <ProductGradeChart rows={all.rows} summary={all.summary} title="All Products Summary" />
      </section>

      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
          <span>Product Wise</span>
          {products.length > 0 ? (
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className={EXCEL_SELECT}
            >
              {products.map((item) => (
                <option key={item.productId} value={item.productId}>
                  {item.productName}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {products.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-[#6B7280]">No product chart data available.</div>
        ) : selectedProduct ? (
          <div className="p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-[#1F2937]">{selectedProduct.productName}</span>
                {selectedProduct.category ? (
                  <span className="text-[#6B7280]">{selectedProduct.category}</span>
                ) : null}
              </div>
              <Link to={`/farmer/products/${selectedProduct.productId}/edit`} className={EXCEL_BTN}>
                Edit Product
              </Link>
            </div>
            <ProductGradeChart rows={selectedProduct.rows} summary={selectedProduct.summary} />
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default DashboardPage;
