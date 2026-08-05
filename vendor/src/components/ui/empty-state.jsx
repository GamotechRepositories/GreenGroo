import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({
  title = 'No records found',
  description = 'Try adjusting filters or search keywords.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cream">
        <Inbox className="h-7 w-7 text-text-secondary" />
      </div>
      <h3 className="text-base font-bold text-text-primary">{title}</h3>
      <p className="mt-1 max-w-sm text-sm font-medium text-text-secondary">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
