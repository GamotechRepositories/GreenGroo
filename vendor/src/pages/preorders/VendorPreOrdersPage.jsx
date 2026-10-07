import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  MapPin,
  Phone,
  Search,
  Store,
  X,
} from 'lucide-react'
import { vendorApi } from '../../api/vendorApi'
import { useLive } from '../../realtime/useLive'
import EmptyState from '../../components/ui/EmptyState'
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TD, TH } from '../../utils/ui'

const TABS = [
  { key: 'awaiting', label: 'Awaiting confirmation', match: ['awaiting_vendor'] },
  { key: 'confirmed', label: 'Confirmed / preparing', match: ['confirmed', 'preparing'] },
  { key: 'to_store', label: 'On the way to store', match: ['dispatched'] },
  { key: 'at_store', label: 'At dark store', match: ['at_store'] },
  { key: 'delivering', label: 'Out for delivery', match: ['rider_assigned', 'out_for_delivery'] },
  { key: 'delivered', label: 'Delivered', match: ['delivered'] },
  { key: 'closed', label: 'Cancelled', match: ['cancelled', 'rejected', 'failed'] },
  { key: 'all', label: 'All', match: null },
]

const PROGRESS_TONE = {
  awaiting_vendor: 'border-amber-200 bg-amber-50 text-amber-800',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  preparing: 'border-sky-200 bg-sky-50 text-sky-800',
  dispatched: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  at_store: 'border-violet-200 bg-violet-50 text-violet-800',
  rider_assigned: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  out_for_delivery: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  delivered: 'border-emerald-300 bg-emerald-100 text-emerald-900',
  cancelled: 'border-slate-200 bg-slate-100 text-slate-600',
  rejected: 'border-red-200 bg-red-50 text-red-700',
  failed: 'border-red-200 bg-red-50 text-red-700',
}

const istDate = (offsetDays) =>
  new Date(Date.now() + 5.5 * 3600_000 + offsetDays * 86400_000).toISOString().slice(0, 10)
const money = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`
const fmtTime = (v) =>
  v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
const fmtDay = (d) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }) : '—'

function ProgressPill({ order }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
        PROGRESS_TONE[order.preOrderProgress] || PROGRESS_TONE.cancelled
      }`}
    >
      {order.preOrderProgressLabel || order.status}
    </span>
  )
}

function groupOrders(orders) {
  const zones = new Map()
  for (const order of orders) {
    const store = order.store || {}
    const zone = store.zone || 'Other'
    const city = store.city || 'Unknown city'
    const storeKey = store.id || order.managerId
    if (!zones.has(zone)) zones.set(zone, new Map())
    const cities = zones.get(zone)
    if (!cities.has(city)) cities.set(city, new Map())
    const stores = cities.get(city)
    if (!stores.has(storeKey)) stores.set(storeKey, { store, orders: [] })
    stores.get(storeKey).orders.push(order)
  }
  return [...zones.entries()].map(([zone, cities]) => ({
    zone,
    count: [...cities.values()].reduce((n, s) => n + [...s.values()].reduce((m, g) => m + g.orders.length, 0), 0),
    cities: [...cities.entries()].map(([city, stores]) => ({
      city,
      count: [...stores.values()].reduce((n, g) => n + g.orders.length, 0),
      stores: [...stores.values()],
    })),
  }))
}

