import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import { useInfiniteProductsQuery } from "../../hooks/queries/useProductsQuery";
import { useProductCartActions } from "../../hooks/useProductCartActions";

function HomeCategoryProducts({ categoryName }) {
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteProductsQuery(
      { categoryName },
      { enabled: Boolean(categoryName) }
    );

  const products = data?.pages?.flatMap((page) => page.products) || [];

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  if (isLoading && products.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[240px] animate-pulse rounded-xl bg-[#f5f5f5]"
          />
        ))}
      </div>
    );
  }

  if (!isLoading && products.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-text-secondary">
        No products found in {categoryName} yet.
      </p>
    );
  }

  return (
    <section className="bg-white px-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <QuickCommerceProductCard
            key={product._id}
            {...cardProps(product)}
            layout="grid"
          />
        ))}
      </div>

      {hasNextPage ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-full border border-border-light px-5 py-2 text-sm font-semibold text-text-primary disabled:opacity-60"
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default HomeCategoryProducts;
