import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { recentCustomers } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'

function initials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
}

export function RecentCustomers() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Recent Customers</CardTitle>
          <CardDescription>Newly active shoppers</CardDescription>
        </div>
      </CardHeader>
      <ul className="space-y-3">
        {recentCustomers.map((customer) => (
          <li
            key={customer.id}
            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-cream/60"
          >
            <span className="soft-green-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
              {initials(customer.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{customer.name}</p>
              <p className="text-xs font-medium text-text-secondary">
                {customer.orders} orders · {customer.joined}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-primary">
              {formatCurrency(customer.spent)}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
