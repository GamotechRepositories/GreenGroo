import { useEffect, useState } from "react";
import { getProducts } from "../../api/api";
import HomeProductRow from "./HomeProductRow";
import { useDeliveryLocationKey } from "../../context/LocationContext";
import { fillWithNewest } from "../../hooks/queries/useProductsQuery";

const HOME_PRODUCT_LIMIT = 16;

function JustArrived({ section = null, viewAllTo = "/just-arrived" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const locationKey = useDeliveryLocationKey();

  useEffect(() => {
    const scope = section ? { section } : {};
    const fetchProducts = async () => {
      try {
        const { data } = await getProducts({
          ...scope,
          justArrived: true,
          limit: HOME_PRODUCT_LIMIT,
        });
        setProducts(await fillWithNewest(data.data || [], HOME_PRODUCT_LIMIT, scope));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [locationKey, section]);

  return (
    <HomeProductRow
      title="Just Arrived"
      viewAllTo={viewAllTo}
      products={products}
      loading={loading}
      maxItems={HOME_PRODUCT_LIMIT}
    />
  );
}

export default JustArrived;
