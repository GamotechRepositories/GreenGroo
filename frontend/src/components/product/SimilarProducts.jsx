import { useEffect, useState } from "react";
import { getSimilarProducts } from "../../api/api";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import HorizontalScrollRow from "../home/HorizontalScrollRow";
import SectionHeader from "../mobile/SectionHeader";
import DealProductCard from "./DealProductCard";

function SimilarProducts({ productId, categoryName = "" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  useEffect(() => {
    if (!productId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSimilar = async () => {
      setLoading(true);
      try {
        const { data } = await getSimilarProducts(productId);
        if (!cancelled) {
          setProducts(data.data || []);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
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
  }, [productId]);

  const viewAllTo = categoryName
    ? `/product?categoryName=${encodeURIComponent(categoryName)}`
    : "/product";

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="col-span-6 mt-8 border-t border-border-light pt-6">
      <SectionHeader title="Similar Products" viewAllTo={viewAllTo} className="mb-4" />

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
          {products.map((product) => (
            <DealProductCard
              key={product._id}
              product={product}
              onAdd={handleAdd}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              cartQuantity={getCartQuantity(product)}
              layout="scroll"
            />
          ))}
        </HorizontalScrollRow>
      )}
    </section>
  );
}

export default SimilarProducts;
