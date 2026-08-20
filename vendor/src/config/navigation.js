import {
  LayoutDashboard,
  Sprout,
  Users,
  UserPlus,
  PlusCircle,
  Settings,
  Shield,
  User,
} from 'lucide-react'

/**
 * Vendor navigation tree focused strictly on Farmer Manager system.
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
    label: 'Farmer Manager',
    icon: Sprout,
    children: [
      { label: 'All Managers', path: '/farmer-manager/managers', permission: 'farmerManager.view' },
      { label: 'Add New Manager', path: '/farmer-manager/managers/add', permission: 'farmerManager.create' },
      { label: 'All Farmers', path: '/farmer-manager/farmers', permission: 'farmerManager.view' },
    ],
  },
  {
    type: 'group',
    label: 'Account & Settings',
    icon: Settings,
    children: [
      { label: 'Vendor Profile', path: '/settings/profile', permission: 'settings.view' },
      { label: 'Security & Password', path: '/settings/security', permission: 'settings.security' },
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
  if (pathname === '/') return 'Farmer Manager Overview'
  if (pathname.startsWith('/farmer-manager/managers/') && pathname.includes('/farmers/add')) {
    return 'Add New Farmer'
  }
  if (pathname.match(/^\/farmer-manager\/managers\/[^/]+\/edit$/)) return 'Edit Manager'
  if (pathname.match(/^\/farmer-manager\/managers\/[^/]+$/)) return 'Manager Profile'
  if (pathname === '/farmer-manager/managers/add') return 'Add Manager'
  if (pathname.match(/^\/farmer-manager\/farmers\/[^/]+\/products\/[^/]+$/)) return 'Farmer Product Details'
  if (pathname.match(/^\/farmer-manager\/farmers\/[^/]+$/)) return 'Farmer Profile'
  if (pathname === '/farmer-manager/farmers') return 'Registered Farmers'
  if (pathname === '/farmer-manager/managers') return 'Manager Directory'

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
  if (pathname.startsWith('/farmer-manager')) return 'Farmer Manager'
  for (const item of NAVIGATION) {
    if (
      item.type === 'group' &&
      item.children?.some((c) => pathname === c.path || pathname.startsWith(`${c.path}/`))
    ) {
      return item.label
    }
  }
  return null
}
