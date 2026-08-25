import { Link } from "react-router-dom";
import { useLocation } from "../../context/LocationContext";
import { useNearestStore } from "../../hooks/useNearestStore";
import { formatDeliveryLine } from "../../utils/detectCurrentLocation";

function HomeDeliveryHeader() {
  const { location, hasLocation } = useLocation();
  const { data: nearest } = useNearestStore();
  const storeName = nearest?.store?.storeName;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <Link to="/location" className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          Deliver to
        </p>
        <div className="flex items-center gap-1">
          <p className="truncate text-sm font-bold text-text-primary">
            {hasLocation ? location.label || location.city || "Current location" : "Select location"}
            {location.pincode ? ` · ${location.pincode}` : ""}
          </p>
          <svg className="h-4 w-4 shrink-0 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p className="truncate text-xs text-text-secondary">
          {hasLocation
            ? [formatDeliveryLine(location), storeName ? `From ${storeName}` : ""]
                .filter(Boolean)
                .join(" · ")
            : "Use current location to see this store’s inventory"}
        </p>
      </Link>

      <Link
        to="/profile"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      </Link>
    </div>
  );
}

export default HomeDeliveryHeader;
