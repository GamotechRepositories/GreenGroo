import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { latestOrders } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'

const statusVariant = {
  Delivered: 'secondary',
  Processing: 'secondary',
  Pending: 'secondary',
  Cancelled: 'secondary',
}

export function LatestOrders() {
  return (
    <Card className="h-full overflow-hidden p-0">
      <div className="p-5 pb-0">
        <CardHeader className="mb-3">
          <div>
            <CardTitle>Latest Orders</CardTitle>
            <CardDescription>Most recent customer orders</CardDescription>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-primary transition hover:underline"
          >
            View all
          </button>
        </CardHeader>
      </div>
      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-y border-border bg-cream/60">
              {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Time'].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-secondary"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {latestOrders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-border/70 transition hover:bg-cream/40 last:border-0"
              >
                <td className="px-5 py-3.5 font-bold text-primary">{order.id}</td>
                <td className="px-5 py-3.5 font-medium text-text-primary">{order.customer}</td>
                <td className="px-5 py-3.5 font-medium text-text-secondary">{order.items}</td>
                <td className="px-5 py-3.5 font-bold text-text-primary">
                  {formatCurrency(order.amount)}
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                </td>
                <td className="px-5 py-3.5 font-medium text-text-secondary">{order.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
