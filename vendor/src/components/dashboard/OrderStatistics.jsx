import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { orderStats } from '@/data/mockData'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 shadow-[var(--shadow-soft)]">
      <p className="text-sm font-bold text-text-primary">
        {payload[0].name}: {payload[0].value}%
      </p>
    </div>
  )
}

export function OrderStatistics() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Order Statistics</CardTitle>
          <CardDescription>Distribution by status</CardDescription>
        </div>
      </CardHeader>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="h-[180px] w-full max-w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={orderStats}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                strokeWidth={0}
              >
                {orderStats.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="w-full flex-1 space-y-2.5">
          {orderStats.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-text-secondary">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-text-primary">{item.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
