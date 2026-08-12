import { useEffect, useState } from "react";
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
        setData(earningsRes);
        setProducts(prodList);
        setHarvestOrders(hoList);
        if (prodList.length > 0) {
          setSelectedProductId(prodList[0].id || prodList[0]._id);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load earnings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState rows={5} />;

  const safeProducts = Array.isArray(products) ? products : [];
  const selectedProduct = safeProducts.find((p) => (p.id || p._id) === selectedProductId) || safeProducts[0];

  // Filter harvest orders for selected product
  const productHarvestOrders = harvestOrders.filter((ho) => ho.productId === (selectedProduct?.id || selectedProduct?._id) || ho.productName === selectedProduct?.name);

  // Calculate earnings dynamically for the selected product
  const productTotalEarnings = productHarvestOrders.reduce((sum, ho) => {
    return sum + (ho.grades || []).reduce((gSum, g) => {
      const q = Number(g.quantity) || 0;
      const r = Number(g.rate) || 0;
      return gSum + (q * r);
    }, 0);
  }, 0);
  const productDeposited = Math.round(productTotalEarnings * 0.7); // 70% deposited
  const productBalance = productTotalEarnings - productDeposited;   // 30% balance

  return (
    <div className="space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Earning Statement</h1>
        <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>
          Product-wise accounting spreadsheet and earnings statement. (Read-Only)
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Product Earnings" value={formatCurrency(productTotalEarnings)} />
        <StatCard title="Deposited (70%)" value={formatCurrency(productDeposited)} />
        <StatCard title="Pending Balance (30%)" value={formatCurrency(productBalance)} />
        <StatCard title="Total Products" value={safeProducts.length} />
      </div>

      {/* Product-Wise Earning Selector */}
      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
          <span>Product-Wise Earning Spreadsheet</span>
          {safeProducts.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6B7280]">Select Product:</span>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className={EXCEL_SELECT}
              >
                {safeProducts.map((item) => (
                  <option key={item.id || item._id} value={item.id || item._id}>
                    {item.name} ({item.category})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {selectedProduct ? (
          <div className="p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#1F2937]">{selectedProduct.name}</h3>
                <p className="text-xs text-[#6B7280]">Category: {selectedProduct.category} · Location: {selectedProduct.farmLocation || "Sangamner"}</p>
              </div>
            </div>

            <ProductGradeChart
              rows={productHarvestOrders.length > 0 ? productHarvestOrders.map((ho, idx) => ({
                id: ho.id || ho._id || idx,
                srNo: idx + 1,
                date: ho.date,
                weekday: ho.day,
                unit: ho.unit || "Kg",
                grades: (ho.grades || []).map((g) => ({
                  name: g.name,
                  quantity: Number(g.quantity || 0),
                  rate: g.rate !== null && g.rate !== undefined && g.rate !== '' ? Number(g.rate) : null,
                })),
                rejectionQty: Number(ho.rejectionQty || 0),
              })) : []}
              summary={{
                totalRupees: 0,
                deposited: 0,
                balance: 0,
              }}
            />
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#6B7280]">
            No products found. Add products to view product-wise earnings.
          </div>
        )}
      </section>
    </div>
  );
}

export default EarningsPage;
