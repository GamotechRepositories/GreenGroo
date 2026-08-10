import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutFarmer } from "../../store/farmerSlice";
import { VERIFICATION_STATUS } from "../../utils/constants";

function VerificationPill({ status }) {
  if (status === VERIFICATION_STATUS.APPROVED) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        🟢 Verified
      </span>
    );
  }
  if (status === VERIFICATION_STATUS.REJECTED) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        🔴 Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      🟡 Pending
    </span>
  );
}

function FarmerHeader({ onOpenSidebar, searchValue, onSearchChange, searchPlaceholder }) {
  const dispatch = useDispatch();
  const farmer = useSelector((s) => s.farmer.farmer);

  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm font-semibold lg:hidden"
        >
          Menu
        </button>

        <div className="relative min-w-[180px] flex-1">
          <input
            type="search"
            value={searchValue || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder || "Search products, orders..."}
            className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-2.5 pl-3 pr-3 text-sm text-[#1F2937] outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/15"
          />
        </div>

        <VerificationPill status={farmer?.verificationStatus} />

        <button
          type="button"
          className="relative rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
          aria-label="Notifications"
        >
          🔔
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#F59E0B]" />
        </button>

        <Link
          to="/farmer/profile"
          className="hidden items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-1.5 sm:inline-flex"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5E9] text-sm font-bold text-[#2E7D32]">
            {(farmer?.name || "F").charAt(0)}
          </span>
          <span className="text-sm font-semibold text-[#1F2937]">{farmer?.name || "Farmer"}</span>
        </Link>

        <button
          type="button"
          onClick={() => dispatch(logoutFarmer())}
          className="rounded-xl bg-[#2E7D32] px-3 py-2 text-sm font-semibold text-white hover:bg-[#256628]"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default FarmerHeader;
