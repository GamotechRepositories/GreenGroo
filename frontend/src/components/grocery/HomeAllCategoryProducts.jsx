import { useState, useEffect } from "react";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import SectionHeader from "../mobile/SectionHeader";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import { getProducts } from "../../api/api";
import TwoRowHorizontalProducts from "./TwoRowHorizontalProducts";
import { useDeliveryLocationKey } from "../../context/LocationContext";

import DealsStartingAt9Section from "../home/DealsStartingAt9Section";

export const HOME_PRODUCT_CATEGORIES = ["Vegetables", "Fruits", "Dairy", "Organic"];

function CategoryProductSection({ categoryName, limit = 20 }) {
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();
  const locationKey = useDeliveryLocationKey();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;
    getProducts({ categoryName, limit })
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
  }, [categoryName, limit, locationKey]);

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  if (products.length === 0) return null;

  return (
    <section className="bg-white px-4 py-4 lg:rounded-2xl lg:px-5 lg:py-5 lg:shadow-sm">
      <SectionHeader
        title={categoryName}
        viewAllTo={`/product?categoryName=${encodeURIComponent(categoryName)}`}
        className="mb-3 lg:mb-4"
      />
      {/* Mobile: 2-row horizontal scroll */}
      <div className="lg:hidden">
        <TwoRowHorizontalProducts products={products} cardProps={cardProps} />
      </div>
      {/* Desktop: category-wise product grid */}
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

function HomeAllCategoryProducts({ limitPerCategory = 20 }) {
  return (
    <div className="space-y-1 lg:space-y-5">
      {HOME_PRODUCT_CATEGORIES.map((category) => (
        <div key={category}>
          <CategoryProductSection
            categoryName={category}
            limit={limitPerCategory}
          />
          {category === "Vegetables" && <DealsStartingAt9Section />}
        </div>
      ))}
    </div>
  );
}

export default HomeAllCategoryProducts;
