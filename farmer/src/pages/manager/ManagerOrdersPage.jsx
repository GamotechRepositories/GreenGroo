import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getManagerFarmers, getManagerFarmerOrders } from "../../api/farmerApi";
import {
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_INPUT,
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_TABLE,
  EXCEL_WRAP,
  EXCEL_HEAD,
  EXCEL_CELL,
} from "../../utils/excelStyles";

export default function ManagerOrdersPage() {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const fs = await getManagerFarmers().catch(() => []);
      const farmerList = Array.isArray(fs) ? fs : [];
      setFarmers(farmerList);

      const results = await Promise.all(
        farmerList.map((f) =>
          getManagerFarmerOrders(f.id)
            .then((os) =>
              (Array.isArray(os) ? os : []).map((o) => ({
                ...o,
                farmerId: f.id,
              }))
            )
            .catch(() => [])
        )
      );
      setOrders(results.flat());
    } catch {
      setFarmers([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Farmer Stats Map
  const farmerStatsMap = useMemo(() => {
    const map = {};
    farmers.forEach((f) => {
      map[f.id] = {
        farmer: f,
        orderCount: 0,
        totalVolume: 0,
        rejectionVolume: 0,
        totalAmount: 0,
        products: new Set(),
      };
    });

    orders.forEach((o) => {
      if (!map[o.farmerId]) {
        map[o.farmerId] = {
          farmer: { id: o.farmerId, name: o.farmerName, mobile: o.farmerMobile, farmLocation: o.farmerLocation },
          orderCount: 0,
          totalVolume: 0,
          rejectionVolume: 0,
          totalAmount: 0,
          products: new Set(),
        };
      }
      map[o.farmerId].orderCount += 1;
      map[o.farmerId].rejectionVolume += Number(o.rejectionQty || 0);

      const prods = o.products && o.products.length > 0 ? o.products : [{ quantity: o.totalQuantity || 0, total: o.totalAmount || o.amount || 0, name: o.productName }];
      prods.forEach((p) => {
        map[o.farmerId].totalVolume += Number(p.quantity || 0);
        map[o.farmerId].totalAmount += Number(p.total || 0);
        if (p.name) map[o.farmerId].products.add(p.name);
      });
    });

    return map;
  }, [farmers, orders]);

  // Filtered Farmers List
  const filteredFarmers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return farmers;
    return farmers.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.mobile?.includes(q) ||
        f.farmLocation?.toLowerCase().includes(q) ||
        f.farmerCode?.toLowerCase().includes(q)
    );
  }, [farmers, searchQuery]);

  // Overall Totals
  const totalVolume = orders.reduce((sum, o) => {
    const prods = o.products && o.products.length > 0 ? o.products : [{ quantity: o.totalQuantity || 0 }];
    return sum + prods.reduce((pSum, p) => pSum + Number(p.quantity || 0), 0);
  }, 0);

  const totalAmount = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || Number(o.amount) || 0), 0);

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Order Management & Statements</h1>
          <p className={EXCEL_PAGE_SUB}>
            Select any farmer below to open their separate Harvest Spreadsheet & Statement page
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/farmer/manager/orders/create"
            className={`${EXCEL_BTN_PRIMARY} inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold shadow-xs`}
          >
            <span>+</span> Create Harvest Order
          </Link>
        </div>
      </div>

      {/* 2. Overview Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Assigned Farmers</p>
          <p className="text-lg font-bold text-[#1F2937]">{farmers.length} Farmers</p>
        </div>
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Total Harvest Orders</p>
          <p className="text-lg font-bold text-[#217346]">{orders.length}</p>
        </div>
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Total Harvest Volume</p>
          <p className="text-lg font-bold text-[#217346]">{totalVolume.toLocaleString("en-IN")} Kg/Litre</p>
        </div>
        <div className={`${EXCEL_PANEL} p-3 rounded-xs shadow-xs`}>
          <p className="text-[11px] font-semibold text-[#6B7280]">Total Statement Value</p>
          <p className="text-lg font-bold text-[#217346]">₹{totalAmount.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* 3. Farmers Directory - Clicking opens Separate Dedicated Page */}
      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1F2937] text-sm">👨‍🌾 Assigned Farmers (Click to Open Separate Sheet Page)</span>
            <span className="rounded bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#217346]">
              {farmers.length} Farmers
            </span>
          </div>

          <div className="relative min-w-[220px]">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search farmer name, mobile, location…"
              className={`${EXCEL_INPUT} w-full py-1 text-xs`}
            />
          </div>
        </div>

        <div className="p-3">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#6B7280]">Loading assigned farmers…</div>
          ) : filteredFarmers.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#6B7280]">
              No farmers found matching "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFarmers.map((f) => {
                const stats = farmerStatsMap[f.id] || { orderCount: 0, totalVolume: 0, totalAmount: 0 };

                return (
                  <div
                    key={f.id}
                    onClick={() => navigate(`/farmer/manager/orders/farmer/${f.id}`)}
                    className="group relative cursor-pointer rounded-xs border border-[#D4D4D4] bg-white p-4 transition-all duration-150 hover:border-[#217346] hover:bg-[#F7FAF7] hover:shadow-md"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xs border border-[#217346]/40 bg-[#E8F5E9] text-lg">
                          👨‍🌾
                        </span>
                        <div>
                          <h2 className="text-sm font-extrabold text-[#1F2937] group-hover:text-[#217346] group-hover:underline">
                            {f.name}
                          </h2>
                          <p className="text-[11px] text-[#6B7280]">
                            {f.mobile || "—"} · {f.farmLocation || f.address?.village || "Nashik"}
                          </p>
                        </div>
                      </div>

                      <span className="rounded bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#217346]">
                        {f.farmerCode || "FARMER"}
                      </span>
                    </div>

                    {/* Action Button */}
                    <div className="mt-3 flex items-center justify-between border-t border-[#E5E7EB] pt-2.5">
                      <span className="text-[11px] font-semibold text-[#6B7280]">
                        Open Harvest Spreadsheet
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-[#217346] group-hover:translate-x-0.5 transition-transform">
                        Open Separate Page →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
