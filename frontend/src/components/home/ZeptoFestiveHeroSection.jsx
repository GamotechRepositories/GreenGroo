import { useSearchParams, Link } from "react-router-dom";
import { sectionToStoreKey } from "../../utils/storeSection";

const PREORDER_MOBILE_HERO = "/assets/payment/heroMobileBaner.png";

export default function ZeptoFestiveHeroSection() {
  const [searchParams] = useSearchParams();
  const currentStore = sectionToStoreKey(searchParams.get("store"));

  if (currentStore === "festive" || currentStore === "mall") {
    return null; // Image heroes live in FestiveStoreSection for those stores
  }

  return (
    <section className="w-full px-0 pt-0 pb-0 lg:hidden">
      <div className="relative overflow-hidden w-full rounded-none">
        <Link to="/product" className="block w-full">
          <img
            src={PREORDER_MOBILE_HERO}
            alt="PreOrder — शेतकऱ्यांच्या मेहनतीतून, तुमच्या कुटुंबाच्या ताटापर्यंत!"
            className="block h-auto w-full object-cover object-center rounded-none cursor-pointer"
          />
        </Link>
      </div>
    </section>
  );
}
