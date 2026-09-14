import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/theme.dart';
import '../../core/utils/product_pricing.dart';
import '../../core/utils/product_utils.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../features/home/home_providers.dart';
import '../../models/cart_item.dart';
import '../../models/product.dart';
import '../../widgets/common/api_error_view.dart';
import '../../widgets/common/skeleton_loaders.dart';
import '../../widgets/product/deal_product_card.dart';

class FeaturedProductsScreen extends ConsumerStatefulWidget {
  const FeaturedProductsScreen({
    super.key,
    required this.title,
    required this.filter,
    required this.emptyMessage,
  });

  final String title;
  final FeaturedProductFilter filter;
  final String emptyMessage;

  @override
  ConsumerState<FeaturedProductsScreen> createState() =>
      _FeaturedProductsScreenState();
}

class _FeaturedProductsScreenState extends ConsumerState<FeaturedProductsScreen> {
  bool _showSort = false;
  ProductSortOption _sort = ProductSortOption.listingDefault;

  Future<void> _handleAdd(Product product, BuildContext context) async {
    final defaults = resolveCartDefaults(product);
    final result = await ref.read(cartControllerProvider.notifier).addToCart(
          product,
          defaults.quantity,
          variantName: defaults.variantName,
          colorName: defaults.colorName,
          flySourceContext: context,
        );
    if (result == AddToCartResult.requiresLogin && mounted) {
      ref.read(authControllerProvider.notifier).openAuthModal();
    }
  }

  Future<void> _handleIncrease(Product product) async {
    final defaults = resolveCartDefaults(product);
    final cartItems = ref.read(cartControllerProvider).items;
    CartItem? line;
    for (final item in cartItems) {
      if (item.id != product.id) continue;
      if (item.variantName.trim() != defaults.variantName.trim()) continue;
      if (item.colorName.trim() != defaults.colorName.trim()) continue;
      line = item;
      break;
    }

    if (line == null) {
      final result = await ref.read(cartControllerProvider.notifier).addToCart(
            product,
            defaults.quantity,
            variantName: defaults.variantName,
            colorName: defaults.colorName,
          );
      if (result == AddToCartResult.requiresLogin && mounted) {
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

  Future<void> _handleDecrease(Product product) async {
    final defaults = resolveCartDefaults(product);
    final cartItems = ref.read(cartControllerProvider).items;
    CartItem? line;
    for (final item in cartItems) {
      if (item.id != product.id) continue;
      if (item.variantName.trim() != defaults.variantName.trim()) continue;
      if (item.colorName.trim() != defaults.colorName.trim()) continue;
      line = item;
      break;
    }
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
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(featuredProductsProvider(widget.filter));

    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          IconButton(
            onPressed: () => setState(() => _showSort = !_showSort),
            icon: const Icon(Icons.swap_vert_rounded),
            tooltip: 'Sort',
          ),
        ],
      ),
      body: Column(
        children: [
          if (_showSort)
            ColoredBox(
              color: Colors.white,
              child: Column(
                children: ProductSortOption.listingOptions.map((option) {
                  final selected = _sort == option;
                  return ListTile(
                    dense: true,
                    title: Text(
                      option.label,
                      style: TextStyle(
                        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                        color: selected ? AppColors.primary : AppColors.textPrimary,
                      ),
                    ),
                    onTap: () => setState(() {
                      _sort = option;
                      _showSort = false;
                    }),
                  );
                }).toList(),
              ),
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(featuredProductsProvider(widget.filter));
                await ref.read(featuredProductsProvider(widget.filter).future);
              },
              child: productsAsync.when(
                loading: () => const SkeletonProductGrid(),
                error: (_, _) => ApiErrorView(
                  message: 'Could not load products',
                  onRetry: () => ref.invalidate(featuredProductsProvider(widget.filter)),
                ),
                data: (products) {
                  final sorted = filterAndSortProducts(
                    products: products,
                    sort: _sort,
                  );
                  if (sorted.isEmpty) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(
                          height: MediaQuery.sizeOf(context).height * 0.5,
                          child: Center(
                            child: Text(
                              widget.emptyMessage,
                              style: const TextStyle(color: AppColors.textSecondary),
                            ),
                          ),
                        ),
                      ],
                    );
                  }

                  return GridView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 10,
                      childAspectRatio: DealProductCardDimensions.gridChildAspectRatio,
                    ),
                    itemCount: sorted.length,
                    itemBuilder: (context, index) {
                      final product = sorted[index];
                      return _FeaturedProductCard(
                        product: product,
                        onAdd: (ctx) => _handleAdd(product, ctx),
                        onIncrease: () => _handleIncrease(product),
                        onDecrease: () => _handleDecrease(product),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeaturedProductCard extends ConsumerWidget {
  const _FeaturedProductCard({
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
      fillCell: true,
      cartQuantity: qty,
      onAdd: onAdd,
      onIncrease: onIncrease,
      onDecrease: onDecrease,
    );
  }
}
