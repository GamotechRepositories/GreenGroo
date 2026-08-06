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
import {
  clearGuestCart,
  loadGuestCart,
  saveGuestCart,
} from "../utils/guestCartStorage";

const CartContext = createContext(null);
const TOAST_DURATION_MS = 2600;

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartToast, setCartToast] = useState(null);
  const [flyAnimation, setFlyAnimation] = useState(null);
  const [toastLeaving, setToastLeaving] = useState(false);
  const itemsRef = useRef([]);
  const queueRef = useRef(Promise.resolve());
  const guestMergedRef = useRef(false);
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

  const applyGuestCart = useCallback((nextItems) => {
    setItems(nextItems);
    saveGuestCart(nextItems);
  }, []);

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

  const mergeGuestCartToServer = useCallback(async () => {
    const guestItems = loadGuestCart();
    if (!guestItems.length) return;

    for (const item of guestItems) {
      await addToCartItem({
        productId: item._id,
        quantity: item.quantity,
        variantName: item.variantName || "",
        colorName: item.colorName || "",
      });
    }

    clearGuestCart();
    await syncCartFromServer();
  }, [syncCartFromServer]);

  useEffect(() => {
    if (authLoading) return;

    const bootstrap = async () => {
      if (user) {
        await loadCart({ silent: true });
        if (!guestMergedRef.current) {
          guestMergedRef.current = true;
          try {
            await mergeGuestCartToServer();
          } catch {
            // Keep server cart if merge fails.
          }
        }
      } else {
        guestMergedRef.current = false;
        setItems(loadGuestCart());
      }
    };

    bootstrap();
  }, [user, authLoading, loadCart, mergeGuestCartToServer]);

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
        const variantName = options.variantName || "";
        const colorName = options.colorName || "";

        if (options.flySource) {
          playFlyToCart(product, options.flySource);
        } else {
          showAddedToCartToast(product);
        }

        applyGuestCart(
          addOrMergeLine(itemsRef.current, product, qty, variantName, colorName)
        );
        return { success: true };
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
    [user, playFlyToCart, runCartMutation, showAddedToCartToast, applyGuestCart]
  );

  const removeFromCart = useCallback(
    (productId, variantName = "", colorName = "") => {
      if (!user) {
        applyGuestCart(
          removeLine(itemsRef.current, productId, variantName, colorName)
        );
        return Promise.resolve({ success: true });
      }

      return runCartMutation((current) => {
        const line = findCartLine(current, productId, variantName, colorName);
        if (!line) return null;

        return {
          optimisticItems: removeLine(current, productId, variantName, colorName),
          apiCall: () => removeFromCartItem(productId, variantName, colorName),
        };
      });
    },
    [user, runCartMutation, applyGuestCart]
  );

  const updateQuantity = useCallback(
    (productId, quantity, variantName = "", colorName = "") => {
      const qty = Number(quantity);
      if (!Number.isFinite(qty)) return Promise.resolve({ success: false });

      if (!user) {
        if (qty < 1) {
          applyGuestCart(
            removeLine(itemsRef.current, productId, variantName, colorName)
          );
        } else {
          applyGuestCart(
            setLineQuantity(itemsRef.current, productId, variantName, colorName, qty)
          );
        }
        return Promise.resolve({ success: true });
      }

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
    [user, runCartMutation, applyGuestCart]
  );

  const incrementCartItem = useCallback(
    ({ productId, variantName = "", colorName = "", step = 1, maxQuantity }) => {
      const safeStep = Number(step) || 1;
      const maxQty = Number.isFinite(Number(maxQuantity)) ? Number(maxQuantity) : null;

      if (!user) {
        const line = findCartLine(itemsRef.current, productId, variantName, colorName);
        if (!line) return Promise.resolve({ success: false });

        let nextQty = line.quantity + safeStep;
        if (maxQty != null) {
          nextQty = Math.min(maxQty, nextQty);
        }
        if (nextQty === line.quantity) return Promise.resolve({ success: true });

        applyGuestCart(
          setLineQuantity(itemsRef.current, productId, variantName, colorName, nextQty)
        );
        return Promise.resolve({ success: true });
      }

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
    [user, runCartMutation, applyGuestCart]
  );

  const decrementCartItem = useCallback(
    ({ productId, variantName = "", colorName = "", resolveNextQuantity }) => {
      if (!user) {
        const line = findCartLine(itemsRef.current, productId, variantName, colorName);
        if (!line) return Promise.resolve({ success: false });

        const nextQty =
          typeof resolveNextQuantity === "function"
            ? Number(resolveNextQuantity(line.quantity))
            : line.quantity - 1;

        if (!Number.isFinite(nextQty) || nextQty === line.quantity) {
          return Promise.resolve({ success: true });
        }

        if (nextQty < 1) {
          applyGuestCart(
            removeLine(itemsRef.current, productId, variantName, colorName)
          );
        } else {
          applyGuestCart(
            setLineQuantity(itemsRef.current, productId, variantName, colorName, nextQty)
          );
        }
        return Promise.resolve({ success: true });
      }

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
    [user, runCartMutation, applyGuestCart]
  );

  const resetCart = useCallback(() => {
    setItems([]);
    if (!user) {
      clearGuestCart();
    }
  }, [user]);

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
        playFlyToCart,
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
