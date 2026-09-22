import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { LocationProvider } from "./context/LocationContext";
import ScrollToTop from "./components/layout/ScrollToTop";
import FloatingCornerActions from "./components/layout/FloatingCornerActions";
import BumperBountyModal from "./components/grocery/BumperBountyModal";
import CartSidebar from "./components/cart/CartSidebar";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <LocationProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppRoutes />
              <FloatingCornerActions />
              <BumperBountyModal />
              <CartSidebar />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </LocationProvider>
    </BrowserRouter>
  );
}

export default App;
