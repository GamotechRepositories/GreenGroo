import { getDealProductById } from "../components/home/DealsStartingAt9Section";
import { GROCERY_CATEGORIES } from "./groceryCategories";

const SHOP_SIDEBAR_IMAGES = {
  Vegetables: "/categories/category_vegetables.jpg",
  Fruits: "/categories/category_fruits.jpg",
  Dairy: "/categories/category_dairy_eggs.png",
  Grains: "/categories/category_pulses_grains.jpg",
  Pulses: "/categories/category_pulses_grains.jpg",
  Grocery: "/categories/shop_grocery.jpg",
  Oils: "/categories/category_oils_ghee.jpg",
  Spices: "/categories/category_spices_dry_fruits.jpg",
  "Dry Fruits": "/categories/category_spices_dry_fruits.jpg",
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

export function getDummyProductById(id) {
  return getDealProductById(id);
}
