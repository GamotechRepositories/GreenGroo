import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

export default [
  { path: "/api/products", router: productRoutes },
  { path: "/api/categories", router: categoryRoutes },
  { path: "/api/sections", router: sectionRoutes },
  { path: "/api/brands", router: brandRoutes },
  { path: "/api/herobanners", router: bannerRoutes },
  { path: "/api/offerbanners", router: bannerRoutes },
  { path: "/api/testimonials", router: bannerRoutes },
  { path: "/api/settings", router: settingsRoutes },
  { path: "/api/coupons", router: couponRoutes },
  { path: "/api/upload", router: uploadRoutes },
  { path: "/api/proxy", router: uploadRoutes },
];
