import { Link } from "react-router-dom";
import { cardClass } from "../adminStyles";
import { formatNumber } from "./dashboardUtils";

const ITEMS = [
  {
    key: "activeProducts",
    label: "Active Products",
    to: "/products/show?status=active",
    color: "text-green-600",
  },
  {
    key: "outOfStock",
    label: "Out of Stock",
    to: "/products/show?status=out_of_stock",
    color: "text-red-600",
  },
  {
    key: "lowStock",
    label: "Low Stock",
    to: "/products/show?status=low_stock",
    color: "text-amber-600",
  },
  { key: "activeUsers", label: "Active Users", to: "/users", color: "text-blue-600" },
];

function StoreOverview({ overview = {}, loading }) {
  return (
    <div className={`${cardClass} h-full`}>
      <h3 className="mb-4 text-base font-semibold text-neutral-900">Store Overview</h3>
      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-4 transition hover:border-primary/20 hover:bg-white"
          >
            <p className="text-xs font-medium text-neutral-500">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold ${item.color}`}>
              {loading ? "—" : formatNumber(overview[item.key])}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default StoreOverview;
