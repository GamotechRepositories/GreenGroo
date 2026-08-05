import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useVendor } from '@/context/VendorContext'
import { cn } from '@/lib/utils'

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

export function ToastViewport() {
  const { toasts, dismissToast } = useVendor()

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[300] flex w-[min(100%-2rem,360px)] flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.type] || Info
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border bg-card px-4 py-3 shadow-[var(--shadow-soft)] animate-in',
              t.type === 'success' && 'border-success/30',
              t.type === 'error' && 'border-error/30',
              t.type === 'info' && 'border-border',
            )}
          >
            <Icon
              className={cn(
                'mt-0.5 h-5 w-5 shrink-0',
                t.type === 'success' && 'text-success',
                t.type === 'error' && 'text-error',
                t.type === 'info' && 'text-primary',
              )}
            />
            <p className="flex-1 text-sm font-medium text-text-primary">{t.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="rounded-full p-1 text-text-secondary hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
