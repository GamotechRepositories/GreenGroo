import { useLocation as useRouterLocation, useSearchParams } from "react-router-dom";
import BottomNav from "../components/mobile/BottomNav";
import TopNav from "../components/mobile/TopNav";
import MobileHeader from "../components/mobile/MobileHeader";
import Footer from "../components/layout/Footer";
import FloatingCartBar from "../components/grocery/FloatingCartBar";
import { showsFloatingCartBar } from "../utils/floatingCartBar";
import HomeStickyCategories from "../components/grocery/HomeStickyCategories";

function MobileLayout({ children }) {
  const { pathname } = useRouterLocation();
  const [searchParams] = useSearchParams();
  const isHome = pathname === "/" || pathname === "/login" || pathname === "/signup";
  const isProductDetail = /^\/product\/[^/]+/.test(pathname);
  const isShop = pathname === "/product";
  const isCategoryBrowse = isShop && Boolean(searchParams.get("categoryName")?.trim());
  const hideNavs = pathname === "/cart" || pathname === "/checkout";

  return (
    <div
      className={`flex min-h-screen flex-col text-text-primary ${
        isHome ? "bg-white lg:bg-mobile-bg" : "bg-mobile-bg"
      }`}
    >
      {!hideNavs && <TopNav />}

      {isHome ? (
        <div className="lg:hidden">
          <HomeStickyCategories />
        </div>
      ) : isProductDetail || hideNavs || isCategoryBrowse ? null : (
        <MobileHeader />
      )}

      <main
        className={`mx-auto w-full flex-1 pt-0 ${
          isHome ? "pb-0 lg:pb-0" : isShop ? "pb-[56px] pt-0 lg:pb-0" : "pb-24 lg:pb-8"
        }`}
      >
        {children}
      </main>

      {showsFloatingCartBar(pathname) ? <FloatingCartBar /> : null}

      <Footer />

      {!hideNavs && <BottomNav />}
    </div>
  );
}

export default MobileLayout;
