import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutFarmer } from "../../store/farmerSlice";
import { VERIFICATION_STATUS } from "../../utils/constants";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
} from "../../utils/excelStyles";

function VerificationPill({ status }) {
  if (status === VERIFICATION_STATUS.APPROVED) {
    return (
      <span className="border border-[#D4D4D4] bg-[#F2F2F2] px-2 py-0.5 text-xs font-semibold text-emerald-700">
        Verified
      </span>
    );
  }
  if (status === VERIFICATION_STATUS.REJECTED) {
    return (
      <span className="border border-[#D4D4D4] bg-[#F2F2F2] px-2 py-0.5 text-xs font-semibold text-red-600">
        Rejected
      </span>
    );
  }
  return (
    <span className="border border-[#D4D4D4] bg-[#F2F2F2] px-2 py-0.5 text-xs font-semibold text-amber-700">
      Pending
    </span>
  );
}

function FarmerHeader({ onOpenSidebar, searchValue, onSearchChange, searchPlaceholder }) {
  const dispatch = useDispatch();
  const farmer = useSelector((s) => s.farmer.farmer);

  return (
    <header className="sticky top-0 z-30 border-b border-[#D4D4D4] bg-white">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 lg:px-4">
        <button type="button" onClick={onOpenSidebar} className={`${EXCEL_BTN} lg:hidden`}>
          Menu
        </button>

        <div className="relative min-w-[180px] flex-1">
          <input
            type="search"
            value={searchValue || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder || "Search products, orders..."}
            className={EXCEL_INPUT}
          />
        </div>

        <VerificationPill status={farmer?.verificationStatus} />

        <button type="button" className={`${EXCEL_BTN} relative`} aria-label="Notifications">
          🔔
        </button>

        <Link
          to="/farmer/profile"
          className={`${EXCEL_BTN} hidden items-center gap-2 sm:inline-flex`}
        >
          <span className="flex h-6 w-6 items-center justify-center border border-[#D4D4D4] bg-[#F2F2F2] text-xs font-bold text-[#217346]">
            {(farmer?.name || "F").charAt(0)}
          </span>
          <span className="text-xs font-semibold">{farmer?.name || "Farmer"}</span>
        </Link>

        <button type="button" onClick={() => dispatch(logoutFarmer())} className={EXCEL_BTN_PRIMARY}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default FarmerHeader;
