import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import { getDummyCategoryProducts } from "../../data/dummyCategoryProducts";

function HomeCategoryProducts({ categoryName }) {
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const products = getDummyCategoryProducts(categoryName) || [];

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  if (products.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-text-secondary">
        No products found in {categoryName} yet.
      </p>
    );
  }

  return (
    <section className="bg-white px-4 py-4">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {products.map((product) => (
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

export default HomeCategoryProducts;
