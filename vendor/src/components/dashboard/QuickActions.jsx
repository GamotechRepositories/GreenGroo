import { Link } from 'react-router-dom'
import {
  PackagePlus,
  TicketPercent,
  Wallet,
  Printer,
  Upload,
} from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const actions = [
  {
    label: 'Add Product',
    desc: 'List a new item',
    to: '/products',
    icon: PackagePlus,
    className: 'from-primary to-secondary text-white',
  },
  {
    label: 'Create Coupon',
    desc: 'Launch a discount',
    to: '/coupons',
    icon: TicketPercent,
    className: 'from-amber-400 to-accent text-text-primary',
  },
  {
    label: 'Withdraw Money',
    desc: 'Cash out wallet',
    to: '/wallet',
    icon: Wallet,
    className: 'from-emerald-500 to-secondary text-white',
  },
  {
    label: 'Print Report',
    desc: 'Export summary',
    to: '/reports',
    icon: Printer,
    className: 'from-slate-600 to-slate-500 text-white',
  },
  {
    label: 'Bulk Upload',
    desc: 'CSV product import',
    to: '/products',
    icon: Upload,
    className: 'from-lime-500 to-green-500 text-white',
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for faster operations</CardDescription>
        </div>
      </CardHeader>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              to={action.to}
              className={cn(
                'group flex flex-col items-start gap-3 rounded-xl bg-gradient-to-br p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                action.className,
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm transition group-hover:scale-105">
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-sm font-bold">{action.label}</p>
                <p className="mt-0.5 text-[11px] font-medium opacity-85">{action.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
