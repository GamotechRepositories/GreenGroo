import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LOGO_URL } from "../layout/Header";
import { useCart } from "../../context/CartContext";
import MobileSearchBar from "./MobileSearchBar";

function MobileHeader() {
  const { cartCount, openCartSidebar } = useCart();
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(72);

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
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white px-3 pt-2.5 pb-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sm:px-5 lg:hidden"
      >
        {/* Row: Logo + Search + Cart */}
        <div className="flex items-center gap-2.5">
          <Link to="/" className="shrink-0 transition-transform active:scale-95">
            <img
              src={LOGO_URL}
              alt="GreenGrocc"
              className="h-10 w-auto object-contain sm:h-12"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <MobileSearchBar className="w-full" />
          </div>

          <Link
            to="/cart"
            data-cart-target="mobile"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0C831F]/10 text-[#0C831F] transition-colors hover:bg-[#0C831F]/15"
            aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
          >
            <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0C831F] px-1 text-[9px] font-extrabold text-white shadow-sm ring-2 ring-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      <div
        className="shrink-0 lg:hidden"
        style={{ height: headerHeight }}
        aria-hidden="true"
      />
    </>
  );
}

export default MobileHeader;
