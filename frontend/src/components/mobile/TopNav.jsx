import { Link } from "react-router-dom";
import { LOGO_URL } from "../layout/Header";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import UserAccountDropdown from "../account/UserAccountDropdown";
import DesktopSearchBar from "./DesktopSearchBar";
import { NavIconWrap } from "./NavIconWrap";
import { HeaderWhatsAppButton } from "./HeaderWhatsAppButton";
import { downloadAndroidApp } from "../../utils/appDownload";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

function TopNav() {
  const { user, openAuthModal } = useAuth();
  const { items, cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const cartTotal = items.reduce(
    (sum, item) => sum + item.discountedPrice * item.quantity,
    0
  );

  const handleWishlistClick = (e) => {
    if (!user) {
      e.preventDefault();
      openAuthModal("login");
    }
  };

  const handleCartClick = (e) => {
    if (!user) {
      e.preventDefault();
      openAuthModal("login");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 hidden bg-white lg:block">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-5 py-3 xl:gap-6 xl:px-8">
        <div className="flex shrink-0 items-center">
          <Link to="/" className="flex items-center">
            <img
              src={LOGO_URL}
              alt="GreenGrocc"
              className="h-11 w-auto object-contain xl:h-12"
            />
          </Link>
        </div>

        <DesktopSearchBar className="mx-2 min-w-0 flex-1 xl:mx-4" />

        <div className="flex shrink-0 items-center gap-1 xl:gap-2">
          <button
            type="button"
            onClick={downloadAndroidApp}
            className="group flex h-10 items-center overflow-hidden rounded-lg px-2.5 text-text-primary transition hover:text-primary"
            aria-label="Get app on Google Play"
          >
            <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m0 0l-2-2m2 2l2-2" />
            </svg>
            <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-200 group-hover:ml-2 group-hover:max-w-[120px] group-hover:opacity-100">
              Get on Play
            </span>
          </button>

          <HeaderWhatsAppButton />

          {user ? (
            <UserAccountDropdown user={user} />
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-text-primary transition hover:text-primary"
              aria-label="Login or Register"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </button>
          )}

          <Link
            to="/wishlist"
            data-wishlist-target="desktop"
            onClick={handleWishlistClick}
            className="relative flex h-10 w-10 items-center justify-center overflow-visible rounded-lg text-primary transition hover:text-primary-dark"
            aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
          >
            <NavIconWrap badge={wishlistCount}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </NavIconWrap>
          </Link>

          <Link
            to="/cart"
            data-cart-target="desktop"
            onClick={handleCartClick}
            className="relative flex h-10 items-center gap-1.5 overflow-visible rounded-lg px-2 text-text-primary transition hover:text-primary"
            aria-label={`Cart, ${cartCount} items, ${formatPrice(cartTotal)}`}
          >
            <NavIconWrap badge={cartCount}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </NavIconWrap>
            <span className="text-sm font-bold leading-none">{formatPrice(cartTotal)}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
