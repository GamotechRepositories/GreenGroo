import {
  MOST_VIEWED_LIMIT,
  useMostViewedProductsQuery,
} from "../../hooks/queries/useProductsQuery";
import HomeProductRow from "./HomeProductRow";

function MostViewedProducts() {
  const { data: products = [], isLoading: loading } = useMostViewedProductsQuery();

  return (
    <HomeProductRow
      title="Most viewed"
      viewAllTo="/product"
      products={products}
      loading={loading}
      maxItems={MOST_VIEWED_LIMIT}
    />
  );
}

export default MostViewedProducts;
