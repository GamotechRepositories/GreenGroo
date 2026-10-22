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
import MovingOfferMarquee from "../components/home/MovingOfferMarquee";
import SuggestedForYouSection from "../components/home/SuggestedForYouSection";
import TopPaymentOffersSection from "../components/home/TopPaymentOffersSection";
import FarmTraceabilityBanner from "../components/home/FarmTraceabilityBanner";
import PreorderHeroCarousel from "../components/home/PreorderHeroCarousel";
import Ready2CookHeroCarousel from "../components/home/Ready2CookHeroCarousel";
import InstantOrderHeroCarousel from "../components/home/InstantOrderHeroCarousel";
import WhatMakesUsDifferent from "../components/home/WhatMakesUsDifferent";

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
          <MovingOfferMarquee />
        </div>
      )}
      <ShopByCategory />
      {store === "main" && <FarmTraceabilityBanner />}
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
          <MovingOfferMarquee />
        </section>
      )}

      {/* Full-width Ready2Cook Hero Banner Carousel for Desktop */}
      {store === "festive" && (
        <section className="hidden lg:block w-full bg-white">
          <Ready2CookHeroCarousel />
          <MovingOfferMarquee />
        </section>
      )}

      {/* Full-width InstantOrder Hero Banner Carousel for Desktop */}
      {store === "mall" && (
        <section className="hidden lg:block w-full bg-white">
          <InstantOrderHeroCarousel />
          <MovingOfferMarquee />
        </section>
      )}

      <div className="mx-auto max-w-7xl lg:px-8 lg:pb-8">
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

