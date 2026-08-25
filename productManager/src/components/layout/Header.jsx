export default function Header({ title, subtitle }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      <span className="flex items-center gap-2 rounded-full bg-green-light px-4 py-1.5 text-sm font-medium text-green-primary">
        <span className="h-2 w-2 rounded-full bg-green-primary" />
        Panel active
      </span>
    </header>
  );
}
