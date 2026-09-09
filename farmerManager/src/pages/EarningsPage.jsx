import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { getEarnings, getProducts, getHarvestOrders } from "../api/farmerApi";
import StatCard from "../components/ui/StatCard";
import LoadingState from "../components/ui/LoadingState";
import ProductGradeChart from "../components/products/ProductGradeChart";
import { EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL, EXCEL_PANEL_HEAD, EXCEL_SELECT } from "../utils/excelStyles";

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function EarningsPage() {
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [harvestOrders, setHarvestOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [earningsRes, productsRes, harvestOrdersRes] = await Promise.all([
          getEarnings().catch(() => ({ totalEarnings: 0, availableBalance: 0, pendingPayments: 0, transactions: [] })),
          getProducts().catch(() => []),
          getHarvestOrders().catch(() => []),
        ]);

        const prodList = Array.isArray(productsRes) ? productsRes : (productsRes?.products || []);
        const hoList = Array.isArray(harvestOrdersRes) ? harvestOrdersRes : [];

        const allCombinedOrders = [...hoList].sort(
          (a, b) => new Date(b.harvestDate || b.date || b.createdAt || 0) - new Date(a.harvestDate || a.date || a.createdAt || 0)
        );

        setData(earningsRes);
        setProducts(prodList);
        setHarvestOrders(allCombinedOrders);
      } catch (err) {
        toast.error(err.message || "Failed to load earnings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const safeProducts = Array.isArray(products) ? products : [];
  const selectedProduct = safeProducts.find((p) => (p.id || p._id) === selectedProductId) || null;

  // Filter harvest orders for selected product (or ALL if none selected)
  const productHarvestOrders = useMemo(() => {
    if (!selectedProduct) return harvestOrders;
    return harvestOrders.filter(
      (ho) =>
        ho.productId === (selectedProduct.id || selectedProduct._id) ||
        ho.productName === selectedProduct.name ||
        (ho.products && ho.products.some((p) => p.name === selectedProduct.name || p.id === selectedProduct.id))
    );
  }, [harvestOrders, selectedProduct]);

  // Calculate earnings dynamically across the displayed orders
  const productTotalEarnings = useMemo(() => {
    return productHarvestOrders.reduce((sum, ho) => {
      if (ho.totalAmount || ho.amount) {
        return sum + Number(ho.totalAmount || ho.amount || 0);
      }
      const gradeSum = (ho.grades || []).reduce((gSum, g) => {
        const q = Number(g.quantity) || 0;
        const r = Number(g.rate) || 0;
        return gSum + (q * r);
      }, 0);
      return sum + gradeSum;
    }, 0);
  }, [productHarvestOrders]);

  const productDeposited = Math.round(productTotalEarnings * 0.7); // 70% deposited
  const productBalance = productTotalEarnings - productDeposited;   // 30% balance

  if (loading) return <LoadingState rows={5} />;

  return (
    <div className="space-y-4 font-sans text-xs">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Earning Statement</h1>
        <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>
          Daily Harvest Chart & dynamic produce statement (Read-Only)
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Statement Earnings" value={formatCurrency(productTotalEarnings)} />
        <StatCard title="Deposited (70%)" value={formatCurrency(productDeposited)} />
        <StatCard title="Pending Balance (30%)" value={formatCurrency(productBalance)} />
        <StatCard title="Total Harvest Orders" value={productHarvestOrders.length} />
      </div>

      {/* Product-Wise Earning Selector */}
      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2 bg-[#F2F8F3]`}>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#1F2937] text-sm">Product-Wise Earning Spreadsheet</span>
            <span className="rounded bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#217346]">
              {productHarvestOrders.length} Orders
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B7280]">Select Product:</span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className={`${EXCEL_SELECT} text-black bg-white border border-[#D4D4D4] py-1 px-2 font-medium`}
            >
              <option value="">All Products ({harvestOrders.length})</option>
              {safeProducts.map((item) => (
                <option key={item.id || item._id} value={item.id || item._id}>
                  {item.name} ({item.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-3">
          <ProductGradeChart
            productName={selectedProduct ? selectedProduct.name : "All Products"}
            rows={productHarvestOrders.length > 0 ? productHarvestOrders.map((ho, idx) => {
              const firstProd = ho.products?.[0];
              const pName = ho.productName || firstProd?.name || "Farm Produce";
              const unit = ho.unit || firstProd?.unit || "Kg";

              // Grades mapping
              const gradesList = (ho.grades && ho.grades.length > 0)
                ? ho.grades
                : (firstProd?.grades && firstProd.grades.length > 0)
                ? firstProd.grades
                : (firstProd?.grade ? [{ name: firstProd.grade, label: firstProd.grade, quantity: firstProd.quantity }] : []);

              return {
                id: ho.id || ho.orderId || ho._id || idx,
                srNo: idx + 1,
                date: ho.date || ho.harvestDate,
                weekday: ho.day || ho.weekday,
                productName: pName,
                unit: unit,
                grades: gradesList.map((g) => ({
                  name: g.name || g.label,
                  quantity: Number(g.quantity || 0),
                  rate: g.rate !== null && g.rate !== undefined && g.rate !== '' ? Number(g.rate) : null,
                })),
                rejectionQty: Number(ho.rejectionQty || 0),
              };
            }) : []}
            summary={{
              totalRupees: productTotalEarnings,
              deposited: productDeposited,
              balance: productBalance,
            }}
          />
        </div>
      </section>
    </div>
  );
}

export default EarningsPage;
