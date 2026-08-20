import { GROCERY_CATEGORIES } from "./groceryCategories";

const SHOP_SIDEBAR_IMAGES = {
  Vegetables: "/categories/shop_vegetables.jpg",
  Fruits: "/categories/shop_fruits.jpg",
  Dairy: "/categories/shop_dairy.jpg",
  Grains: "/categories/shop_grains.jpg",
  Pulses: "/categories/shop_pulses.jpg",
  Grocery: "/categories/shop_grocery.jpg",
  Oils: "/categories/shop_oils.jpg",
  Spices: "/categories/shop_spices.jpg",
  "Dry Fruits": "/categories/shop_dry_fruits.jpg",
};

/** Full shop left-rail list (Vegetables, Fruits, Dairy, … Bakery). */
export const DUMMY_SHOP_CATEGORIES = GROCERY_CATEGORIES.map((cat) => ({
  _id: `shop-cat-${cat.slug}`,
  categoryName: cat.name,
  categoryImage: SHOP_SIDEBAR_IMAGES[cat.name] || cat.image,
  subcategories: [],
  itemsLabel: cat.items,
}));

export function getDummyCategoryProducts() {
  return null;
}

export function getAllDummyProducts() {
  return [];
}

export function getDummyProductById() {
  return null;
}
