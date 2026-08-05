import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  ChevronDown,
  Globe,
  Menu,
  MessageSquare,
  Search,
  Store,
  User,
  LogOut,
  Settings,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { notifications, stores } from '@/data/mockData'
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
        'absolute right-0 top-full z-50 mt-2 min-w-[240px] overflow-hidden rounded-xl border border-border bg-white shadow-[var(--shadow-soft)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Navbar({ onMenuClick, pageTitle }) {
  const [store, setStore] = useState(stores[0])
  const [openMenu, setOpenMenu] = useState(null)

  const toggle = (key) => setOpenMenu((prev) => (prev === key ? null : key))
  const close = () => setOpenMenu(null)

  return (
    <header className="glass-header sticky top-0 z-30 border-b border-border/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
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
          <p className="truncate text-xs font-medium text-text-secondary">
            Manage your store performance in real time
          </p>
        </div>

        <div className="relative mx-auto hidden w-full max-w-md flex-1 lg:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search Products..."
            className="pl-10 bg-white/90"
            aria-label="Search products"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="relative lg:hidden">
            <Button variant="ghost" size="icon-sm" aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
          </div>

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
            <Dropdown open={openMenu === 'notify'} onClose={close} className="w-80">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-text-primary">Notifications</p>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="border-b border-border/70 px-4 py-3 transition hover:bg-cream/60 last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      {n.unread && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                      <div className={cn(!n.unread && 'pl-4')}>
                        <p className="text-sm font-semibold text-text-primary">{n.title}</p>
                        <p className="text-xs font-medium text-text-secondary">{n.desc}</p>
                        <p className="mt-1 text-[11px] text-text-secondary">{n.time}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
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
              <div className="px-4 py-6 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-text-secondary/50" />
                <p className="mt-2 text-sm font-semibold text-text-primary">No new messages</p>
                <p className="text-xs text-text-secondary">Customer chats will appear here</p>
              </div>
            </Dropdown>
          </div>

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
                  onClick={close}
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-text-primary transition hover:bg-cream"
                >
                  {lang}
                </button>
              ))}
            </Dropdown>
          </div>

          <div className="relative hidden md:block">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggle('store')}
              className="max-w-[200px] gap-1.5 bg-white/80"
            >
              <Store className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">{store.name.replace('GreenGroo — ', '')}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </Button>
            <Dropdown open={openMenu === 'store'} onClose={close} className="min-w-[240px]">
              {stores.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setStore(s)
                    close()
                  }}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium transition hover:bg-cream',
                    store.id === s.id ? 'text-primary' : 'text-text-primary',
                  )}
                >
                  {s.name}
                  {store.id === s.id && <Badge variant="success">Active</Badge>}
                </button>
              ))}
            </Dropdown>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => toggle('profile')}
              className="flex items-center gap-2 rounded-full border border-border bg-white/90 py-1 pl-1 pr-2.5 transition hover:border-primary/30 hover:shadow-sm"
            >
              <span className="soft-green-gradient flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white">
                RK
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-bold leading-tight text-text-primary">
                  Ravi Kumar
                </span>
                <span className="block text-[10px] font-medium text-text-secondary">
                  Store Owner
                </span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-text-secondary sm:block" />
            </button>
            <Dropdown open={openMenu === 'profile'} onClose={close} className="min-w-[200px]">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-text-primary">Ravi Kumar</p>
                <p className="text-xs text-text-secondary">ravi@greengroo.store</p>
              </div>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-cream"
              >
                <User className="h-4 w-4 text-gray-600" /> Profile
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-cream"
              >
                <Settings className="h-4 w-4 text-gray-600" /> Settings
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-sm font-medium text-error transition hover:bg-error/5"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </Dropdown>
          </div>
        </div>
      </div>
    </header>
  )
}
