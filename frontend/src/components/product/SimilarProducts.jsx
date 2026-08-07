import { useEffect, useState } from "react";
import { getSimilarProducts } from "../../api/api";
import { getDummyCategoryProducts } from "../../data/dummyCategoryProducts";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import HorizontalScrollRow from "../home/HorizontalScrollRow";
import SectionHeader from "../mobile/SectionHeader";
import DealProductCard from "./DealProductCard";
import QuickCommerceProductCard from "./QuickCommerceProductCard";

function SimilarProducts({ productId, categoryName = "" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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
        if (String(productId || "").startsWith("dummy-") || !productId) {
          const dummy = (getDummyCategoryProducts(categoryName) || [])
            .filter((p) => String(p._id) !== String(productId))
            .slice(0, 10);
          if (!cancelled) setProducts(dummy);
          return;
        }

        const { data } = await getSimilarProducts(productId);
        if (!cancelled) {
          setProducts(data.data || []);
        }
      } catch {
        if (!cancelled) {
          const dummy = (getDummyCategoryProducts(categoryName) || [])
            .filter((p) => String(p._id) !== String(productId))
            .slice(0, 10);
          setProducts(dummy);
        }
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
  }, [productId, categoryName]);

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
