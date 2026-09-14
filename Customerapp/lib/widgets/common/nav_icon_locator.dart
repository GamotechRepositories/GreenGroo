import 'package:flutter/rendering.dart';

/// Tracks on-screen bounds for fly-to-cart / fly-to-wishlist animations
/// without a shared [GlobalKey] on the widget tree.
abstract final class NavIconLocator {
  static RenderBox? cartIconBox;
  static RenderBox? wishlistIconBox;

  static void reportCart(RenderBox? box) {
    cartIconBox = box;
  }

  static void reportWishlist(RenderBox? box) {
    wishlistIconBox = box;
  }

  static void clearCart() {
    cartIconBox = null;
  }

  static void clearWishlist() {
    wishlistIconBox = null;
  }
}
