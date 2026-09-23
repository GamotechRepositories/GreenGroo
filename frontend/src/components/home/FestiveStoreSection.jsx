import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import { useProductsQuery } from "../../hooks/queries/useProductsQuery";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import SectionHeader from "../mobile/SectionHeader";
import TwoRowHorizontalProducts from "../grocery/TwoRowHorizontalProducts";
import ZeptoFestiveHeroSection from "./ZeptoFestiveHeroSection";
import SuggestedForYouSection from "./SuggestedForYouSection";
import TopPaymentOffersSection from "./TopPaymentOffersSection";
import Ready2CookHotPickBanners from "./Ready2CookHotPickBanners";
import {
  sectionToStoreKey,
  storeToSection,
  buildStoreProductUrl,
} from "../../utils/storeSection";

function FestiveStoreSection() {
  const [searchParams] = useSearchParams();
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const categoryFromUrl = searchParams.get("categoryName")?.trim() || "";
  const currentFilter = categoryFromUrl || "All";
  const currentStore = sectionToStoreKey(searchParams.get("store"));
  const isInstant = currentStore === "mall";
  const targetSection = storeToSection(currentStore);

  const buildProductCategoryUrl = (catName) =>
    buildStoreProductUrl({ categoryName: catName, store: currentStore });

  const { data: dbCategories = [], isLoading: catsLoading } = useCategoriesQuery({
    section: targetSection,
  });
  const { data: apiProducts = [], isLoading: productsLoading } = useProductsQuery({
    section: targetSection,
    limit: 40,
  });

  const displayCategories = useMemo(
    () =>
      (dbCategories || []).map((c) => ({
        _id: c._id,
        name: c.categoryName,
        slug: c.categoryName,
        tag: c.emoji ? `${c.emoji} ${c.categoryName}` : c.categoryName,
        itemCount:
          c.itemCount || (c.productCount ? `${c.productCount}+ items` : "Shop now"),
        bgClass: c.bgClass || "bg-[#E8F8EE]",
        image:
          c.categoryImage ||
          (isInstant ? "/categories/grocery.webp" : "/categories/vegetables.webp"),
        emoji: c.emoji,
      })),
    [dbCategories, isInstant]
  );

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(apiProducts) ? apiProducts : [];
    if (currentFilter === "All" || !currentFilter) return list;
    const target = currentFilter.toLowerCase();
    return list.filter((p) => {
      const pCats = [
        ...(Array.isArray(p.categories) ? p.categories : []),
        p.categoryName,
        p.storeCategory,
      ].filter(Boolean);
      return pCats.some((c) => {
        const name = String(c).toLowerCase();
        return name === target || name.includes(target) || target.includes(name);
      });
    });
  }, [apiProducts, currentFilter]);

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  return (
    <div className="space-y-2 pb-2 pt-0">
      <ZeptoFestiveHeroSection />

      <section className="px-4 pt-2 sm:px-6 lg:px-6">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-[1.35rem]">
          <img
            src={
              isInstant
                ? "/assets/payment/instantOrderHeroImageMobile.png"
                : "/assets/payment/ready2cookHeroSectionMobile.png"
            }
            alt={
              isInstant
                ? "InstantOrder — essentials delivered in minutes"
                : "Ready2Cook — chopped, cleaned, cook-ready veggies and meal mixes"
            }
            className="block h-auto w-full object-cover object-center"
          />
        </div>
      </section>

      <Ready2CookHotPickBanners />

      <section className="px-4 py-3 sm:px-6">
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              Shop by Category
            </h2>
            <p className="mt-0.5 text-xs font-medium text-gray-500 sm:text-sm">
              {isInstant
                ? "Top groceries, essentials & packaged foods"
                : "Fresh picks for every kitchen need"}
            </p>
          </div>
          <Link
            to={buildProductCategoryUrl("All")}
            className={`shrink-0 text-xs font-bold hover:underline sm:text-sm ${
              isInstant ? "text-blue-700" : "text-amber-800"
            }`}
          >
            View all
          </Link>
        </div>

        {catsLoading && displayCategories.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading categories…</p>
        ) : displayCategories.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No categories yet. Add them in Product Management.
          </p>
        ) : (
          <div
            className={`grid gap-2.5 sm:gap-3 ${
              isInstant
                ? "grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4"
                : "grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
            }`}
          >
            {displayCategories.map((cat) => {
              const isSelected =
                currentFilter === cat.name || currentFilter === cat.slug;
              return (
                <Link
                  key={cat._id || cat.name}
                  to={buildProductCategoryUrl(cat.name)}
                  className={`group relative min-h-[100px] overflow-hidden rounded-2xl border p-3 transition duration-200 hover:-translate-y-0.5 sm:min-h-[112px] sm:rounded-[1.25rem] sm:p-3.5 ${
                    isSelected
                      ? isInstant
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/25"
                        : "border-amber-600 bg-amber-50 ring-2 ring-amber-500/30"
                      : `border-gray-100 ${cat.bgClass || "bg-gray-50"}`
                  }`}
                >
                  <div className="relative z-10 max-w-[62%] pr-1">
                    <h3 className="line-clamp-2 text-[11px] font-bold leading-tight text-gray-900 sm:text-[13px]">
                      {cat.name}
                    </h3>
                    <p className="mt-1 truncate text-[9px] font-semibold text-gray-500 sm:text-[11px]">
                      {cat.itemCount}
                    </p>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 h-11 w-11 overflow-hidden rounded-xl sm:bottom-2 sm:right-2 sm:h-14 sm:w-14">
                    <img
                      src={cat.image}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <SuggestedForYouSection
        title={isInstant ? "Instant bestsellers" : "Suggested for you"}
        subtitle={
          isInstant
            ? "Fast-moving grocery & essentials"
            : "Handpicked prep-ready picks"
        }
        customProducts={filteredProducts}
      />

      <TopPaymentOffersSection />

      <section className="px-4 py-2 sm:px-6">
        <SectionHeader
          title={
            !currentFilter || currentFilter === "All"
              ? isInstant
                ? "All Instant products"
                : "All Ready2Cook products"
              : currentFilter
          }
          viewAllTo={buildProductCategoryUrl("All")}
          className="mb-3"
        />

        {productsLoading && filteredProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading products…</p>
        ) : filteredProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No products in this section yet.
          </p>
        ) : (
          <>
            <div className="lg:hidden">
              <TwoRowHorizontalProducts
                products={filteredProducts}
                cardProps={cardProps}
              />
            </div>

            <div className="hidden grid-cols-4 gap-4 lg:grid xl:grid-cols-5">
              {filteredProducts.map((product) => (
                <QuickCommerceProductCard
                  key={product._id}
                  {...cardProps(product)}
                  layout="grid"
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default FestiveStoreSection;
