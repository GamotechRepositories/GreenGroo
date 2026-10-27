import { useMemo } from "react";
import { Link } from "react-router-dom";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import SectionHeader from "../mobile/SectionHeader";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import { useProductsQuery } from "../../hooks/queries/useProductsQuery";
import TwoRowHorizontalProducts from "./TwoRowHorizontalProducts";
import LazySection from "../common/LazySection";
import { useLocation } from "../../context/LocationContext";
import { useNearestStore } from "../../hooks/useNearestStore";
import { getMostVisitedCategories } from "../../utils/categoryVisits";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import { storeToSection } from "../../utils/storeSection";
import FarmerGrowthBanner from "../home/FarmerGrowthBanner";
import FarmerTestimonials from "../home/FarmerTestimonials";
import OfferBannerCarousel from "../home/OfferBannerCarousel";
import { categoryBannerKey } from "../home/categoryBanners";
import { useSectionBanners } from "../../hooks/queries/useSectionBanners";

/** Two full rows of the 3-column mobile grid. */
const MOBILE_GRID_LIMIT = 6;

function CategoryProductSection({ categoryName, limit = 20, section = null, banners }) {
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();
  const params = section ? { categoryName, limit, section } : { categoryName, limit };
  const { data } = useProductsQuery(params);
  const products = useMemo(() => (Array.isArray(data) ? data.slice(0, limit) : []), [data, limit]);

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  if (products.length === 0) return null;

  const key = categoryBannerKey(categoryName);
  const forCategory = (list) => (key ? list.filter((banner) => banner.category === key) : []);
  const desktopBanners = forCategory(banners.desktop);
  const mobileBanners = forCategory(banners.mobile);

  return (
    <section className="px-2 py-2 sm:px-3 lg:px-0 lg:py-4">
      {desktopBanners.length ? (
        <OfferBannerCarousel banners={desktopBanners} className="mb-4 hidden lg:mb-5 lg:block" />
      ) : null}
      {mobileBanners.length ? (
        <OfferBannerCarousel banners={mobileBanners} className="mb-4 lg:hidden" aspectClass="aspect-[1024/540]" />
      ) : null}
      <SectionHeader
        title={categoryName}
        viewAllTo={`/product?categoryName=${encodeURIComponent(categoryName)}`}
        className="mb-3 lg:mb-4"
      />
      <div className="lg:hidden">
        <TwoRowHorizontalProducts
          products={products.slice(0, MOBILE_GRID_LIMIT)}
          cardProps={cardProps}
          scroll={false}
        />
      </div>
      <div className="hidden gap-4 lg:grid lg:grid-cols-6">
        {products.slice(0, 12).map((product) => (
          <QuickCommerceProductCard
            key={product._id}
            {...cardProps(product)}
            layout="grid"
          />
        ))}
      </div>
    </section>
  );
}

function rankHomeCategories(availableNames) {
  if (!availableNames.length) return [];
  const visited = getMostVisitedCategories(availableNames.length);
  const visitedLower = new Set(visited.map((name) => name.toLowerCase()));
  const preferred = visited.filter((name) =>
    availableNames.some((cat) => cat.toLowerCase() === name.toLowerCase())
  );
  const rest = availableNames.filter(
    (cat) => !visitedLower.has(cat.toLowerCase())
  );
  return [...preferred, ...rest];
}

function HomeAllCategoryProducts({ limitPerCategory = 20, section = null }) {
  const { hasLocation } = useLocation();
  const { data: nearest } = useNearestStore();
  const needsLocation = nearest?.needsLocation || !hasLocation;
  const noStore =
    hasLocation && !nearest?.store && nearest?.reason && nearest.reason !== "no_store";

  const targetSection = section || storeToSection("main");
  const { data: apiCategories = [] } = useCategoriesQuery({
    section: targetSection,
  });
  const categoryBanners = useSectionBanners(targetSection, "category");

  const categories = useMemo(() => {
    const names = (apiCategories || [])
      .map((c) => c.categoryName)
      .filter(Boolean)
      .filter((name) => name.toLowerCase() !== "most purchase");
    const ranked = rankHomeCategories(names);
    const isDairyName = (name) => name.toLowerCase().includes("dairy");
    const nonDairy = ranked.filter((name) => !isDairyName(name));
    const dairyCategories = ranked.filter(isDairyName);
    const fruitsIndex = nonDairy.findIndex((name) => name.toLowerCase().includes("fruit") && !name.toLowerCase().includes("dry"));
    if (fruitsIndex === -1) return [...nonDairy, ...dairyCategories];
    return [
      ...nonDairy.slice(0, fruitsIndex + 1),
      ...dairyCategories,
      ...nonDairy.slice(fruitsIndex + 1),
    ];
  }, [apiCategories]);

  return (
    <div className="space-y-1 lg:space-y-5">
      {needsLocation ? (
        <div className="mx-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:mx-0">
          <p className="font-semibold">Set your delivery location</p>
          <p className="mt-1 text-amber-800">
            All catalog products are listed here. Stock depends on your nearest dark store.{" "}
            <Link to="/location" className="font-semibold text-primary underline">
              Choose location
            </Link>{" "}
            to see what is available near you.
          </p>
        </div>
      ) : null}


      {noStore ? (
        <div className="mx-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 lg:mx-0">
          No dark store covers this location yet. Try a nearby area like Balewadi or Mahalunge.
        </div>
      ) : null}

      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <LazySection minHeight={320} rootMargin="600px 0px">
            <CategoryProductSection
              categoryName={category}
              limit={limitPerCategory}
              section={targetSection}
              banners={categoryBanners}
            />
          </LazySection>
        </div>
      ))}

      <LazySection>
        <FarmerTestimonials className="my-3 sm:my-4 lg:my-6" />
      </LazySection>

      <LazySection minHeight={160}>
        <FarmerGrowthBanner />
      </LazySection>
    </div>
  );
}

export default HomeAllCategoryProducts;
