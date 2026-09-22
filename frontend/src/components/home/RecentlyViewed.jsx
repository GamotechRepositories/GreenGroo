import { useMostViewedProductsQuery } from "../../hooks/queries/useProductsQuery";
import HomeProductRow from "./HomeProductRow";

function RecentlyViewed() {
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

export default RecentlyViewed;
