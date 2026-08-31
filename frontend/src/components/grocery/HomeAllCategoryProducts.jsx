import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import SectionHeader from "../mobile/SectionHeader";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import { getProducts } from "../../api/api";
import TwoRowHorizontalProducts from "./TwoRowHorizontalProducts";
import { useDeliveryLocationKey, useLocation } from "../../context/LocationContext";
import { useNearestStore } from "../../hooks/useNearestStore";

export const HOME_PRODUCT_CATEGORIES = ["Vegetables", "Fruits", "Dairy", "Staples"];

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
  const { hasLocation } = useLocation();
  const { data: nearest } = useNearestStore();
  const storeName = nearest?.store?.storeName;
  const needsLocation = nearest?.needsLocation || !hasLocation;
  const noStore =
    hasLocation && !nearest?.store && nearest?.reason && nearest.reason !== "no_store";

  return (
    <div className="space-y-1 lg:space-y-5">
      {needsLocation ? (
        <div className="mx-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:mx-0">
          <p className="font-semibold">Set your delivery location</p>
          <p className="mt-1 text-amber-800">
            Products shown here come from your nearest dark store inventory.{" "}
            <Link to="/location" className="font-semibold text-primary underline">
              Choose location
            </Link>{" "}
            to see what&apos;s in stock near you.
          </p>
        </div>
      ) : null}

      {!needsLocation && storeName ? (
        <div className="mx-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 lg:mx-0">
          <p className="font-semibold">
            {nearest?.store?.area
              ? `${nearest.store.area} · ${storeName}`
              : storeName}
          </p>
          <p className="mt-0.5 text-emerald-800">
            Products below are from this area&apos;s dark store inventory
            {nearest?.inStockCount ? ` · ${nearest.inStockCount} items in stock` : ""}.
            Change location to see another area&apos;s products.
          </p>
        </div>
      ) : null}

      {noStore ? (
        <div className="mx-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 lg:mx-0">
          No dark store covers this location yet. Try a nearby area like Balewadi or Mahalunge.
        </div>
      ) : null}

      {HOME_PRODUCT_CATEGORIES.map((category) => (
        <CategoryProductSection
          key={category}
          categoryName={category}
          limit={limitPerCategory}
        />
      ))}
    </div>
  );
}

export default HomeAllCategoryProducts;
