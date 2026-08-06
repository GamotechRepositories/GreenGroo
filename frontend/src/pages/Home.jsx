import HomeStickyCategories from "../components/grocery/HomeStickyCategories";
import FreshPromoBanner from "../components/grocery/FreshPromoBanner";
import DesktopSideBanner from "../components/grocery/DesktopSideBanner";
import TodaysDealStrip from "../components/grocery/TodaysDealStrip";
import CategoryPills from "../components/grocery/CategoryPills";
import BestDeals from "../components/mobile/BestDeals";
import JustArrived from "../components/home/JustArrived";
import HotSelling from "../components/home/HotSelling";

function Home() {
  return (
    <div className="bg-white lg:bg-gradient-to-b lg:from-primary-light/30 lg:to-mobile-bg">
      <div className="lg:hidden">
        <HomeStickyCategories />

        <FreshPromoBanner />
        <TodaysDealStrip />
        <CategoryPills />

        <div className="space-y-0">
          <BestDeals title="Previously bought" viewAllTo="/product" />
          <JustArrived />
          <HotSelling />
        </div>
      </div>

      <div className="mx-auto max-w-7xl lg:px-8 lg:py-8">
        <div className="mb-0 hidden lg:mb-8 lg:flex lg:items-stretch lg:gap-5">
          <DesktopSideBanner />
          <div className="min-w-0 flex-[3]">
            <FreshPromoBanner />
          </div>
        </div>

        <div className="hidden py-4 lg:block lg:py-8">
          <CategoryPills />
        </div>

        <div className="hidden space-y-6 lg:block">
          <BestDeals title="Previously bought" viewAllTo="/product" />
          <JustArrived />
          <HotSelling />
        </div>
      </div>
    </div>
  );
}

export default Home;
