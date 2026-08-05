import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getWishlist,
  removeFromWishlistItem,
  toggleWishlistItem,
} from "../api/api";
import { useAuth } from "./AuthContext";
import AddedToCartToast from "../components/cart/AddedToCartToast";
import FlyToCartOverlay from "../components/cart/FlyToCartOverlay";
import { buildFlyToWishlistAnimation, pulseWishlistTarget } from "../utils/flyToCart";
import {
  clearGuestWishlist,
  loadGuestWishlist,
  saveGuestWishlist,
} from "../utils/guestWishlistStorage";

const WishlistContext = createContext(null);
const TOAST_DURATION_MS = 2600;

const toProductId = (value) => String(value ?? "");

const mapWishlistItems = (wishlist) => {
  if (!wishlist?.items?.length) return [];

  return wishlist.items
    .filter((item) => item.product && item.product.isActive !== false)
    .map((item) => ({
      _id: toProductId(item.product._id),
      name: item.product.name,
      brandName: item.product.brandName,
      price: item.product.price,
      discountedPrice: item.product.discountedPrice,
      discountedPercent: item.product.discountedPercent,
      productImages: item.product.productImages,
      stock: item.product.stock ?? 0,
      subcategory: item.product.subcategory,
      pricingType: item.product.pricingType,
      bulkPricing: item.product.bulkPricing,
      variantType: item.product.variantType,
      variants: item.product.variants,
      minOrderQuantity: item.product.minOrderQuantity,
      stepByQuantity: item.product.stepByQuantity,
      colors: item.product.colors,
    }));
};

const mapToggleProduct = (product) => ({
  _id: toProductId(product._id),
  name: product.name,
  brandName: product.brandName,
  price: product.price,
  discountedPrice: product.discountedPrice,
  discountedPercent: product.discountedPercent,
  productImages: product.productImages,
  stock: product.stock ?? 0,
  subcategory: product.subcategory,
  pricingType: product.pricingType,
  bulkPricing: product.bulkPricing,
  variantType: product.variantType,
  variants: product.variants,
  minOrderQuantity: product.minOrderQuantity,
  stepByQuantity: product.stepByQuantity,
  colors: product.colors,
});

