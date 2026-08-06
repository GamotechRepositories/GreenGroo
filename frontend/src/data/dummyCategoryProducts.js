const FRUIT_NAMES = [
  "Fresh Banana",
  "Alphonso Mango",
  "Shimla Apple",
  "Sweet Orange",
  "Green Grapes",
  "Pomegranate",
  "Papaya",
  "Watermelon",
  "Muskmelon",
  "Kiwi",
  "Strawberry",
  "Pineapple",
  "Guava",
  "Chikoo",
  "Pear",
  "Peach",
  "Cherry",
  "Dragon Fruit",
  "Coconut",
  "Lemon",
];

const VEG_NAMES = [
  "Tomato",
  "Onion",
  "Potato",
  "Carrot",
  "Cabbage",
  "Cauliflower",
  "Broccoli",
  "Capsicum",
  "Cucumber",
  "Spinach",
  "Lady Finger",
  "Brinjal",
  "Beans",
  "Peas",
  "Bottle Gourd",
  "Bitter Gourd",
  "Pumpkin",
  "Beetroot",
  "Radish",
  "Garlic",
];

const ORGANIC_NAMES = [
  "Organic Turmeric",
  "Organic Toor Dal",
  "Organic Brown Rice",
  "Organic Jaggery",
  "Organic A2 Milk",
  "Organic Mustard Oil",
  "Organic Honey",
  "Organic Quinoa",
  "Organic Moong Dal",
  "Organic Wheat Flour",
  "Organic Chana",
  "Organic Coconut Oil",
  "Organic Green Tea",
  "Organic Almonds",
  "Organic Cashews",
  "Organic Ragi Flour",
  "Organic Rock Salt",
  "Organic Ghee",
  "Organic Sugar",
  "Organic Besan",
];

const DAIRY_NAMES = [
  "Full Cream Milk",
  "Toned Milk",
  "Curd",
  "Paneer",
  "Butter",
  "Ghee",
  "Cheese Slice",
  "Mozzarella",
  "Fresh Cream",
  "Buttermilk",
  "Lassi",
  "Yogurt",
  "Cottage Cheese",
  "Flavoured Milk",
  "Milkshake",
  "Khoya",
  "Malai",
  "Probiotic Curd",
  "Cheese Cubes",
  "Whipping Cream",
];

