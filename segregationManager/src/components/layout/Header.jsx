import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

export default function Header({ title, subtitle }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 rounded-full bg-green-light px-4 py-1.5 text-sm font-medium text-green-primary">
          <span className="h-2 w-2 rounded-full bg-green-primary" />
          Panel active
        </span>
        <Link
          to="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-green-100 hover:text-green-700"
        >
          <Icon name="user" size="sm" />
        </Link>
      </div>
    </header>
  )
}
