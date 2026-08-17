import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { LocationProvider } from "./context/LocationContext";
import AuthModal from "./components/auth/AuthModal";
import ScrollToTop from "./components/layout/ScrollToTop";
import FloatingCornerActions from "./components/layout/FloatingCornerActions";
import BumperBountyModal from "./components/grocery/BumperBountyModal";
import AppRoutes from "./routes/AppRoutes";

function AuthModalHost() {
  const { authModal, closeAuthModal, setAuthModal } = useAuth();

  if (!authModal) return null;

  return (
    <AuthModal
      mode={authModal}
      onClose={closeAuthModal}
      onSwitchMode={setAuthModal}
    />
  );
}

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
              <AuthModalHost />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </LocationProvider>
    </BrowserRouter>
  );
}

export default App;