const CATEGORY_FALLBACK = {
  Fruits: "/categories/fruits.webp",
  Vegetables: "/categories/vegetables.webp",
  Organic: "/categories/organic.webp",
  Dairy: "/categories/dairy.webp",
};

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&h=400&q=80`;

/** Keyword → related food photo */
const RELATED_IMAGES = {
  // Fruits
  banana: img("photo-1571771894821-ce9b6d11b449"),
  mango: img("photo-1553279768-865429fa0078"),
  apple: img("photo-1560806887-1e4cd0b6cbd6"),
  orange: img("photo-1547514701-42782101795e"),
  grapes: img("photo-1537640538966-79f369143f8f"),
  pomegranate: img("photo-1541344999736-83eca272f6fc"),
  papaya: img("photo-1526318472351-c75fcf070305"),
  watermelon: img("photo-1587049352846-4a222e784d38"),
  muskmelon: img("photo-1571575173700-afb9492e6a50"),
  kiwi: img("photo-1585059895525-76a90c3d8d49"),
  strawberry: img("photo-1464965911861-746a04b4bca6"),
  pineapple: img("photo-1550258987-190a2d41a8ba"),
  guava: img("photo-1601493700631-2b16ec4b4716"),
  chikoo: img("photo-1601493700631-2b16ec4b4716"),
  pear: img("photo-1514756331096-242fdeb70d4a"),
  peach: img("photo-1629828874514-d80e87e8e9f0"),
  cherry: img("photo-1528821128474-27f963b062bf"),
  dragon: img("photo-1527325678964-54921690f999"),
  coconut: img("photo-1550985543-4b7731623df9"),
  lemon: img("photo-1570197788417-0e82375c9371"),

  // Vegetables
  tomato: img("photo-1546094096-0df4bcaaa337"),
  onion: img("photo-1518977956812-cd3dbadaaf31"),
  potato: img("photo-1518977676601-b53f82aba655"),
  carrot: img("photo-1598170845058-32b9d6a5da37"),
  cabbage: img("photo-1594282486552-05b4d80acd93"),
  cauliflower: img("photo-1568584711075-3d021a7e8cae"),
  broccoli: img("photo-1459411621453-7b03977f4bfc"),
  capsicum: img("photo-1563565375-f3fdfdbefa83"),
  cucumber: img("photo-1449300079323-02e209d9d3a6"),
  spinach: img("photo-1576045057995-568f588f82fb"),
  lady: img("photo-1425543107036-a46717f3ac17"),
  brinjal: img("photo-1615485290382-441e4d049cb5"),
  beans: img("photo-1567375698348-5d9d5ae24c50"),
  peas: img("photo-1587735243615-c03f25aaff15"),
  bottle: img("photo-1594282486552-05b4d80acd93"),
  bitter: img("photo-1615485290382-441e4d049cb5"),
  pumpkin: img("photo-1570586437263-ab629fccc818"),
  beetroot: img("photo-1593105544559-ecb03bf76f82"),
  radish: img("photo-1598170845058-32b9d6a5da37"),
  garlic: img("photo-1540148426945-6cf22a1b4958"),

  // Organic / grocery
  turmeric: img("photo-1615485290382-441e4d049cb5"),
  dal: img("photo-1586201375761-83865001e31c"),
  toor: img("photo-1586201375761-83865001e31c"),
  moong: img("photo-1586201375761-83865001e31c"),
  rice: img("photo-1536304993881-ff6e9eefa2a6"),
  brown: img("photo-1536304993881-ff6e9eefa2a6"),
  jaggery: img("photo-1606312619070-d48b7cec1f1e"),
  mustard: img("photo-1474979266404-7eaacbcd87c5"),
  oil: img("photo-1474979266404-7eaacbcd87c5"),
  honey: img("photo-1558642452-9d2a7deb7f62"),
  quinoa: img("photo-1586201375761-83865001e31c"),
  flour: img("photo-1574323347407-f5e1ad6d020b"),
  wheat: img("photo-1574323347407-f5e1ad6d020b"),
  ragi: img("photo-1574323347407-f5e1ad6d020b"),
  besan: img("photo-1574323347407-f5e1ad6d020b"),
  chana: img("photo-1596797038530-2c107229654b"),
  tea: img("photo-1564890369478-c89ca6d9cde9"),
  almonds: img("photo-1508061250071-47227b62b4c0"),
  cashews: img("photo-1599599810769-bcde5a160d32"),
  salt: img("photo-1518110925495-5fe2cdfbd0be"),
  sugar: img("photo-1581441363689-1f3c3c414635"),

  // Dairy
  milk: img("photo-1563636619-e9143da7973b"),
  cream: img("photo-1628088062854-d1870b4553da"),
  toned: img("photo-1550583724-b2692b85b150"),
  flavoured: img("photo-1550583724-b2692b85b150"),
  a2: img("photo-1563636619-e9143da7973b"),
  curd: img("photo-1488477181946-6428a0291777"),
  probiotic: img("photo-1488477181946-6428a0291777"),
  yogurt: img("photo-1488477181946-6428a0291777"),
  paneer: img("photo-1631452180519-c014fe946bc7"),
  butter: img("photo-1589985270826-4b7bb135bc9d"),
  ghee: img("photo-1589985270826-4b7bb135bc9d"),
  cheese: img("photo-1486297678162-eb2a19b0a32d"),
  mozzarella: img("photo-1618164435735-413d3b802f83"),
  fresh: img("photo-1628088062854-d1870b4553da"),
  whipping: img("photo-1628088062854-d1870b4553da"),
  buttermilk: img("photo-1550583724-b2692b85b150"),
  lassi: img("photo-1550583724-b2692b85b150"),
  cottage: img("photo-1631452180519-c014fe946bc7"),
  milkshake: img("photo-1572490122747-3968b75cc699"),
  khoya: img("photo-1631452180519-c014fe946bc7"),
  malai: img("photo-1628088062854-d1870b4553da"),
};

function getRelatedImage(name, category) {
  const cleaned = String(name || "")
    .toLowerCase()
    .replace(/^organic\s+/, "")
    .replace(/^fresh\s+/, "")
    .replace(/^sweet\s+/, "")
    .replace(/^green\s+/, "")
    .replace(/^shimla\s+/, "")
    .replace(/^alphonso\s+/, "")
    .replace(/^full\s+cream\s+/, "")
    .trim();

  if (RELATED_IMAGES[cleaned]) return RELATED_IMAGES[cleaned];

  const words = cleaned.split(/\s+/);
  for (const word of words) {
    if (RELATED_IMAGES[word]) return RELATED_IMAGES[word];
  }

  return CATEGORY_FALLBACK[category];
}

function makeProducts(names, category, priceBase) {
  return names.map((name, index) => {
    const price = priceBase + (index % 7) * 10 + (index % 3) * 5;
    const discountedPrice = Math.max(priceBase - 5, price - 10 - (index % 5) * 2);
    return {
      _id: `dummy-${category}-${index + 1}`,
      name,
      sub: index % 2 === 0 ? "500 g" : "1 kg",
      price,
      discountedPrice,
      ratings: 3.8 + (index % 12) * 0.1,
      reviewCount: 100 + index * 37,
      productImages: [getRelatedImage(name, category), CATEGORY_FALLBACK[category]],
      categories: [category],
      stock: 50,
    };
  });
}

const DUMMY_BY_CATEGORY = {
  fruits: makeProducts(FRUIT_NAMES, "Fruits", 40),
  vegetables: makeProducts(VEG_NAMES, "Vegetables", 25),
  organic: makeProducts(ORGANIC_NAMES, "Organic", 80),
  dairy: makeProducts(DAIRY_NAMES, "Dairy", 35),
};

export function getDummyCategoryProducts(categoryName) {
  const key = String(categoryName || "").trim().toLowerCase();
  if (key.includes("fruit")) return DUMMY_BY_CATEGORY.fruits;
  if (key.includes("vegetable") || key.includes("veggie")) return DUMMY_BY_CATEGORY.vegetables;
  if (key.includes("organic")) return DUMMY_BY_CATEGORY.organic;
  if (key.includes("dairy") || key.includes("milk")) return DUMMY_BY_CATEGORY.dairy;
  return null;
}
