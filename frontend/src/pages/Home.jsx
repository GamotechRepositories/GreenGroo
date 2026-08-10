import { useSearchParams } from "react-router-dom";
import FreshPromoBanner from "../components/grocery/FreshPromoBanner";
import DesktopSideBanner from "../components/grocery/DesktopSideBanner";
import TodaysDealStrip from "../components/grocery/TodaysDealStrip";
import CategoryPills from "../components/grocery/CategoryPills";
import HomeCategoryProducts from "../components/grocery/HomeCategoryProducts";
import HomeAllCategoryProducts from "../components/grocery/HomeAllCategoryProducts";
import BestDeals from "../components/mobile/BestDeals";
import JustArrived from "../components/home/JustArrived";
import HotSelling from "../components/home/HotSelling";

function Home() {
  const [searchParams] = useSearchParams();
  const categoryName = searchParams.get("categoryName")?.trim() || "";
  const isFruits = /fruit/i.test(categoryName);
  const isVegetables = /vegetable|veggie/i.test(categoryName);
  const isOrganic = /organic/i.test(categoryName);
  const isDairy = /dairy|milk/i.test(categoryName);
  const promoBanner =
    isFruits
      ? "/banners/fruits-banner.png"
      : isVegetables
        ? "/banners/vegetables-banner.png"
        : isOrganic
          ? "/banners/organic-banner.png"
          : isDairy
            ? "/banners/dairy-banner.png"
            : "/banners/all-banner.png";

  return (
    <div className="bg-white lg:bg-gradient-to-b lg:from-primary-light/30 lg:to-mobile-bg">
      <div className="lg:hidden">
        <FreshPromoBanner bgImage={promoBanner} />
        <TodaysDealStrip />

        {categoryName ? (
          <HomeCategoryProducts categoryName={categoryName} />
        ) : (
          <>
            <CategoryPills />
            <HomeAllCategoryProducts limitPerCategory={20} />
          </>
        )}
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
          {categoryName ? (
            <HomeCategoryProducts categoryName={categoryName} />
          ) : (
            <HomeAllCategoryProducts limitPerCategory={20} />
          )}
          <BestDeals title="Previously bought" viewAllTo="/product" />
          <JustArrived />
          <HotSelling />
        </div>
      </div>
    </div>
  );
}

export default Home;
