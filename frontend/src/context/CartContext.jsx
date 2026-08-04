import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { addToCartItem, getCart, removeFromCartItem, updateCartItemQty } from "../api/api";
import { useAuth } from "./AuthContext";
import AddedToCartToast from "../components/cart/AddedToCartToast";
import FlyToCartOverlay from "../components/cart/FlyToCartOverlay";
import { buildFlyToCartAnimation } from "../utils/flyToCart";
import {
  addOrMergeLine,
  findCartLine,
  mapCartItems,
  removeLine,
  setLineQuantity,
} from "../utils/cartState";

const CartContext = createContext(null);
const TOAST_DURATION_MS = 2600;

export function CartProvider({ children }) {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartToast, setCartToast] = useState(null);
  const [flyAnimation, setFlyAnimation] = useState(null);
  const [toastLeaving, setToastLeaving] = useState(false);
  const itemsRef = useRef([]);
  const queueRef = useRef(Promise.resolve());
  const pendingAddRef = useRef(null);
  const toastTimerRef = useRef(null);
  const toastExitTimerRef = useRef(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const dismissCartToast = useCallback(() => {
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
      setCartToast(null);
      setToastLeaving(false);
    }, 250);
  }, []);

  const showAddedToCartToast = useCallback(
    (product) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastExitTimerRef.current) clearTimeout(toastExitTimerRef.current);

      setToastLeaving(false);
      setCartToast({
        productImage: product?.productImages?.[0] || "",
      });

      toastTimerRef.current = setTimeout(() => {
        dismissCartToast();
      }, TOAST_DURATION_MS);
    },
    [dismissCartToast]
  );

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastExitTimerRef.current) clearTimeout(toastExitTimerRef.current);
    },
    []
  );

  const syncCartFromServer = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    const { data } = await getCart();
    setItems(mapCartItems(data.data));
  }, [user]);

  const loadCart = useCallback(
    async ({ silent = false } = {}) => {
      if (!user) {
        setItems([]);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        await syncCartFromServer();
      } catch {
        setItems([]);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [user, syncCartFromServer]
  );

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      loadCart();
    } else {
      setItems([]);
    }
  }, [user, authLoading, loadCart]);

  const playFlyToCart = useCallback(
    (product, flySource) => {
      const animation = buildFlyToCartAnimation(
        flySource,
        product?.productImages?.[0] || ""
      );
      if (!animation) {
        showAddedToCartToast(product);
        return;
      }
      setFlyAnimation({ ...animation, id: Date.now() });
    },
    [showAddedToCartToast]
  );

  const clearFlyAnimation = useCallback(() => {
    setFlyAnimation(null);
  }, []);

  const runCartMutation = useCallback((buildMutation) => {
    const execute = async () => {
      const snapshot = itemsRef.current;
      const mutation = buildMutation(snapshot);
      if (!mutation) {
        return { success: false };
      }

      const { optimisticItems, apiCall } = mutation;
      setItems(optimisticItems);

      try {
        const response = await apiCall();
        setItems(mapCartItems(response.data.data));
        return { success: true };
      } catch (error) {
        setItems(snapshot);
        try {
          await syncCartFromServer();
        } catch {
          // Keep rolled-back snapshot if refresh fails.
        }

        return {
          success: false,
          message: error?.response?.data?.message || "Could not update cart. Please try again.",
        };
      }
    };

    const task = queueRef.current.then(execute, execute);
    queueRef.current = task.then(
      () => undefined,
      () => undefined
    );
    return task;
  }, [syncCartFromServer]);

  const addToCart = useCallback(
    async (product, quantity, options = {}) => {
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty < 1) {
        return { success: false };
      }

      if (!user) {
        pendingAddRef.current = {
          product,
          quantity: qty,
          variantName: options.variantName || "",
          colorName: options.colorName || "",
          flySource: options.flySource || null,
        };
        openAuthModal("login");
        return { requiresLogin: true };
      }

      const variantName = options.variantName || "";
      const colorName = options.colorName || "";

      if (options.flySource) {
        playFlyToCart(product, options.flySource);
      } else {
        showAddedToCartToast(product);
      }

      return runCartMutation((current) => ({
        optimisticItems: addOrMergeLine(current, product, qty, variantName, colorName),
        apiCall: () =>
          addToCartItem({
            productId: product._id,
            quantity: qty,
            variantName,
            colorName,
          }),
      }));
    },
    [user, openAuthModal, playFlyToCart, runCartMutation, showAddedToCartToast]
  );

  useEffect(() => {
    if (!user || !pendingAddRef.current) return;

    const pending = pendingAddRef.current;
    pendingAddRef.current = null;

    addToCart(pending.product, pending.quantity, {
      variantName: pending.variantName,
      colorName: pending.colorName,
      flySource: pending.flySource || undefined,
    });
  }, [user, addToCart]);

  const removeFromCart = useCallback(
    (productId, variantName = "", colorName = "") => {
      if (!user) return Promise.resolve();

      return runCartMutation((current) => {
        const line = findCartLine(current, productId, variantName, colorName);
        if (!line) return null;

        return {
          optimisticItems: removeLine(current, productId, variantName, colorName),
          apiCall: () => removeFromCartItem(productId, variantName, colorName),
        };
      });
    },
    [user, runCartMutation]
  );

  const updateQuantity = useCallback(
    (productId, quantity, variantName = "", colorName = "") => {
      if (!user) return Promise.resolve();

      const qty = Number(quantity);
      if (!Number.isFinite(qty)) return Promise.resolve({ success: false });

      return runCartMutation((current) => {
        const line = findCartLine(current, productId, variantName, colorName);
        if (!line) return null;

        if (qty < 1) {
          return {
            optimisticItems: removeLine(current, productId, variantName, colorName),
            apiCall: () => removeFromCartItem(productId, variantName, colorName),
          };
        }

        return {
          optimisticItems: setLineQuantity(current, productId, variantName, colorName, qty),
          apiCall: () => updateCartItemQty(productId, qty, variantName, colorName),
        };
      });
    },
    [user, runCartMutation]
  );

  const incrementCartItem = useCallback(
    ({ productId, variantName = "", colorName = "", step = 1, maxQuantity }) => {
      if (!user) return Promise.resolve({ success: false });

      const safeStep = Number(step) || 1;
      const maxQty = Number.isFinite(Number(maxQuantity)) ? Number(maxQuantity) : null;

      return runCartMutation((current) => {
        const line = findCartLine(current, productId, variantName, colorName);
        if (!line) return null;

        let nextQty = line.quantity + safeStep;
        if (maxQty != null) {
          nextQty = Math.min(maxQty, nextQty);
        }
        if (nextQty === line.quantity) return null;

        return {
          optimisticItems: setLineQuantity(current, productId, variantName, colorName, nextQty),
          apiCall: () => updateCartItemQty(productId, nextQty, variantName, colorName),
        };
      });
    },
    [user, runCartMutation]
  );

  const decrementCartItem = useCallback(
    ({ productId, variantName = "", colorName = "", resolveNextQuantity }) => {
      if (!user) return Promise.resolve({ success: false });

      return runCartMutation((current) => {
        const line = findCartLine(current, productId, variantName, colorName);
        if (!line) return null;

        const nextQty =
          typeof resolveNextQuantity === "function"
            ? Number(resolveNextQuantity(line.quantity))
            : line.quantity - 1;

        if (!Number.isFinite(nextQty) || nextQty === line.quantity) return null;

        if (nextQty < 1) {
          return {
            optimisticItems: removeLine(current, productId, variantName, colorName),
            apiCall: () => removeFromCartItem(productId, variantName, colorName),
          };
        }

        return {
          optimisticItems: setLineQuantity(current, productId, variantName, colorName, nextQty),
          apiCall: () => updateCartItemQty(productId, nextQty, variantName, colorName),
        };
      });
    },
    [user, runCartMutation]
  );

  const resetCart = useCallback(() => {
    setItems([]);
  }, []);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        incrementCartItem,
        decrementCartItem,
        cartCount,
        loadCart,
        resetCart,
        loading,
      }}
    >
      {children}
      <FlyToCartOverlay animation={flyAnimation} onComplete={clearFlyAnimation} />
      <AddedToCartToast
        visible={Boolean(cartToast)}
        productImage={cartToast?.productImage}
        leaving={toastLeaving}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
