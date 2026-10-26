import SectionHeader from "../mobile/SectionHeader";
import DealProductCard from "../product/DealProductCard";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import HorizontalScrollRow from "./HorizontalScrollRow";
import { useProductCartActions } from "../../hooks/useProductCartActions";

const DESKTOP_COLUMNS = 6;

function HomeProductRow({ title, viewAllTo, products, loading, maxItems = 8 }) {
  const desktopLimit = Math.max(DESKTOP_COLUMNS, Math.floor(maxItems / DESKTOP_COLUMNS) * DESKTOP_COLUMNS);
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
    <section className="bg-transparent px-2 sm:px-3 py-3 lg:px-0 lg:py-5">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeader title={title} viewAllTo={viewAllTo} className="mb-4" />

        {loading ? (
          <>
            <div className="lg:hidden">
              <HorizontalScrollRow gapClassName="gap-3">
                {Array.from({ length: 6 }).map((_, i) =>
                  skeleton(
                    `m-${i}`,
                    "h-[220px] w-[calc((100vw-2rem-2.25rem)/3.25)] shrink-0"
                  )
                )}
              </HorizontalScrollRow>
            </div>
            <div className="hidden gap-3 lg:grid lg:grid-cols-6 lg:grid-rows-1">
              {Array.from({ length: DESKTOP_COLUMNS }).map((_, i) => skeleton(`d-${i}`, "h-[280px] rounded-2xl"))}
            </div>
          </>
        ) : (
          <>
            <div className="lg:hidden">
              <HorizontalScrollRow gapClassName="gap-3">
                {products.slice(0, maxItems).map((product) => (
                  <QuickCommerceProductCard key={product._id} {...cardProps(product)} />
                ))}
              </HorizontalScrollRow>
            </div>
            <div className="hidden gap-3 lg:grid lg:grid-cols-6">
              {products.slice(0, desktopLimit).map((product) => (
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
