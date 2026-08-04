import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { PRODUCT_PRICING_SELECT } from "../utils/productPricing.js";
import { getUserContactEmail } from "../utils/userContact.js";

const populateWishlist = (query) =>
  query.populate({
    path: "items.product",
    select: `${PRODUCT_PRICING_SELECT} subcategory`,
  });

export const getWishlist = async (req, res) => {
  try {
    let wishlist = await populateWishlist(
      Wishlist.findOne({ user: req.user._id })
    );

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: {
          user: req.user._id,
          email: getUserContactEmail(req.user),
          items: [],
        },
      });
    }

    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleWishlistItem = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    let added = false;

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        email: getUserContactEmail(req.user),
        items: [{ product: productId }],
      });
      added = true;
    } else {
      wishlist.email = getUserContactEmail(req.user);
      const existingIndex = wishlist.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingIndex >= 0) {
        wishlist.items.splice(existingIndex, 1);
        added = false;
      } else {
        wishlist.items.push({ product: productId });
        added = true;
      }

      await wishlist.save();
    }

    const updated = await populateWishlist(Wishlist.findById(wishlist._id));

    res.status(200).json({
      success: true,
      message: added ? "Added to wishlist" : "Removed from wishlist",
      added,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    wishlist.items = wishlist.items.filter(
      (item) => item.product.toString() !== productId
    );
    await wishlist.save();

    const updated = await populateWishlist(Wishlist.findById(wishlist._id));

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
