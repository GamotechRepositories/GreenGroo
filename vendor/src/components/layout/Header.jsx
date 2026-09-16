export default function Header({ title, subtitle, rightElement }) {
  if (!title && !subtitle && !rightElement) return null;
  return (
    <header className="sticky top-0 z-10 hidden items-center justify-between border-b border-gray-100 bg-white px-6 py-4 lg:flex print:hidden">
      <div className="min-w-0">
        {title ? <h1 className="text-lg font-bold text-gray-900">{title}</h1> : null}
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {rightElement ? rightElement : null}
    </header>
  )
}
