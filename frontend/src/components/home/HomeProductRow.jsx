import SectionHeader from "../mobile/SectionHeader";
import DealProductCard from "../product/DealProductCard";
import HorizontalScrollRow from "./HorizontalScrollRow";
import { useProductCartActions } from "../../hooks/useProductCartActions";

function HomeProductRow({ title, viewAllTo, products, loading }) {
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
    layout: "scroll",
  });

  if (!loading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section className="bg-white px-4 py-3 sm:px-6 md:px-8">
      <SectionHeader title={title} viewAllTo={viewAllTo} className="mb-2" />

      {loading ? (
        <HorizontalScrollRow>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`product-row-skeleton-${index}`}
              className="h-[258px] w-[150px] shrink-0 animate-pulse rounded-xl border border-border-light bg-gray-100 sm:w-[165px]"
            />
          ))}
        </HorizontalScrollRow>
      ) : (
        <HorizontalScrollRow>
          {products.map((product) => (
            <DealProductCard key={product._id} {...cardProps(product)} />
          ))}
        </HorizontalScrollRow>
      )}
    </section>
  );
}

export default HomeProductRow;
