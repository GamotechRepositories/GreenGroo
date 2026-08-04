import { useEffect, useMemo, useState } from "react";
import { getDashboardStats } from "../../../api/api";
import MonthlySalesChart from "../MonthlySalesChart";
import DashboardRecentOrders from "../dashboard/DashboardRecentOrders";
import RevenueCard from "../dashboard/RevenueCard";
import StoreOverview from "../dashboard/StoreOverview";
import TodayStatCard from "../dashboard/TodayStatCard";
import TopCategoriesChart from "../dashboard/TopCategoriesChart";
import TotalMiniCard from "../dashboard/TotalMiniCard";
import { getCurrentMonthDateRange, getCurrentMonthName, getTodayDateString } from "../dashboardUtils";
import { IconCategory, IconOrder, IconProduct } from "../AdminIcons";

const EMPTY_DAY_STATS = {
  orders: 0,
  attempted: 0,
  confirmed: 0,
  shipping: 0,
  delivered: 0,
  cancelled: 0,
  return: 0,
};

function OverviewSection() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [years, setYears] = useState([currentYear]);
  const [totals, setTotals] = useState({ products: 0, categories: 0, users: 0, totalRevenue: 0 });
  const [revenue, setRevenue] = useState({ currentMonth: 0, lastMonth: 0, monthlyTrend: [] });
  const [storeOverview, setStoreOverview] = useState({
    activeProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    activeUsers: 0,
  });
  const [topCategories, setTopCategories] = useState([]);
  const [topCategoriesTotal, setTopCategoriesTotal] = useState(0);
  const [monthOrders, setMonthOrders] = useState({ count: 0, ...EMPTY_DAY_STATS });
  const [todayDate, setTodayDate] = useState(() => getTodayDateString());

  useEffect(() => {
    const syncTodayDate = () => {
      const nextDate = getTodayDateString();
      setTodayDate((prev) => (prev === nextDate ? prev : nextDate));
    };

    syncTodayDate();
    const intervalId = window.setInterval(syncTodayDate, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await getDashboardStats({ year });
        const stats = data.data || {};

        setRecentOrders(stats.recentOrders || []);
        setMonthlySales(stats.monthlySales || []);
        setYears(stats.years?.length ? stats.years : [currentYear]);
        setTotals(stats.totals || { products: 0, categories: 0, users: 0, totalRevenue: 0 });
        setRevenue(stats.revenue || { currentMonth: 0, lastMonth: 0, monthlyTrend: [] });
        setStoreOverview(
          stats.storeOverview || {
            activeProducts: 0,
            outOfStock: 0,
            lowStock: 0,
            activeUsers: 0,
          }
        );
        setTopCategories(stats.topCategories || []);
        setTopCategoriesTotal(Number(stats.topCategoriesTotal) || 0);
        setMonthOrders({
          count: Number(stats.monthOrders?.count ?? stats.monthOrders?.orders) || 0,
          orders: Number(stats.monthOrders?.orders ?? stats.monthOrders?.count) || 0,
          attempted: Number(stats.monthOrders?.attempted) || 0,
          confirmed: Number(stats.monthOrders?.confirmed) || 0,
          shipping: Number(stats.monthOrders?.shipping) || 0,
          delivered: Number(stats.monthOrders?.delivered) || 0,
          cancelled: Number(stats.monthOrders?.cancelled) || 0,
          return: Number(stats.monthOrders?.return) || 0,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [year, currentYear, todayDate]);

  const todayOrdersLink = useMemo(
    () => `/orders?startDate=${todayDate}&endDate=${todayDate}`,
    [todayDate]
  );
  const monthOrdersLink = useMemo(() => {
    const { startDate, endDate } = getCurrentMonthDateRange();
    return `/orders?startDate=${startDate}&endDate=${endDate}`;
  }, []);
  const currentMonthName = useMemo(() => getCurrentMonthName(), []);

  return (
    <div className="min-w-0 space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-7">
        <TodayStatCard
          label={`${currentMonthName} Orders`}
          value={monthOrders.count ?? monthOrders.orders}
          loading={loading}
          iconBg="bg-orange-50 text-primary"
          to={monthOrdersLink}
        >
          <IconOrder className="h-5 w-5" />
        </TodayStatCard>
        <TodayStatCard
          label={`${currentMonthName} Attempted`}
          value={monthOrders.attempted}
          loading={loading}
          iconBg="bg-purple-50 text-purple-600"
          to={`${monthOrdersLink}&status=attempted`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.25 10.5V6a3.75 3.75 0 117.5 0v4.5" />
          </svg>
        </TodayStatCard>
        <TodayStatCard
          label={`${currentMonthName} Confirmed`}
          value={monthOrders.confirmed}
          loading={loading}
          iconBg="bg-emerald-50 text-emerald-600"
          to={`${monthOrdersLink}&status=confirm`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </TodayStatCard>
        <TodayStatCard
          label={`${currentMonthName} Shipping`}
          value={monthOrders.shipping}
          loading={loading}
          iconBg="bg-blue-50 text-blue-600"
          to={`${monthOrdersLink}&status=shipping`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
            />
          </svg>
        </TodayStatCard>
        <TodayStatCard
          label={`${currentMonthName} Delivered`}
          value={monthOrders.delivered}
          loading={loading}
          iconBg="bg-green-50 text-green-600"
          to={`${monthOrdersLink}&status=delivered`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </TodayStatCard>
        <TodayStatCard
          label={`${currentMonthName} Cancelled`}
          value={monthOrders.cancelled}
          loading={loading}
          iconBg="bg-red-50 text-red-500"
          to={`${monthOrdersLink}&status=cancelled`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </TodayStatCard>
        <TodayStatCard
          label={`${currentMonthName} Return`}
          value={monthOrders.return}
          loading={loading}
          iconBg="bg-amber-50 text-amber-600"
          to={`${monthOrdersLink}&status=return`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
            />
          </svg>
        </TodayStatCard>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 xl:items-stretch">
        <TotalMiniCard
          label="Total Products"
          value={totals.products}
          loading={loading}
          to="/products/show"
          icon={IconProduct}
          iconBg="bg-violet-50 text-violet-600"
        />
        <TotalMiniCard
          label="Total Categories"
          value={totals.categories}
          loading={loading}
          to="/categories/show"
          icon={IconCategory}
          iconBg="bg-blue-50 text-blue-600"
        />
        <RevenueCard
          compact
          className="col-span-2 xl:col-span-1"
          totalRevenue={totals.totalRevenue}
          currentMonth={revenue.currentMonth}
          lastMonth={revenue.lastMonth}
          monthlyTrend={revenue.monthlyTrend}
          loading={loading}
          to="/revenue"
        />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        <div className="flex h-full min-h-0 xl:col-span-2">
          <MonthlySalesChart
            monthlySales={monthlySales}
            year={year}
            years={years}
            onYearChange={setYear}
            loading={loading}
          />
        </div>
        <div className="flex h-full min-h-0">
          <TopCategoriesChart
            categories={topCategories}
            totalSales={topCategoriesTotal}
            loading={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardRecentOrders
            orders={recentOrders}
            loading={loading}
            viewAllTo={todayOrdersLink}
          />
        </div>
        <StoreOverview overview={storeOverview} loading={loading} />
      </div>
    </div>
  );
}

export default OverviewSection;