export function WishlistProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wishlistToast, setWishlistToast] = useState(null);
  const [flyAnimation, setFlyAnimation] = useState(null);
  const [toastLeaving, setToastLeaving] = useState(false);
  const pendingToggleRef = useRef(null);
  const guestMergedRef = useRef(false);
  const toastTimerRef = useRef(null);
  const toastExitTimerRef = useRef(null);

  const dismissWishlistToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (toastExitTimerRef.current) {
      clearTimeout(toastExitTimerRef.current);
      toastExitTimerRef.current = null;
    }

    setToastLeaving(true);
    toastExitTimerRef.current = setTimeout(() => {
      setWishlistToast(null);
      setToastLeaving(false);
    }, 250);
  }, []);

  const showAddedToWishlistToast = useCallback(
    (product) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastExitTimerRef.current) clearTimeout(toastExitTimerRef.current);

      setToastLeaving(false);
      setWishlistToast({
        productImage: product?.productImages?.[0] || "",
      });

      toastTimerRef.current = setTimeout(() => {
        dismissWishlistToast();
      }, TOAST_DURATION_MS);
    },
    [dismissWishlistToast]
  );

  const playFlyToWishlist = useCallback(
    (product, flySource) => {
      const animation = buildFlyToWishlistAnimation(
        flySource,
        product?.productImages?.[0] || ""
      );
      if (!animation) {
        showAddedToWishlistToast(product);
        return;
      }
      setFlyAnimation({ ...animation, id: Date.now(), pulse: pulseWishlistTarget });
    },
    [showAddedToWishlistToast]
  );

  const clearFlyAnimation = useCallback(() => {
    setFlyAnimation(null);
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastExitTimerRef.current) clearTimeout(toastExitTimerRef.current);
    },
    []
  );

  const mergeGuestWishlistToServer = useCallback(async () => {
    const guestItems = loadGuestWishlist();
    if (!guestItems.length) return;

    for (const item of guestItems) {
      await toggleWishlistItem(toProductId(item._id));
    }

    clearGuestWishlist();
    const { data } = await getWishlist();
    setItems(mapWishlistItems(data.data));
  }, []);

  const loadWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await getWishlist();
      setItems(mapWishlistItems(data.data));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    const bootstrap = async () => {
      if (user) {
        await loadWishlist();
        if (!guestMergedRef.current) {
          guestMergedRef.current = true;
          try {
            await mergeGuestWishlistToServer();
          } catch {
            // Keep server wishlist if merge fails.
          }
        }
      } else {
        guestMergedRef.current = false;
        setItems(loadGuestWishlist());
      }
    };

    bootstrap();
  }, [user, authLoading, loadWishlist, mergeGuestWishlistToServer]);

  const wishlistIds = useMemo(
    () => new Set(items.map((item) => toProductId(item._id))),
    [items]
  );

  const isWishlisted = useCallback(
    (productId) => wishlistIds.has(toProductId(productId)),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (product, options = {}) => {
      const productId = toProductId(product?._id);
      if (!productId || productId.length < 10) return { success: false };

      if (!user) {
        const normalized = mapToggleProduct(product);
        let nextWishlisted = false;

        setItems((prev) => {
          const wasWishlisted = prev.some((item) => toProductId(item._id) === productId);
          nextWishlisted = !wasWishlisted;
          const nextItems = wasWishlisted
            ? prev.filter((item) => toProductId(item._id) !== productId)
            : [...prev, normalized];
          saveGuestWishlist(nextItems);
          return nextItems;
        });

        if (options.flySource && nextWishlisted) {
          playFlyToWishlist(product, options.flySource);
        } else if (nextWishlisted) {
          showAddedToWishlistToast(product);
        }

        return { success: true, wishlisted: nextWishlisted };
      }

      const normalized = mapToggleProduct(product);
      const wasWishlisted = wishlistIds.has(productId);

      setItems((prev) => {
        if (wasWishlisted) {
          return prev.filter((item) => toProductId(item._id) !== productId);
        }
        return [...prev, normalized];
      });

      try {
        const { data } = await toggleWishlistItem(productId);
        setItems(mapWishlistItems(data.data));
        if (data.added) {
          if (options.flySource) {
            playFlyToWishlist(normalized, options.flySource);
          } else {
            showAddedToWishlistToast(normalized);
          }
        }
        return { success: true, added: data.added };
      } catch (err) {
        setItems((prev) => {
          if (wasWishlisted) {
            return prev.some((item) => toProductId(item._id) === productId)
              ? prev
              : [...prev, normalized];
          }
          return prev.filter((item) => toProductId(item._id) !== productId);
        });
        return {
          success: false,
          message: err.response?.data?.message || "Could not update wishlist",
        };
      }
    },
    [user, wishlistIds, showAddedToWishlistToast, playFlyToWishlist]
  );

  useEffect(() => {
    if (!user || !pendingToggleRef.current) return;

    const pending = pendingToggleRef.current;
    pendingToggleRef.current = null;
    toggleWishlist(pending.product, { flySource: pending.flySource || undefined });
  }, [user, toggleWishlist]);

  const removeFromWishlist = useCallback(
    async (productId) => {
      const id = toProductId(productId);

      if (!user) {
        setItems((prev) => {
          const nextItems = prev.filter((item) => toProductId(item._id) !== id);
          saveGuestWishlist(nextItems);
          return nextItems;
        });
        return;
      }

      setItems((prev) => prev.filter((item) => toProductId(item._id) !== id));

      try {
        const { data } = await removeFromWishlistItem(id);
        setItems(mapWishlistItems(data.data));
      } catch {
        await loadWishlist();
      }
    },
    [user, loadWishlist]
  );

  const wishlistCount = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistCount,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        loadWishlist,
        loading,
      }}
    >
      {children}
      <FlyToCartOverlay animation={flyAnimation} onComplete={clearFlyAnimation} />
      <AddedToCartToast
        visible={Boolean(wishlistToast)}
        productImage={wishlistToast?.productImage}
        leaving={toastLeaving}
        message="Added to Wishlist"
      />
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
