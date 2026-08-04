import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink } from "react-router-dom";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from "../../config/contact";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import Header from "./Header";
import ProductMegaMenu from "./ProductMegaMenu";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/blog", label: "Blog" },
];

const PRODUCT_PATH = "/product";
const PROMO_TAGS = ["most purchase"];

const bottomNavClass = ({ isActive }) =>
  `inline-flex items-center h-12 px-5 xl:px-6 text-xs font-semibold tracking-[0.15em] uppercase transition border-b-[3px] whitespace-nowrap ${
    isActive
      ? "text-accent border-accent"
      : "text-white border-transparent hover:text-accent"
  }`;

const mobileNavClass = ({ isActive }) =>
  `block py-2.5 font-medium uppercase tracking-wide transition ${
    isActive ? "text-accent" : "text-neutral-300 hover:text-accent"
  }`;

function Navbar() {
  const { user, logout, openAuthModal } = useAuth();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [productExpanded, setProductExpanded] = useState(false);
  const { data: categories = [] } = useCategoriesQuery();
  const headerBarRef = useRef(null);

  const menuCategories = useMemo(
    () =>
      categories.filter(
        (item) => !PROMO_TAGS.includes(item.categoryName?.trim().toLowerCase())
      ),
    [categories]
  );

  const updateMenuTop = () => {
    if (headerBarRef.current) {
      setMenuTop(headerBarRef.current.getBoundingClientRect().bottom);
    }
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    updateMenuTop();
    window.addEventListener("resize", updateMenuTop);
    return () => window.removeEventListener("resize", updateMenuTop);
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    setProductExpanded(false);
  };

  const closeProductMenu = () => setProductMenuOpen(false);

  const buildProductLink = (categoryName, subcategory) => {
    const params = new URLSearchParams({ categoryName });
    if (subcategory) params.set("subcategory", subcategory);
    return `${PRODUCT_PATH}?${params.toString()}`;
  };

  const handleLoginClick = () => {
    if (user) return;
    openAuthModal("login");
  };

  const mobileMenu =
    menuOpen &&
    createPortal(
      <>
        <button
          type="button"
          aria-label="Close menu"
          className="md:hidden fixed inset-0 z-[90] bg-black/50"
          style={{ top: menuTop }}
          onClick={closeMenu}
        />
        <div
          className="md:hidden fixed left-0 right-0 z-[100] bg-[#111111] border-t border-neutral-800 px-4 py-4 overflow-y-auto shadow-xl"
          style={{ top: menuTop, maxHeight: `calc(100vh - ${menuTop}px)` }}
        >
          <ul className="space-y-1 mb-4 border-b border-neutral-800 pb-4">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={mobileNavClass}
                  onClick={closeMenu}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}

            <li>
              <button
                type="button"
                onClick={() => setProductExpanded((open) => !open)}
                className="flex w-full items-center justify-between py-2.5 font-medium uppercase tracking-wide text-neutral-300 hover:text-accent transition"
              >
                Product
                <span
                  className={`text-accent transition-transform ${productExpanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {productExpanded && menuCategories.length > 0 && (
                <ul className="mt-1 mb-2 pl-3 border-l border-neutral-800 space-y-4">
                  {menuCategories.map((category) => (
                    <li key={category._id}>
                      <Link
                        to={buildProductLink(category.categoryName)}
                        onClick={closeMenu}
                        className="block text-sm font-semibold text-accent mb-2"
                      >
                        {category.categoryName}
                      </Link>
                      {category.subcategories?.length > 0 && (
                        <ul className="space-y-1.5 pl-2">
                          {category.subcategories.map((sub) => (
                            <li key={sub}>
                              <Link
                                to={buildProductLink(category.categoryName, sub)}
                                onClick={closeMenu}
                                className="block text-sm text-neutral-400 hover:text-accent transition"
                              >
                                {sub}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {productExpanded && menuCategories.length === 0 && (
                <Link
                  to={PRODUCT_PATH}
                  onClick={closeMenu}
                  className="block pl-3 py-1 text-sm text-neutral-400 hover:text-accent"
                >
                  View all products
                </Link>
              )}
            </li>
          </ul>

          <div className="space-y-3">
            <a
              href={CONTACT_PHONE_TEL}
              className="flex items-center gap-2 text-sm text-neutral-300 hover:text-accent transition"
            >
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {CONTACT_PHONE_DISPLAY}
            </a>

            <Link
              to="/cart"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  openAuthModal("login");
                }
                closeMenu();
              }}
              className="flex items-center gap-3 w-full rounded-lg border border-neutral-700 text-white px-4 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent transition"
            >
              <span className="relative inline-flex">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                {user && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] px-0.5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              My Cart
            </Link>

            {user ? (
              <>
                <p className="text-sm text-neutral-300">Hi, {user.name}</p>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="w-full rounded-lg border border-neutral-700 text-white px-4 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  openAuthModal("login");
                  closeMenu();
                }}
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-neutral-700 text-white px-4 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Login / Sign Up
              </button>
            )}

            <Link
              to="/contact"
              onClick={closeMenu}
              className="block w-full text-center rounded-lg bg-accent text-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:brightness-110 transition"
            >
              Bulk Enquiry
            </Link>
          </div>
        </div>
      </>,
      document.body
    );

  return (
    <>
      <div ref={headerBarRef}>
        <Header
          user={user}
          onLoginClick={handleLoginClick}
          onMenuToggle={() => setMenuOpen((o) => !o)}
          menuOpen={menuOpen}
        />
      </div>

      <nav
        className="hidden md:block bg-[#111111] border-t border-neutral-800/60 relative"
        onMouseLeave={closeProductMenu}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 flex items-center justify-between">
          <ul className="flex items-center">
            {NAV_LINKS.map((link, index) => (
              <li key={link.to} className="flex items-center">
                {index > 0 && (
                  <span className="w-px h-4 bg-neutral-700/80 shrink-0" aria-hidden="true" />
                )}
                <NavLink to={link.to} end={link.end} className={bottomNavClass}>
                  {link.label}
                </NavLink>
              </li>
            ))}

            <li
              className="flex items-center"
              onMouseEnter={() => setProductMenuOpen(true)}
            >
              <span className="w-px h-4 bg-neutral-700/80 shrink-0" aria-hidden="true" />
              <NavLink
                to={PRODUCT_PATH}
                className={({ isActive }) =>
                  bottomNavClass({
                    isActive: isActive || productMenuOpen,
                  })
                }
              >
                Product
              </NavLink>
            </li>
          </ul>

          <Link
            to="/contact"
            className="shrink-0 rounded-lg bg-accent text-white px-6 py-2.5 text-xs font-bold tracking-[0.12em] uppercase hover:brightness-110 transition shadow-sm"
          >
            Bulk Enquiry
          </Link>
        </div>

        {productMenuOpen && menuCategories.length > 0 && (
          <div onMouseEnter={() => setProductMenuOpen(true)}>
            <ProductMegaMenu
              categories={categories}
              onNavigate={closeProductMenu}
            />
          </div>
        )}
      </nav>

      {mobileMenu}
    </>
  );
}

export default Navbar;
