import { useSearchParams } from "react-router-dom";
import FreshPromoBanner from "../components/grocery/FreshPromoBanner";
import DesktopSideBanner from "../components/grocery/DesktopSideBanner";
import CategoryPills from "../components/grocery/CategoryPills";
import HomeCategoryProducts from "../components/grocery/HomeCategoryProducts";
import HomeAllCategoryProducts from "../components/grocery/HomeAllCategoryProducts";
import BestDeals from "../components/mobile/BestDeals";
import JustArrived from "../components/home/JustArrived";
import HotSelling from "../components/home/HotSelling";
import FestiveStoreSection from "../components/home/FestiveStoreSection";
import FreshProduceStoreSection from "../components/home/FreshProduceStoreSection";

import ZeptoFestiveHeroSection from "../components/home/ZeptoFestiveHeroSection";
import HomeSlidingBanners from "../components/home/HomeSlidingBanners";
import SuggestedForYouSection from "../components/home/SuggestedForYouSection";
import TopPaymentOffersSection from "../components/home/TopPaymentOffersSection";

function StoreContent() {
  const [searchParams] = useSearchParams();
  const categoryName = searchParams.get("categoryName")?.trim() || "";
  const store = searchParams.get("store")?.trim()?.toLowerCase() || "main";

  if (store === "festive" || store === "mall") {
    return <FestiveStoreSection />;
  }

  if (store === "fresh") {
    return <FreshProduceStoreSection />;
  }

  if (categoryName) {
    return <HomeCategoryProducts categoryName={categoryName} />;
  }

  return (
    <>
      <ZeptoFestiveHeroSection />
      <CategoryPills />
      <SuggestedForYouSection />
      <TopPaymentOffersSection />
      <HomeAllCategoryProducts limitPerCategory={20} />
    </>
  );
}

function Home() {
  const [searchParams] = useSearchParams();
  const store = searchParams.get("store")?.trim()?.toLowerCase() || "main";

  return (
    <div className="bg-white lg:bg-gradient-to-b lg:from-primary-light/30 lg:to-mobile-bg">
      {/* Mobile store view */}
      <div className="lg:hidden">
        <StoreContent />
      </div>

      {/* Desktop store view */}
      <div className="mx-auto max-w-7xl lg:px-8 lg:py-8">
        {store === "main" && (
          <div className="mb-0 hidden lg:mb-8 lg:flex lg:items-stretch lg:gap-5">
            <DesktopSideBanner />
            <div className="min-w-0 flex-[3]">
              <FreshPromoBanner />
            </div>
          </div>
        )}

        <div className="hidden space-y-6 lg:block">
          <StoreContent />
          {store === "main" && (
            <>
              <BestDeals title="Previously bought" viewAllTo="/product" />
              <JustArrived />
              <HotSelling />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;

