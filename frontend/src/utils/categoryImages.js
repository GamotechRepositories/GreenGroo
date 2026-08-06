/** Local PNG icons for grocery categories */
export const CATEGORY_IMAGES = {
  fruits: "/fruits.png",
  fruit: "/fruits.png",
  vegetables: "/vegetables.png",
  vegetable: "/vegetables.png",
  veggies: "/vegetables.png",
};

export function isVegetablesCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return (
    key === "vegetables" ||
    key === "vegetable" ||
    key === "veggies" ||
    key.includes("vegetable") ||
    key.includes("veggie")
  );
}

export function isFruitsCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  if (isVegetablesCategory(name)) return false;
  return key === "fruits" || key === "fruit" || key.includes("fruit");
}

export function getCategoryImage(name, apiImage) {
  const key = String(name || "").trim().toLowerCase();
  if (CATEGORY_IMAGES[key]) return CATEGORY_IMAGES[key];
  if (isVegetablesCategory(name)) return "/vegetables.png";
  if (isFruitsCategory(name)) return "/fruits.png";
  return apiImage || null;
}
