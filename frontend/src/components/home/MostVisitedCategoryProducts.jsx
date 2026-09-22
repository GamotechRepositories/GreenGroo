import { useEffect, useState } from "react";
import { getMostVisitedCategories } from "../../utils/categoryVisits";
import { getProducts } from "../../api/api";
import { useDeliveryLocationKey } from "../../context/LocationContext";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import SectionHeader from "../mobile/SectionHeader";
import TwoRowHorizontalProducts from "../grocery/TwoRowHorizontalProducts";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";

const LIMIT_PER_CATEGORY = 12;
const MAX_CATEGORIES = 3;

function VisitedCategorySection({ categoryName, products }) {
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  if (!products.length) return null;

  return (
    <section className="bg-white px-4 py-4 lg:rounded-2xl lg:px-5 lg:py-5 lg:shadow-sm">
      <SectionHeader
        title={`More from ${categoryName}`}
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

function MostVisitedCategoryProducts() {
  const locationKey = useDeliveryLocationKey();
  const [categories, setCategories] = useState(() =>
    getMostVisitedCategories(MAX_CATEGORIES)
  );
  const [byCategory, setByCategory] = useState({});

  useEffect(() => {
    setCategories(getMostVisitedCategories(MAX_CATEGORIES));
  }, [locationKey]);

  useEffect(() => {
    if (!categories.length) {
      setByCategory({});
      return;
    }

    let isMounted = true;

    Promise.all(
      categories.map(async (categoryName) => {
        try {
          const res = await getProducts({
            categoryName,
            limit: LIMIT_PER_CATEGORY,
          });
          const list = res.data?.data || res.data?.products || res.data || [];
          return [categoryName, Array.isArray(list) ? list.slice(0, LIMIT_PER_CATEGORY) : []];
        } catch {
          return [categoryName, []];
        }
      })
    ).then((entries) => {
      if (!isMounted) return;
      setByCategory(Object.fromEntries(entries));
    });

    return () => {
      isMounted = false;
    };
  }, [categories, locationKey]);

  if (!categories.length) return null;

  const sections = categories.filter((name) => (byCategory[name] || []).length > 0);
  if (!sections.length) return null;

  return (
    <div className="space-y-1 lg:space-y-5">
      {sections.map((categoryName) => (
        <VisitedCategorySection
          key={categoryName}
          categoryName={categoryName}
          products={byCategory[categoryName] || []}
        />
      ))}
    </div>
  );
}

export default MostVisitedCategoryProducts;
