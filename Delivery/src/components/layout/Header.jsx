import { Icon } from '../ui/Icon'

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
      <div className="flex items-center gap-4">
        <button type="button" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden">
          <Icon name="menu" size="md" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Good Morning, Rahul <span className="inline-block">👋</span>
          </h1>
          <p className="text-sm text-gray-500">Be safe and deliver happiness!</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 rounded-full bg-green-light px-4 py-1.5 text-sm font-medium text-green-primary">
          <span className="h-2 w-2 rounded-full bg-green-primary" />
          Online
        </span>

        <button type="button" className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100">
          <Icon name="bell" size="md" />
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            5
          </span>
        </button>

        <button type="button" className="rounded-full bg-gray-100 p-1">
          <img
            src="https://i.pravatar.cc/80?img=12"
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover"
          />
        </button>
      </div>
    </header>
  )
}
