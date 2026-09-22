import { useEffect, useState } from "react";
import { getSimilarProducts, getProducts } from "../../api/api";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import HorizontalScrollRow from "../home/HorizontalScrollRow";
import SectionHeader from "../mobile/SectionHeader";
import QuickCommerceProductCard from "./QuickCommerceProductCard";
import { useDeliveryLocationKey } from "../../context/LocationContext";

function SimilarProducts({ productId, categoryName = "" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const locationKey = useDeliveryLocationKey();
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  useEffect(() => {
    if (!productId && !categoryName) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSimilar = async () => {
      setLoading(true);
      try {
        if (productId) {
          const { data } = await getSimilarProducts(productId);
          if (!cancelled) {
            const list = data?.data || data?.products || data || [];
            if (Array.isArray(list) && list.length > 0) {
              setProducts(
                list
                  .filter((p) => String(p._id) !== String(productId))
                  .slice(0, 12)
              );
              return;
            }
          }
        }

        if (categoryName) {
          const { data } = await getProducts({ categoryName, limit: 12 });
          if (!cancelled) {
            const list = data?.data || data?.products || data || [];
            if (Array.isArray(list)) {
              setProducts(
                list.filter((p) => String(p._id) !== String(productId)).slice(0, 12)
              );
            }
          }
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSimilar();

    return () => {
      cancelled = true;
    };
  }, [productId, categoryName, locationKey]);

  const viewAllTo = categoryName
    ? `/product?categoryName=${encodeURIComponent(categoryName)}`
    : "/product";

  if (!loading && products.length === 0) {
    return null;
  }

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  return (
    <section className="w-full">
      <div className="px-4 sm:px-0">
        <SectionHeader title="Similar products" viewAllTo={viewAllTo} className="mb-4" />
      </div>

      {loading ? (
        <>
          <div className="px-4 lg:hidden sm:px-0">
            <HorizontalScrollRow>
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`similar-skeleton-m-${index}`}
                  className="h-[258px] w-[150px] shrink-0 animate-pulse rounded-xl border border-slate-100 bg-slate-100"
                />
              ))}
            </HorizontalScrollRow>
          </div>
          <div className="hidden grid-cols-4 gap-4 lg:grid xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`similar-skeleton-d-${index}`}
                className="h-[280px] animate-pulse rounded-xl border border-slate-100 bg-slate-100"
              />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Mobile / tablet — horizontal scroll */}
          <div className="px-4 lg:hidden sm:px-0">
            <HorizontalScrollRow>
              {products.map((product) => (
                <QuickCommerceProductCard
                  key={product._id}
                  {...cardProps(product)}
                  layout="scroll"
                />
              ))}
            </HorizontalScrollRow>
          </div>

          {/* Desktop — responsive grid */}
          <div className="hidden grid-cols-4 gap-4 lg:grid xl:grid-cols-5">
            {products.slice(0, 10).map((product) => (
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
  );
}

export default SimilarProducts;
