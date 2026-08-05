import {
  IndianRupee,
  ShoppingBag,
  CheckCircle2,
  Wallet,
  Eye,
  PackageX,
  RotateCcw,
  Clock3,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { SalesOverviewChart } from '@/components/dashboard/SalesOverviewChart'
import { RevenueAnalyticsChart } from '@/components/dashboard/RevenueAnalyticsChart'
import { TopSellingProducts } from '@/components/dashboard/TopSellingProducts'
import { OrderStatistics } from '@/components/dashboard/OrderStatistics'
import { LatestOrders } from '@/components/dashboard/LatestOrders'
import { LowStockTable } from '@/components/dashboard/LowStockTable'
import { RecentCustomers } from '@/components/dashboard/RecentCustomers'
import { QuickActions } from '@/components/dashboard/QuickActions'

const stats = [
  {
    title: "Today's Sales",
    value: 68420,
    change: '+12.4%',
    trend: 'up',
    icon: IndianRupee,
    format: 'currency',
    accent: 'green',
  },
  {
    title: 'Monthly Revenue',
    value: 1842500,
    change: '+8.1%',
    trend: 'up',
    icon: IndianRupee,
    format: 'currency',
    accent: 'lime',
  },
  {
    title: 'Pending Orders',
    value: 36,
    change: '+4',
    trend: 'up',
    icon: Clock3,
    accent: 'warn',
  },
  {
    title: 'Completed Orders',
    value: 248,
    change: '+18.2%',
    trend: 'up',
    icon: CheckCircle2,
    accent: 'green',
  },
  {
    title: 'Wallet Balance',
    value: 92640,
    change: '+₹4,200',
    trend: 'up',
    icon: Wallet,
    format: 'currency',
    accent: 'gold',
  },
  {
    title: 'Visitors',
    value: 3842,
    change: '+6.8%',
    trend: 'up',
    icon: Eye,
    accent: 'slate',
  },
  {
    title: 'Low Stock',
    value: 14,
    change: '+3',
    trend: 'down',
    icon: PackageX,
    accent: 'warn',
  },
  {
    title: 'Refund Requests',
    value: 7,
    change: '-2',
    trend: 'up',
    icon: RotateCcw,
    accent: 'error',
  },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="soft-green-gradient relative overflow-hidden rounded-2xl p-5 text-white shadow-[var(--shadow-soft)] sm:p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-16 h-24 w-24 rounded-full bg-accent/25 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white/80">Good afternoon, Ravi</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Your store is performing great today
            </h2>
            <p className="mt-2 max-w-xl text-sm font-medium text-white/85">
              ₹68,420 in sales so far · 36 orders awaiting action · 14 products need restock.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm">
              Store open · Andheri West
            </span>
            <span className="rounded-full bg-accent/90 px-3.5 py-1.5 text-xs font-bold text-text-primary">
              Avg. delivery 28 min
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <QuickActions />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SalesOverviewChart />
        <RevenueAnalyticsChart />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <TopSellingProducts />
        </div>
        <div className="xl:col-span-1">
          <OrderStatistics />
        </div>
        <div className="lg:col-span-2 xl:col-span-1">
          <RecentCustomers />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <LatestOrders />
        </div>
        <div>
          <LowStockTable />
        </div>
      </section>

      <p className="flex items-center justify-center gap-2 pb-2 text-center text-xs font-medium text-text-secondary">
        <ShoppingBag className="h-3.5 w-3.5" />
        GreenGroo Vendor Dashboard · Live preview with sample data
      </p>
    </div>
  )
}
