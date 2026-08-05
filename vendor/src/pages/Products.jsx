import { useMemo, useState } from 'react'
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Eye,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { products as productsData } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'

const statusVariant = {
  Active: 'success',
  'Low Stock': 'warning',
  'Out of Stock': 'error',
}

export default function Products() {
  const [query, setQuery] = useState('')
  const [openAction, setOpenAction] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return productsData
    return productsData.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary sm:hidden">Products</h2>
          <p className="text-sm font-medium text-text-secondary">
            Manage catalog, pricing, and stock status
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="bg-white">
            <Upload className="h-4 w-4" />
            Bulk Upload
          </Button>
          <Button>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <CardHeader className="mb-0">
            <div>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>{filtered.length} products found</CardDescription>
            </div>
          </CardHeader>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, SKU..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-cream/70">
                {[
                  'Image',
                  'Product Name',
                  'SKU',
                  'Category',
                  'Stock',
                  'Price',
                  'Discount',
                  'Status',
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary sm:px-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-border/70 transition hover:bg-cream/40 last:border-0"
                >
                  <td className="px-4 py-3.5 sm:px-5">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-11 w-11 rounded-xl object-cover ring-1 ring-border"
                    />
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-text-primary sm:px-5">
                    {product.name}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-text-secondary sm:px-5">
                    {product.sku}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-text-primary sm:px-5">
                    {product.category}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-text-primary sm:px-5">
                    {product.stock}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-text-primary sm:px-5">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    {product.discount > 0 ? (
                      <Badge variant="accent">{product.discount}% OFF</Badge>
                    ) : (
                      <span className="text-xs font-medium text-text-secondary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <Badge variant={statusVariant[product.status]}>{product.status}</Badge>
                  </td>
                  <td className="relative px-4 py-3.5 sm:px-5">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenAction((prev) => (prev === product.id ? null : product.id))
                      }
                      className="rounded-full p-2 text-gray-600 transition hover:bg-muted"
                      aria-label="Product actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openAction === product.id && (
                      <div className="absolute right-4 top-12 z-10 min-w-[140px] overflow-hidden rounded-xl border border-border bg-white shadow-[var(--shadow-soft)]">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-text-primary hover:bg-cream"
                          onClick={() => setOpenAction(null)}
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-text-primary hover:bg-cream"
                          onClick={() => setOpenAction(null)}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-error hover:bg-error/5"
                          onClick={() => setOpenAction(null)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
