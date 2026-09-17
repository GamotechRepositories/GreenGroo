import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import { useWishlist } from "../../context/WishlistContext";
import { LOGO_URL } from "../layout/Header";
import { NavIconWrap } from "./NavIconWrap";
import { HeaderWhatsAppButton } from "./HeaderWhatsAppButton";
import MobileMenuDrawer from "./MobileMenuDrawer";
import MobileSearchBar from "./MobileSearchBar";

function MobileHeader() {
  const { wishlistCount } = useWishlist();
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(72);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: allCategories = [] } = useCategoriesQuery();
  const categories = useMemo(
    () =>
      allCategories.filter(
        (cat) => cat.categoryName?.toLowerCase() !== "most purchase"
      ),
    [allCategories]
  );

  useLayoutEffect(() => {
    const node = headerRef.current;
    if (!node) return undefined;

    const updateHeight = () => {
      setHeaderHeight(node.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [searchOpen]);

  const toggleSearch = () => {
    setMenuOpen(false);
    setSearchOpen((prev) => !prev);
  };

  const openMenu = () => {
    setSearchOpen(false);
    setMenuOpen(true);
  };

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white px-4 pt-3 pb-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sm:px-6 md:px-8 lg:hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="shrink-0 transition-transform active:scale-95">
            <img
              src={LOGO_URL}
              alt="GreenGrocc"
              className="h-14 w-auto object-contain sm:h-[60px]"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 overflow-visible">
            <button
              type="button"
              onClick={toggleSearch}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                searchOpen ? "bg-[#0C831F]/10 text-[#0C831F]" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
              aria-label={searchOpen ? "Close search" : "Open search"}
              aria-expanded={searchOpen}
            >
              <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </button>

            <HeaderWhatsAppButton />

            <Link
              to="/wishlist"
              data-wishlist-target="mobile"
              className="relative flex h-10 w-10 items-center justify-center overflow-visible rounded-full bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100"
              aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
            >
              <NavIconWrap badge={wishlistCount}>
                <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </NavIconWrap>
            </Link>

            <button
              type="button"
              onClick={openMenu}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.75" />
                <circle cx="12" cy="12" r="1.75" />
                <circle cx="12" cy="19" r="1.75" />
              </svg>
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div className="mt-3">
            <MobileSearchBar
              className="w-full"
              autoFocus
              onSubmit={() => setSearchOpen(false)}
            />
          </div>
        ) : null}
      </header>

      <div
        className="shrink-0 lg:hidden"
        style={{ height: headerHeight }}
        aria-hidden="true"
      />

      <MobileMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
      />
    </>
  );
}

export default MobileHeader;
