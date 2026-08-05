import { AlertTriangle } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { lowStockProducts } from '@/data/mockData'

export function LowStockTable() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Low Stock Products
          </CardTitle>
          <CardDescription>Items below reorder threshold</CardDescription>
        </div>
      </CardHeader>
      <ul className="space-y-3">
        {lowStockProducts.map((product) => (
          <li
            key={product.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-cream/40 p-3 transition hover:bg-cream"
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-11 w-11 rounded-xl object-cover ring-1 ring-border"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{product.name}</p>
              <p className="text-xs font-medium text-text-secondary">{product.sku}</p>
            </div>
            <div className="text-right">
              <Badge variant="warning">{product.stock} left</Badge>
              <Button variant="secondary" size="sm" className="mt-1.5 h-7 px-2.5 text-[11px]">
                Restock
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
