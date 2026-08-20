import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, ArrowRight, Eye, EyeOff, ShieldCheck, TrendingUp, Zap, Truck, CheckCircle2 } from 'lucide-react'
import { useVendor } from '@/context/VendorContext'

export default function SigninPage() {
  const navigate = useNavigate()
  const { login } = useVendor()

  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!emailOrPhone.trim()) {
      setError('Please enter your mobile number or email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    try {
      setLoading(true)
      const res = await login({ emailOrPhone, password })
      if (res.success) {
        navigate('/', { replace: true })
      } else {
        setError(res.message || 'Invalid credentials')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setEmailOrPhone('9876543210')
    setPassword('vendor123')
    try {
      setLoading(true)
      const res = await login({ emailOrPhone: '9876543210', password: 'vendor123' })
      if (res.success) {
        navigate('/', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-800">
        {/* Left Side: Features Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-700 via-green-800 to-emerald-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-green-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                <Store className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white">GreenGrocc</h2>
                <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Seller Portal</p>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <h3 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                Grow your local grocery & fresh store business online.
              </h3>
              <p className="text-sm text-emerald-100/90 leading-relaxed font-normal">
                Manage orders, product stock, farmer networks, and daily payouts seamlessly in one powerful vendor hub.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-10 pt-8 border-t border-white/15 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-emerald-300" />
              </div>
              <span className="text-xs font-semibold text-emerald-100">Reach 50,000+ active neighborhood customers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-emerald-300" />
              </div>
              <span className="text-xs font-semibold text-emerald-100">Instant order notifications & 10-min dispatch</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Truck className="h-4 w-4 text-emerald-300" />
              </div>
              <span className="text-xs font-semibold text-emerald-100">Direct Farmer Manager network integration</span>
            </div>
          </div>
        </div>

        {/* Right Side: Signin Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Vendor Access
              </span>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer underline"
              >
                ⚡ Demo 1-Click Login
              </button>
            </div>

            <div className="mt-6">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Vendor Sign In
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your vendor mobile number or email to manage your store catalog
              </p>
            </div>

            {error && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number or Email Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210 or ravi@greengroo.store"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Account Password *
                  </label>
                  <span className="text-[11px] font-medium text-slate-400 cursor-pointer hover:underline">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>Sign In to Seller Central</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Want to sell your store products on GreenGrocc?{' '}
              <Link to="/signup" className="font-extrabold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline">
                Register New Vendor Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
