import { useState, useEffect } from "react";
import { greenGroccService } from "../services/greenGroccService";

export function useGreenGrocc() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        greenGroccService.getCategories(),
        greenGroccService.getProducts(),
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

export default useGreenGrocc;
