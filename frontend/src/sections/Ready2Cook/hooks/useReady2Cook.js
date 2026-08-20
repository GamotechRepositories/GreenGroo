import { useState, useEffect } from "react";
import { ready2CookService } from "../services/ready2CookService";
import { READY2COOK_CATEGORIES } from "../data/categories";

export function useReady2Cook() {
  const [categories, setCategories] = useState(READY2COOK_CATEGORIES);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const cats = await ready2CookService.getCategories();
      const prods = await ready2CookService.getProducts();
      if (isMounted) {
        if (cats?.length) setCategories(cats);
        if (prods?.length) setProducts(prods);
        setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  return { categories, products, loading };
}

export default useReady2Cook;
