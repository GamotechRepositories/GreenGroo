import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/product_pricing.dart';
import '../../../features/auth/auth_controller.dart';
import '../../../features/cart/cart_controller.dart';
import '../../../models/cart_item.dart';
import '../../../models/product.dart';
import '../../../routes/route_paths.dart';
import '../../../widgets/common/section_header.dart';
import '../../../widgets/common/skeleton_loaders.dart';
import '../../../widgets/product/deal_product_card.dart';
import '../product_providers.dart';

class SimilarProductsSection extends ConsumerWidget {
  const SimilarProductsSection({
    super.key,
    required this.productId,
    this.categoryName = '',
  });

  final String productId;
  final String categoryName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(similarProductsProvider(productId));

    return productsAsync.when(
      loading: () => _SimilarProductsShell(
        categoryName: categoryName,
        child: _SimilarProductsGrid(
          itemCount: 12,
          itemBuilder: (_, _) => const SkeletonBox(borderRadius: 12),
        ),
      ),
      error: (_, _) => const SizedBox.shrink(),
      data: (products) {
        if (products.isEmpty) return const SizedBox.shrink();

        return _SimilarProductsShell(
          categoryName: categoryName,
          child: _SimilarProductsGrid(
            itemCount: products.length,
            itemBuilder: (context, index) =>
                _SimilarDealCard(product: products[index]),
          ),
        );
      },
    );
  }
}

class _SimilarProductsGrid extends StatelessWidget {
  const _SimilarProductsGrid({
    required this.itemCount,
    required this.itemBuilder,
  });

  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final crossAxisCount = width >= 1024 ? 6 : width >= 640 ? 3 : 2;

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: itemCount,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: DealProductCardDimensions.gridChildAspectRatio,
      ),
      itemBuilder: itemBuilder,
    );
  }
}

class _SimilarProductsShell extends StatelessWidget {
  const _SimilarProductsShell({
    required this.categoryName,
    required this.child,
  });

  final String categoryName;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SectionHeader(
            title: 'Similar Products',
            dense: true,
            onViewAll: () => _openViewAll(context),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  void _openViewAll(BuildContext context) {
    final category = categoryName.trim();
    if (category.isEmpty) {
      context.push(RoutePaths.product);
      return;
    }

    context.push(
      '${RoutePaths.product}?categoryName=${Uri.encodeComponent(category)}',
    );
  }
}

class _SimilarDealCard extends ConsumerWidget {
  const _SimilarDealCard({required this.product});

  final Product product;

  CartItem? _cartLine(List<CartItem> items) {
    final defaults = resolveCartDefaults(product);
    for (final item in items) {
      if (item.id != product.id) continue;
      if (item.variantName.trim() != defaults.variantName.trim()) continue;
      if (item.colorName.trim() != defaults.colorName.trim()) continue;
      return item;
    }
    return null;
  }

  Future<void> _handleAdd(WidgetRef ref, BuildContext context) async {
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

  Future<void> _handleIncrease(WidgetRef ref) async {
    if (product.id.length < 10) return;
    final cartItems = ref.read(cartControllerProvider).items;
    final line = _cartLine(cartItems);
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

  Future<void> _handleDecrease(WidgetRef ref) async {
    final cartItems = ref.read(cartControllerProvider).items;
    final line = _cartLine(cartItems);
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
    return DealProductCard(
      product: product,
      fillCell: true,
      cartQuantity: ref.watch(cartProductQuantityProvider(product.id)),
      onAdd: (context) => _handleAdd(ref, context),
      onIncrease: () => _handleIncrease(ref),
      onDecrease: () => _handleDecrease(ref),
    );
  }
}
