import SectionHeader from "../mobile/SectionHeader";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import { getDummyCategoryProducts } from "../../data/dummyCategoryProducts";
import TwoRowHorizontalProducts from "./TwoRowHorizontalProducts";

export const HOME_PRODUCT_CATEGORIES = ["Fruits", "Vegetables", "Organic", "Dairy"];

function CategoryProductSection({ categoryName, limit = 20 }) {
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const allProducts = getDummyCategoryProducts(categoryName) || [];
  const products = allProducts.slice(0, limit);

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  if (products.length === 0) return null;

  return (
    <section className="bg-white px-4 py-4">
      <SectionHeader
        title={categoryName}
        viewAllTo={`/?categoryName=${encodeURIComponent(categoryName)}`}
        className="mb-3"
      />
      <TwoRowHorizontalProducts products={products} cardProps={cardProps} />
    </section>
  );
}

function HomeAllCategoryProducts({ limitPerCategory = 20 }) {
  return (
    <div className="space-y-1">
      {HOME_PRODUCT_CATEGORIES.map((category) => (
        <CategoryProductSection
          key={category}
          categoryName={category}
          limit={limitPerCategory}
        />
      ))}
    </div>
  );
}

export default HomeAllCategoryProducts;
