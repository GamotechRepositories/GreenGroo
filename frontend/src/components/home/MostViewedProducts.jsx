import {
  MOST_VIEWED_LIMIT,
  useMostViewedProductsQuery,
} from "../../hooks/queries/useProductsQuery";
import HomeProductRow from "./HomeProductRow";

function MostViewedProducts({ section = null, viewAllTo = "/product" }) {
  const { data: products = [], isLoading: loading } = useMostViewedProductsQuery({}, section);

  return (
    <HomeProductRow
      title="Most viewed"
      viewAllTo={viewAllTo}
      products={products}
      loading={loading}
      maxItems={MOST_VIEWED_LIMIT}
    />
  );
}

export default MostViewedProducts;
