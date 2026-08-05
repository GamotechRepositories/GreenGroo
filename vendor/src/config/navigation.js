import {
  LayoutDashboard,
  Store,
  Package,
  Warehouse,
  ShoppingBag,
  Truck,
  Users,
  MessageSquare,
  Building2,
  Gift,
  Wallet,
  BarChart3,
  FileBarChart,
  UserCog,
  Star,
  Bell,
  Headphones,
  CreditCard,
  Settings,
} from 'lucide-react'

/**
 * Full vendor navigation tree.
 * Each leaf has: label, path, permission
 * Groups have: label, icon, children
 */
export const NAVIGATION = [
  {
    type: 'link',
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    permission: 'dashboard.view',
    end: true,
  },
  {
    type: 'group',
    label: 'Store Management',
    icon: Store,
    children: [
      { label: 'Store Profile', path: '/store/profile', permission: 'store.view' },
      { label: 'Store Information', path: '/store/information', permission: 'store.view' },
      { label: 'Store Banner', path: '/store/banner', permission: 'store.edit' },
      { label: 'Store Logo', path: '/store/logo', permission: 'store.edit' },
      { label: 'Business Hours', path: '/store/business-hours', permission: 'store.edit' },
      { label: 'Pickup Address', path: '/store/pickup-address', permission: 'store.edit' },
      { label: 'Warehouse', path: '/store/warehouse', permission: 'store.view' },
      { label: 'Brand Settings', path: '/store/brand-settings', permission: 'store.edit' },
      { label: 'Social Links', path: '/store/social-links', permission: 'store.edit' },
      { label: 'Theme Customization', path: '/store/theme', permission: 'store.edit' },
      { label: 'Vacation Mode', path: '/store/vacation-mode', permission: 'store.edit' },
    ],
  },
  {
    type: 'group',
    label: 'Products',
    icon: Package,
    children: [
      { label: 'All Products', path: '/products', permission: 'products.view' },
      { label: 'Add Product', path: '/products/add', permission: 'products.create' },
      { label: 'Draft Products', path: '/products/drafts', permission: 'products.view' },
      { label: 'Pending Approval', path: '/products/pending', permission: 'products.view' },
      { label: 'Rejected Products', path: '/products/rejected', permission: 'products.view' },
      { label: 'Product Reviews', path: '/products/reviews', permission: 'products.view' },
      { label: 'Product Variants', path: '/products/variants', permission: 'products.edit' },
      { label: 'Product Attributes', path: '/products/attributes', permission: 'products.edit' },
      { label: 'Categories', path: '/products/categories', permission: 'products.view' },
      { label: 'Brands', path: '/products/brands', permission: 'products.view' },
      { label: 'Tags', path: '/products/tags', permission: 'products.view' },
      { label: 'Bulk Upload CSV', path: '/products/bulk-upload', permission: 'products.create' },
      { label: 'Import Products', path: '/products/import', permission: 'products.create' },
      { label: 'Export Products', path: '/products/export', permission: 'products.export' },
      { label: 'SEO', path: '/products/seo', permission: 'products.edit' },
      { label: 'Barcode', path: '/products/barcode', permission: 'products.view' },
      { label: 'SKU Manager', path: '/products/sku-manager', permission: 'products.edit' },
    ],
  },
  {
    type: 'group',
    label: 'Inventory',
    icon: Warehouse,
    children: [
      { label: 'Stock Management', path: '/inventory/stock', permission: 'inventory.view' },
      { label: 'Warehouse', path: '/inventory/warehouse', permission: 'inventory.view' },
      { label: 'Batch Management', path: '/inventory/batches', permission: 'inventory.edit' },
      { label: 'Expiry Tracking', path: '/inventory/expiry', permission: 'inventory.view' },
      { label: 'Low Stock', path: '/inventory/low-stock', permission: 'inventory.view' },
      { label: 'Damaged Products', path: '/inventory/damaged', permission: 'inventory.edit' },
      { label: 'Price Management', path: '/inventory/pricing', permission: 'inventory.edit' },
      { label: 'Offer Management', path: '/inventory/offers', permission: 'inventory.edit' },
      { label: 'Inventory History', path: '/inventory/history', permission: 'inventory.view' },
      { label: 'Stock Adjustment', path: '/inventory/adjustment', permission: 'inventory.edit' },
    ],
  },
  {
    type: 'group',
    label: 'Orders',
    icon: ShoppingBag,
    children: [
      { label: 'All Orders', path: '/orders', permission: 'orders.view' },
      { label: 'New Orders', path: '/orders/new', permission: 'orders.view' },
      { label: 'Confirmed', path: '/orders/confirmed', permission: 'orders.view' },
      { label: 'Processing', path: '/orders/processing', permission: 'orders.view' },
      { label: 'Packed', path: '/orders/packed', permission: 'orders.view' },
      { label: 'Ready For Pickup', path: '/orders/ready-for-pickup', permission: 'orders.view' },
      { label: 'Out For Delivery', path: '/orders/out-for-delivery', permission: 'orders.view' },
      { label: 'Delivered', path: '/orders/delivered', permission: 'orders.view' },
      { label: 'Cancelled', path: '/orders/cancelled', permission: 'orders.view' },
      { label: 'Returns', path: '/orders/returns', permission: 'orders.returns' },
      { label: 'Refund Requests', path: '/orders/refunds', permission: 'orders.returns' },
      { label: 'Warranty Requests', path: '/orders/warranty', permission: 'orders.view' },
      { label: 'RMA', path: '/orders/rma', permission: 'orders.returns' },
      { label: 'Order Timeline', path: '/orders/timeline', permission: 'orders.view' },
      { label: 'Print Invoice', path: '/orders/print-invoice', permission: 'orders.export' },
    ],
  },
  {
    type: 'group',
    label: 'Shipping',
    icon: Truck,
    children: [
      { label: 'Pickup Requests', path: '/shipping/pickup-requests', permission: 'shipping.view' },
      { label: 'Courier Partners', path: '/shipping/couriers', permission: 'shipping.view' },
      { label: 'Shipping Labels', path: '/shipping/labels', permission: 'shipping.edit' },
      { label: 'Tracking', path: '/shipping/tracking', permission: 'shipping.view' },
      { label: 'Delivery Charges', path: '/shipping/charges', permission: 'shipping.edit' },
      { label: 'Delivery Zones', path: '/shipping/zones', permission: 'shipping.edit' },
      { label: 'Shiprocket', path: '/shipping/shiprocket', permission: 'shipping.integrations' },
      { label: 'Delhivery', path: '/shipping/delhivery', permission: 'shipping.integrations' },
    ],
  },
  {
    type: 'group',
    label: 'Customers',
    icon: Users,
    children: [
      { label: 'Customer List', path: '/customers', permission: 'customers.view' },
      { label: 'Customer Details', path: '/customers/details', permission: 'customers.view' },
      { label: 'Customer Orders', path: '/customers/orders', permission: 'customers.view' },
      { label: 'Customer Reviews', path: '/customers/reviews', permission: 'customers.view' },
      { label: 'Loyalty', path: '/customers/loyalty', permission: 'customers.view' },
      { label: 'Blacklist', path: '/customers/blacklist', permission: 'customers.edit' },
    ],
  },
  {
    type: 'group',
    label: 'Enquiries',
    icon: MessageSquare,
    children: [
      { label: 'Product Enquiries', path: '/enquiries/products', permission: 'enquiries.view' },
      { label: 'RFQ', path: '/enquiries/rfq', permission: 'enquiries.view' },
      { label: 'Quote Requests', path: '/enquiries/quotes', permission: 'enquiries.view' },
      { label: 'Live Chat', path: '/enquiries/live-chat', permission: 'enquiries.view' },
      { label: 'Messages', path: '/enquiries/messages', permission: 'enquiries.view' },
      { label: 'Enquiry History', path: '/enquiries/history', permission: 'enquiries.view' },
    ],
  },
  {
    type: 'group',
    label: 'Wholesale',
    icon: Building2,
    children: [
      { label: 'Wholesale Products', path: '/wholesale/products', permission: 'wholesale.view' },
      { label: 'Dealer Requests', path: '/wholesale/dealers', permission: 'wholesale.view' },
      { label: 'MOQ', path: '/wholesale/moq', permission: 'wholesale.edit' },
      { label: 'Bulk Pricing', path: '/wholesale/bulk-pricing', permission: 'wholesale.edit' },
      { label: 'B2B Customers', path: '/wholesale/b2b-customers', permission: 'wholesale.view' },
    ],
  },
  {
    type: 'group',
    label: 'Coupons & Marketing',
    icon: Gift,
    children: [
      { label: 'Coupons', path: '/marketing/coupons', permission: 'marketing.view' },
      { label: 'Offers', path: '/marketing/offers', permission: 'marketing.view' },
      { label: 'Flash Sale', path: '/marketing/flash-sale', permission: 'marketing.edit' },
      { label: 'Discount Rules', path: '/marketing/discount-rules', permission: 'marketing.edit' },
      { label: 'Campaigns', path: '/marketing/campaigns', permission: 'marketing.edit' },
      { label: 'Referral', path: '/marketing/referral', permission: 'marketing.view' },
      { label: 'Reward Points', path: '/marketing/reward-points', permission: 'marketing.view' },
    ],
  },
  {
    type: 'group',
    label: 'Finance',
    icon: Wallet,
    children: [
      { label: 'Dashboard', path: '/finance', permission: 'finance.view' },
      { label: 'Revenue', path: '/finance/revenue', permission: 'finance.view' },
      { label: 'Wallet', path: '/finance/wallet', permission: 'finance.view' },
      { label: 'Transactions', path: '/finance/transactions', permission: 'finance.view' },
      { label: 'Withdraw Requests', path: '/finance/withdrawals', permission: 'finance.edit' },
      { label: 'Payouts', path: '/finance/payouts', permission: 'finance.view' },
      { label: 'Commission', path: '/finance/commission', permission: 'finance.view' },
      { label: 'Invoice', path: '/finance/invoice', permission: 'finance.export' },
      { label: 'Tax Reports', path: '/finance/tax-reports', permission: 'finance.export' },
      { label: 'GST Reports', path: '/finance/gst-reports', permission: 'finance.export' },
    ],
  },
  {
    type: 'group',
    label: 'Analytics',
    icon: BarChart3,
    children: [
      { label: 'Sales Analytics', path: '/analytics/sales', permission: 'analytics.view' },
      { label: 'Revenue Analytics', path: '/analytics/revenue', permission: 'analytics.view' },
      { label: 'Product Analytics', path: '/analytics/products', permission: 'analytics.view' },
      { label: 'Customer Analytics', path: '/analytics/customers', permission: 'analytics.view' },
      { label: 'Store Visitors', path: '/analytics/visitors', permission: 'analytics.view' },
      { label: 'Conversion Rate', path: '/analytics/conversion', permission: 'analytics.view' },
      { label: 'Ratings Analytics', path: '/analytics/ratings', permission: 'analytics.view' },
    ],
  },
  {
    type: 'group',
    label: 'Reports',
    icon: FileBarChart,
    children: [
      { label: 'Sales Report', path: '/reports/sales', permission: 'reports.view' },
      { label: 'Order Report', path: '/reports/orders', permission: 'reports.view' },
      { label: 'Inventory Report', path: '/reports/inventory', permission: 'reports.view' },
      { label: 'Finance Report', path: '/reports/finance', permission: 'reports.view' },
      { label: 'Tax Report', path: '/reports/tax', permission: 'reports.view' },
      { label: 'Customer Report', path: '/reports/customers', permission: 'reports.view' },
      { label: 'Download CSV', path: '/reports/download-csv', permission: 'reports.export' },
      { label: 'Download PDF', path: '/reports/download-pdf', permission: 'reports.export' },
    ],
  },
  {
    type: 'group',
    label: 'Staff Manager',
    icon: UserCog,
    children: [
      { label: 'Staff List', path: '/staff', permission: 'staff.view' },
      { label: 'Add Staff', path: '/staff/add', permission: 'staff.create' },
      { label: 'Roles', path: '/staff/roles', permission: 'staff.roles' },
      { label: 'Permissions', path: '/staff/permissions', permission: 'staff.roles' },
      { label: 'Attendance', path: '/staff/attendance', permission: 'staff.view' },
      { label: 'Activity Logs', path: '/staff/activity-logs', permission: 'staff.view' },
    ],
  },
  {
    type: 'group',
    label: 'Reviews',
    icon: Star,
    children: [
      { label: 'Product Reviews', path: '/reviews/products', permission: 'reviews.view' },
      { label: 'Store Reviews', path: '/reviews/store', permission: 'reviews.view' },
      { label: 'Reply Reviews', path: '/reviews/reply', permission: 'reviews.edit' },
      { label: 'Report Reviews', path: '/reviews/report', permission: 'reviews.edit' },
    ],
  },
  {
    type: 'group',
    label: 'Notifications',
    icon: Bell,
    children: [
      { label: 'All Notifications', path: '/notifications', permission: 'notifications.view' },
      { label: 'Order Alerts', path: '/notifications/orders', permission: 'notifications.view' },
      { label: 'Stock Alerts', path: '/notifications/stock', permission: 'notifications.view' },
      { label: 'Payment Alerts', path: '/notifications/payments', permission: 'notifications.view' },
      { label: 'Customer Messages', path: '/notifications/messages', permission: 'notifications.view' },
    ],
  },
  {
    type: 'group',
    label: 'Support',
    icon: Headphones,
    children: [
      { label: 'Tickets', path: '/support/tickets', permission: 'support.view' },
      { label: 'Open Tickets', path: '/support/open', permission: 'support.view' },
      { label: 'Closed Tickets', path: '/support/closed', permission: 'support.view' },
      { label: 'FAQ', path: '/support/faq', permission: 'support.view' },
      { label: 'Contact Support', path: '/support/contact', permission: 'support.view' },
    ],
  },
  {
    type: 'group',
    label: 'Subscription',
    icon: CreditCard,
    children: [
      { label: 'Current Plan', path: '/subscription/current', permission: 'subscription.view' },
      { label: 'Upgrade Plan', path: '/subscription/upgrade', permission: 'subscription.edit' },
      { label: 'Billing', path: '/subscription/billing', permission: 'subscription.view' },
      { label: 'Payment History', path: '/subscription/history', permission: 'subscription.view' },
    ],
  },
  {
    type: 'group',
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'Profile', path: '/settings/profile', permission: 'settings.view' },
      { label: 'Security', path: '/settings/security', permission: 'settings.security' },
      { label: 'Change Password', path: '/settings/password', permission: 'settings.security' },
      { label: 'Notifications', path: '/settings/notifications', permission: 'settings.view' },
      { label: 'API Keys', path: '/settings/api-keys', permission: 'settings.security' },
      { label: 'Payment Settings', path: '/settings/payment', permission: 'settings.edit' },
      { label: 'Shipping Settings', path: '/settings/shipping', permission: 'settings.edit' },
      { label: 'Store Settings', path: '/settings/store', permission: 'settings.edit' },
    ],
  },
]

/** Flatten all leaf routes for router generation */
export function getAllRoutes() {
  const routes = []
  for (const item of NAVIGATION) {
    if (item.type === 'link') {
      routes.push({
        path: item.path,
        label: item.label,
        permission: item.permission,
        isDashboard: item.path === '/',
      })
    } else if (item.children) {
      for (const child of item.children) {
        routes.push({
          path: child.path,
          label: child.label,
          permission: child.permission,
          parent: item.label,
        })
      }
    }
  }
  return routes
}

export function getPageTitle(pathname) {
  if (pathname === '/') return 'Dashboard'
  for (const item of NAVIGATION) {
    if (item.type === 'link' && item.path === pathname) return item.label
    if (item.children) {
      const child = item.children.find((c) => c.path === pathname)
      if (child) return child.label
    }
  }
  return 'Vendor'
}

export function findActiveGroup(pathname) {
  for (const item of NAVIGATION) {
    if (item.type === 'group' && item.children?.some((c) => c.path === pathname)) {
      return item.label
    }
  }
  return null
}
