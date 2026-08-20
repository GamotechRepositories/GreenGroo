import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff, Building2, MapPin, Phone, Mail, Lock, User } from 'lucide-react'
import { useVendor } from '@/context/VendorContext'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useVendor()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    shopName: '',
    shopAddress: '',
    gstNumber: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const nameTrimmed = formData.name.trim()
    const phoneTrimmed = formData.phone.trim()
    const shopTrimmed = formData.shopName.trim()

    if (!nameTrimmed) {
      setError('Please enter your full name (1 or 2 words, e.g. Rahul Sharma).')
      return
    }

    if (!/^[6789]\d{9}$/.test(phoneTrimmed)) {
      setError('Phone number must be a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).')
      return
    }

    if (!shopTrimmed) {
      setError('Please enter your store or shop name.')
      return
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      setLoading(true)
      const res = await signup(formData)
      if (res.success) {
        navigate('/', { replace: true })
      } else {
        setError(res.message || 'Registration failed')
      }
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-800">
        {/* Left Side Info Showcase */}
        <div className="lg:col-span-4 bg-gradient-to-br from-emerald-800 via-green-900 to-emerald-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Store className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white">GreenGrocc</h2>
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Partner Onboarding</p>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <h3 className="text-2xl font-black leading-tight tracking-tight">
                Become an Authorized Vendor Partner
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Join our hyperlocal grocery & fresh produce store network and start receiving neighborhood orders in minutes.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/15 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
              <span>Zero onboarding setup fees</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
              <span>Dedicated Store & Inventory Manager</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
              <span>Farmer Manager network connection</span>
            </div>
          </div>
        </div>

        {/* Right Side Signup Form */}
        <div className="lg:col-span-8 p-8 sm:p-10 bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                New Seller Registration
              </span>
              <Link to="/signin" className="text-xs font-bold text-emerald-600 hover:underline">
                Already registered? Sign In
              </Link>
            </div>

            <div className="mt-4">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Register Store Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Fill in your details to start selling on GreenGrocc Seller Portal
              </p>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Owner Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Ravi Kumar"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number (10 digits) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. ravi@greengroo.store"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Store / Shop Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="shopName"
                      required
                      placeholder="e.g. GreenGrocc — Andheri West"
                      value={formData.shopName}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Shop Address & Locality *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="shopAddress"
                      required
                      placeholder="e.g. Shop 12, Link Road, Andheri West"
                      value={formData.shopAddress}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GST Number (optional)
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    maxLength={15}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Account Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-9 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Vendor Account...
                  </span>
                ) : (
                  <>
                    <span>Create Vendor Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have a vendor account?{' '}
              <Link to="/signin" className="font-extrabold text-emerald-600 hover:underline">
                Sign In to Seller Central
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
