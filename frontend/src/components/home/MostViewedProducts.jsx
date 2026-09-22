import { useMostViewedProductsQuery } from "../../hooks/queries/useProductsQuery";
import HomeProductRow from "./HomeProductRow";

function MostViewedProducts() {
  const { data: products = [], isLoading: loading } = useMostViewedProductsQuery();

  return (
    <HomeProductRow
      title="Most viewed"
      viewAllTo="/product"
      products={products}
      loading={loading}
    />
  );
}

export default MostViewedProducts;
