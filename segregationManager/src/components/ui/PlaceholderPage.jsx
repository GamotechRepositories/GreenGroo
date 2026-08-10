import { PageShell } from '../layout/SegregationManagerLayout'

export default function PlaceholderPage({ title, subtitle, description }) {
  return (
    <PageShell title={title} subtitle={subtitle}>
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-base font-medium text-gray-900">{title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          {description || 'This section is ready for implementation.'}
        </p>
      </div>
    </PageShell>
  )
}
