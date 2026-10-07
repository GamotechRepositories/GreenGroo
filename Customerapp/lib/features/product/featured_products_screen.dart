import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/theme.dart';
import '../../core/utils/product_pricing.dart';
import '../../core/utils/product_utils.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../features/home/home_providers.dart';
import '../../features/product/product_providers.dart';
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
            flySourceContext: context,
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

  ProductQuery get _query => ProductQuery(
        justArrived: widget.filter == FeaturedProductFilter.justArrived,
        hotSelling: widget.filter == FeaturedProductFilter.hotSelling,
        sort: _sort.id,
      );

  bool _maybeLoadMore(ScrollMetrics metrics, PagedProducts paged) {
    if (paged.hasMore && !paged.loadingMore && paged.error == null &&
        metrics.extentAfter < metrics.viewportDimension * 1.5) {
      ref.read(pagedProductsProvider(_query).notifier).loadMore();
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final query = _query;
    final paged = ref.watch(pagedProductsProvider(query));
    final notifier = ref.read(pagedProductsProvider(query).notifier);

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
              onRefresh: notifier.refresh,
              child: Builder(
                builder: (context) {
                  if (paged.loadingFirst) return const SkeletonProductGrid();
                  if (paged.error != null && paged.items.isEmpty) {
                    return ApiErrorView(
                      message: 'Could not load products',
                      onRetry: notifier.refresh,
                    );
                  }
                  final sorted = filterAndSortProducts(
                    products: paged.items,
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

                  final showFooter = paged.hasMore || paged.error != null;
                  return NotificationListener<ScrollMetricsNotification>(
                    onNotification: (n) => _maybeLoadMore(n.metrics, paged),
                    child: NotificationListener<ScrollUpdateNotification>(
                      onNotification: (n) => _maybeLoadMore(n.metrics, paged),
                      child: CustomScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        slivers: [
                          SliverPadding(
                            padding: EdgeInsets.fromLTRB(16, 12, 16, showFooter ? 0 : 24),
                            sliver: SliverGrid.builder(
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
                            ),
                          ),
                          if (showFooter)
                            SliverPadding(
                              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                              sliver: SliverToBoxAdapter(
                                child: Center(
                                  child: paged.error != null
                                      ? TextButton.icon(
                                          onPressed: notifier.loadMore,
                                          icon: const Icon(Icons.refresh_rounded, size: 18),
                                          label: const Text('Couldn\'t load more · Retry'),
                                        )
                                      : const SizedBox(
                                          width: 22,
                                          height: 22,
                                          child: CircularProgressIndicator(strokeWidth: 2),
                                        ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
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
