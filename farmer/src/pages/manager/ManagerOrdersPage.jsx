import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getManagerAllHarvestOrders, getManagerAllProducts } from "../../api/farmerApi";
import { formatProductBusinessId } from "../../utils/cropLinks";
import { isPendingProductApproval } from "../../utils/productActions";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";

const ACTION_BTN =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 whitespace-nowrap hover:bg-slate-50 sm:h-7 sm:rounded-md sm:px-2 sm:text-[10px]";

const TAB_STATEMENTS = "statements";
const TAB_BY_PRODUCT = "by-product";

function isBusinessProductId(value) {
  const id = String(value || "").trim();
  return Boolean(id) && !/^[a-f0-9]{24}$/i.test(id);
}

function productKeyOf(item = {}) {
  const id = String(item.productId || item.id || "").trim();
  if (isBusinessProductId(id)) return id;
  return String(item.productName || item.name || "Produce").trim().toLowerCase();
}

function productNameOf(item = {}) {
  return item.productName || item.name || "Farm Produce";
}

function isAvailableForOrder(product) {
  const status = String(product?.status || "").trim();
  if (!status) return true;
  if (isPendingProductApproval(status)) return false;
  if (status === "Draft" || status === "Rejected" || status === "Paused") return false;
  return true;
}

function orderCreatePath(product) {
  const params = new URLSearchParams({
    farmerId: product.farmerId || "",
    productId: product.id || product.productId || "",
  });
  return `/farmer/manager/orders/create?${params.toString()}`;
}

