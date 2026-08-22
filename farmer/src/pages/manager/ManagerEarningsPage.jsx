import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getManagerFarmers,
  getManagerFarmerOrders,
  getHarvestOrders,
} from "../../api/farmerApi";
import StatCard from "../../components/ui/StatCard";
import LoadingState from "../../components/ui/LoadingState";
import {
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_TABLE,
  EXCEL_WRAP,
  EXCEL_HEAD,
  EXCEL_CELL,
} from "../../utils/excelStyles";

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ManagerEarningsPage() {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [allHarvestOrders, setAllHarvestOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmerSearch, setFarmerSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const farmerList = await getManagerFarmers().catch(() => []);
        const safeFarmers = Array.isArray(farmerList) ? farmerList : [];
        setFarmers(safeFarmers);

        // Fetch orders across all assigned farmers
        const farmerDataPromises = safeFarmers.map(async (f) => {
          const ordersRes = await getManagerFarmerOrders(f.id).catch(() => []);
          const orders = Array.isArray(ordersRes) ? ordersRes : [];

          return {
            farmer: f,
            orders: orders.map((o) => ({
              ...o,
              farmerId: f.id,
              farmerName: f.name,
              farmerMobile: f.mobile,
            })),
          };
        });

        // Also fetch general harvest orders if available
        const generalHarvestOrdersPromise = getHarvestOrders().catch(() => []);

        const [farmerResults, generalHarvestOrders] = await Promise.all([
          Promise.all(farmerDataPromises),
          generalHarvestOrdersPromise,
        ]);

        const combinedOrders = [];
        const seenOrderIds = new Set();

        farmerResults.forEach(({ orders }) => {
          orders.forEach((o) => {
            const key = o.id || o.orderId || String(o._id);
            if (key && !seenOrderIds.has(key)) {
              seenOrderIds.add(key);
              combinedOrders.push(o);
            }
          });
        });

        const safeGeneralHO = Array.isArray(generalHarvestOrders) ? generalHarvestOrders : [];
        safeGeneralHO.forEach((ho) => {
          const key = ho.id || ho.orderId || String(ho._id);
          if (key && !seenOrderIds.has(key)) {
            seenOrderIds.add(key);
            const matchedFarmer = safeFarmers.find(
              (f) => f.id === ho.farmerId || f.name === ho.farmerName
            );
            combinedOrders.push({
              ...ho,
              farmerId: ho.farmerId || matchedFarmer?.id || "",
              farmerName: ho.farmerName || matchedFarmer?.name || "Farmer",
            });
          }
        });

        setAllHarvestOrders(combinedOrders);
      } catch (err) {
        toast.error(err?.message || "Failed to load farmer statements & earnings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Per Farmer stats
  const farmerStatsMap = useMemo(() => {
    const map = new Map();
    farmers.forEach((f) => {
      const fOrders = allHarvestOrders.filter((o) => o.farmerId === f.id || o.farmerName === f.name);
      const totalEarn = fOrders.reduce((sum, ho) => {
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

      const totalQty = fOrders.reduce((sum, ho) => {
        const q = Number(ho.totalQuantity || ho.quantity || 0);
        if (q > 0) return sum + q;
        const gQ = (ho.grades || []).reduce((gs, g) => gs + Number(g.quantity || 0), 0);
        return sum + gQ;
      }, 0);

      map.set(f.id, {
        orderCount: fOrders.length,
        totalEarnings: totalEarn,
        totalQuantity: totalQty,
        deposited: Math.round(totalEarn * 0.7),
        pendingBalance: totalEarn - Math.round(totalEarn * 0.7),
      });
    });
    return map;
  }, [farmers, allHarvestOrders]);

  // Overall totals
  const overallEarnings = useMemo(() => {
    return Array.from(farmerStatsMap.values()).reduce((sum, s) => sum + s.totalEarnings, 0);
  }, [farmerStatsMap]);

  const overallDeposited = Math.round(overallEarnings * 0.7);
  const overallPending = overallEarnings - overallDeposited;

  // Filtered farmers list for search
  const visibleFarmers = useMemo(() => {
    if (!farmerSearch.trim()) return farmers;
    const q = farmerSearch.toLowerCase().trim();
    return farmers.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.mobile?.includes(q) ||
        f.farmLocation?.toLowerCase().includes(q) ||
        f.farmName?.toLowerCase().includes(q)
    );
  }, [farmers, farmerSearch]);

  if (loading) return <LoadingState rows={6} />;

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Farmer Earnings & Statements</h1>
          <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>
            Financial earnings statements and daily harvest spreadsheets across assigned farmers
          </p>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Assigned Farmers" value={farmers.length} />
        <StatCard title="Total Statement Earnings" value={formatCurrency(overallEarnings)} />
        <StatCard title="Total Deposited (70%)" value={formatCurrency(overallDeposited)} />
        <StatCard title="Total Pending (30%)" value={formatCurrency(overallPending)} />
      </div>

      {/* 3. Farmers Directory Cards Grid (Click to open NEW PAGE) */}
      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2 bg-[#F2F8F3]`}>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#1F2937] text-sm">👨‍🌾 Assigned Farmers — Select Farmer to Open Earning Spreadsheet</span>
            <span className="rounded bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#217346]">
              {farmers.length} Farmers
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="search"
              value={farmerSearch}
              onChange={(e) => setFarmerSearch(e.target.value)}
              placeholder="Search farmer name or mobile..."
              className="border border-[#D4D4D4] bg-white px-2.5 py-1 text-xs text-[#1F2937] outline-none focus:border-[#217346] w-60 rounded-xs"
            />
          </div>
        </div>

        <div className="p-3">
          {visibleFarmers.length === 0 ? (
            <p className="text-center py-8 text-[#6B7280]">No farmers found matching search.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleFarmers.map((f) => {
                const stats = farmerStatsMap.get(f.id) || { orderCount: 0, totalEarnings: 0, deposited: 0, pendingBalance: 0 };

                return (
                  <div
                    key={f.id}
                    className="flex flex-col justify-between rounded-xs border border-[#D4D4D4] bg-white p-3.5 shadow-xs transition-all hover:border-[#217346] hover:shadow-md group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xs border border-[#217346] bg-[#E8F5E9] font-bold text-lg text-[#217346]">
                          👨‍🌾
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold text-sm text-[#1F2937] truncate group-hover:text-[#217346] transition-colors">
                            {f.name}
                          </h3>
                          <p className="text-[10px] text-[#6B7280] truncate">📱 {f.mobile || "—"}</p>
                          <p className="text-[10px] text-[#6B7280] truncate">📍 {f.farmLocation || f.address?.village || "Nashik"}</p>
                        </div>
                      </div>

                      {/* Mini Financial Stats */}
                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E5E7EB] pt-2.5">
                        <div>
                          <p className="text-[9px] font-semibold text-[#6B7280]">Total Earnings</p>
                          <p className="text-xs font-bold text-[#217346]">₹{stats.totalEarnings.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-semibold text-[#6B7280]">Harvest Orders</p>
                          <p className="text-xs font-bold text-[#1F2937]">{stats.orderCount} Orders</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-[#6B7280]">Deposited (70%)</p>
                          <p className="text-[11px] font-bold text-emerald-700">₹{stats.deposited.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-semibold text-[#6B7280]">Pending (30%)</p>
                          <p className="text-[11px] font-bold text-amber-600">₹{stats.pendingBalance.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Opens the New Dedicated Page */}
                    <div className="mt-3 pt-2 border-t border-[#F0F0F0]">
                      <Link
                        to={`/farmer/manager/earnings/farmer/${f.id}`}
                        className={`${EXCEL_BTN_PRIMARY} w-full text-center block py-1.5 text-xs font-bold shadow-xs hover:opacity-90`}
                      >
                        📊 View Earning Spreadsheet ↗
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. Farmers Statements Table View */}
      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between`}>
          <span className="font-bold text-[#1F2937]">Farmers Statement Overview Table</span>
          <span className="text-[11px] text-[#6B7280]">Click any row to open that farmer's spreadsheet</span>
        </div>

        <div className="p-3">
          <div className={EXCEL_WRAP}>
            <table className={EXCEL_TABLE}>
              <thead>
                <tr className="bg-[#F2F2F2]">
                  <th className={`${EXCEL_HEAD} text-center w-12`}>Sr.</th>
                  <th className={`${EXCEL_HEAD} text-left`}>Farmer Name</th>
                  <th className={`${EXCEL_HEAD} text-left`}>Mobile</th>
                  <th className={`${EXCEL_HEAD} text-left`}>Location</th>
                  <th className={`${EXCEL_HEAD} text-center`}>Harvest Orders</th>
                  <th className={`${EXCEL_HEAD} text-right text-[#217346]`}>Total Earnings</th>
                  <th className={`${EXCEL_HEAD} text-right text-emerald-700`}>Deposited (70%)</th>
                  <th className={`${EXCEL_HEAD} text-right text-amber-600`}>Pending (30%)</th>
                  <th className={`${EXCEL_HEAD} text-center w-36`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleFarmers.map((f, idx) => {
                  const stats = farmerStatsMap.get(f.id) || { orderCount: 0, totalEarnings: 0, deposited: 0, pendingBalance: 0 };
                  return (
                    <tr
                      key={f.id}
                      onClick={() => navigate(`/farmer/manager/earnings/farmer/${f.id}`)}
                      className="hover:bg-[#F2F8F3] cursor-pointer transition-colors"
                    >
                      <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{idx + 1}</td>
                      <td className={`${EXCEL_CELL} font-bold text-[#217346]`}>
                        {f.name}
                      </td>
                      <td className={`${EXCEL_CELL} text-[#4B5563]`}>{f.mobile || "—"}</td>
                      <td className={`${EXCEL_CELL} text-[#4B5563]`}>{f.farmLocation || f.address?.village || "Nashik"}</td>
                      <td className={`${EXCEL_CELL} text-center font-bold text-[#1F2937]`}>{stats.orderCount} Orders</td>
                      <td className={`${EXCEL_CELL} text-right font-extrabold text-[#217346] tabular-nums`}>
                        ₹{stats.totalEarnings.toLocaleString("en-IN")}
                      </td>
                      <td className={`${EXCEL_CELL} text-right font-semibold text-emerald-700 tabular-nums`}>
                        ₹{stats.deposited.toLocaleString("en-IN")}
                      </td>
                      <td className={`${EXCEL_CELL} text-right font-semibold text-amber-600 tabular-nums`}>
                        ₹{stats.pendingBalance.toLocaleString("en-IN")}
                      </td>
                      <td className={`${EXCEL_CELL} text-center`} onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/farmer/manager/earnings/farmer/${f.id}`}
                          className="inline-flex items-center gap-1 border border-[#217346] bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#217346] hover:bg-[#c8e6c9] rounded-xs"
                        >
                          Open Chart 📊 ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
