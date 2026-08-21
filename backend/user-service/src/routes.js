import userRoutes from "./routes/userRoutes.js";
import addressRoutes from "../../legacy/routes/addressRoutes.js";
import cartRoutes from "../../legacy/routes/cartRoutes.js";
import wishlistRoutes from "../../legacy/routes/wishlistRoutes.js";
import supportRoutes from "../../legacy/routes/supportRoutes.js";
import locationRoutes from "../../legacy/routes/locationRoutes.js";

export default [
  { path: "/api/users", router: userRoutes },
  { path: "/api/addresses", router: addressRoutes },
  { path: "/api/cart", router: cartRoutes },
  { path: "/api/wishlist", router: wishlistRoutes },
  { path: "/api/support", router: supportRoutes },
  { path: "/api/location", router: locationRoutes },
];
