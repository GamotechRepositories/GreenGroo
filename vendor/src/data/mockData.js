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
  { name: 'Organic Bananas', sales: 1240, revenue: 84320, color: '#2E7D32' },
  { name: 'Farm Fresh Milk', sales: 980, revenue: 60760, color: '#43A047' },
  { name: 'Brown Bread', sales: 860, revenue: 38700, color: '#66BB6A' },
  { name: 'Tomatoes 1kg', sales: 720, revenue: 28800, color: '#81C784' },
  { name: 'Eggs Pack 12', sales: 640, revenue: 53760, color: '#A5D6A7' },
]

export const orderStats = [
  { name: 'Delivered', value: 68, color: '#2E7D32' },
  { name: 'Processing', value: 18, color: '#6B7280' },
  { name: 'Pending', value: 10, color: '#9CA3AF' },
  { name: 'Cancelled', value: 4, color: '#D1D5DB' },
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

export const recentReviews = [
  {
    id: 'REV-901',
    customer: 'Ananya Sharma',
    product: 'Organic Bananas 1kg',
    rating: 5,
    comment: 'Fresh and delivered fast!',
    time: '1h ago',
  },
  {
    id: 'REV-900',
    customer: 'Rahul Mehta',
    product: 'Farm Fresh Milk 1L',
    rating: 4,
    comment: 'Good quality, packaging could improve.',
    time: '3h ago',
  },
  {
    id: 'REV-899',
    customer: 'Priya Nair',
    product: 'Brown Bread',
    rating: 5,
    comment: 'Soft and fresh every time.',
    time: '5h ago',
  },
  {
    id: 'REV-898',
    customer: 'Vikram Singh',
    product: 'Eggs Pack 12',
    rating: 3,
    comment: 'One egg was cracked on arrival.',
    time: 'Yesterday',
  },
]

export const pendingRefunds = [
  {
    id: 'REF-221',
    orderId: 'ORD-78390',
    customer: 'Sneha Patel',
    amount: 420,
    reason: 'Damaged item',
    status: 'Pending',
  },
  {
    id: 'REF-220',
    orderId: 'ORD-78355',
    customer: 'Amit Joshi',
    amount: 180,
    reason: 'Wrong product',
    status: 'Pending',
  },
  {
    id: 'REF-219',
    orderId: 'ORD-78312',
    customer: 'Neha Kapoor',
    amount: 620,
    reason: 'Late delivery',
    status: 'Processing',
  },
  {
    id: 'REF-218',
    orderId: 'ORD-78280',
    customer: 'Karan Desai',
    amount: 95,
    reason: 'Missing item',
    status: 'Pending',
  },
]

export const notifications = [
  { id: 1, title: 'New order received', desc: 'ORD-78421 · ₹842', time: '2m ago', unread: true },
  { id: 2, title: 'Low stock alert', desc: 'Amul Butter 500g is below threshold', time: '18m ago', unread: true },
  { id: 3, title: 'Refund requested', desc: 'ORD-78390 · Customer raised return', time: '1h ago', unread: false },
  { id: 4, title: 'Payout processed', desc: '₹42,500 credited to wallet', time: '3h ago', unread: false },
]
