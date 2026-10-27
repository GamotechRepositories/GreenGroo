import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Banner from "../models/Banner.js";
import { assertS3Configured, getS3Client, uploadBufferToS3 } from "./s3Upload.js";

const FRONTEND_PUBLIC = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../frontend/public"
);

const CONTENT_TYPES = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

const SECTIONS = ["preorder", "ready2cook", "instantorder"];

const slides = (list, extra = {}) => list.map(([file, alt]) => ({ file, alt, ...extra }));

const CATEGORY_SHOP = slides(
  [1, 2, 3, 4, 5].map((n) => [`/assets/payment/category_banner_${n}.png`, `Featured Special Banner ${n}`]),
  { linkUrl: "/product" }
);

const OFFERS = [
  {
    file: "/offers/summer.jpg",
    alt: "Gentle Summer Organic Care",
    linkUrl: "/product?categoryName=Vegetables",
    tag: "Farm Fresh",
    title: "Gentle Summer\nOrganic Care",
    subtitle: "Farm Fresh Vegetables & Fruits",
    offerText: "Up to 30% Off",
  },
  {
    file: "/offers/harvest.jpg",
    alt: "Nashik Co-op Direct Harvest",
    linkUrl: "/product?categoryName=Vegetables",
    tag: "Direct Farm",
    title: "Nashik Co-op\nDirect Harvest",
    subtitle: "Fresh vegetable combos from the farm",
    offerText: "Flat 40% Off",
  },
];

const MID = slides(
  [
    ["/assets/payment/image.png", "Fresh Fruits & Vegetables - Naturally Grown. Farm Fresh. Healthier You."],
    ["/assets/payment/image2.png", "Farm Fresh - Fresh Fruits & Vegetables - Naturally Grown. Direct from Farms."],
  ],
  { linkUrl: "/product" }
);

/** `category` picks the tile: farmfresh = left tile, farmerstories = right (video) tile. */
const STORIES = [
  {
    category: "farmfresh",
    file: "/assets/features/farm_fresh_slide_2.png",
    alt: "आज शेतात काय आहे? - या आठवड्यातील ताजी उत्पादने",
    linkUrl: "/categories",
  },
  {
    category: "farmerstories",
    file: "/assets/features/farmer_stories_banner_complete.png",
    video: "/10847026-hd_1920_1080_25fps.mp4",
    alt: "Farmer Stories - शेतकऱ्यांच्या खऱ्या गोष्टी",
    title: "शेतकऱ्यांची खरी गोष्ट (Farmer Story)",
    subtitle: "स्थानिक शेतकरी: तुकाराम शिंदे (सातारा सेंद्रिय शेत)",
  },
];

const categoryBanner = (category, file, bgColor, tag, title, subtitle, offerText) => ({
  file,
  category,
  bgColor,
  tag,
  title,
  subtitle,
  offerText,
  alt: title.replace(/\n/g, " "),
});

/** Category name shown on the home page, used for the "View" link. */
const CATEGORY_NAMES = {
  fruits: "Fruits",
  dairy: "Dairy",
  vegetables: "Vegetables",
  beverages: "Beverages",
  oils: "Oils",
  spices: "Spices",
  dryfruits: "Dry Fruits",
  grains: "Grains",
  organic: "Organic",
  pulses: "Pulses",
};

