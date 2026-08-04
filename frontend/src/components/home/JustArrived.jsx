import { useEffect, useState } from "react";
import { getProducts } from "../../api/api";
import HomeProductRow from "./HomeProductRow";

const HOME_PRODUCT_LIMIT = 12;

function JustArrived() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await getProducts({
          justArrived: true,
          limit: HOME_PRODUCT_LIMIT,
        });
        setProducts((data.data || []).slice(0, HOME_PRODUCT_LIMIT));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <HomeProductRow
      title="Just Arrived"
      viewAllTo="/just-arrived"
      products={products}
      loading={loading}
    />
  );
}

export default JustArrived;
