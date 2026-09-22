import { usePurchasedProductsQuery } from "../../hooks/queries/useProductsQuery";
import { useAuth } from "../../context/AuthContext";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import SectionHeader from "./SectionHeader";
import DealProductCard from "../product/DealProductCard";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import HorizontalScrollRow from "../home/HorizontalScrollRow";

const HOME_PRODUCT_LIMIT = 8;

function BestDeals({ title = "Previously bought", viewAllTo = "/orders" }) {
  const { user } = useAuth();
  const { data: products = [], isLoading: loading } = usePurchasedProductsQuery({
    enabled: Boolean(user),
  });
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const displayProducts = products.slice(0, HOME_PRODUCT_LIMIT);

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  const skeleton = (key, className) => (
    <div
      key={key}
      className={`animate-pulse rounded-xl bg-[#f5f5f5] ${className}`}
    />
  );

  if (!user) return null;
  if (!loading && displayProducts.length === 0) return null;

  return (
    <section className="px-4 py-4 sm:px-6 lg:px-6 lg:py-5 xl:px-8">
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
            <div className="hidden gap-3 lg:grid lg:grid-cols-8 lg:grid-rows-1">
              {Array.from({ length: 8 }).map((_, i) => skeleton(`d-${i}`, "h-[280px] rounded-2xl"))}
            </div>
          </>
        ) : (
          <>
            <div className="lg:hidden">
              <HorizontalScrollRow gapClassName="gap-3">
                {displayProducts.map((product) => (
                  <QuickCommerceProductCard key={product._id} {...cardProps(product)} />
                ))}
              </HorizontalScrollRow>
            </div>
            <div className="hidden gap-3 lg:grid lg:grid-cols-8 lg:grid-rows-1">
              {displayProducts.slice(0, 8).map((product) => (
                <DealProductCard key={product._id} {...cardProps(product)} layout="grid" />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default BestDeals;
