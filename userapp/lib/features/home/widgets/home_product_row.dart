import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../config/theme.dart';
import '../../../core/utils/product_pricing.dart';
import '../../../features/auth/auth_controller.dart';
import '../../../features/cart/cart_controller.dart';
import '../../../models/cart_item.dart';
import '../../../models/product.dart';
import '../../../widgets/common/section_header.dart';
import '../../../widgets/product/deal_product_card.dart';
import 'home_section_card.dart';

class HomeProductRow extends ConsumerWidget {
  const HomeProductRow({
    super.key,
    required this.title,
    required this.onViewAll,
    required this.products,
    required this.loading,
  });

  final String title;
  final VoidCallback onViewAll;
  final List<Product> products;
  final bool loading;

  CartItem? _cartLine(List<CartItem> items, Product product) {
    final defaults = resolveCartDefaults(product);
    for (final item in items) {
      if (item.id != product.id) continue;
      if (item.variantName.trim() != defaults.variantName.trim()) continue;
      if (item.colorName.trim() != defaults.colorName.trim()) continue;
      return item;
    }
    return null;
  }

  Future<void> _handleAdd(WidgetRef ref, Product product, BuildContext context) async {
    if (product.id.length < 10) return;
    final defaults = resolveCartDefaults(product);
    final result = await ref.read(cartControllerProvider.notifier).addToCart(
          product,
          defaults.quantity,
          variantName: defaults.variantName,
          colorName: defaults.colorName,
          flySourceContext: context,
        );
    if (result == AddToCartResult.requiresLogin) {
      ref.read(authControllerProvider.notifier).openAuthModal();
    }
  }

  Future<void> _handleIncrease(WidgetRef ref, Product product) async {
    if (product.id.length < 10) return;
    final cartItems = ref.read(cartControllerProvider).items;
    final line = _cartLine(cartItems, product);
    if (line == null) {
      final defaults = resolveCartDefaults(product);
      final result = await ref.read(cartControllerProvider.notifier).addToCart(
            product,
            defaults.quantity,
            variantName: defaults.variantName,
            colorName: defaults.colorName,
          );
      if (result == AddToCartResult.requiresLogin) {
        ref.read(authControllerProvider.notifier).openAuthModal();
      }
      return;
    }

    final step = getCartStepForProduct(product, line.variantName);
    await ref.read(cartControllerProvider.notifier).updateCartLineQuantity(
          productId: product.id,
          quantity: line.quantity + step,
          variantName: line.variantName,
          colorName: line.colorName,
        );
  }

  Future<void> _handleDecrease(WidgetRef ref, Product product) async {
    final cartItems = ref.read(cartControllerProvider).items;
    final line = _cartLine(cartItems, product);
    if (line == null) return;

    final nextQty = getDecreasedCartQuantityForProduct(
      product,
      line.quantity,
      line.variantName,
    );
    if (nextQty <= 0) {
      await ref.read(cartControllerProvider.notifier).removeFromCartLine(
            productId: product.id,
            variantName: line.variantName,
            colorName: line.colorName,
          );
      return;
    }

    await ref.read(cartControllerProvider.notifier).updateCartLineQuantity(
          productId: product.id,
          quantity: nextQty,
          variantName: line.variantName,
          colorName: line.colorName,
        );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!loading && products.isEmpty) {
      return const SizedBox.shrink();
    }

    return HomeSectionCard(
      margin: const EdgeInsets.fromLTRB(0, 2, 0, 2),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      showDivider: false,
      child: Column(
        children: [
          SectionHeader(
            title: title,
            dense: true,
            onViewAll: onViewAll,
          ),
          SizedBox(
            height: DealProductCardDimensions.height,
            child: loading
                ? ListView.separated(
                    scrollDirection: Axis.horizontal,
                    cacheExtent: 240,
                    itemCount: 6,
                    separatorBuilder: (_, _) => const SizedBox(width: 10),
                    itemBuilder: (_, _) => Container(
                      width: DealProductCardDimensions.width,
                      decoration: BoxDecoration(
                        color: AppColors.mobileSurface,
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  )
                : ListView.separated(
                    scrollDirection: Axis.horizontal,
                    clipBehavior: Clip.none,
                    cacheExtent: 240,
                    itemCount: products.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 10),
                    itemBuilder: (context, index) {
                      final product = products[index];
                      return _HomeDealProductCard(
                        product: product,
                        onAdd: (ctx) => _handleAdd(ref, product, ctx),
                        onIncrease: () => _handleIncrease(ref, product),
                        onDecrease: () => _handleDecrease(ref, product),
                      );
                    },
                  ),
          ),
        ],
      ),
        );
  }
}

/// Isolates cart rebuilds to the single card whose quantity changed.
class _HomeDealProductCard extends ConsumerWidget {
  const _HomeDealProductCard({
    required this.product,
    required this.onAdd,
    required this.onIncrease,
    required this.onDecrease,
  });

  final Product product;
  final void Function(BuildContext context) onAdd;
  final VoidCallback onIncrease;
  final VoidCallback onDecrease;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final qty = ref.watch(cartProductQuantityProvider(product.id));

    return DealProductCard(
      product: product,
      cartQuantity: qty,
      onAdd: onAdd,
      onIncrease: onIncrease,
      onDecrease: onDecrease,
    );
  }
}
