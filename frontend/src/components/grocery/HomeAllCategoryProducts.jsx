import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import SectionHeader from "../mobile/SectionHeader";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import { getProducts } from "../../api/api";
import TwoRowHorizontalProducts from "./TwoRowHorizontalProducts";
import { useDeliveryLocationKey, useLocation } from "../../context/LocationContext";
import { useNearestStore } from "../../hooks/useNearestStore";
import { getMostVisitedCategories } from "../../utils/categoryVisits";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import { storeToSection } from "../../utils/storeSection";
import FarmerGrowthBanner from "../home/FarmerGrowthBanner";
import FarmerTestimonials from "../home/FarmerTestimonials";

function CategoryProductSection({ categoryName, limit = 20, section = null }) {
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();
  const locationKey = useDeliveryLocationKey();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const params = { categoryName, limit };
    if (section) params.section = section;
    getProducts(params)
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data || res.data?.products || res.data || [];
        if (Array.isArray(list)) {
          setProducts(list.slice(0, limit));
        }
      })
      .catch(() => {
        if (isMounted) setProducts([]);
      });
    return () => {
      isMounted = false;
    };
  }, [categoryName, limit, locationKey, section]);

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  if (products.length === 0) return null;

  return (
    <section className="bg-white px-2 sm:px-3 py-3 lg:rounded-2xl lg:px-3.5 lg:py-4 lg:shadow-sm">
      <SectionHeader
        title={categoryName}
        viewAllTo={`/product?categoryName=${encodeURIComponent(categoryName)}`}
        className="mb-3 lg:mb-4"
      />
      <div className="lg:hidden">
        <TwoRowHorizontalProducts products={products} cardProps={cardProps} />
      </div>
      <div className="hidden grid-cols-4 gap-4 lg:grid xl:grid-cols-5">
        {products.slice(0, 10).map((product) => (
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
  const storeName = nearest?.store?.storeName;
  const needsLocation = nearest?.needsLocation || !hasLocation;
  const noStore =
    hasLocation && !nearest?.store && nearest?.reason && nearest.reason !== "no_store";

  const targetSection = section || storeToSection("main");
  const { data: apiCategories = [] } = useCategoriesQuery({
    section: targetSection,
  });

  const categories = useMemo(() => {
    const names = (apiCategories || [])
      .map((c) => c.categoryName)
      .filter(Boolean)
      .filter((name) => name.toLowerCase() !== "most purchase");
    const ranked = rankHomeCategories(names);
    // Position Dairy as the final category section so it sits right above FarmerGrowthBanner and WhatMakesUsDifferent!
    const nonDairy = ranked.filter((name) => !name.toLowerCase().includes("dairy"));
    const dairyCategories = ranked.filter((name) => name.toLowerCase().includes("dairy"));
    return [...nonDairy, ...dairyCategories];
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

      {categories.map((category) => {
        const isDairy = category.toLowerCase().includes("dairy");
        return (
          <div key={category} className="space-y-4">
            <CategoryProductSection
              categoryName={category}
              limit={limitPerCategory}
              section={targetSection}
            />
            {isDairy && (
              <FarmerTestimonials className="my-3 sm:my-4 lg:my-6" />
            )}
          </div>
        );
      })}

      {!categories.some((c) => c.toLowerCase().includes("dairy")) && (
        <FarmerTestimonials className="my-3 sm:my-4 lg:my-6" />
      )}

      {/* शेतकऱ्यांसोबत वाढणारा भारत - Placed below Dairy / Testimonials section */}
      <FarmerGrowthBanner />
    </div>
  );
}

export default HomeAllCategoryProducts;
