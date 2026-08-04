import HeroBanner from "../components/mobile/HeroBanner";
import CategoryNav from "../components/mobile/CategoryNav";
import JustArrived from "../components/home/JustArrived";
import HotSelling from "../components/home/HotSelling";
import RecentlyViewed from "../components/home/RecentlyViewed";
import TopBrands from "../components/mobile/TopBrands";
import BestDeals from "../components/mobile/BestDeals";
import WhyChooseUs from "../components/mobile/WhyChooseUs";
import PromoBanner from "../components/mobile/PromoBanner";
import TestimonialsImpact from "../components/home/TestimonialsImpact";
import SocialMediaCarousel from "../components/home/SocialMediaCarousel";

function Home() {
  return (
    <div className="bg-mobile-bg">
      <HeroBanner />
      <CategoryNav />
      <TopBrands />
      <BestDeals />
      <div className="flex flex-col gap-1.5 py-1.5 sm:gap-2 sm:py-2">
        <JustArrived />
        <HotSelling />
        <RecentlyViewed />
      </div>
      <WhyChooseUs />
      <PromoBanner />
      <TestimonialsImpact />
      <SocialMediaCarousel />
    </div>
  );
}

export default Home;
