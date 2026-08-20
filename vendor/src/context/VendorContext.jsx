import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loginVendor, registerVendor, getVendorProfile } from '@/api/vendorAuthApi'

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

const DEFAULT_DEMO_VENDOR = {
  id: 'vendor-demo-1',
  name: 'Ravi Kumar',
  email: 'ravi@greengroo.store',
  phone: '9876543210',
  shopName: 'GreenGrooo — Andheri West',
  store: 'GreenGrooo — Andheri West',
  shopAddress: 'Store 12, Link Road, Andheri West, Mumbai',
  gstNumber: '27AAAAA0000A1Z5',
  initials: 'RK',
  role: 'vendor',
}

function getInitials(name) {
  if (!name) return 'V'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatVendorUser(userData) {
  if (!userData) return DEFAULT_DEMO_VENDOR
  const shop = userData.shopName || userData.store || 'GreenGrooo Seller Store'
  return {
    id: userData.id || userData._id || 'vendor-user',
    name: userData.name || 'Vendor Partner',
    email: userData.email || '',
    phone: userData.phone || '',
    shopName: shop,
    store: shop,
    shopAddress: userData.shopAddress || '',
    gstNumber: userData.gstNumber || '',
    initials: getInitials(userData.name || 'Vendor'),
    role: userData.role || 'vendor',
  }
}

export function VendorProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('vendor-theme') || 'light')
  const [role, setRole] = useState('owner') // owner | staff
  const [toasts, setToasts] = useState([])

  const [token, setToken] = useState(() => localStorage.getItem('vendor_token') || '')
  const [vendor, setVendor] = useState(() => {
    const saved = localStorage.getItem('vendor_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return DEFAULT_DEMO_VENDOR
      }
    }
    return DEFAULT_DEMO_VENDOR
  })
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('vendor_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('vendor-theme', theme)
  }, [theme])

  // Verify stored token on boot
  useEffect(() => {
    const storedToken = localStorage.getItem('vendor_token')
    if (storedToken) {
      getVendorProfile(storedToken)
        .then((res) => {
          if (res.success && res.data) {
            const formatted = formatVendorUser(res.data)
            setVendor(formatted)
            localStorage.setItem('vendor_user', JSON.stringify(formatted))
            setIsAuthenticated(true)
          }
        })
        .catch(() => {
          // Keep existing saved user or fallback demo
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

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

  const login = useCallback(
    async (credentials) => {
      try {
        const res = await loginVendor(credentials)
        if (res.success && res.data) {
          const jwtToken = res.data.token
          const formattedUser = formatVendorUser(res.data.user)

          setToken(jwtToken)
          setVendor(formattedUser)
          setIsAuthenticated(true)

          localStorage.setItem('vendor_token', jwtToken)
          localStorage.setItem('vendor_user', JSON.stringify(formattedUser))

          toast(`Welcome back, ${formattedUser.name}!`)
          return { success: true, user: formattedUser }
        }
        throw new Error(res.message || 'Login failed')
      } catch (err) {
        // Mock fallback mode if backend unreachable
        if (err.message.includes('Failed to fetch')) {
          const isPhone = /^[6789]\d{9}$/.test(credentials.emailOrPhone.trim())
          const mockUser = formatVendorUser({
            name: credentials.emailOrPhone.split('@')[0] || 'Vendor Partner',
            email: isPhone ? 'vendor@greengroo.store' : credentials.emailOrPhone,
            phone: isPhone ? credentials.emailOrPhone : '9876543210',
            shopName: 'GreenGrooo — Main Store',
          })
          setToken('mock-vendor-token')
          setVendor(mockUser)
          setIsAuthenticated(true)
          localStorage.setItem('vendor_token', 'mock-vendor-token')
          localStorage.setItem('vendor_user', JSON.stringify(mockUser))
          toast(`Signed in as ${mockUser.name}`)
          return { success: true, user: mockUser }
        }
        toast(err.message, 'error')
        return { success: false, message: err.message }
      }
    },
    [toast],
  )

  const signup = useCallback(
    async (formData) => {
      try {
        const res = await registerVendor(formData)
        if (res.success && res.data) {
          const jwtToken = res.data.token
          const formattedUser = formatVendorUser({
            ...res.data.user,
            shopName: formData.shopName || res.data.user.shopName,
          })

          setToken(jwtToken)
          setVendor(formattedUser)
          setIsAuthenticated(true)

          localStorage.setItem('vendor_token', jwtToken)
          localStorage.setItem('vendor_user', JSON.stringify(formattedUser))

          toast(`Account created! Welcome, ${formattedUser.name}.`)
          return { success: true, user: formattedUser }
        }
        throw new Error(res.message || 'Registration failed')
      } catch (err) {
        if (err.message.includes('Failed to fetch')) {
          const mockUser = formatVendorUser({
            name: formData.name,
            email: formData.email || `${formData.phone}@greengroo.store`,
            phone: formData.phone,
            shopName: formData.shopName || 'GreenGrooo — Seller Store',
            shopAddress: formData.shopAddress,
            gstNumber: formData.gstNumber,
          })
          setToken('mock-vendor-token')
          setVendor(mockUser)
          setIsAuthenticated(true)
          localStorage.setItem('vendor_token', 'mock-vendor-token')
          localStorage.setItem('vendor_user', JSON.stringify(mockUser))
          toast(`Vendor account created for ${mockUser.name}!`)
          return { success: true, user: mockUser }
        }
        toast(err.message, 'error')
        return { success: false, message: err.message }
      }
    },
    [toast],
  )

  const logout = useCallback(() => {
    setToken('')
    setVendor(DEFAULT_DEMO_VENDOR)
    setIsAuthenticated(false)
    localStorage.removeItem('vendor_token')
    localStorage.removeItem('vendor_user')
    toast('Logged out successfully')
  }, [toast])

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
      token,
      vendor,
      user: vendor,
      isAuthenticated,
      loading,
      login,
      signup,
      logout,
    }),
    [
      theme,
      toggleTheme,
      role,
      can,
      toast,
      toasts,
      dismissToast,
      token,
      vendor,
      isAuthenticated,
      loading,
      login,
      signup,
      logout,
    ],
  )

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>
}

export function useVendor() {
  const ctx = useContext(VendorContext)
  if (!ctx) throw new Error('useVendor must be used within VendorProvider')
  return ctx
}