const CATEGORY = [
  categoryBanner("fruits", "/banners/fruits-banner.png", "#fff3c4", "Farm Fresh", "Juicy Fruits\nPicked Fresh", "Apples, bananas, grapes & more", "Up to 25% Off"),
  categoryBanner("fruits", "/banners/fruits-banner-2.jpg", "#fde4e4", "Seasonal", "Seasonal Fruit\nFestival", "Mangoes, papaya & pomegranate", "Flat 20% Off"),
  categoryBanner("dairy", "/banners/dairy-banner.png", "#fdf6e4", "Daily Fresh", "Pure Dairy\nEvery Morning", "Milk, curd, paneer & butter", "Up to 15% Off"),
  categoryBanner("dairy", "/banners/dairy-banner-2.jpg", "#e3f1fc", "Farm to Home", "Desi Dairy\nEssentials", "Fresh paneer, dahi & eggs", "Save ₹50 on ₹499"),
  categoryBanner("vegetables", "/banners/vegetables-banner.png", "#eef6dc", "Farm Fresh", "Fresh Veggies\nDaily Harvest", "Straight from local farms", "Up to 30% Off"),
  categoryBanner("vegetables", "/banners/vegetables-banner-2.jpg", "#fdf5d6", "Kitchen Basics", "Everyday\nSabzi Store", "Onion, potato, tomato & more", "Flat 20% Off"),
  categoryBanner("beverages", "/banners/beverages-banner-1.jpg", "#fde7d6", "Chilled", "Cool Drinks\nfor Every Mood", "Juices, sodas & green tea", "Up to 20% Off"),
  categoryBanner("beverages", "/banners/beverages-banner-2.jpg", "#dcecf9", "Desi Drinks", "Traditional\nRefreshers", "Aam panna, chaas & milk shakes", "Buy 2 Save 10%"),
  categoryBanner("oils", "/banners/oils-banner-1.jpg", "#fbe9a8", "Pure & Healthy", "Cooking Oils\n& Desi Ghee", "Groundnut, sunflower & mustard", "Up to 18% Off"),
  categoryBanner("oils", "/banners/oils-banner-2.jpg", "#e8f0d0", "Cold Pressed", "Wood Pressed\nGoodness", "Coconut, sesame & more", "Flat 15% Off"),
  categoryBanner("spices", "/banners/spices-banner-1.jpg", "#f6ddd3", "Aromatic", "Whole Spices\nBold Flavour", "Chilli, jeera, pepper & more", "Up to 25% Off"),
  categoryBanner("spices", "/banners/spices-banner-2.jpg", "#fbf3e3", "Ghar ka Masala", "Masala Box\nEssentials", "Haldi, mirchi, garam masala", "Flat 15% Off"),
  categoryBanner("dryfruits", "/banners/dryfruits-banner-1.jpg", "#f1dcc0", "Premium", "Premium\nDry Fruits", "Almonds, cashews & pistachios", "Up to 20% Off"),
  categoryBanner("dryfruits", "/banners/dryfruits-banner-2.jpg", "#ece3f5", "Gift Packs", "Healthy\nGifting Boxes", "Dates, apricots & mixed nuts", "Flat 10% Off"),
  categoryBanner("grains", "/banners/grains-banner-1.jpg", "#f8e7c6", "Staples", "Rice, Wheat\n& Millets", "Basmati, jowar, bajra & ragi", "Up to 15% Off"),
  categoryBanner("grains", "/banners/grains-banner-2.jpg", "#e5f0d4", "Protein Rich", "Dals, Atta\n& Besan", "Stock up your kitchen", "Save ₹40 on ₹399"),
  categoryBanner("organic", "/banners/organic-banner.png", "#e8cfa9", "100% Organic", "Certified\nOrganic Range", "Chemical-free, farm direct", "Up to 20% Off"),
  categoryBanner("organic", "/banners/organic-banner-2.jpg", "#e5efd6", "Pure & Natural", "Grown the\nNatural Way", "Organic veggies, jaggery & rice", "Flat 15% Off"),
  categoryBanner("pulses", "/banners/pulses-banner-1.jpg", "#f6ecd6", "Protein Rich", "Dals &\nPulses", "Toor, moong, masoor & chana", "Up to 20% Off"),
  categoryBanner("pulses", "/banners/pulses-banner-2.jpg", "#e3f0d4", "Ghar ka Dal", "Everyday\nDal Essentials", "Rajma, chole, urad & more", "Flat 15% Off"),
].map((banner) => ({
  ...banner,
  linkUrl: `/product?categoryName=${encodeURIComponent(CATEGORY_NAMES[banner.category])}`,
}));

/** The banners that used to be hardcoded in the storefront, keyed by section → placement → device. */
const DEFAULTS = {
  preorder: {
    hero: {
      desktop: slides(
        [
          ["/assets/payment/heroBaner.png", "शेतातून थेट तुमच्या घरापर्यंत !"],
          ["/assets/payment/heroBaner2.png", "Festive Season Special - Fresh Fruits & Veggies From ₹9"],
        ],
        { linkUrl: "/product" }
      ),
      mobile: slides(
        [
          ["/assets/payment/heroMobileBaner.jpg", "शेतातून थेट तुमच्या घरापर्यंत !"],
          ["/assets/payment/heroMobileBaner2.png", "Festive Season Special - Fresh Fruits & Veggies From ₹9"],
        ],
        { linkUrl: "/product" }
      ),
    },
    shop: {
      desktop: CATEGORY_SHOP,
      mobile: slides(
        [
          ["/assets/payment/preorder banner mobile view 2.png", "Festive Season Special. Fresh Fruits & Veggies from ₹9"],
          ["/assets/payment/fresh_fruits_vegetables_banner_2.png", "Fresh Fruits & Vegetables. Naturally Grown. Order Now"],
        ],
        { linkUrl: "/product" }
      ),
    },
    mid: { desktop: MID, mobile: MID },
    stories: { desktop: STORIES, mobile: STORIES },
    category: { desktop: CATEGORY, mobile: CATEGORY },
  },
  ready2cook: {
    hero: {
      desktop: slides(
        [
          ["/assets/payment/ready2cook 1.webp", "Ready to Cook — Fresh Ingredients | Cleaned | Chopped | Ready in Minutes"],
          ["/assets/payment/ready to cook 2.webp", "Ready to Cook — Freshly Chopped, Ready for You!"],
        ],
        { linkUrl: "/product?store=festive" }
      ),
      mobile: slides(
        [
          ["/assets/payment/ready2 cook mobile view 1.png", "Ready to Cook — Fresh Ingredients | Cleaned | Chopped | Ready in Minutes"],
          ["/assets/payment/ready2 cook mobile view 2.png", "Ready to Cook — Freshly Chopped, Ready for You!"],
        ],
        { linkUrl: "/product?store=festive" }
      ),
    },
    shop: { desktop: CATEGORY_SHOP, mobile: CATEGORY_SHOP },
  },
  instantorder: {
    hero: {
      desktop: slides(
        [
          ["/assets/payment/instant order.webp", "Instant Order — Fresh Farm Produce Delivered to Your Doorstep On Time & Always Fresh"],
          ["/assets/payment/instant order 2.webp", "Stock up on Daily Essentials — Fresh Farm Goodness & Exotic Fruits & Vegetables"],
        ],
        { linkUrl: "/product?store=mall" }
      ),
      mobile: slides(
        [
          ["/assets/payment/instant order mobile banner 1.png", "Instant Order — Fresh Farm Produce Delivered to Your Doorstep On Time & Always Fresh"],
          ["/assets/payment/instant order mobile banner 2.png", "Stock up on Daily Essentials — Fresh Farm Goodness & Exotic Fruits & Vegetables"],
        ],
        { linkUrl: "/product?store=mall" }
      ),
    },
    shop: { desktop: CATEGORY_SHOP, mobile: CATEGORY_SHOP },
  },
};

