import { useState, useEffect } from "react";
import { superMallService } from "../services/superMallService";
import { SUPERMALL_CATEGORIES } from "../data/categories";

export function useSuperMall() {
  const [categories, setCategories] = useState(SUPERMALL_CATEGORIES);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const cats = await superMallService.getCategories();
      const prods = await superMallService.getProducts();
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

export default useSuperMall;
