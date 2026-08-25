import { useEffect, useState } from "react";
import { getSimilarProducts, getProducts } from "../../api/api";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import HorizontalScrollRow from "../home/HorizontalScrollRow";
import SectionHeader from "../mobile/SectionHeader";
import DealProductCard from "./DealProductCard";
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
              setProducts(list.slice(0, 10));
              return;
            }
          }
        }

        if (categoryName) {
          const { data } = await getProducts({ categoryName, limit: 10 });
          if (!cancelled) {
            const list = data?.data || data?.products || data || [];
            if (Array.isArray(list)) {
              setProducts(list.filter((p) => String(p._id) !== String(productId)).slice(0, 10));
            }
          }
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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

  const useQuickCard = products.some((p) => String(p._id).startsWith("dummy-"));

  return (
    <section className="col-span-6 mt-8 border-t border-[#F0F0F0] pt-6">
      <SectionHeader title="Similar products" viewAllTo={viewAllTo} className="mb-4" />

      {loading ? (
        <HorizontalScrollRow>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`similar-skeleton-${index}`}
              className="h-[258px] w-[150px] shrink-0 animate-pulse rounded-xl border border-border-light bg-mobile-surface sm:w-[165px]"
            />
          ))}
        </HorizontalScrollRow>
      ) : (
        <HorizontalScrollRow>
          {products.map((product) =>
            useQuickCard ? (
              <QuickCommerceProductCard
                key={product._id}
                product={product}
                onAdd={handleAdd}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                cartQuantity={getCartQuantity(product)}
                layout="scroll"
              />
            ) : (
              <DealProductCard
                key={product._id}
                product={product}
                onAdd={handleAdd}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                cartQuantity={getCartQuantity(product)}
                layout="scroll"
              />
            )
          )}
        </HorizontalScrollRow>
      )}
    </section>
  );
}

export default SimilarProducts;
