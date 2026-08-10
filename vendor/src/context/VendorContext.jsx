import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const VendorContext = createContext(null)

const OWNER_PERMISSIONS = ['*']

const STAFF_PERMISSIONS = [
  'dashboard.view',
  'products.view',
  'products.create',
  'products.edit',
  'orders.view',
  'inventory.view',
  'customers.view',
  'enquiries.view',
  'notifications.view',
  'support.view',
  'farmerManager.view',
  'farmerManager.create',
  'farmerManager.edit',
]

export function VendorProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('vendor-theme') || 'light')
  const [role, setRole] = useState('owner') // owner | staff
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('vendor-theme', theme)
  }, [theme])

  const permissions = role === 'owner' ? OWNER_PERMISSIONS : STAFF_PERMISSIONS

  const can = useCallback(
    (permission) => {
      if (!permission) return true
      if (permissions.includes('*')) return true
      return permissions.includes(permission)
    },
    [permissions],
  )

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  const toast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      role,
      setRole,
      can,
      toast,
      toasts,
      dismissToast,
      vendor: {
        id: 'vendor-1',
        name: 'Ravi Kumar',
        email: 'ravi@greengroo.store',
        store: 'GreenGroo — Andheri West',
        initials: 'RK',
      },
    }),
    [theme, toggleTheme, role, can, toast, toasts, dismissToast],
  )

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>
}

export function useVendor() {
  const ctx = useContext(VendorContext)
  if (!ctx) throw new Error('useVendor must be used within VendorProvider')
  return ctx
}
