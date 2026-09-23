import { useState, useEffect } from "react";
import { superMallService } from "../services/superMallService";

export function useSuperMall() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        superMallService.getCategories(),
        superMallService.getProducts(),
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

export default useSuperMall;
