export const salesOverviewData = [
  { name: 'Mon', sales: 42000, orders: 118 },
  { name: 'Tue', sales: 38000, orders: 102 },
  { name: 'Wed', sales: 51000, orders: 145 },
  { name: 'Thu', sales: 47000, orders: 132 },
  { name: 'Fri', sales: 62000, orders: 168 },
  { name: 'Sat', sales: 78000, orders: 210 },
  { name: 'Sun', sales: 69000, orders: 188 },
]

export const revenueAnalyticsData = [
  { name: 'Jan', revenue: 2.4 },
  { name: 'Feb', revenue: 2.8 },
  { name: 'Mar', revenue: 3.1 },
  { name: 'Apr', revenue: 2.9 },
  { name: 'May', revenue: 3.6 },
  { name: 'Jun', revenue: 4.2 },
  { name: 'Jul', revenue: 3.9 },
  { name: 'Aug', revenue: 4.8 },
]

export const topSellingProducts = [
  { name: 'Organic Bananas', sales: 1240, color: '#2E7D32' },
  { name: 'Farm Fresh Milk', sales: 980, color: '#43A047' },
  { name: 'Brown Bread', sales: 860, color: '#66BB6A' },
  { name: 'Tomatoes 1kg', sales: 720, color: '#81C784' },
  { name: 'Eggs Pack 12', sales: 640, color: '#A5D6A7' },
]

export const orderStats = [
  { name: 'Delivered', value: 68, color: '#4CAF50' },
  { name: 'Processing', value: 18, color: '#F4C542' },
  { name: 'Pending', value: 10, color: '#FFB300' },
  { name: 'Cancelled', value: 4, color: '#E53935' },
]

export const latestOrders = [
  {
    id: 'ORD-78421',
    customer: 'Ananya Sharma',
    items: 5,
    amount: 842,
    status: 'Delivered',
    time: '12 min ago',
  },
  {
    id: 'ORD-78420',
    customer: 'Rahul Mehta',
    items: 3,
    amount: 456,
    status: 'Processing',
    time: '28 min ago',
  },
  {
    id: 'ORD-78419',
    customer: 'Priya Nair',
    items: 8,
    amount: 1280,
    status: 'Pending',
    time: '41 min ago',
  },
  {
    id: 'ORD-78418',
    customer: 'Vikram Singh',
    items: 2,
    amount: 210,
    status: 'Delivered',
    time: '1 hr ago',
  },
  {
    id: 'ORD-78417',
    customer: 'Sneha Patel',
    items: 6,
    amount: 975,
    status: 'Cancelled',
    time: '2 hr ago',
  },
]

export const lowStockProducts = [
  {
    id: 'p1',
    name: 'Amul Butter 500g',
    sku: 'GG-BUT-500',
    stock: 8,
    threshold: 20,
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=80&h=80&fit=crop',
  },
  {
    id: 'p2',
    name: 'Basmati Rice 5kg',
    sku: 'GG-RIC-5KG',
    stock: 5,
    threshold: 15,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=80&h=80&fit=crop',
  },
  {
    id: 'p3',
    name: 'Olive Oil 1L',
    sku: 'GG-OIL-1L',
    stock: 3,
    threshold: 12,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=80&h=80&fit=crop',
  },
  {
    id: 'p4',
    name: 'Honey Pure 250g',
    sku: 'GG-HON-250',
    stock: 6,
    threshold: 18,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=80&h=80&fit=crop',
  },
]

export const recentCustomers = [
  { id: 'c1', name: 'Ananya Sharma', orders: 24, spent: 18420, joined: '2 days ago' },
  { id: 'c2', name: 'Rahul Mehta', orders: 18, spent: 12650, joined: '5 days ago' },
  { id: 'c3', name: 'Priya Nair', orders: 31, spent: 24890, joined: '1 week ago' },
  { id: 'c4', name: 'Vikram Singh', orders: 9, spent: 5320, joined: '2 weeks ago' },
]

export const products = [
  {
    id: 1,
    name: 'Organic Bananas 1kg',
    sku: 'GG-BAN-1KG',
    category: 'Fruits',
    stock: 145,
    price: 68,
    discount: 10,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=80&h=80&fit=crop',
  },
  {
    id: 2,
    name: 'Farm Fresh Milk 1L',
    sku: 'GG-MLK-1L',
    category: 'Dairy',
    stock: 98,
    price: 62,
    discount: 5,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=80&h=80&fit=crop',
  },
  {
    id: 3,
    name: 'Whole Wheat Bread',
    sku: 'GG-BRD-WW',
    category: 'Bakery',
    stock: 42,
    price: 45,
    discount: 0,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=80&h=80&fit=crop',
  },
  {
    id: 4,
    name: 'Tomatoes 1kg',
    sku: 'GG-TOM-1KG',
    category: 'Vegetables',
    stock: 8,
    price: 40,
    discount: 15,
    status: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=80&h=80&fit=crop',
  },
  {
    id: 5,
    name: 'Eggs Pack of 12',
    sku: 'GG-EGG-12',
    category: 'Dairy',
    stock: 76,
    price: 84,
    discount: 8,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=80&h=80&fit=crop',
  },
  {
    id: 6,
    name: 'Amul Butter 500g',
    sku: 'GG-BUT-500',
    category: 'Dairy',
    stock: 8,
    price: 275,
    discount: 12,
    status: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=80&h=80&fit=crop',
  },
  {
    id: 7,
    name: 'Basmati Rice 5kg',
    sku: 'GG-RIC-5KG',
    category: 'Staples',
    stock: 5,
    price: 620,
    discount: 20,
    status: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=80&h=80&fit=crop',
  },
  {
    id: 8,
    name: 'Green Tea 100 bags',
    sku: 'GG-TEA-100',
    category: 'Beverages',
    stock: 0,
    price: 299,
    discount: 0,
    status: 'Out of Stock',
    image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=80&h=80&fit=crop',
  },
]

export const stores = [
  { id: 's1', name: 'GreenGrocc — Andheri West' },
  { id: 's2', name: 'GreenGrocc — Bandra East' },
  { id: 's3', name: 'GreenGrocc — Powai Hub' },
]

export const notifications = [
  { id: 1, title: 'New order received', desc: 'ORD-78421 · ₹842', time: '2m ago', unread: true },
  { id: 2, title: 'Low stock alert', desc: 'Amul Butter 500g is below threshold', time: '18m ago', unread: true },
  { id: 3, title: 'Refund requested', desc: 'ORD-78390 · Customer raised return', time: '1h ago', unread: false },
]
