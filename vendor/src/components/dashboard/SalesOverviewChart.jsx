import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { salesOverviewData } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-semibold text-text-secondary">{label}</p>
      <p className="text-sm font-bold text-primary">{formatCurrency(payload[0].value)}</p>
      <p className="text-xs font-medium text-text-secondary">{payload[1]?.value} orders</p>
    </div>
  )
}

export function SalesOverviewChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Sales Overview</CardTitle>
          <CardDescription>Weekly sales performance across your store</CardDescription>
        </div>
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {['Week', 'Month'].map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                i === 0 ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </CardHeader>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesOverviewData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2E7D32" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#2E7D32" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
              tickFormatter={(v) => `${v / 1000}k`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#2E7D32"
              strokeWidth={2.5}
              fill="url(#salesGradient)"
              animationDuration={900}
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="transparent"
              fill="transparent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
