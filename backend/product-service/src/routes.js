import productRoutes from "../../legacy/routes/productRoutes.js";
import categoryRoutes from "../../legacy/routes/categoryRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import brandRoutes from "../../legacy/routes/brandRoutes.js";
import heroBannerRoutes from "../../legacy/routes/heroBannerRoutes.js";
import offerBannerRoutes from "../../legacy/routes/offerBannerRoutes.js";
import testimonialRoutes from "../../legacy/routes/testimonialRoutes.js";
import storeSettingsRoutes from "../../legacy/routes/storeSettingsRoutes.js";
import couponRoutes from "../../legacy/routes/couponRoutes.js";
import uploadRoutes from "../../legacy/routes/uploadRoutes.js";
import proxyRoutes from "../../legacy/routes/proxyRoutes.js";

export default [
  { path: "/api/products", router: productRoutes },
  { path: "/api/categories", router: categoryRoutes },
  { path: "/api/sections", router: sectionRoutes },
  { path: "/api/brands", router: brandRoutes },
  { path: "/api/herobanners", router: heroBannerRoutes },
  { path: "/api/offerbanners", router: offerBannerRoutes },
  { path: "/api/testimonials", router: testimonialRoutes },
  { path: "/api/settings", router: storeSettingsRoutes },
  { path: "/api/coupons", router: couponRoutes },
  { path: "/api/upload", router: uploadRoutes },
  { path: "/api/proxy", router: proxyRoutes },
];
