import { useSearchParams } from "react-router-dom";
import { sectionToStoreKey } from "../../utils/storeSection";
import PreorderHeroCarousel from "./PreorderHeroCarousel";

export default function ZeptoFestiveHeroSection() {
  const [searchParams] = useSearchParams();
  const currentStore = sectionToStoreKey(searchParams.get("store"));

  if (currentStore === "festive" || currentStore === "mall") {
    return null; // Image heroes live in FestiveStoreSection for those stores
  }

  return (
    <section className="w-full px-0 pt-0 pb-0 lg:hidden">
      <div className="relative overflow-hidden w-full rounded-none">
        <PreorderHeroCarousel isMobile={true} />
      </div>
    </section>
  );
}
