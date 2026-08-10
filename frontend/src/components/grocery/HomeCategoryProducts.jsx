import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
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
    <section className="bg-white px-4 py-4 lg:rounded-2xl lg:px-5 lg:py-5 lg:shadow-sm">
      <h2 className="mb-3 text-base font-bold text-text-primary lg:mb-4 lg:text-xl">
        {categoryName}
      </h2>
      <div className="lg:hidden">
        <TwoRowHorizontalProducts
          products={products}
          cardProps={cardProps}
          scroll={false}
        />
      </div>
      <div className="hidden grid-cols-4 gap-4 lg:grid xl:grid-cols-5">
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
