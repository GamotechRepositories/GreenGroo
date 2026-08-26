import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  getCartStepForItem,
  getDecreasedCartQuantityForProduct,
  resolveCartDefaults,
} from "../utils/cartDefaults";
import { isLocalProductId } from "../utils/localProductId";
import { isMultiVariant } from "../utils/productPricing";

function findCartLine(items, product) {
  if (!product?._id) return null;

  const { variantName, colorName } = resolveCartDefaults(product);
  const exact =
    items.find(
      (item) =>
        String(item._id) === String(product._id) &&
        (item.variantName || "") === variantName &&
        (item.colorName || "") === colorName
    ) || null;

  if (exact) return exact;

  return items.find((item) => String(item._id) === String(product._id)) || null;
}

export function useProductCartActions() {
  const { openAuthModal } = useAuth();
  const { items, addToCart, incrementCartItem, decrementCartItem, playFlyToCart } =
    useCart();

  const getCartLine = useCallback((product) => findCartLine(items, product), [items]);

  const getCartQuantity = useCallback(
    (product) => {
      if (!product?._id) return 0;

      if (isMultiVariant(product)) {
        return items
          .filter((item) => String(item._id) === String(product._id))
          .reduce((sum, item) => sum + (item.quantity || 0), 0);
      }

      return getCartLine(product)?.quantity || 0;
    },
    [items, getCartLine]
  );

  const handleAdd = useCallback(
    async (product, flySource) => {
      if (!product?._id) return null;
      if (product._id.length < 10 && !isLocalProductId(product._id)) return null;

      const { variantName, colorName, quantity } = resolveCartDefaults(product);
      const result = await addToCart(product, quantity, {
        variantName,
        colorName,
        flySource,
      });

      if (result?.requiresLogin) {
        openAuthModal("login");
      }

      return result;
    },
    [addToCart, openAuthModal]
  );

  const handleIncrease = useCallback(
    async (product, flySource) => {
      if (!product?._id) return null;
      if (product._id.length < 10 && !isLocalProductId(product._id)) return null;

      const line = getCartLine(product);
      const { variantName, colorName, quantity } = resolveCartDefaults(product);

      if (line) {
        if (flySource) {
          playFlyToCart?.(product, flySource);
        }
        const step = getCartStepForItem(line);
        await incrementCartItem({
          productId: line._id,
          variantName: line.variantName || "",
          colorName: line.colorName || "",
          step,
        });
        return { success: true };
      }

      const result = await addToCart(product, quantity, {
        variantName,
        colorName,
        flySource,
      });

      if (result?.requiresLogin) {
        openAuthModal("login");
      }

      return result;
    },
    [getCartLine, addToCart, incrementCartItem, openAuthModal, playFlyToCart]
  );

  const handleDecrease = useCallback(
    async (product) => {
      const line = getCartLine(product);
      if (!line) return;

      await decrementCartItem({
        productId: line._id,
        variantName: line.variantName || "",
        colorName: line.colorName || "",
        resolveNextQuantity: (currentQty) =>
          getDecreasedCartQuantityForProduct(product, currentQty, line.variantName || ""),
      });
    },
    [getCartLine, decrementCartItem]
  );

  return {
    getCartLine,
    getCartQuantity,
    handleAdd,
    handleIncrease,
    handleDecrease,
  };
}
