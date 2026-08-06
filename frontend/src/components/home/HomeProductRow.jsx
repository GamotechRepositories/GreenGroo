import SectionHeader from "../mobile/SectionHeader";
import DealProductCard from "../product/DealProductCard";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
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
  });

  if (!loading && (!products || products.length === 0)) {
    return null;
  }

  const skeleton = (key, className) => (
    <div key={key} className={`animate-pulse rounded-xl bg-[#f5f5f5] ${className}`} />
  );

  return (
    <section className="bg-white px-4 py-4 sm:px-6 lg:rounded-2xl lg:border lg:border-border-light lg:px-6 lg:py-6 lg:shadow-sm xl:px-8">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeader title={title} viewAllTo={viewAllTo} className="mb-4" />

        {loading ? (
          <>
            <div className="lg:hidden">
              <HorizontalScrollRow gapClassName="gap-3">
                {Array.from({ length: 6 }).map((_, i) =>
                  skeleton(`m-${i}`, "h-[200px] w-[128px] shrink-0 sm:w-[140px]")
                )}
              </HorizontalScrollRow>
            </div>
            <div className="hidden gap-3 lg:grid lg:grid-cols-8 lg:grid-rows-1">
              {Array.from({ length: 8 }).map((_, i) => skeleton(`d-${i}`, "h-[280px] rounded-2xl"))}
            </div>
          </>
        ) : (
          <>
            <div className="lg:hidden">
              <HorizontalScrollRow gapClassName="gap-3">
                {products.slice(0, 8).map((product) => (
                  <QuickCommerceProductCard key={product._id} {...cardProps(product)} />
                ))}
              </HorizontalScrollRow>
            </div>
            <div className="hidden gap-3 lg:grid lg:grid-cols-8 lg:grid-rows-1">
              {products.slice(0, 8).map((product) => (
                <DealProductCard key={product._id} {...cardProps(product)} layout="grid" />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default HomeProductRow;
