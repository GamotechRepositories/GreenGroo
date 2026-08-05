import { Construction } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function PlaceholderPage({ title, description }) {
  return (
    <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
      <div className="soft-green-gradient mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm">
        <Construction className="h-7 w-7 text-white" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">{title}</h2>
      <p className="mt-2 max-w-md text-sm font-medium text-text-secondary">
        {description ||
          `${title} module UI is ready for wiring. Connect APIs and expand this screen next.`}
      </p>
      <Link to="/" className="mt-6">
        <Button variant="secondary" type="button">
          Back to Dashboard
        </Button>
      </Link>
    </Card>
  )
}
