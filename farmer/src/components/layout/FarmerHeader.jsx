import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { logoutFarmer, selectIsManager } from "../../store/farmerSlice";
import { VERIFICATION_STATUS } from "../../utils/constants";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_INPUT } from "../../utils/excelStyles";

function VerificationPill({ status }) {
  if (status === VERIFICATION_STATUS.APPROVED) {
    return (
      <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
        Verified
      </span>
    );
  }
  if (status === VERIFICATION_STATUS.REJECTED) {
    return (
      <span className="hidden rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 sm:inline-flex">
        Rejected
      </span>
    );
  }
  return (
    <span className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 sm:inline-flex">
      Pending
    </span>
  );
}

function FarmerHeader({ onOpenSidebar, searchValue, onSearchChange, searchPlaceholder }) {
  const dispatch = useDispatch();
  const farmer = useSelector((s) => s.farmer.farmer);
  const isManager = useSelector(selectIsManager);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5">
        <button type="button" onClick={onOpenSidebar} className={`${EXCEL_BTN} px-2.5 lg:hidden`} aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </button>

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchValue || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder || "Search products, orders..."}
            className={`${EXCEL_INPUT} pl-9`}
          />
        </div>

        <VerificationPill status={farmer?.verificationStatus} />

        <button type="button" className={`${EXCEL_BTN} relative px-2.5`} aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>

        <Link
          to={isManager ? "/farmer/manager/profile" : "/farmer/profile"}
          className={`${EXCEL_BTN} hidden items-center gap-2 pr-3 sm:inline-flex`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
            {(farmer?.name || (isManager ? "M" : "F")).charAt(0)}
          </span>
          <span className="max-w-[120px] truncate text-sm font-semibold">{farmer?.name || (isManager ? "Manager" : "Farmer")}</span>
        </Link>

        <button type="button" onClick={() => dispatch(logoutFarmer())} className={`${EXCEL_BTN_PRIMARY} gap-1.5 px-3`}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default FarmerHeader;
