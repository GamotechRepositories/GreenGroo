import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Globe,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Settings,
  Sun,
  User,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useVendor } from '@/context/VendorContext'
import { cn } from '@/lib/utils'

function Dropdown({ open, onClose, children, className }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        'absolute right-0 top-full z-50 mt-2 min-w-[240px] overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Navbar({ onMenuClick, pageTitle }) {
  const { theme, toggleTheme, vendor, toast, role, setRole, logout } = useVendor()
  const [openMenu, setOpenMenu] = useState(null)
  const [search, setSearch] = useState('')

  const toggle = (key) => setOpenMenu((prev) => (prev === key ? null : key))
  const close = () => setOpenMenu(null)

  return (
    <header className="glass-header sticky top-0 z-30 border-b border-border/80">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-full p-2 text-text-secondary transition hover:bg-muted lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 md:block">
          <h1 className="truncate text-lg font-bold text-text-primary">{pageTitle}</h1>
          <p className="truncate text-xs font-medium text-text-secondary">{vendor.store}</p>
        </div>

        <div className="relative mx-auto hidden w-full max-w-md flex-1 lg:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim()) {
                toast(`Searching for “${search.trim()}”`, 'info')
              }
            }}
            placeholder="Search products, orders, customers…"
            className="bg-white/90 pl-10"
            aria-label="Search"
          />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggle('notify')}
              aria-label="Notifications"
              className="relative"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error ring-2 ring-white" />
            </Button>
            <Dropdown open={openMenu === 'notify'} onClose={close} className="w-72">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-text-primary">Notifications</p>
              </div>
              <div className="p-6 text-center text-xs text-text-secondary">
                <Bell className="h-6 w-6 text-text-secondary mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-text-primary">No new notifications</p>
                <p className="mt-1 text-[11px]">System alerts will appear here</p>
              </div>
            </Dropdown>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggle('messages')}
              aria-label="Messages"
              className="relative"
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-white" />
            </Button>
            <Dropdown open={openMenu === 'messages'} onClose={close}>
              <div className="px-4 py-5 text-center">
                <p className="text-sm font-semibold text-text-primary">Messages</p>
                <p className="mt-1 text-xs text-text-secondary">3 unread customer chats</p>
                <Link
                  to="/enquiries/messages"
                  onClick={close}
                  className="mt-3 inline-block text-xs font-bold text-primary hover:underline"
                >
                  Open inbox
                </Link>
              </div>
            </Dropdown>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Theme toggle"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-gray-600" />
            ) : (
              <Sun className="h-5 w-5 text-amber-500" />
            )}
          </Button>

          <div className="relative hidden sm:block">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggle('lang')}
              className="gap-1.5 bg-white/80"
            >
              <Globe className="h-3.5 w-3.5" />
              EN
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Dropdown open={openMenu === 'lang'} onClose={close} className="min-w-[140px]">
              {['English', 'Hindi', 'Marathi'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    toast(`Language set to ${lang}`, 'info')
                    close()
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-text-primary transition hover:bg-cream"
                >
                  {lang}
                </button>
              ))}
            </Dropdown>
          </div>

          <Link
            to="/support/faq"
            className="hidden items-center gap-1.5 rounded-full border border-border bg-white/80 px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-primary/30 hover:text-primary md:inline-flex"
          >
            <CircleHelp className="h-3.5 w-3.5" />
            Help
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => toggle('profile')}
              className="flex items-center gap-2 rounded-full border border-border bg-white/90 py-1 pl-1 pr-2.5 transition hover:border-primary/30 hover:shadow-sm"
            >
              <span className="soft-green-gradient flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white">
                {vendor.initials}
              </span>
              <span className="hidden text-left lg:block">
                <span className="block text-xs font-bold leading-tight text-text-primary">
                  {vendor.name}
                </span>
                <span className="block text-[10px] font-medium capitalize text-text-secondary">
                  {role}
                </span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-text-secondary lg:block" />
            </button>
            <Dropdown open={openMenu === 'profile'} onClose={close} className="min-w-[220px]">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-text-primary">{vendor.name}</p>
                <p className="text-xs text-text-secondary">{vendor.email}</p>
              </div>
              <Link
                to="/settings/profile"
                onClick={close}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-cream"
              >
                <User className="h-4 w-4 text-gray-600" /> Vendor Profile
              </Link>
              <Link
                to="/settings/store"
                onClick={close}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-cream"
              >
                <Settings className="h-4 w-4 text-gray-600" /> Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setRole(role === 'owner' ? 'staff' : 'owner')
                  toast(`Switched to ${role === 'owner' ? 'staff' : 'owner'} role`, 'info')
                  close()
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-text-primary transition hover:bg-cream"
              >
                Switch role ({role === 'owner' ? '→ Staff' : '→ Owner'})
              </button>
              <button
                type="button"
                onClick={() => {
                  close()
                  logout()
                }}
                className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-sm font-medium text-error transition hover:bg-error/5 cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </Dropdown>
          </div>
        </div>
      </div>
    </header>
  )
}