SECTIONS.forEach((section) => {
  DEFAULTS[section].offer = { desktop: OFFERS, mobile: OFFERS };
});

function defaultEntries() {
  const entries = [];
  Object.entries(DEFAULTS).forEach(([section, placements]) => {
    Object.entries(placements).forEach(([placement, devices]) => {
      Object.entries(devices).forEach(([device, list]) => {
        const orderByGroup = new Map();
        list.forEach((item) => {
          const group = item.category || "";
          const order = orderByGroup.get(group) || 0;
          orderByGroup.set(group, order + 1);
          entries.push({
            ...item,
            section,
            placement,
            device,
            order,
            seedKey: `default:${section}:${placement}:${device}:${group ? `${group}:` : ""}${item.file}`,
          });
        });
      });
    });
  });
  return entries;
}

/** First start: import the website banners when the collection is still empty. Never throws. */
export async function importDefaultBannersIfEmpty() {
  try {
    if (await Banner.exists({})) return;
    const summary = await importDefaultBanners();
    console.log(
      `[Banners] imported ${summary.created} website banner(s) to S3` +
        (summary.missing.length ? `; missing files: ${summary.missing.join(", ")}` : "")
    );
  } catch (error) {
    console.warn("[Banners] default banner import skipped:", error.message);
  }
}

/**
 * Uploads the storefront's old hardcoded banner images (from frontend/public) to S3 and stores
 * them as Banner documents. Safe to run again: entries already imported are skipped.
 */
export async function importDefaultBanners({ log = () => {} } = {}) {
  assertS3Configured();
  const client = getS3Client();
  const entries = defaultEntries();
  const existing = new Set(
    (await Banner.find({ seedKey: { $in: entries.map((e) => e.seedKey) } }, { seedKey: 1 }).lean()).map((b) => b.seedKey)
  );

  const uploadedByFile = new Map();
  const summary = { created: 0, skipped: 0, missing: [] };

  /** Returns the S3 URL for a frontend/public file, or "" when the file is missing. */
  const upload = async (publicPath) => {
    if (uploadedByFile.has(publicPath)) return uploadedByFile.get(publicPath);
    const filePath = path.join(FRONTEND_PUBLIC, ...publicPath.split("/").filter(Boolean));
    let buffer;
    try {
      buffer = await fs.readFile(filePath);
    } catch {
      if (!summary.missing.includes(publicPath)) summary.missing.push(publicPath);
      log(`missing file ${publicPath}`);
      return "";
    }
    const ext = path.extname(filePath).toLowerCase();
    const { url } = await uploadBufferToS3({
      buffer,
      folder: "banners",
      ext,
      contentType: CONTENT_TYPES[ext] || "application/octet-stream",
      client,
    });
    uploadedByFile.set(publicPath, url);
    log(`uploaded ${publicPath} -> ${url}`);
    return url;
  };

  for (const entry of entries) {
    if (existing.has(entry.seedKey)) {
      summary.skipped += 1;
      continue;
    }

    const { file, video, ...doc } = entry;
    const imageUrl = await upload(file);
    if (!imageUrl) continue;
    const videoUrl = video ? await upload(video) : "";

    await Banner.create({ ...doc, imageUrl, ...(videoUrl ? { videoUrl } : {}), isActive: true });
    summary.created += 1;
  }

  return summary;
}
