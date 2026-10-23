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
import SuggestedForYouSection from "../components/home/SuggestedForYouSection";
import TopPaymentOffersSection from "../components/home/TopPaymentOffersSection";
import HeroFeatureCards from "../components/home/HeroFeatureCards";
import FarmProduceDualBanners from "../components/home/FarmProduceDualBanners";
import FarmerTestimonials from "../components/home/FarmerTestimonials";
import PreorderHeroCarousel from "../components/home/PreorderHeroCarousel";
import Ready2CookHeroCarousel from "../components/home/Ready2CookHeroCarousel";
import InstantOrderHeroCarousel from "../components/home/InstantOrderHeroCarousel";
import WhatMakesUsDifferent from "../components/home/WhatMakesUsDifferent";
import HomeMidBannerSlider from "../components/home/HomeMidBannerSlider";

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
      <HeroFeatureCards />
      <ShopByCategory />
      <FarmProduceDualBanners />
      <HotSelling />
      <JustArrived />
      <MostViewedProducts />
      <BestDeals title="Previously bought" viewAllTo="/orders" />
      <MostVisitedCategoryProducts />

      <HomeMidBannerSlider />

      <SuggestedForYouSection />
      <TopPaymentOffersSection />
      <HomeAllCategoryProducts limitPerCategory={20} />
      {/* Mobile view of WhatMakesUsDifferent */}
      <div className="lg:hidden">
        <WhatMakesUsDifferent />
      </div>
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

      {/* Full-width PreOrder Hero Banner Carousel for Desktop — touches subnavbar directly, edge-to-edge, no curved edges */}
      {store === "main" && (
        <section className="hidden lg:block w-full bg-white">
          <PreorderHeroCarousel />
        </section>
      )}

      {/* Full-width Ready2Cook Hero Banner Carousel for Desktop */}
      {store === "festive" && (
        <section className="hidden lg:block w-full bg-white">
          <Ready2CookHeroCarousel />
        </section>
      )}

      {/* Full-width InstantOrder Hero Banner Carousel for Desktop */}
      {store === "mall" && (
        <section className="hidden lg:block w-full bg-white">
          <InstantOrderHeroCarousel />
        </section>
      )}

      <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-3 xl:px-4 lg:pb-8">
        <div className="hidden space-y-6 lg:block">
          <StoreContent />
        </div>
      </div>

      {/* Full-width What Makes Us Different for Desktop — edge-to-edge without container side padding */}
      <div className="hidden lg:block w-full">
        <WhatMakesUsDifferent />
      </div>
    </div>
  );
}

export default Home;

