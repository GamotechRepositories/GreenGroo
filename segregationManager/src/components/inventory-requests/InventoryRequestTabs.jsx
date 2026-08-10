import { INVENTORY_REQUEST_TABS } from '../../data/inventoryRequests'

export default function InventoryRequestTabs({ activeTab, counts, onTabChange }) {
  return (
    <div className="border-b border-gray-100 px-5 pt-4">
      <div className="flex flex-wrap gap-2">
        {INVENTORY_REQUEST_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-green-primary bg-green-light/40 text-green-primary'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 ring-1 ring-gray-200">
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
