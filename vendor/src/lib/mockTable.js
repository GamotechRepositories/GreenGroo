const STATUSES = ['Active', 'Pending', 'Processing', 'Completed', 'Cancelled', 'Low Stock']
const NAMES = [
  'Ananya Sharma',
  'Rahul Mehta',
  'Priya Nair',
  'Vikram Singh',
  'Sneha Patel',
  'Amit Joshi',
  'Neha Kapoor',
  'Karan Desai',
]
const PRODUCTS = [
  'Organic Bananas 1kg',
  'Farm Fresh Milk 1L',
  'Brown Bread',
  'Tomatoes 1kg',
  'Eggs Pack 12',
  'Amul Butter 500g',
  'Basmati Rice 5kg',
  'Olive Oil 1L',
]

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

/** Deterministic mock rows for any module page */
export function generateRows(pageKey, count = 48) {
  const seed = hash(pageKey || 'default')
  return Array.from({ length: count }, (_, i) => {
    const n = (seed + i * 17) % 10000
    const status = STATUSES[(seed + i) % STATUSES.length]
    const name = NAMES[(seed + i) % NAMES.length]
    const product = PRODUCTS[(seed + i * 3) % PRODUCTS.length]
    return {
      id: `${pageKey.slice(0, 3).toUpperCase()}-${1000 + i}`,
      name,
      product,
      category: ['Fruits', 'Dairy', 'Bakery', 'Staples', 'Beverages'][i % 5],
      amount: 120 + ((n * 37) % 4500),
      stock: (n * 3) % 180,
      status,
      date: new Date(Date.now() - i * 86400000 * 0.4).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      sku: `GG-${(n % 900) + 100}-${String.fromCharCode(65 + (i % 26))}`,
    }
  })
}

export const DEFAULT_COLUMNS = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'product', label: 'Product', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'stock', label: 'Stock', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, format: 'currency' },
  { key: 'status', label: 'Status', sortable: true, type: 'badge' },
  { key: 'date', label: 'Date', sortable: true },
]

export function rowsToCsv(rows, columns) {
  const headers = columns.map((c) => c.label).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = row[c.key] ?? ''
          const str = String(val).replace(/"/g, '""')
          return `"${str}"`
        })
        .join(','),
    )
    .join('\n')
  return `${headers}\n${body}`
}

export function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