function RejectDialog({ order, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (!reason.trim()) return toast.error('Please give a reason')
    setBusy(true)
    try {
      const res = await vendorApi.rejectPreOrder(order.id, reason.trim())
      toast.success(res.data?.message || 'Pre-order rejected')
      onDone()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not reject')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className={`${PANEL} w-full max-w-md p-5`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Reject pre-order #{order.orderNumber}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              The order is cancelled and {order.customerName || 'the customer'} is notified.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
        <textarea
          className={`${INPUT} mt-4 min-h-24`}
          placeholder="Reason (e.g. item out of season, supply not available for this slot)"
          value={reason}
          maxLength={300}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={BTN} onClick={onClose}>
            Keep order
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-600 bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? 'Rejecting…' : 'Reject order'}
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderDetail({ order }) {
  const steps = [
    ['Placed', order.createdAt, ''],
    ['Confirmed', order.vendorConfirmedAt, order.vendorActionByName],
    ['Forwarded by Product Manager', order.forwardedAt, order.forwardedByName],
    ['Received at dark store', order.storeReceivedAt, order.storeReceivedByName],
    ['Delivered', order.deliveredAt, ''],
  ]
  return (
    <div className="grid gap-4 bg-slate-50/70 px-4 py-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className={TH}>Item</th>
              <th className={`${TH} text-right`}>Qty</th>
              <th className={`${TH} text-right`}>Price</th>
              <th className={`${TH} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(order.items || []).map((item) => (
              <tr key={item.id || item.sku}>
                <td className={TD}>
                  <div className="font-medium text-slate-800">{item.name}</div>
                  {item.sku ? <div className="text-[11px] text-slate-400">{item.sku}</div> : null}
                </td>
                <td className={`${TD} text-right`}>
                  {item.quantity} {item.unit || ''}
                </td>
                <td className={`${TD} text-right`}>{money(item.price)}</td>
                <td className={`${TD} text-right font-medium`}>{money(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200 text-sm">
            <tr>
              <td className={TD} colSpan={3}>Items total</td>
              <td className={`${TD} text-right`}>{money(order.itemsTotal)}</td>
            </tr>
            {order.deliveryFee ? (
              <tr>
                <td className={TD} colSpan={3}>Delivery fee</td>
                <td className={`${TD} text-right`}>{money(order.deliveryFee)}</td>
              </tr>
            ) : null}
            <tr className="font-semibold text-slate-900">
              <td className={TD} colSpan={3}>Order total</td>
              <td className={`${TD} text-right`}>{money(order.orderTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="space-y-3 text-sm">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Deliver to</div>
          <div className="mt-1 font-medium text-slate-800">{order.customerName}</div>
          <div className="flex items-center gap-1 text-slate-600">
            <Phone size={12} /> {order.customerPhone || '—'}
          </div>
          <div className="mt-1 flex items-start gap-1 text-slate-600">
            <MapPin size={12} className="mt-0.5 shrink-0" /> {order.customerAddress || '—'}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Progress</div>
          <ol className="mt-2 space-y-1.5">
            {steps.map(([label, at, by]) => (
              <li key={label} className="flex items-start gap-2">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${at ? 'bg-emerald-600' : 'bg-slate-300'}`}
                />
                <span className={at ? 'text-slate-800' : 'text-slate-400'}>
                  {label}
                  {at ? <span className="text-slate-500"> · {fmtTime(at)}</span> : null}
                  {at && by ? <span className="text-slate-500"> · {by}</span> : null}
                </span>
              </li>
            ))}
          </ol>
          {order.assignedRider ? (
            <div className="mt-2 text-slate-600">
              Rider: <span className="font-medium text-slate-800">{order.assignedRider.name}</span>{' '}
              {order.assignedRider.phone ? `(${order.assignedRider.phone})` : ''}
            </div>
          ) : null}
          {order.vendorRejectReason ? (
            <div className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">
              Rejected: {order.vendorRejectReason}
            </div>
          ) : null}
          {order.preOrderNote ? (
            <div className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">
              PM note: {order.preOrderNote}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function StoreCard({ group, selected, onToggle, onToggleAll, onConfirm, onReject, busyIds }) {
  const [open, setOpen] = useState(true)
  const [expanded, setExpanded] = useState({})
  const { store, orders } = group
  const awaiting = orders.filter((o) => o.preOrderProgress === 'awaiting_vendor')
  const allChecked = awaiting.length > 0 && awaiting.every((o) => selected.has(o.id))

  return (
    <div className={`${PANEL} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Store size={16} className="text-emerald-700" />
          <div>
            <div className="text-sm font-semibold text-slate-900">{store.storeName || 'Dark store'}</div>
            <div className="text-xs text-slate-500">
              {[store.area, store.city, store.pincode].filter(Boolean).join(', ')}
              {store.managerName ? ` · Manager ${store.managerName}` : ''}
              {store.managerPhone ? ` (${store.managerPhone})` : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-200">
            {orders.length} order{orders.length === 1 ? '' : 's'}
          </span>
          {awaiting.length ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
              {awaiting.length} to confirm
            </span>
          ) : null}
        </div>
      </button>

      {open ? (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white">
              <tr className="border-b border-slate-100">
                <th className={`${TH} w-8`}>
                  <input
                    type="checkbox"
                    disabled={!awaiting.length}
                    checked={allChecked}
                    onChange={() => onToggleAll(awaiting.map((o) => o.id), !allChecked)}
                    title="Select all awaiting confirmation"
                  />
                </th>
                <th className={TH}>Order</th>
                <th className={TH}>Customer</th>
                <th className={TH}>Items</th>
                <th className={TH}>Delivery slot</th>
                <th className={TH}>Payment</th>
                <th className={TH}>Status</th>
                <th className={`${TH} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => {
                const canAct = order.preOrderProgress === 'awaiting_vendor'
                const canReject = order.status === 'preorder_hold' && ['', 'pending'].includes(order.preOrderStage || '')
                const isOpen = Boolean(expanded[order.id])
                const itemsCount = (order.items || []).reduce((n, i) => n + Number(i.quantity || 0), 0)
                return [
                  <tr key={order.id} className="align-top hover:bg-slate-50/60">
                    <td className={TD}>
                      <input
                        type="checkbox"
                        disabled={!canAct}
                        checked={selected.has(order.id)}
                        onChange={() => onToggle(order.id)}
                      />
                    </td>
                    <td className={TD}>
                      <button
                        type="button"
                        onClick={() => setExpanded((m) => ({ ...m, [order.id]: !isOpen }))}
                        className="flex items-center gap-1 font-semibold text-slate-900 hover:text-emerald-700"
                      >
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}#{order.orderNumber}
                      </button>
                      <div className="text-[11px] text-slate-400">Placed {fmtTime(order.createdAt)}</div>
                    </td>
                    <td className={TD}>
                      <div className="font-medium text-slate-800">{order.customerName}</div>
                      <div className="text-xs text-slate-500">{order.customerPhone}</div>
                      <div className="max-w-[220px] truncate text-xs text-slate-400" title={order.customerAddress}>
                        {order.customerAddress}
                      </div>
                    </td>
                    <td className={TD}>
                      <div className="max-w-[240px] text-xs text-slate-700">
                        {(order.items || [])
                          .slice(0, 3)
                          .map((i) => `${i.name} × ${i.quantity}`)
                          .join(', ')}
                        {(order.items || []).length > 3 ? ` +${order.items.length - 3} more` : ''}
                      </div>
                      <div className="text-[11px] text-slate-400">{itemsCount} units</div>
                    </td>
                    <td className={TD}>
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <CalendarClock size={13} className="text-emerald-700" /> {fmtDay(order.preOrderDate)}
                      </div>
                      <div className="text-xs text-slate-500">{order.preOrderSlot || '—'}</div>
                    </td>
                    <td className={TD}>
                      <div className="font-semibold text-slate-900">{money(order.orderTotal)}</div>
                      <div className="text-xs text-slate-500">
                        {order.paymentStatus === 'paid_online' ? 'Paid online' : order.paymentMethod === 'COD' ? 'Cash on delivery' : order.paymentMethod || '—'}
                      </div>
                    </td>
                    <td className={TD}>
                      <ProgressPill order={order} />
                      {order.vendorConfirmedAt ? (
                        <div className="mt-1 text-[11px] text-slate-400">Confirmed {fmtTime(order.vendorConfirmedAt)}</div>
                      ) : null}
                    </td>
                    <td className={`${TD} text-right`}>
                      <div className="flex justify-end gap-1.5">
                        {canAct ? (
                          <button
                            type="button"
                            disabled={busyIds.has(order.id)}
                            onClick={() => onConfirm([order.id])}
                            className={`${BTN_PRIMARY} min-h-8 gap-1 px-2.5 py-1 text-xs`}
                          >
                            <Check size={13} /> Confirm
                          </button>
                        ) : null}
                        {canReject ? (
                          <button
                            type="button"
                            onClick={() => onReject(order)}
                            className={`${BTN} min-h-8 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50`}
                          >
                            Reject
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>,
                  isOpen ? (
                    <tr key={`${order.id}-detail`}>
                      <td colSpan={8} className="p-0">
                        <OrderDetail order={order} />
                      </td>
                    </tr>
                  ) : null,
                ]
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

export default function VendorPreOrdersPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'awaiting'
  const dateMode = params.get('when') || 'upcoming'
  const customDate = params.get('date') || ''
  const zone = params.get('zone') || ''
  const city = params.get('city') || ''
  const storeId = params.get('store') || ''
  const slot = params.get('slot') || ''
  const [query, setQuery] = useState('')

  const [data, setData] = useState({ orders: [], stores: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [busyIds, setBusyIds] = useState(new Set())
  const [rejecting, setRejecting] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'zone') {
      next.delete('city')
      next.delete('store')
    }
    if (key === 'city') next.delete('store')
    setParams(next, { replace: true })
  }

  const apiDate =
    dateMode === 'today' ? istDate(0) : dateMode === 'tomorrow' ? istDate(1) : dateMode === 'date' ? customDate : ''

  useLive(
    async ({ silent }) => {
      if (!silent) setLoading(true)
      try {
        const res = await vendorApi.getPreOrders(apiDate ? { date: apiDate } : {})
        setData(res.data || {})
        setError('')
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load pre-orders')
      } finally {
        setLoading(false)
      }
    },
    [apiDate, reloadKey],
  )

  const stores = data.stores || []
  const zones = useMemo(() => [...new Set(stores.map((s) => s.zone))].sort(), [stores])
  const cities = useMemo(
    () => [...new Set(stores.filter((s) => !zone || s.zone === zone).map((s) => s.city))].sort(),
    [stores, zone],
  )
  const storeOptions = stores.filter((s) => (!zone || s.zone === zone) && (!city || s.city === city))
  const slots = useMemo(
    () => [...new Set((data.orders || []).map((o) => o.preOrderSlot).filter(Boolean))].sort(),
    [data.orders],
  )

  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data.orders || []).filter((o) => {
      const s = o.store || {}
      if (zone && s.zone !== zone) return false
      if (city && s.city !== city) return false
      if (storeId && s.id !== storeId) return false
      if (slot && o.preOrderSlot !== slot) return false
      if (!q) return true
      return [o.orderNumber, o.customerName, o.customerPhone, o.customerAddress, ...(o.items || []).map((i) => i.name)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [data.orders, zone, city, storeId, slot, query])

  const counts = useMemo(() => {
    const c = {}
    for (const t of TABS) c[t.key] = t.match ? scoped.filter((o) => t.match.includes(o.preOrderProgress)).length : scoped.length
    return c
  }, [scoped])

  const activeTab = TABS.find((t) => t.key === tab) || TABS[0]
  const visible = activeTab.match ? scoped.filter((o) => activeTab.match.includes(o.preOrderProgress)) : scoped
  const groups = useMemo(() => groupOrders(visible), [visible])
  const selectedVisible = [...selected].filter((id) =>
    visible.some((o) => o.id === id && o.preOrderProgress === 'awaiting_vendor'),
  )

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = (ids, on) =>
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)))
      return next
    })

  const confirm = async (ids) => {
    if (!ids.length) return
    setBusyIds((prev) => new Set([...prev, ...ids]))
    try {
      const res = await vendorApi.confirmPreOrders(ids)
      toast.success(res.data?.message || 'Confirmed')
      setSelected((prev) => {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      })
      setReloadKey((k) => k + 1)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not confirm')
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      })
    }
  }

  const summaryCards = [
    ['Awaiting confirmation', counts.awaiting, 'text-amber-700'],
    ['Confirmed / preparing', counts.confirmed, 'text-emerald-700'],
    ['On the way to store', counts.to_store, 'text-indigo-700'],
    ['At dark store', counts.at_store, 'text-violet-700'],
    ['Out for delivery', counts.delivering, 'text-cyan-700'],
    ['Delivered', counts.delivered, 'text-slate-900'],
  ]

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <div className={PAGE_KICKER}>Orders</div>
        <h1 className={PAGE_TITLE}>Pre-orders</h1>
        <p className={PAGE_SUB}>
          Next-day slot orders from customers for your dark stores, by zone, city and dark store. Confirm them so the
          Product Manager can prepare and send the goods to the store.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map(([label, value, tone]) => (
          <div key={label} className={`${PANEL} px-4 py-3`}>
            <div className="text-xs text-slate-500">{label}</div>
            <div className={`mt-1 text-2xl font-bold ${tone}`}>{value ?? 0}</div>
          </div>
        ))}
      </div>

      <div className={`${PANEL} space-y-3 p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          {[
            ['upcoming', 'All upcoming'],
            ['today', 'Today'],
            ['tomorrow', 'Tomorrow'],
            ['date', 'Pick date'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setParam('when', key === 'upcoming' ? '' : key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                dateMode === key
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
          {dateMode === 'date' ? (
            <input
              type="date"
              className={`${INPUT} w-auto py-1.5`}
              value={customDate}
              onChange={(e) => setParam('date', e.target.value)}
            />
          ) : null}
          <div className="relative ml-auto w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${INPUT} py-2 pl-8`}
              placeholder="Search order, customer, phone, item"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select className={INPUT} value={zone} onChange={(e) => setParam('zone', e.target.value)}>
            <option value="">All zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          <select className={INPUT} value={city} onChange={(e) => setParam('city', e.target.value)}>
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className={INPUT} value={storeId} onChange={(e) => setParam('store', e.target.value)}>
            <option value="">All dark stores</option>
            {storeOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.storeName} ({s.area})
              </option>
            ))}
          </select>
          <select className={INPUT} value={slot} onChange={(e) => setParam('slot', e.target.value)}>
            <option value="">All slots</option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setParam('tab', t.key)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              activeTab.key === t.key
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
              {counts[t.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <p className="text-sm text-slate-400">Loading pre-orders…</p>
      ) : !stores.length ? (
        <EmptyState
          title="No dark stores yet"
          description="Pre-orders appear here once the admin approves a dark store for you."
        />
      ) : !groups.length ? (
        <EmptyState title="No pre-orders here" description="Try another tab, date or location filter." />
      ) : (
        <div className="space-y-6">
          {groups.map((zoneGroup) => (
            <section key={zoneGroup.zone} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                  Zone
                </span>
                <h2 className="text-base font-semibold text-slate-900">{zoneGroup.zone}</h2>
                <span className="text-xs text-slate-500">{zoneGroup.count} orders</span>
              </div>
              {zoneGroup.cities.map((cityGroup) => (
                <div key={cityGroup.city} className="space-y-3 border-l-2 border-emerald-100 pl-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-emerald-700" />
                    <span className="font-semibold text-slate-800">{cityGroup.city}</span>
                    <span className="text-xs text-slate-500">
                      {cityGroup.stores.length} dark store{cityGroup.stores.length === 1 ? '' : 's'} · {cityGroup.count}{' '}
                      orders
                    </span>
                  </div>
                  {cityGroup.stores.map((group) => (
                    <StoreCard
                      key={group.store.id || group.orders[0].id}
                      group={group}
                      selected={selected}
                      onToggle={toggle}
                      onToggleAll={toggleAll}
                      onConfirm={confirm}
                      onReject={setRejecting}
                      busyIds={busyIds}
                    />
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      {selectedVisible.length ? (
        <div className="sticky bottom-4 z-30 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
          <span className="text-sm font-medium text-slate-700">
            {selectedVisible.length} pre-order{selectedVisible.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2">
            <button type="button" className={BTN} onClick={() => setSelected(new Set())}>
              Clear
            </button>
            <button type="button" className={`${BTN_PRIMARY} gap-1`} onClick={() => confirm(selectedVisible)}>
              <Check size={14} /> Confirm selected
            </button>
          </div>
        </div>
      ) : null}

      {rejecting ? (
        <RejectDialog
          order={rejecting}
          onClose={() => setRejecting(null)}
          onDone={() => {
            setRejecting(null)
            setReloadKey((k) => k + 1)
          }}
        />
      ) : null}
    </div>
  )
}
