import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Leaf, X } from 'lucide-react'
import { NAVIGATION, findActiveGroup } from '@/config/navigation'
import { useVendor } from '@/context/VendorContext'
import { cn } from '@/lib/utils'

function NavGroup({ item, open, onToggle, onNavigate }) {
  const { can } = useVendor()
  const visibleChildren = item.children.filter((c) => can(c.permission))
  if (!visibleChildren.length) return null

  const Icon = item.icon

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
          open
            ? 'bg-cream text-primary'
            : 'text-text-secondary hover:bg-cream hover:text-text-primary',
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0 text-gray-600" strokeWidth={2} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <ul className="overflow-hidden">
          <div className="ml-4 mt-1 space-y-0.5 border-l border-border py-1 pl-3">
            {visibleChildren.map((child) => (
              <li key={child.path}>
                <NavLink
                  to={child.path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-text-secondary hover:bg-cream hover:text-text-primary',
                    )
                  }
                >
                  {child.label}
                </NavLink>
              </li>
            ))}
          </div>
        </ul>
      </div>
    </li>
  )
}

export function Sidebar({ open, onClose }) {
  const { pathname } = useLocation()
  const { can } = useVendor()
  const [expanded, setExpanded] = useState(() => {
    const active = findActiveGroup(pathname)
    return active ? { [active]: true } : { Products: true }
  })

  useEffect(() => {
    const active = findActiveGroup(pathname)
    if (active) {
      setExpanded((prev) => ({ ...prev, [active]: true }))
    }
  }, [pathname])

  const toggle = (label) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-text-primary/30 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-sidebar shadow-[var(--shadow-soft)] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-5">
          <div className="flex items-center gap-2.5">
            <div className="soft-green-gradient flex h-9 w-9 items-center justify-center rounded-xl shadow-sm">
              <Leaf className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-text-primary">GreenGrocc</p>
              <p className="text-[11px] font-medium text-text-secondary">Seller Central</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-text-secondary transition hover:bg-muted lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="sidebar-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            Main menu
          </p>
          <ul className="space-y-1">
            {NAVIGATION.map((item) => {
              if (item.type === 'link') {
                if (!can(item.permission)) return null
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-text-secondary hover:bg-cream hover:text-text-primary',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'h-[18px] w-[18px]',
                              isActive ? 'text-white' : 'text-gray-600',
                            )}
                          />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              }

              return (
                <NavGroup
                  key={item.label}
                  item={item}
                  open={!!expanded[item.label]}
                  onToggle={() => toggle(item.label)}
                  onNavigate={onClose}
                />
              )
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-border p-4">
          <div className="rounded-xl border border-border bg-cream/80 p-3">
            <p className="text-xs font-bold text-text-primary">Pro Plan active</p>
            <p className="mt-0.5 text-[11px] font-medium text-text-secondary">
              Unlimited listings · Priority support
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
