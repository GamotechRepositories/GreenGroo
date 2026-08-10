import { Link } from "react-router-dom";
import { LOGO_URL } from "../layout/Header";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLocation } from "../../context/LocationContext";
import UserAccountDropdown from "../account/UserAccountDropdown";
import DesktopSearchBar from "./DesktopSearchBar";

function TopNav() {
  const { user, openAuthModal } = useAuth();
  const { cartCount } = useCart();
  const { location } = useLocation();

  const addressLine = [location.label, location.address, location.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 hidden border-b border-[#F0F0F0] bg-white lg:block">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-4 px-5 xl:gap-6 xl:px-8">
        {/* Logo */}
        <Link to="/" className="flex h-full shrink-0 items-center pr-4 xl:pr-5">
          <img
            src={LOGO_URL}
            alt="GreenGrocc"
            className="h-10 w-auto object-contain xl:h-11"
          />
        </Link>

        <div className="h-10 w-px shrink-0 bg-[#E8E8E8]" aria-hidden="true" />

        {/* Delivery location */}
        <Link
          to="/location"
          className="group flex min-w-0 max-w-[220px] shrink-0 flex-col justify-center py-1 xl:max-w-[260px]"
        >
          <p className="text-[15px] font-extrabold leading-tight text-text-primary">
            Delivery in 15 minutes
          </p>
          <span className="mt-0.5 flex min-w-0 items-center gap-1">
            <span className="truncate text-[13px] font-medium text-text-secondary group-hover:text-text-primary">
              {addressLine || "Select your delivery location"}
            </span>
            <svg
              className="h-3.5 w-3.5 shrink-0 text-text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </Link>

        {/* Search */}
        <DesktopSearchBar className="mx-2 min-w-0 flex-1" />

        {/* Login / Account */}
        <div className="flex shrink-0 items-center gap-4 xl:gap-5">
          {user ? (
            <UserAccountDropdown user={user} />
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="text-[15px] font-semibold text-[#363636] transition hover:text-text-primary"
            >
              Login
            </button>
          )}

          {/* My Cart */}
          <Link
            to="/cart"
            data-cart-target="desktop"
            className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-[#0C831F] px-3.5 text-white transition hover:bg-[#097019]"
            aria-label={`My Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
          >
            <span className="relative inline-flex">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
              {cartCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#0C831F]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </span>
            <span className="h-5 w-px bg-white/35" aria-hidden="true" />
            <span className="text-sm font-bold tracking-wide">My Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