function productQty(product) {
  const gradesSum = (product.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
  return gradesSum || Number(product.availableQuantity ?? product.stock ?? 0);
}

function productFarmersPath(product) {
  const key = productKeyOf(product);
  const params = new URLSearchParams({ name: productNameOf(product) });
  const productId = product.productId || product.id || "";
  if (productId) params.set("productId", productId);
  return `/farmer/manager/orders/product/${encodeURIComponent(key)}/farmers?${params.toString()}`;
}

function orderProductEntry(order) {
  const first = Array.isArray(order.products) && order.products.length > 0 ? order.products[0] : {};
  const productId = [order.productId, first.productId, first.id].find((v) => isBusinessProductId(v)) || "";
  const qtyFromGrades = (order.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
  const qtyFromProducts = (order.products || []).reduce((s, p) => s + Number(p.quantity || 0), 0);
  return {
    productId,
    productName: order.productName || first.name || "Farm Produce",
    quantity: Number(order.totalQuantity || 0) || qtyFromGrades || qtyFromProducts,
    amount: Number(order.totalAmount || order.amount || 0),
    unit: order.unit || first.unit || "Kg",
    category: order.category || first.category || "",
  };
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold sm:min-h-0 sm:flex-none sm:rounded-md sm:px-3 sm:text-xs ${
        active ? "bg-[#217346] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function ManagerOrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === TAB_BY_PRODUCT ? TAB_BY_PRODUCT : TAB_STATEMENTS;
  const [farmers, setFarmers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const setTab = (next) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next === TAB_STATEMENTS) nextParams.delete("tab");
    else nextParams.set("tab", next);
    setSearchParams(nextParams, { replace: true });
    setQ("");
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [harvestData, productData] = await Promise.all([
          getManagerAllHarvestOrders().catch(() => ({ farmers: [], orders: [] })),
          getManagerAllProducts().catch(() => ({ farmers: [], products: [] })),
        ]);
        setFarmers(
          Array.isArray(harvestData?.farmers)
            ? harvestData.farmers
            : Array.isArray(productData?.farmers)
              ? productData.farmers
              : []
        );
        setOrders(Array.isArray(harvestData?.orders) ? harvestData.orders : []);
        setProducts(Array.isArray(productData?.products) ? productData.products : []);
      } catch {
        setFarmers([]);
        setOrders([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const productRows = useMemo(() => {
    const map = new Map();
    const catalog = new Map();

    const ensure = (key, seed = {}) => {
      if (!map.has(key)) {
        map.set(key, {
          key,
          productId: seed.productId || "",
          productName: seed.productName || "Farm Produce",
          category: seed.category || "",
          unit: seed.unit || "Kg",
          farmerId: seed.farmerId || "",
          farmerName: seed.farmerName || "",
          orderCount: 0,
          totalVolume: 0,
          totalAmount: 0,
          farmerIds: new Set(),
        });
      }
      return map.get(key);
    };

    products.forEach((p) => {
      const key = productKeyOf(p);
      catalog.set(key, p);
      if (p.farmerId) {
        catalog.set(`${p.farmerId}:${String(productNameOf(p)).toLowerCase()}`, p);
      }
    });

    orders.forEach((o) => {
      const p = orderProductEntry(o);
      const catalogHit =
        (isBusinessProductId(p.productId) && catalog.get(p.productId)) ||
        catalog.get(`${o.farmerId}:${String(p.productName || "").toLowerCase()}`) ||
        null;
      const productId = p.productId || catalogHit?.productId || catalogHit?.id || "";
      const productName = p.productName || productNameOf(catalogHit || {});
      const key = productKeyOf({ productId, productName, id: productId });
      const row = ensure(key, {
        productId,
        productName,
        category: p.category || catalogHit?.category || "",
        unit: p.unit || catalogHit?.unit || "Kg",
        farmerId: o.farmerId || catalogHit?.farmerId || "",
        farmerName: o.farmerName || catalogHit?.farmerName || farmers.find((f) => f.id === o.farmerId)?.name || "",
      });
      row.orderCount += 1;
      row.totalVolume += Number(p.quantity || 0);
      row.totalAmount += Number(p.amount || 0);
      if (o.farmerId) row.farmerIds.add(o.farmerId);
      if (!row.productId && productId) row.productId = productId;
      if (!row.farmerName && o.farmerName) row.farmerName = o.farmerName;
    });

    return Array.from(map.values())
      .filter((row) => row.orderCount > 0)
      .map((row) => ({
        ...row,
        farmerLabel:
          row.farmerIds.size <= 1
            ? row.farmerName || farmers.find((f) => f.id === [...row.farmerIds][0])?.name || "—"
            : `${row.farmerIds.size} farmers`,
      }))
      .sort((a, b) => {
        if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
        return String(a.productName).localeCompare(String(b.productName));
      });
  }, [products, orders, farmers]);

  const availableProducts = useMemo(() => {
    const query = q.toLowerCase().trim();
    return products.filter((p) => {
      if (!isAvailableForOrder(p)) return false;
      if (!query) return true;
      return (
        productNameOf(p).toLowerCase().includes(query) ||
        String(p.variety || "").toLowerCase().includes(query) ||
        String(p.category || "").toLowerCase().includes(query) ||
        String(p.productId || p.id || "").toLowerCase().includes(query)
      );
    });
  }, [products, q]);

  const filteredRows = useMemo(() => {
    const query = q.toLowerCase().trim();
    return productRows.filter((row) => {
      if (!query) return true;
      return (
        row.productName?.toLowerCase().includes(query) ||
        row.category?.toLowerCase().includes(query) ||
        row.productId?.toLowerCase().includes(query) ||
        formatProductBusinessId(row).toLowerCase().includes(query)
      );
    });
  }, [productRows, q]);

  const totalVolume = filteredRows.reduce((sum, r) => sum + r.totalVolume, 0);
  const totalAmount = filteredRows.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalOrderCount = filteredRows.reduce((sum, r) => sum + r.orderCount, 0);

  const openProductSheet = (row) => {
    const params = new URLSearchParams({ name: row.productName || "" });
    if (row.productId) params.set("productId", row.productId);
    navigate(`/farmer/manager/orders/product/${encodeURIComponent(row.key)}?${params.toString()}`);
  };

  return (
    <div className="min-w-0 space-y-2 sm:space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-bold text-[#1F2937] sm:text-xl">Order Management</h1>
          <p className="text-[11px] text-[#6B7280] sm:text-sm">
            {tab === TAB_BY_PRODUCT ? "Create harvest orders from available products" : "Harvest orders grouped by product"}
          </p>
        </div>
        <Link
          to="/farmer/manager/orders/create"
          className={`${EXCEL_BTN_PRIMARY} shrink-0 !min-h-9 px-3 py-1.5 text-[11px] sm:!min-h-10 sm:text-xs`}
        >
          + Order
        </Link>
      </div>

      <div className="flex gap-1.5">
        <TabButton active={tab === TAB_STATEMENTS} onClick={() => setTab(TAB_STATEMENTS)}>
          Statements
        </TabButton>
        <TabButton active={tab === TAB_BY_PRODUCT} onClick={() => setTab(TAB_BY_PRODUCT)}>
          By Product
        </TabButton>
      </div>

      {tab === TAB_STATEMENTS ? (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
          {[
            { label: "With Orders", value: productRows.length, color: "text-[#217346]" },
            { label: "Orders", value: totalOrderCount, color: "text-[#1F2937]" },
            { label: "Volume", value: `${totalVolume.toLocaleString("en-IN")} Kg`, color: "text-emerald-700" },
            { label: "Value", value: `₹${totalAmount.toLocaleString("en-IN")}`, color: "text-[#217346]" },
          ].map((s) => (
            <div key={s.label} className={`${EXCEL_PANEL} px-2.5 py-1.5 sm:px-3 sm:py-2`}>
              <p className="text-[10px] text-[#6B7280]">{s.label}</p>
              <p className={`truncate text-sm font-bold sm:text-base ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {[
            { label: "Available", value: availableProducts.length, color: "text-[#217346]" },
            { label: "All Products", value: products.length, color: "text-emerald-700" },
          ].map((s) => (
            <div key={s.label} className={`${EXCEL_PANEL} px-2.5 py-1.5 sm:px-3 sm:py-2`}>
              <p className="text-[10px] text-[#6B7280]">{s.label}</p>
              <p className={`text-sm font-bold sm:text-base ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search product or ID…"
        className={`${EXCEL_INPUT} w-full !py-2 !text-xs sm:max-w-xs sm:!py-1.5`}
      />

      {loading ? (
        <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>Loading…</div>
      ) : tab === TAB_BY_PRODUCT ? (
        availableProducts.length === 0 ? (
          <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>
            No available products. Approve or add a product first.
          </div>
        ) : (
          <div className={EXCEL_PANEL}>
            <div className="divide-y divide-[#E5E7EB] sm:hidden">
              {availableProducts.map((p) => {
                const id = p.id || p.productId;
                const name = productNameOf(p);
                const qty = productQty(p);
                return (
                  <div key={id} className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={productFarmersPath(p)} className="block truncate text-[13px] font-semibold text-[#217346]">
                          {name}
                        </Link>
                        <p className="mt-0.5 truncate text-[11px] text-[#9CA3AF]">
                          {[p.variety, p.category].filter(Boolean).join(" · ") || "—"}
                        </p>
                        <p className="mt-0.5 break-all font-mono text-[10px] text-emerald-700">{formatProductBusinessId(p)}</p>
                        <p className="mt-1.5 text-[13px] font-bold text-[#1F2937]">
                          {qty.toLocaleString("en-IN")} {p.unit || "Kg"}
                        </p>
                      </div>
                      <div className="flex w-[108px] shrink-0 flex-col items-stretch gap-1">
                        <span className="self-end rounded bg-green-50 px-1.5 py-0.5 text-center text-[10px] font-semibold text-green-700">
                          {p.status || "Active"}
                        </span>
                        <Link to={productFarmersPath(p)} className={`${ACTION_BTN} w-full`}>
                          View
                        </Link>
                        <Link to={orderCreatePath(p)} className={`${EXCEL_BTN_PRIMARY} !min-h-9 w-full px-2 text-[11px]`}>
                          Create Order
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                    {["Product", "Product ID", "Qty", "Status"].map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">
                        {h}
                      </th>
                    ))}
                    <th className="sticky right-0 z-20 border-l border-[#D4D4D4] bg-[#F2F2F2] px-3 py-2 text-right font-semibold text-[#6B7280]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {availableProducts.map((p) => {
                    const id = p.id || p.productId;
                    const name = productNameOf(p);
                    const qty = productQty(p);
                    return (
                      <tr key={id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                        <td className="px-3 py-2">
                          <Link to={orderCreatePath(p)} className="font-semibold text-[#217346] hover:underline">
                            {name}
                          </Link>
                          <p className="text-[10px] text-[#9CA3AF]">
                            {[p.variety, p.category].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-emerald-700">{formatProductBusinessId(p)}</td>
                        <td className="px-3 py-2 font-semibold">
                          {qty} {p.unit || "Kg"}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                            {p.status || "Active"}
                          </span>
                        </td>
                        <td className="sticky right-0 z-10 whitespace-nowrap border-l border-[#D4D4D4] bg-white px-3 py-2 text-right">
                          <div className="flex flex-nowrap items-center justify-end gap-1">
                            <Link to={productFarmersPath(p)} className={ACTION_BTN}>
                              View
                            </Link>
                            <Link to={orderCreatePath(p)} className={`${EXCEL_BTN_PRIMARY} !min-h-7 px-2.5 py-1 text-[10px]`}>
                              Create Order
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : filteredRows.length === 0 ? (
        <div className={`${EXCEL_PANEL} p-6 text-center text-xs text-[#6B7280]`}>
          {productRows.length === 0
            ? "No harvest orders yet. Use Create Order by Product to add one."
            : "No matching harvest orders."}
        </div>
      ) : (
        <div className={EXCEL_PANEL}>
          <div className="divide-y divide-[#E5E7EB] sm:hidden">
            {filteredRows.map((row) => (
              <div key={row.key} className="px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => openProductSheet(row)}
                  className="block w-full truncate text-left text-[13px] font-semibold text-[#217346]"
                >
                  {row.productName}
                </button>
                {row.category ? <p className="mt-0.5 truncate text-[11px] text-[#9CA3AF]">{row.category}</p> : null}
                <p className="mt-0.5 break-all font-mono text-[10px] text-emerald-700">{formatProductBusinessId(row)}</p>
                <div className="mt-1.5 grid grid-cols-3 gap-1 text-[11px]">
                  <div>
                    <p className="text-[#6B7280]">Orders</p>
                    <p className="font-bold text-[#1F2937]">{row.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Volume</p>
                    <p className="font-bold text-[#1F2937]">
                      {row.totalVolume.toLocaleString("en-IN")} {row.unit || "Kg"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Value</p>
                    <p className="font-bold text-[#217346]">₹{row.totalAmount.toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <Link to={productFarmersPath(row)} className={`${ACTION_BTN} w-full`}>
                    View
                  </Link>
                  <button type="button" className={`${ACTION_BTN} w-full`} onClick={() => openProductSheet(row)}>
                    Sheet
                  </button>
                  <Link
                    to={`/farmer/manager/orders/create?productId=${encodeURIComponent(row.productId || "")}&farmerId=${encodeURIComponent(row.farmerId || [...row.farmerIds][0] || "")}`}
                    className={`${ACTION_BTN} w-full`}
                  >
                    + Order
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                  {["Product", "Product ID", "Orders", "Volume", "Value"].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">
                      {h}
                    </th>
                  ))}
                  <th className="sticky right-0 z-20 border-l border-[#D4D4D4] bg-[#F2F2F2] px-3 py-2 text-right font-semibold text-[#6B7280]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.key} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => openProductSheet(row)}
                        className="font-semibold text-[#217346] hover:underline"
                      >
                        {row.productName}
                      </button>
                      {row.category ? <p className="text-[10px] text-[#9CA3AF]">{row.category}</p> : null}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-emerald-700">{formatProductBusinessId(row)}</td>
                    <td className="px-3 py-2 font-semibold">{row.orderCount}</td>
                    <td className="px-3 py-2">
                      {row.totalVolume.toLocaleString("en-IN")} {row.unit || "Kg"}
                    </td>
                    <td className="px-3 py-2 font-semibold text-[#217346]">₹{row.totalAmount.toLocaleString("en-IN")}</td>
                    <td className="sticky right-0 z-10 whitespace-nowrap border-l border-[#D4D4D4] bg-white px-3 py-2">
                      <div className="flex flex-nowrap items-center justify-end gap-1">
                        <Link to={productFarmersPath(row)} className={ACTION_BTN}>
                          View
                        </Link>
                        <button type="button" className={ACTION_BTN} onClick={() => openProductSheet(row)}>
                          Sheet
                        </button>
                        <Link
                          to={`/farmer/manager/orders/create?productId=${encodeURIComponent(row.productId || "")}&farmerId=${encodeURIComponent(row.farmerId || [...row.farmerIds][0] || "")}`}
                          className={ACTION_BTN}
                        >
                          + Order
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
