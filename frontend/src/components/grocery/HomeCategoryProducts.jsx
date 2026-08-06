import { useProductCartActions } from "../../hooks/useProductCartActions";
import { getDummyCategoryProducts } from "../../data/dummyCategoryProducts";
import TwoRowHorizontalProducts from "./TwoRowHorizontalProducts";

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
      <TwoRowHorizontalProducts
        products={products}
        cardProps={cardProps}
        scroll={false}
      />
    </section>
  );
}

export default HomeCategoryProducts;
