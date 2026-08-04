const SORT_GETTERS = {
  createdAt: (product) => new Date(product.createdAt || 0).getTime(),
  name: (product) => product.name?.toLowerCase() || "",
  price: (product) => Number(product.discountedPrice) || 0,
  stock: (product) => (product.inStock !== false ? 1 : 0),
  status: (product) => (product.isActive ? 1 : 0),
  brand: (product) => product.brandName?.toLowerCase() || "",
};

export function filterAndSortProducts(
  products,
  { selectedCategory, statusFilter, searchQuery, sortBy, sortDir }
) {
  let result = [...products];

  if (selectedCategory !== "all") {
    result = result.filter((product) => product.categories?.includes(selectedCategory));
  }

  if (statusFilter === "inactive") {
    result = result.filter((product) => !product.isActive);
  } else if (statusFilter === "out_of_stock") {
    result = result.filter((product) => product.inStock === false || Number(product.stock) <= 0);
  } else if (statusFilter === "low_stock") {
    result = result.filter(
      (product) =>
        product.isActive &&
        product.inStock !== false &&
        Number(product.stock) > 0 &&
        Number(product.stock) <= 5
    );
  } else if (statusFilter === "active") {
    result = result.filter(
      (product) => product.isActive && product.inStock !== false && Number(product.stock) > 0
    );
  }

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    result = result.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const brand = product.brandName?.toLowerCase() || "";
      const subcategories = [
        ...(Array.isArray(product.subcategories) ? product.subcategories : []),
        product.subcategory,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const categories = (product.categories || []).join(" ").toLowerCase();

      return (
        name.includes(query) ||
        brand.includes(query) ||
        subcategories.includes(query) ||
        categories.includes(query)
      );
    });
  }

  const getValue = SORT_GETTERS[sortBy] || SORT_GETTERS.name;

  result.sort((a, b) => {
    const valueA = getValue(a);
    const valueB = getValue(b);

    if (valueA < valueB) return sortDir === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return result;
}
