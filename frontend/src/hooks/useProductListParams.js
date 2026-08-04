import { useMemo } from "react";

export function useProductListParams(searchParams) {
  return useMemo(() => {
    const params = {};

    const categoryName = searchParams.get("categoryName")?.trim() || "";
    const searchQuery = searchParams.get("q")?.trim() || "";
    const brandName = searchParams.get("brandName")?.trim() || "";
    const brand = searchParams.get("brand")?.trim() || "";
    const subcategory = searchParams.get("subcategory")?.trim() || "";
    const minPrice = searchParams.get("minPrice")?.trim() || "";
    const maxPrice = searchParams.get("maxPrice")?.trim() || "";
    const sort = searchParams.get("sort")?.trim() || "newest";

    if (categoryName) params.categoryName = categoryName;
    if (searchQuery) params.q = searchQuery;
    if (brandName) params.brandName = brandName;
    else if (brand) params.brandName = brand;
    if (subcategory) params.subcategory = subcategory;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sort && sort !== "default") params.sort = sort;
    if (searchParams.get("justArrived") === "true") params.justArrived = true;
    if (searchParams.get("hotSelling") === "true") params.hotSelling = true;

    return params;
  }, [searchParams]);
}
