import { useLocation as useRouterLocation } from "react-router-dom";
import BottomNav from "../components/mobile/BottomNav";
import TopNav from "../components/mobile/TopNav";
import MobileHeader from "../components/mobile/MobileHeader";
import CategoryNavbar from "../components/layout/CategoryNavbar";
import Footer from "../components/layout/Footer";
import FloatingCartBar from "../components/grocery/FloatingCartBar";
import HomeStickyCategories from "../components/grocery/HomeStickyCategories";

function MobileLayout({ children }) {
  const { pathname } = useRouterLocation();
  const isHome = pathname === "/";
  const isProductDetail = /^\/product\/[^/]+/.test(pathname);
  const isShop = pathname === "/product";

  return (
    <div
      className={`flex min-h-screen flex-col text-text-primary ${
        isHome ? "bg-white lg:bg-mobile-bg" : "bg-mobile-bg"
      }`}
    >
      <TopNav />

      {isHome ? (
        <div className="lg:hidden">
          <HomeStickyCategories />
        </div>
      ) : isProductDetail ? null : (
        <MobileHeader />
      )}

      {/* Shop uses vertical category rail; skip horizontal CategoryNavbar */}
      {!isHome && !isProductDetail && !isShop ? <CategoryNavbar /> : null}

      <main
        className={`mx-auto w-full flex-1 pb-24 pt-0 lg:pt-[72px] ${
          isHome ? "lg:pb-0" : isShop ? "lg:pb-0" : "lg:pb-8"
        }`}
      >
        {children}
      </main>

      {isHome ? <FloatingCartBar /> : null}

      <div className={isHome || isShop ? "hidden lg:block" : ""}>
        <Footer />
      </div>

      <BottomNav />
    </div>
  );
}

export default MobileLayout;
