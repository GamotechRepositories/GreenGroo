import {
  ShoppingBag,
  IndianRupee,
  Wallet,
  Clock3,
  RotateCcw,
  PackageX,
  Eye,
  Percent,
  Star,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '@/components/dashboard/StatCard'
import { SalesOverviewChart } from '@/components/dashboard/SalesOverviewChart'
import { RevenueAnalyticsChart } from '@/components/dashboard/RevenueAnalyticsChart'
import { TopSellingProducts } from '@/components/dashboard/TopSellingProducts'
import { OrderStatistics } from '@/components/dashboard/OrderStatistics'
import { LatestOrders } from '@/components/dashboard/LatestOrders'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { pendingRefunds, recentReviews, topSellingProducts } from '@/data/mockData'
import { formatCurrency, formatNumber } from '@/lib/utils'

const stats = [
  { title: "Today's Orders", value: 186, change: '+14.2%', trend: 'up', icon: ShoppingBag },
  {
    title: "Today's Revenue",
    value: 68420,
    change: '+12.4%',
    trend: 'up',
    icon: IndianRupee,
    format: 'currency',
  },
  {
    title: 'Wallet Balance',
    value: 92640,
    change: '+₹4,200',
    trend: 'up',
    icon: Wallet,
    format: 'currency',
  },
  { title: 'Pending Orders', value: 36, change: '+4', trend: 'up', icon: Clock3 },
  { title: 'Pending Returns', value: 7, change: '-2', trend: 'up', icon: RotateCcw },
  { title: 'Low Stock', value: 14, change: '+3', trend: 'down', icon: PackageX },
  { title: 'Visitors', value: 3842, change: '+6.8%', trend: 'up', icon: Eye },
  { title: 'Conversion', value: '4.8%', change: '+0.4%', trend: 'up', icon: Percent },
  { title: 'Average Rating', value: '4.7', change: '+0.1', trend: 'up', icon: Star },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary sm:text-2xl">Dashboard</h2>
          <p className="mt-1 text-sm font-medium text-text-secondary">
            {formatNumber(186)} orders today · {formatCurrency(68420)} revenue · 36 pending · 14
            low stock
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/products/add">
            <Button>Add Product</Button>
          </Link>
          <Link to="/orders/new">
            <Button variant="outline">New Orders</Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RevenueAnalyticsChart />
        <SalesOverviewChart />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopSellingProducts />
        <OrderStatistics />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <LatestOrders />
        </div>

        <Card className="h-full overflow-hidden p-0">
          <div className="p-5 pb-0">
            <CardHeader className="mb-3">
              <div>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>By units sold this week</CardDescription>
              </div>
              <Link
                to="/analytics/products"
                className="text-xs font-semibold text-text-secondary hover:text-primary"
              >
                View all
              </Link>
            </CardHeader>
          </div>
          <ul className="divide-y divide-border">
            {topSellingProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-xs font-semibold text-text-secondary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{p.name}</p>
                  <p className="text-xs font-medium text-text-secondary">
                    {formatNumber(p.sales)} sold
                  </p>
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  {formatCurrency(p.revenue)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <div className="p-5 pb-0">
            <CardHeader className="mb-3">
              <div>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>Latest customer feedback</CardDescription>
              </div>
              <Link
                to="/reviews/products"
                className="text-xs font-semibold text-text-secondary hover:text-primary"
              >
                Manage
              </Link>
            </CardHeader>
          </div>
          <ul className="divide-y divide-border">
            {recentReviews.map((r) => (
              <li key={r.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{r.customer}</p>
                    <p className="text-xs font-medium text-text-secondary">{r.product}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-text-secondary">
                    <Star className="h-3.5 w-3.5" />
                    {r.rating}
                  </div>
                </div>
                <p className="mt-1.5 text-sm font-medium text-text-secondary">{r.comment}</p>
                <p className="mt-1 text-[11px] text-text-secondary">{r.time}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="p-5 pb-0">
            <CardHeader className="mb-3">
              <div>
                <CardTitle>Pending Refunds</CardTitle>
                <CardDescription>Requests awaiting action</CardDescription>
              </div>
              <Link
                to="/orders/refunds"
                className="text-xs font-semibold text-text-secondary hover:text-primary"
              >
                Review
              </Link>
            </CardHeader>
          </div>
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-y border-border bg-cream/60">
                  {['Refund', 'Order', 'Customer', 'Amount', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-secondary"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingRefunds.map((r) => (
                  <tr key={r.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3 font-semibold text-text-primary">{r.id}</td>
                    <td className="px-4 py-3 font-medium text-text-secondary">{r.orderId}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{r.customer}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}
