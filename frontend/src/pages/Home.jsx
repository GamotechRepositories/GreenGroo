import { useSyncExternalStore } from "react";
import { useSearchParams } from "react-router-dom";
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
import PreorderHeroCarousel from "../components/home/PreorderHeroCarousel";
import Ready2CookHeroCarousel from "../components/home/Ready2CookHeroCarousel";
import InstantOrderHeroCarousel from "../components/home/InstantOrderHeroCarousel";
import WhatMakesUsDifferent from "../components/home/WhatMakesUsDifferent";
import HomeMidBannerSlider from "../components/home/HomeMidBannerSlider";
import LazySection from "../components/common/LazySection";

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
      {/* Below the first screens: each section mounts (and fetches) only as it nears the viewport. */}
      <LazySection>
        <JustArrived />
      </LazySection>
      <LazySection>
        <MostViewedProducts />
      </LazySection>
      <LazySection>
        <BestDeals title="Previously bought" viewAllTo="/orders" />
      </LazySection>
      <LazySection>
        <MostVisitedCategoryProducts />
      </LazySection>

      <LazySection minHeight={180}>
        <HomeMidBannerSlider />
      </LazySection>

      <LazySection>
        <SuggestedForYouSection />
      </LazySection>
      <LazySection minHeight={160}>
        <TopPaymentOffersSection />
      </LazySection>
      <LazySection>
        <HomeAllCategoryProducts limitPerCategory={20} />
      </LazySection>
      {/* Mobile view of WhatMakesUsDifferent */}
      <div className="lg:hidden">
        <LazySection>
          <WhatMakesUsDifferent />
        </LazySection>
      </div>
    </>
  );
}

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(onChange) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Mount the store content once (mobile or desktop slot), so its sections fetch once. */
function useIsDesktop() {
  return useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP_QUERY).matches);
}

function Home() {
  const [searchParams] = useSearchParams();
  const store = sectionToStoreKey(searchParams.get("store"));
  const isDesktop = useIsDesktop();

  return (
    <div className="bg-white lg:bg-gradient-to-b lg:from-primary-light/30 lg:to-mobile-bg">
      {/* Mobile store view */}
      {!isDesktop && (
        <div className="lg:hidden">
          <StoreContent />
        </div>
      )}

      {/* Full-width PreOrder Hero Banner Carousel for Desktop — touches subnavbar directly, edge-to-edge, no curved edges */}
      {store === "main" && (
        <section className="hidden lg:block w-full bg-white">
          <PreorderHeroCarousel isMobile={false} />
        </section>
      )}

      {/* Full-width Ready2Cook Hero Banner Carousel for Desktop */}
      {store === "festive" && (
        <section className="hidden lg:block w-full bg-white">
          <Ready2CookHeroCarousel isMobile={false} />
        </section>
      )}

      {/* Full-width InstantOrder Hero Banner Carousel for Desktop */}
      {store === "mall" && (
        <section className="hidden lg:block w-full bg-white">
          <InstantOrderHeroCarousel isMobile={false} />
        </section>
      )}

      <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-3 xl:px-4 lg:pb-8">
        {isDesktop && (
          <div className="hidden space-y-6 lg:block">
            <StoreContent />
          </div>
        )}
      </div>

      {/* Full-width What Makes Us Different for Desktop — edge-to-edge without container side padding */}
      {isDesktop && (
        <div className="hidden lg:block w-full">
          <LazySection>
            <WhatMakesUsDifferent />
          </LazySection>
        </div>
      )}
    </div>
  );
}

export default Home;

