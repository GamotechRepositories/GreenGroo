import { useState, useEffect } from "react";
import { ready2CookService } from "../services/ready2CookService";

export function useReady2Cook() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        ready2CookService.getCategories(),
        ready2CookService.getProducts(),
      ]);
      if (isMounted) {
        setCategories(Array.isArray(cats) ? cats : []);
        setProducts(Array.isArray(prods) ? prods : []);
        setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return { categories, products, loading };
}

export default useReady2Cook;
