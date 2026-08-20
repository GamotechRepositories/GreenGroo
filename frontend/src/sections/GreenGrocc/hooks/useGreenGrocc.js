import { useState, useEffect } from "react";
import { greenGroccService } from "../services/greenGroccService";
import { GREENGROCC_CATEGORIES } from "../data/categories";

export function useGreenGrocc() {
  const [categories, setCategories] = useState(GREENGROCC_CATEGORIES);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const cats = await greenGroccService.getCategories();
      const prods = await greenGroccService.getProducts();
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

export default useGreenGrocc;
