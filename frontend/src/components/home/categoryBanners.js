const categoryLink = (name) => `/product?categoryName=${encodeURIComponent(name)}`;

const CATEGORY_BANNERS = {
  fruits: [
    {
      id: "fruits-1",
      image: "/banners/fruits-banner.png",
      fade: "from-[#fff3c4] via-[#fff3c4]/80",
      tag: "Farm Fresh",
      title: "Juicy Fruits\nPicked Fresh",
      subtitle: "Apples, bananas, grapes & more",
      offer: "Up to 25% Off",
    },
    {
      id: "fruits-2",
      image: "/banners/fruits-banner-2.jpg",
      fade: "from-[#fde4e4] via-[#fde4e4]/80",
      tag: "Seasonal",
      title: "Seasonal Fruit\nFestival",
      subtitle: "Mangoes, papaya & pomegranate",
      offer: "Flat 20% Off",
    },
  ],
  dairy: [
    {
      id: "dairy-1",
      image: "/banners/dairy-banner.png",
      fade: "from-[#fdf6e4] via-[#fdf6e4]/80",
      tag: "Daily Fresh",
      title: "Pure Dairy\nEvery Morning",
      subtitle: "Milk, curd, paneer & butter",
      offer: "Up to 15% Off",
    },
    {
      id: "dairy-2",
      image: "/banners/dairy-banner-2.jpg",
      fade: "from-[#e3f1fc] via-[#e3f1fc]/80",
      tag: "Farm to Home",
      title: "Desi Dairy\nEssentials",
      subtitle: "Fresh paneer, dahi & eggs",
      offer: "Save ₹50 on ₹499",
    },
  ],
  vegetables: [
    {
      id: "vegetables-1",
      image: "/banners/vegetables-banner.png",
      fade: "from-[#eef6dc] via-[#eef6dc]/80",
      tag: "Farm Fresh",
      title: "Fresh Veggies\nDaily Harvest",
      subtitle: "Straight from local farms",
      offer: "Up to 30% Off",
    },
    {
      id: "vegetables-2",
      image: "/banners/vegetables-banner-2.jpg",
      fade: "from-[#fdf5d6] via-[#fdf5d6]/80",
      tag: "Kitchen Basics",
      title: "Everyday\nSabzi Store",
      subtitle: "Onion, potato, tomato & more",
      offer: "Flat 20% Off",
    },
  ],
  beverages: [
    {
      id: "beverages-1",
      image: "/banners/beverages-banner-1.jpg",
      fade: "from-[#fde7d6] via-[#fde7d6]/80",
      tag: "Chilled",
      title: "Cool Drinks\nfor Every Mood",
      subtitle: "Juices, sodas & green tea",
      offer: "Up to 20% Off",
    },
    {
      id: "beverages-2",
      image: "/banners/beverages-banner-2.jpg",
      fade: "from-[#dcecf9] via-[#dcecf9]/80",
      tag: "Desi Drinks",
      title: "Traditional\nRefreshers",
      subtitle: "Aam panna, chaas & milk shakes",
      offer: "Buy 2 Save 10%",
    },
  ],
  oils: [
    {
      id: "oils-1",
      image: "/banners/oils-banner-1.jpg",
      fade: "from-[#fbe9a8] via-[#fbe9a8]/80",
      tag: "Pure & Healthy",
      title: "Cooking Oils\n& Desi Ghee",
      subtitle: "Groundnut, sunflower & mustard",
      offer: "Up to 18% Off",
    },
    {
      id: "oils-2",
      image: "/banners/oils-banner-2.jpg",
      fade: "from-[#e8f0d0] via-[#e8f0d0]/80",
      tag: "Cold Pressed",
      title: "Wood Pressed\nGoodness",
      subtitle: "Coconut, sesame & more",
      offer: "Flat 15% Off",
    },
  ],
  spices: [
    {
      id: "spices-1",
      image: "/banners/spices-banner-1.jpg",
      fade: "from-[#f6ddd3] via-[#f6ddd3]/80",
      tag: "Aromatic",
      title: "Whole Spices\nBold Flavour",
      subtitle: "Chilli, jeera, pepper & more",
      offer: "Up to 25% Off",
    },
    {
      id: "spices-2",
      image: "/banners/spices-banner-2.jpg",
      fade: "from-[#fbf3e3] via-[#fbf3e3]/80",
      tag: "Ghar ka Masala",
      title: "Masala Box\nEssentials",
      subtitle: "Haldi, mirchi, garam masala",
      offer: "Flat 15% Off",
    },
  ],
  dryfruits: [
    {
      id: "dryfruits-1",
      image: "/banners/dryfruits-banner-1.jpg",
      fade: "from-[#f1dcc0] via-[#f1dcc0]/80",
      tag: "Premium",
      title: "Premium\nDry Fruits",
      subtitle: "Almonds, cashews & pistachios",
      offer: "Up to 20% Off",
    },
    {
      id: "dryfruits-2",
      image: "/banners/dryfruits-banner-2.jpg",
      fade: "from-[#ece3f5] via-[#ece3f5]/80",
      tag: "Gift Packs",
      title: "Healthy\nGifting Boxes",
      subtitle: "Dates, apricots & mixed nuts",
      offer: "Flat 10% Off",
    },
  ],
  grains: [
    {
      id: "grains-1",
      image: "/banners/grains-banner-1.jpg",
      fade: "from-[#f8e7c6] via-[#f8e7c6]/80",
      tag: "Staples",
      title: "Rice, Wheat\n& Millets",
      subtitle: "Basmati, jowar, bajra & ragi",
      offer: "Up to 15% Off",
    },
    {
      id: "grains-2",
      image: "/banners/grains-banner-2.jpg",
      fade: "from-[#e5f0d4] via-[#e5f0d4]/80",
      tag: "Protein Rich",
      title: "Dals, Atta\n& Besan",
      subtitle: "Stock up your kitchen",
      offer: "Save ₹40 on ₹399",
    },
  ],
  organic: [
    {
      id: "organic-1",
      image: "/banners/organic-banner.png",
      fade: "from-[#e8cfa9] via-[#e8cfa9]/80",
      tag: "100% Organic",
      title: "Certified\nOrganic Range",
      subtitle: "Chemical-free, farm direct",
      offer: "Up to 20% Off",
    },
    {
      id: "organic-2",
      image: "/banners/organic-banner-2.jpg",
      fade: "from-[#e5efd6] via-[#e5efd6]/80",
      tag: "Pure & Natural",
      title: "Grown the\nNatural Way",
      subtitle: "Organic veggies, jaggery & rice",
      offer: "Flat 15% Off",
    },
  ],
};

function bannerKey(categoryName) {
  const name = String(categoryName || "").toLowerCase();
  if (name.includes("dry") && name.includes("fruit")) return "dryfruits";
  if (name.includes("fruit")) return "fruits";
  if (name.includes("dairy")) return "dairy";
  if (name.includes("vegetable")) return "vegetables";
  if (name.includes("beverage")) return "beverages";
  if (name.includes("oil")) return "oils";
  if (name.includes("spice")) return "spices";
  if (name.includes("grain")) return "grains";
  if (name.includes("organic")) return "organic";
  return "";
}

export function getCategoryBanners(categoryName) {
  const banners = CATEGORY_BANNERS[bannerKey(categoryName)] || [];
  const link = categoryLink(categoryName);
  return banners.map((banner) => ({ ...banner, link }));
}
