import { useSearchParams, Link } from "react-router-dom";
import FreshPromoBanner from "../components/grocery/FreshPromoBanner";
import ShopByCategory from "../components/home/ShopByCategory";
import HomeCategoryProducts from "../components/grocery/HomeCategoryProducts";
import HomeAllCategoryProducts from "../components/grocery/HomeAllCategoryProducts";
import BestDeals from "../components/mobile/BestDeals";
import JustArrived from "../components/home/JustArrived";
import HotSelling from "../components/home/HotSelling";
import MostViewedProducts from "../components/home/MostViewedProducts";
import MostVisitedCategoryProducts from "../components/home/MostVisitedCategoryProducts";
import FestiveStoreSection from "../components/home/FestiveStoreSection";
import FreshProduceStoreSection from "../components/home/FreshProduceStoreSection";
import { sectionToStoreKey } from "../components/grocery/HomeMobileHeader";

import ZeptoFestiveHeroSection from "../components/home/ZeptoFestiveHeroSection";
import Ready2CookHotPickBanners from "../components/home/Ready2CookHotPickBanners";
import MovingOfferMarquee from "../components/home/MovingOfferMarquee";
import SuggestedForYouSection from "../components/home/SuggestedForYouSection";
import TopPaymentOffersSection from "../components/home/TopPaymentOffersSection";
import HeroTrustBadges from "../components/home/HeroTrustBadges";
import TrustFeatureBanners from "../components/home/TrustFeatureBanners";

function StoreContent() {
  const [searchParams] = useSearchParams();
  const categoryName = searchParams.get("categoryName")?.trim() || "";
  const store = sectionToStoreKey(searchParams.get("store"));

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
      {store === "main" && (
        <div className="lg:hidden">
          <HeroTrustBadges />
          <MovingOfferMarquee />
        </div>
      )}
      <Ready2CookHotPickBanners />
      <ShopByCategory />
      <TrustFeatureBanners />
      <HotSelling />
      <JustArrived />
      <MostViewedProducts />
      <BestDeals title="Previously bought" viewAllTo="/orders" />
      <MostVisitedCategoryProducts />

      <section className="px-4 py-2 sm:px-6 lg:px-0 lg:py-4">
        <img 
          src="/assets/payment/image.png" 
          alt="Promotional Banner" 
          className="w-full h-auto object-cover rounded-xl sm:rounded-2xl"
        />
      </section>

      <SuggestedForYouSection />
      <TopPaymentOffersSection />
      <HomeAllCategoryProducts limitPerCategory={20} />
    </>
  );
}

function Home() {
  const [searchParams] = useSearchParams();
  const store = sectionToStoreKey(searchParams.get("store"));

  return (
    <div className="bg-white lg:bg-gradient-to-b lg:from-primary-light/30 lg:to-mobile-bg">
      {/* Mobile store view */}
      <div className="lg:hidden">
        <StoreContent />
      </div>

      {/* Full-width PreOrder Hero Banner for Desktop — touches subnavbar directly, edge-to-edge, no curved edges */}
      {store === "main" && (
        <section className="hidden lg:block w-full bg-white">
          <Link to="/product" className="block w-full">
            <img
              src="/assets/payment/heroBaner.png"
              alt="PreOrder — शेतकऱ्यांच्या मेहनतीतून, तुमच्या कुटुंबाच्या ताटापर्यंत!"
              className="w-full h-auto object-cover block rounded-none cursor-pointer"
            />
          </Link>
          <HeroTrustBadges />
          <MovingOfferMarquee />
        </section>
      )}

      <div className="mx-auto max-w-7xl lg:px-8 lg:pb-8">
        <div className="hidden space-y-6 lg:block">
          <StoreContent />
        </div>
      </div>
    </div>
  );
}

export default Home;

