import userRoutes from "./routes/userRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";

export default [
  { path: "/api/users", router: userRoutes },
  { path: "/api/addresses", router: addressRoutes },
  { path: "/api/cart", router: cartRoutes },
  { path: "/api/wishlist", router: wishlistRoutes },
  { path: "/api/support", router: supportRoutes },
  { path: "/api/location", router: locationRoutes },
];
