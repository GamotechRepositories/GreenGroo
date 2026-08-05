import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { topSellingProducts } from '@/data/mockData'
import { formatNumber } from '@/lib/utils'

export function TopSellingProducts() {
  const max = Math.max(...topSellingProducts.map((p) => p.sales))

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Best performers this week</CardDescription>
        </div>
      </CardHeader>
      <ul className="space-y-4">
        {topSellingProducts.map((product, index) => (
          <li key={product.name}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-[11px] font-semibold text-text-secondary">
                  {index + 1}
                </span>
                <span className="truncate text-sm font-semibold text-text-primary">
                  {product.name}
                </span>
              </div>
              <span className="shrink-0 text-xs font-medium text-text-secondary">
                {formatNumber(product.sales)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/70 transition-all duration-700"
                style={{ width: `${(product.sales / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
