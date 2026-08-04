import { useRecentlyViewedProductsQuery } from "../../hooks/queries/useProductsQuery";
import HomeProductRow from "./HomeProductRow";

function RecentlyViewed() {
  const { data: products = [], isLoading: loading } = useRecentlyViewedProductsQuery();

  return (
    <HomeProductRow
      title="Recently Viewed"
      viewAllTo="/product"
      products={products}
      loading={loading}
    />
  );
}

export default RecentlyViewed;
