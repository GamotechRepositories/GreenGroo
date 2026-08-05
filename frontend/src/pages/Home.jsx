import HomeMobileHeader from "../components/grocery/HomeMobileHeader";
import FreshPromoBanner from "../components/grocery/FreshPromoBanner";
import TodaysDealStrip from "../components/grocery/TodaysDealStrip";
import CategoryPills from "../components/grocery/CategoryPills";
import DesktopCategorySidebar from "../components/grocery/DesktopCategorySidebar";
import TrustBadges from "../components/grocery/TrustBadges";
import BestDeals from "../components/mobile/BestDeals";
import JustArrived from "../components/home/JustArrived";
import HotSelling from "../components/home/HotSelling";

function Home() {
  return (
    <div className="bg-white lg:bg-gradient-to-b lg:from-primary-light/30 lg:to-mobile-bg">
      {/* Mobile — Blinkit-style sticky header */}
      <div className="sticky top-0 z-40 lg:hidden">
        <HomeMobileHeader />
      </div>

      {/* Mobile hero + deal strip */}
      <div className="lg:hidden">
        <FreshPromoBanner />
        <TodaysDealStrip />
      </div>

      <div className="mx-auto max-w-7xl lg:px-8 lg:py-8">
        {/* Desktop hero row */}
        <div className="mb-0 hidden lg:mb-8 lg:grid lg:grid-cols-[240px_1fr] lg:gap-6 xl:grid-cols-[260px_1fr]">
          <DesktopCategorySidebar />
          <FreshPromoBanner />
        </div>

        <div className="hidden lg:block">
          <TrustBadges />
        </div>

        <div className="hidden py-4 lg:block lg:py-8">
          <CategoryPills />
        </div>

        <div className="space-y-0 lg:space-y-6">
          <BestDeals title="Previously bought" viewAllTo="/product" />
          <JustArrived />
          <HotSelling />
        </div>
      </div>
    </div>
  );
}

export default Home;
