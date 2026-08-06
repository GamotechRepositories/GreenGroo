import { useLocation as useRouterLocation } from "react-router-dom";
import BottomNav from "../components/mobile/BottomNav";
import TopNav from "../components/mobile/TopNav";
import MobileHeader from "../components/mobile/MobileHeader";
import CategoryNavbar from "../components/layout/CategoryNavbar";
import Footer from "../components/layout/Footer";
import FloatingCartBar from "../components/grocery/FloatingCartBar";

const HIDE_MOBILE_HEADER_PATHS = ["/", "/location"];

function MobileLayout({ children }) {
  const { pathname } = useRouterLocation();
  const isHome = pathname === "/";
  const hideMobileHeader = HIDE_MOBILE_HEADER_PATHS.includes(pathname);

  return (
    <div
      className={`flex min-h-screen flex-col text-text-primary ${
        isHome ? "bg-white lg:bg-mobile-bg" : "bg-mobile-bg"
      }`}
    >
      <TopNav />

      {!hideMobileHeader ? <MobileHeader /> : null}

      {!isHome ? <CategoryNavbar /> : null}

      <main
        className={`mx-auto w-full flex-1 ${
          hideMobileHeader
            ? "pb-24 pt-0 lg:pb-0 lg:pt-[72px]"
            : "pb-24 pt-0 lg:pb-8 lg:pt-[72px]"
        }`}
      >
        {children}
      </main>

      {isHome ? <FloatingCartBar /> : null}

      <div className={isHome ? "hidden lg:block" : ""}>
        <Footer />
      </div>

      <BottomNav />
    </div>
  );
}

export default MobileLayout;
