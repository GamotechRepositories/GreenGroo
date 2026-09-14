import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../core/utils/product_pricing.dart';
import '../../core/utils/product_utils.dart';
import '../../features/home/home_fallback_data.dart';
import '../../models/cart_item.dart';
import '../../models/product.dart';
import '../auth/auth_controller.dart';
import '../../core/utils/ui_sound_effects.dart';
import '../../widgets/cart/fly_product_animator.dart';

enum AddToCartResult { success, requiresLogin, failed }

class PendingCartAction {
  const PendingCartAction({
    required this.product,
    required this.quantity,
    this.buyNow = false,
    this.variantName = '',
    this.colorName = '',
  });

  final Product product;
  final int quantity;
  final bool buyNow;
  final String variantName;
  final String colorName;
}

class CartState {
  const CartState({
    this.items = const [],
    this.loading = false,
    this.toastImage,
    this.navigateToCheckout = false,
    this.errorMessage,
  });

  final List<CartItem> items;
  final bool loading;
  final String? toastImage;
  final bool navigateToCheckout;
  final String? errorMessage;

  int get cartCount => items.fold(0, (sum, item) => sum + item.quantity);

  CartState copyWith({
    List<CartItem>? items,
    bool? loading,
    String? toastImage,
    bool clearToast = false,
    bool navigateToCheckout = false,
    bool clearCheckoutNav = false,
    String? errorMessage,
    bool clearError = false,
  }) {
    return CartState(
      items: items ?? this.items,
      loading: loading ?? this.loading,
      toastImage: clearToast ? null : (toastImage ?? this.toastImage),
      navigateToCheckout: clearCheckoutNav
          ? false
          : (navigateToCheckout || this.navigateToCheckout),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

final cartControllerProvider =
    NotifierProvider<CartController, CartState>(CartController.new);

int cartLineQuantityForProduct(List<CartItem> items, Product product) {
  final defaults = resolveCartDefaults(product);
  final line = findCartLine(
    items,
    product.id,
    defaults.variantName,
    defaults.colorName,
  );
  return line?.quantity ?? 0;
}

/// Rebuilds only when this product's cart quantity changes.
final cartProductQuantityProvider = Provider.family<int, String>((ref, productId) {
  return ref.watch(
    cartControllerProvider.select((state) {
      for (final item in state.items) {
        if (item.id == productId) {
          return item.quantity;
        }
      }
      return 0;
    }),
  );
});

class CartController extends Notifier<CartState> {
  PendingCartAction? _pending;
  Timer? _toastClearTimer;

  @override
  CartState build() {
    ref.onDispose(() => _toastClearTimer?.cancel());
    ref.listen(authControllerProvider, (previous, next) {
      final wasLoggedOut = previous?.isLoggedIn != true;
      if (wasLoggedOut && next.isLoggedIn) {
        _handleLogin();
      } else if (!next.isLoggedIn && previous?.isLoggedIn == true) {
        state = const CartState();
        _pending = null;
      }
    });

    return const CartState();
  }

  Future<void> _handleLogin() async {
    await loadCart();
    final pending = _pending;
    if (pending == null) return;
    _pending = null;

    final result = await addToCart(
      pending.product,
      pending.quantity,
      buyNow: pending.buyNow,
      variantName: pending.variantName,
      colorName: pending.colorName,
    );

    if (result == AddToCartResult.success && pending.buyNow) {
      clearToast();
      state = state.copyWith(navigateToCheckout: true);
    }
  }

  Future<void> loadCart({bool silent = false}) async {
    final auth = ref.read(authControllerProvider);
    if (!auth.isLoggedIn) {
      state = const CartState();
      return;
    }

    if (!silent) {
      state = state.copyWith(loading: true);
    }
    try {
      final items = await ref.read(apiServiceProvider).fetchCartItems();
      state = state.copyWith(items: items, loading: false);
    } catch (_) {
      state = state.copyWith(items: const [], loading: false);
    }
  }

  Future<AddToCartResult> addToCart(
    Product product,
    int quantity, {
    bool buyNow = false,
    String variantName = '',
    String colorName = '',
    BuildContext? flySourceContext,
  }) async {
    if (quantity < 1) return AddToCartResult.failed;

    if (product.id.isEmpty || isFallbackProductId(product.id)) {
      state = state.copyWith(
        errorMessage: 'This product is not available to order right now.',
      );
      return AddToCartResult.failed;
    }

    final effectiveVariant = variantName.trim();
    final effectiveColor = colorName.trim();

    final auth = ref.read(authControllerProvider);
    if (!auth.isLoggedIn) {
      _pending = PendingCartAction(
        product: product,
        quantity: quantity,
        buyNow: buyNow,
        variantName: effectiveVariant,
        colorName: effectiveColor,
      );
      ref.read(authControllerProvider.notifier).openAuthModal();
      return AddToCartResult.requiresLogin;
    }

    try {
      await ref.read(apiServiceProvider).addToCartItem({
        'productId': product.id,
        'quantity': quantity,
        'variantName': effectiveVariant,
        'colorName': effectiveColor,
      });
      _mergeCartLineLocally(
        product,
        quantity,
        variantName: effectiveVariant,
        colorName: effectiveColor,
      );

      if (!buyNow) {
        unawaited(UiSoundEffects.playCartAdd());
        if (flySourceContext != null && flySourceContext.mounted) {
          triggerFlyToCart(
            sourceContext: flySourceContext,
            imageUrl: product.primaryImage,
          );
        } else {
          state = state.copyWith(toastImage: product.primaryImage, clearError: true);
          _toastClearTimer?.cancel();
          _toastClearTimer = Timer(const Duration(milliseconds: 2600), () {
            if (ref.mounted) clearToast();
          });
        }
      } else {
        state = state.copyWith(navigateToCheckout: true, clearError: true);
      }

      return AddToCartResult.success;
    } catch (error) {
      state = state.copyWith(errorMessage: authErrorMessage(error));
      return AddToCartResult.failed;
    }
  }

  void clearToast() {
    state = state.copyWith(clearToast: true);
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  void clearCheckoutNavigation() {
    state = state.copyWith(clearCheckoutNav: true);
  }

  Future<void> removeFromCart(String productId) async {
    await removeFromCartLine(productId: productId);
  }

  Future<void> removeFromCartLine({
    required String productId,
    String variantName = '',
    String colorName = '',
  }) async {
    final auth = ref.read(authControllerProvider);
    if (!auth.isLoggedIn) return;

    final previous = state.items;
    state = state.copyWith(
      items: previous
          .where(
            (item) => !cartLineMatches(
              item,
              productId,
              variantName,
              colorName,
            ),
          )
          .toList(),
    );

    try {
      await ref.read(apiServiceProvider).removeFromCartItem(
            productId,
            variantName: variantName,
            colorName: colorName,
          );
    } catch (_) {
      state = state.copyWith(items: previous);
    }
  }

  Future<void> updateQuantity(String productId, int quantity) async {
    await updateCartLineQuantity(productId: productId, quantity: quantity);
  }

  Future<bool> updateCartLineQuantity({
    required String productId,
    required int quantity,
    String variantName = '',
    String colorName = '',
  }) async {
    final auth = ref.read(authControllerProvider);
    if (!auth.isLoggedIn) return false;

    if (quantity < 1) {
      await removeFromCartLine(
        productId: productId,
        variantName: variantName,
        colorName: colorName,
      );
      return true;
    }

    final previous = state.items;
    state = state.copyWith(
      items: previous
          .map(
            (item) => cartLineMatches(
              item,
              productId,
              variantName,
              colorName,
            )
                ? item.copyWith(quantity: quantity)
                : item,
          )
          .toList(),
      clearError: true,
    );

    try {
      await ref.read(apiServiceProvider).updateCartItemQty(
            productId,
            quantity,
            variantName: variantName,
            colorName: colorName,
          );
      await loadCart(silent: true);
      return true;
    } catch (error) {
      state = state.copyWith(
        items: previous,
        errorMessage: authErrorMessage(error),
      );
      return false;
    }
  }

  Future<void> clearCart() async {
    final items = List<CartItem>.from(state.items);
    if (items.isEmpty) return;

    state = state.copyWith(items: const [], clearError: true);

    try {
      // Sequential deletes — parallel writes race on the same cart document.
      for (final item in items) {
        await ref.read(apiServiceProvider).removeFromCartItem(
              item.id,
              variantName: item.variantName,
              colorName: item.colorName,
            );
      }
      await loadCart(silent: true);
    } catch (error) {
      await loadCart(silent: true);
      if (state.items.isNotEmpty) {
        state = state.copyWith(errorMessage: authErrorMessage(error));
      }
    }
  }

  void _mergeCartLineLocally(
    Product product,
    int quantity, {
    required String variantName,
    required String colorName,
  }) {
    final items = List<CartItem>.from(state.items);
    final existing = findCartLine(items, product.id, variantName, colorName);

    if (existing != null) {
      final index = items.indexOf(existing);
      items[index] = existing.copyWith(quantity: existing.quantity + quantity);
    } else {
      items.add(
        cartItemFromProduct(
          product,
          quantity,
          variantName: variantName,
          colorName: colorName,
        ),
      );
    }

    state = state.copyWith(items: items, clearError: true);
  }
}
