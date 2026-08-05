import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { revenueAnalyticsData } from '@/data/mockData'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-semibold text-text-secondary">{label}</p>
      <p className="text-sm font-bold text-primary">₹{payload[0].value}L</p>
    </div>
  )
}

export function RevenueAnalyticsChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Revenue Chart</CardTitle>
          <CardDescription>Monthly revenue trend (in lakhs)</CardDescription>
        </div>
      </CardHeader>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueAnalyticsData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              tickFormatter={(v) => `${v}L`}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F7F2E8' }} />
            <Bar
              dataKey="revenue"
              fill="#2E7D32"
              fillOpacity={0.75}
              radius={[6, 6, 2, 2]}
              maxBarSize={32}
              animationDuration={700}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
