import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/image_gallery_save.dart';
import '../../core/utils/product_pricing.dart';
import '../../core/utils/product_utils.dart';
import '../../core/utils/recently_viewed.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../features/home/home_providers.dart';
import '../../models/cart_item.dart';
import '../../features/product/product_providers.dart';
import 'widgets/similar_products_section.dart';
import 'widgets/top_category_products_section.dart';
import '../../models/product.dart';
import '../../routes/route_paths.dart';
import '../../widgets/common/app_network_image.dart';
import '../../widgets/common/skeleton_loaders.dart';
import '../../widgets/product/product_share_sheet.dart';
import '../../widgets/product/wishlist_button.dart';
import '../../widgets/product/product_video_player.dart';

@immutable
class ProductDetailCartKey {
  const ProductDetailCartKey({
    required this.productId,
    required this.variantName,
    required this.colorName,
  });

  final String productId;
  final String variantName;
  final String colorName;

  @override
  bool operator ==(Object other) {
    return other is ProductDetailCartKey &&
        productId == other.productId &&
        variantName == other.variantName &&
        colorName == other.colorName;
  }

  @override
  int get hashCode => Object.hash(productId, variantName, colorName);
}

final productDetailCartQuantityProvider =
    Provider.family<int?, ProductDetailCartKey>((ref, key) {
  return ref.watch(
    cartControllerProvider.select((state) {
      for (final item in state.items) {
        if (item.id != key.productId) continue;
        if (item.variantName.trim() != key.variantName.trim()) continue;
        if (item.colorName.trim() != key.colorName.trim()) continue;
        return item.quantity;
      }
      return null;
    }),
  );
});

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});

  final String productId;

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _quantity = defaultSingleMoq;
  String _selectedVariant = '';
  String _selectedColor = '';
  String? _quantitySyncedKey;
  Timer? _recentlyViewedDebounce;

  @override
  void didUpdateWidget(covariant ProductDetailScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.productId != widget.productId) {
      _quantitySyncedKey = null;
      _selectedVariant = '';
      _selectedColor = '';
      _quantity = defaultSingleMoq;
    }
  }

  void _syncQuantityForProduct(
    Product product,
    String activeVariantName,
    int? cartLineQuantity,
  ) {
    final key =
        '${widget.productId}|$activeVariantName|$_selectedColor|${cartLineQuantity ?? 'local'}';
    if (_quantitySyncedKey == key) return;
    _quantitySyncedKey = key;

    final minOrderQuantity = getMinOrderQuantity(product, activeVariantName);
    final maxQuantity = getMaxOrderQuantity(product, activeVariantName);
    final nextQuantity = cartLineQuantity ?? minOrderQuantity;
    final clamped = nextQuantity.clamp(minOrderQuantity, maxQuantity);

    if (_quantity != clamped) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        setState(() => _quantity = clamped);
      });
    }
  }

  void _handleVariantChange(Product product, String variantName) {
    setState(() {
      _selectedVariant = variantName;
      _quantitySyncedKey = null;
      final minOrderQuantity = getMinOrderQuantity(product, variantName);
      _quantity = minOrderQuantity;
      final colors = getAvailableColors(product, variantName);
      _selectedColor = colors.isNotEmpty ? colors.first.name : '';
    });
  }

  void _initSelectionsForProduct(Product product) {
    if (!mounted) return;

    var changed = false;
    if (isMultiVariant(product) && _selectedVariant.isEmpty) {
      _selectedVariant = product.variants.first.name;
      changed = true;
    }

    final activeVariant = resolveActiveVariantName(product, _selectedVariant);
    final colors = getAvailableColors(product, activeVariant);
    if (_selectedColor.isEmpty && colors.isNotEmpty) {
      _selectedColor = colors.first.name;
      changed = true;
    }

    if (changed) setState(() {});
  }

  @override
  void dispose() {
    _recentlyViewedDebounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final productAsync = ref.watch(productDetailProvider(widget.productId));

    ref.listen(productDetailProvider(widget.productId), (previous, next) {
      next.whenData((product) {
        if (!mounted) return;
        _initSelectionsForProduct(product);
        _recentlyViewedDebounce?.cancel();
        _recentlyViewedDebounce = Timer(const Duration(seconds: 2), () {
          RecentlyViewedStore.add(product.id).then((_) {
            if (!mounted) return;
            ref.invalidate(recentlyViewedProductsProvider);
          });
        });
      });
    });

    return productAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => _handleBackNavigation(context),
          ),
          title: const Text('Product Details'),
        ),
        body: const SkeletonProductDetail(),
      ),
      error: (_, _) => Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => _handleBackNavigation(context),
          ),
          title: const Text('Product Details'),
        ),
        body: _ErrorView(onBack: () => context.go(RoutePaths.product)),
      ),
      data: (product) => _buildScaffold(context, product),
    );
  }

  void _handleBackNavigation(BuildContext context) {
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    } else if (context.canPop()) {
      context.pop();
    } else {
      context.go(RoutePaths.home);
    }
  }

  Widget _buildScaffold(BuildContext context, Product product) {
    final activeVariantName =
        resolveActiveVariantName(product, _selectedVariant);
    final selectionColor =
        resolveSelectionColor(product, activeVariantName, _selectedColor);
    final cartKey = ProductDetailCartKey(
      productId: product.id,
      variantName: activeVariantName,
      colorName: selectionColor,
    );

    ref.listen<int?>(productDetailCartQuantityProvider(cartKey),
        (previous, next) {
      _syncQuantityForProduct(product, activeVariantName, next);
    });

    final inStock = isProductInStock(product, activeVariantName);
    final minOrderQuantity = getMinOrderQuantity(product, activeVariantName);
    final maxQuantity = getMaxOrderQuantity(product, activeVariantName);

    // Active variant price resolution
    double currentPrice = product.effectivePrice;
    double mrpPrice = product.price;
    int discountPercent = product.discountedPercent.round();

    if (isMultiVariant(product)) {
      final v = getVariant(product, activeVariantName);
      if (v != null) {
        currentPrice = v.discountedPrice > 0 ? v.discountedPrice : v.price;
        mrpPrice = v.price;
        if (v.discountedPrice > 0 && v.price > v.discountedPrice) {
          discountPercent =
              ((v.price - v.discountedPrice) / v.price * 100).round();
        } else {
          discountPercent = 0;
        }
      }
    }

    final hasDiscount = mrpPrice > currentPrice && discountPercent > 0;
    final displayUnit = activeVariantName.isNotEmpty
        ? activeVariantName
        : (product.weightUnit.isNotEmpty ? product.weightUnit : '1 unit');
    final perUnitPrice = _calculatePerUnitPrice(currentPrice, displayUnit);

    final cartState = ref.watch(cartControllerProvider);
    final cartCount = cartState.cartCount;
    final cartTotal = cartState.items.fold<double>(
      0,
      (sum, item) => sum + item.lineTotal,
    );

    final images =
        product.productImages.where((i) => i.trim().isNotEmpty).toList();

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) {
          _handleBackNavigation(context);
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 1,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
            onPressed: () => _handleBackNavigation(context),
          ),
        title: Text(
          product.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        actions: [
          WishlistButton(product: product, size: 38),
          IconButton(
            icon: const Icon(Icons.search, color: AppColors.textPrimary),
            onPressed: () => context.push(RoutePaths.product),
          ),
          IconButton(
            icon: const Icon(Icons.share_outlined, color: AppColors.textPrimary),
            onPressed: () => showProductShareSheet(
              context,
              product,
              variantName: activeVariantName,
            ),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  cacheExtent: AppScrollConfig.cacheExtent,
                  children: [
                    // Carousel
                    _ProductImageGallery(
                      images: images,
                      product: product,
                      videoUrl: product.videoUrl,
                    ),
                    const SizedBox(height: 12),

                    // Highlights Chips + "View details" Button Row (as in reference image)
                    _buildHighlightsRow(context, product, activeVariantName),
                    const SizedBox(height: 14),

                    // Unit & Stock Row
                    Row(
                      children: [
                        Text(
                          displayUnit,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        if (inStock && product.stock > 0 && product.stock <= 10) ...[
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF3F4F6),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.battery_3_bar_rounded,
                                  size: 13,
                                  color: Color(0xFFD97706),
                                ),
                                const SizedBox(width: 3),
                                Text(
                                  '${product.stock} left',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFFB45309),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ] else if (!inStock) ...[
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEE2E2),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'Out of stock',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFFDC2626),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 6),

                    // Product Title
                    Text(
                      product.name,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Price Section
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          formatInr(currentPrice),
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (hasDiscount) ...[
                          const SizedBox(width: 8),
                          Text(
                            'MRP ${formatInr(mrpPrice)}',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.textMuted,
                              decoration: TextDecoration.lineThrough,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (hasDiscount) ...[
                      const SizedBox(height: 4),
                      Text(
                        '$discountPercent% OFF on MRP',
                        style: const TextStyle(
                          color: Color(0xFF1E5BF8),
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ],
                    const SizedBox(height: 2),
                    Text(
                      perUnitPrice ?? 'Inclusive of all taxes',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Select Unit Variant Selector
                    if (isMultiVariant(product)) ...[
                      const Text(
                        'Select Unit',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        height: 78,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: product.variants.length,
                          separatorBuilder: (_, _) => const SizedBox(width: 10),
                          itemBuilder: (context, index) {
                            final variant = product.variants[index];
                            final isSelected = activeVariantName == variant.name;
                            final vPrice = variant.discountedPrice > 0
                                ? variant.discountedPrice
                                : variant.price;
                            final vMrp = variant.price;
                            final vHasDiscount = variant.discountedPrice > 0 &&
                                variant.price > variant.discountedPrice;
                            final vDiscountPercent = vHasDiscount
                                ? ((variant.price - variant.discountedPrice) /
                                        variant.price *
                                        100)
                                    .round()
                                : 0;

                            return GestureDetector(
                              onTap: () =>
                                  _handleVariantChange(product, variant.name),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFFF0FDF4)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(0xFF16A34A)
                                        : const Color(0xFFE5E7EB),
                                    width: isSelected ? 1.5 : 1,
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    if (vHasDiscount)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 5, vertical: 1),
                                        margin: const EdgeInsets.only(bottom: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF2563EB),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          '$vDiscountPercent% OFF',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 9,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                    Text(
                                      variant.name,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13,
                                        color: isSelected
                                            ? const Color(0xFF16A34A)
                                            : AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          formatInr(vPrice),
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                        if (vHasDiscount) ...[
                                          const SizedBox(width: 4),
                                          Text(
                                            formatInr(vMrp),
                                            style: const TextStyle(
                                              fontSize: 10,
                                              color: AppColors.textMuted,
                                              decoration:
                                                  TextDecoration.lineThrough,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],



                    // Brand Row Tile
                    if (product.brandName.trim().isNotEmpty) ...[
                      InkWell(
                        onTap: () => context.push(
                          '${RoutePaths.product}?brandName=${Uri.encodeComponent(product.brandName)}',
                        ),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF3F4F6),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  product.brandName.substring(0, 1).toUpperCase(),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                    color: Color(0xFF16A34A),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      product.brandName,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    const Text(
                                      'Explore all products',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.chevron_right,
                                color: Color(0xFF9CA3AF),
                                size: 20,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],

                    // Warranty / Replacement Policy Tile
                    if (product.warranty.trim().isNotEmpty) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE5E7EB)),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.published_with_changes_outlined,
                              color: AppColors.textPrimary,
                              size: 22,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                product.warranty,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                            const Icon(
                              Icons.chevron_right,
                              color: Color(0xFF9CA3AF),
                              size: 20,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],

                    const SizedBox(height: 12),

                    // Similar Products Section
                    SimilarProductsSection(
                      productId: product.id,
                      categoryName: product.categories.isNotEmpty
                          ? product.categories.first
                          : product.subcategory,
                    ),

                    const SizedBox(height: 6),
                    // Top Category Products Section (More from this category)
                    TopCategoryProductsSection(product: product),

                    SizedBox(height: MediaQuery.paddingOf(context).bottom + 20),
                  ],
                ),
              ),

              // Persistent Sticky Bottom Bar
              _ProductDetailBottomBar(
                product: product,
                cartKey: cartKey,
                activeVariantName: activeVariantName,
                selectionColor: selectionColor,
                inStock: inStock,
                minOrderQuantity: minOrderQuantity,
                maxQuantity: maxQuantity,
                currentPrice: currentPrice,
                mrpPrice: mrpPrice,
                hasDiscount: hasDiscount,
                displayUnit: displayUnit,
                onAddToCart: _addToCart,
                onQuantityDecrease: _handleQuantityDecrease,
                onQuantityIncrease: _handleQuantityIncrease,
              ),
            ],
          ),
        ),
      );
  }

  Widget _buildHighlightsRow(
    BuildContext context,
    Product product,
    String activeVariantName,
  ) {
    final highlights = _extractHighlights(product);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        if (highlights.isNotEmpty) ...[
          ...highlights.take(2).map(
            (h) => Expanded(
              child: Container(
                height: 52,
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      h.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      h.value,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ] else ...[
          const Spacer(),
        ],
        InkWell(
          onTap: () => _showProductDetailsModal(
            context,
            product,
            activeVariantName,
          ),
          borderRadius: BorderRadius.circular(10),
          child: Container(
            height: 52,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF86EFAC)),
            ),
            alignment: Alignment.center,
            child: const Text(
              'View\ndetails',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF16A34A),
                fontWeight: FontWeight.w700,
                fontSize: 12,
                height: 1.25,
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _showProductDetailsModal(
    BuildContext context,
    Product product,
    String activeVariantName,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) => _ProductDetailsSheet(
        productId: product.id,
        initialActiveVariantName: activeVariantName,
        onAddToCart: _addToCart,
        onQuantityDecrease: _handleQuantityDecrease,
        onQuantityIncrease: _handleQuantityIncrease,
      ),
    );
  }

  CartItem? _resolveCartLine(
    Product product,
    String activeVariantName,
    String selectionColor,
  ) {
    final items = ref.read(cartControllerProvider).items;
    return findCartLineForProductDetail(
      items,
      product,
      activeVariantName,
      selectionColor,
    );
  }

  void _showQuantityMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _handleQuantityDecrease(
    Product product,
    String activeVariantName,
    String selectionColor,
  ) async {
    final minOrderQuantity = getMinOrderQuantity(product, activeVariantName);
    final quantityStep = getCartAdjustStep(product, activeVariantName);
    final line = _resolveCartLine(product, activeVariantName, selectionColor);

    if (line != null) {
      final nextQty = getDecreasedCartQuantityForProduct(
        product,
        line.quantity,
        line.variantName,
      );
      if (nextQty <= 0) {
        await ref.read(cartControllerProvider.notifier).removeFromCartLine(
              productId: line.id,
              variantName: line.variantName,
              colorName: line.colorName,
            );
      } else {
        final ok = await ref
            .read(cartControllerProvider.notifier)
            .updateCartLineQuantity(
              productId: line.id,
              quantity: nextQty,
              variantName: line.variantName,
              colorName: line.colorName,
            );
        if (!ok) {
          _showQuantityMessage(
            ref.read(cartControllerProvider).errorMessage ??
                'Could not update quantity',
          );
        }
      }
      return;
    }

    setState(() {
      _quantity = (_quantity - quantityStep).clamp(minOrderQuantity, _quantity);
    });
  }

  Future<void> _handleQuantityIncrease(
    Product product,
    String activeVariantName,
    String selectionColor,
  ) async {
    final minOrderQuantity = getMinOrderQuantity(product, activeVariantName);
    final quantityStep = getCartAdjustStep(product, activeVariantName);
    final maxQuantity = getMaxOrderQuantity(product, activeVariantName);
    var line = _resolveCartLine(product, activeVariantName, selectionColor);

    if (line != null) {
      final nextQty = getNextCartQuantityForProduct(
        product,
        line.quantity,
        line.variantName,
      );
      if (nextQty <= line.quantity) {
        _showQuantityMessage(
          maxQuantity <= line.quantity
              ? 'Maximum $maxQuantity units available'
              : 'Cannot increase quantity further',
        );
        return;
      }

      final ok = await ref
          .read(cartControllerProvider.notifier)
          .updateCartLineQuantity(
            productId: line.id,
            quantity: nextQty,
            variantName: line.variantName,
            colorName: line.colorName,
          );
      if (!ok) {
        _showQuantityMessage(
          ref.read(cartControllerProvider).errorMessage ??
              'Could not update quantity',
        );
      }
      return;
    }

    await ref.read(cartControllerProvider.notifier).loadCart(silent: true);
    line = _resolveCartLine(product, activeVariantName, selectionColor);
    if (line != null) {
      await _handleQuantityIncrease(
        product,
        activeVariantName,
        selectionColor,
      );
      return;
    }

    setState(() {
      _quantity =
          (_quantity + quantityStep).clamp(minOrderQuantity, maxQuantity);
    });
  }

  Future<void> _addToCart(
    Product product,
    String activeVariantName,
    String selectionColor,
    BuildContext flySourceContext,
  ) async {
    final availableColors = getAvailableColors(product, activeVariantName);
    if (availableColors.isNotEmpty && selectionColor.isEmpty) return;

    final existingLine = findCartLineForProductDetail(
      ref.read(cartControllerProvider).items,
      product,
      activeVariantName,
      selectionColor,
    );
    if (existingLine != null) {
      await _handleQuantityIncrease(
        product,
        activeVariantName,
        selectionColor,
      );
      return;
    }

    final result = await ref.read(cartControllerProvider.notifier).addToCart(
          product,
          _quantity,
          variantName: activeVariantName,
          colorName: selectionColor,
          flySourceContext: flySourceContext,
        );
    if (result == AddToCartResult.requiresLogin && mounted) {
      ref.read(authControllerProvider.notifier).openAuthModal();
    } else if (result == AddToCartResult.success) {
      setState(() => _quantitySyncedKey = null);
    }
  }
}

// ---------------------------------------------------------------------------
// Bottom Sheet Modal ("View product details >") - Image 3 Layout
// ---------------------------------------------------------------------------

class _ProductDetailsSheet extends ConsumerWidget {
  const _ProductDetailsSheet({
    required this.productId,
    required this.initialActiveVariantName,
    required this.onAddToCart,
    required this.onQuantityDecrease,
    required this.onQuantityIncrease,
  });

  final String productId;
  final String initialActiveVariantName;
  final Future<void> Function(
    Product product,
    String activeVariantName,
    String selectionColor,
    BuildContext flySourceContext,
  ) onAddToCart;
  final Future<void> Function(
    Product product,
    String activeVariantName,
    String selectionColor,
  ) onQuantityDecrease;
  final Future<void> Function(
    Product product,
    String activeVariantName,
    String selectionColor,
  ) onQuantityIncrease;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productAsync = ref.watch(productDetailProvider(productId));

    return productAsync.when(
      loading: () => const SizedBox(
        height: 300,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (_, _) => const SizedBox.shrink(),
      data: (product) => _buildSheetBody(context, ref, product),
    );
  }

  Widget _buildSheetBody(BuildContext context, WidgetRef ref, Product product) {
    final activeVariantName =
        resolveActiveVariantName(product, initialActiveVariantName);
    final selectionColor =
        resolveSelectionColor(product, activeVariantName, '');
    final cartKey = ProductDetailCartKey(
      productId: product.id,
      variantName: activeVariantName,
      colorName: selectionColor,
    );

    final cartLineQuantity =
        ref.watch(productDetailCartQuantityProvider(cartKey));
    final inCart = cartLineQuantity != null;
    final inStock = isProductInStock(product, activeVariantName);
    final minOrderQuantity = getMinOrderQuantity(product, activeVariantName);
    final maxQuantity = getMaxOrderQuantity(product, activeVariantName);

    double currentPrice = product.effectivePrice;
    double mrpPrice = product.price;
    int discountPercent = product.discountedPercent.round();

    if (isMultiVariant(product)) {
      final v = getVariant(product, activeVariantName);
      if (v != null) {
        currentPrice = v.discountedPrice > 0 ? v.discountedPrice : v.price;
        mrpPrice = v.price;
        if (v.discountedPrice > 0 && v.price > v.discountedPrice) {
          discountPercent =
              ((v.price - v.discountedPrice) / v.price * 100).round();
        } else {
          discountPercent = 0;
        }
      }
    }

    final hasDiscount = mrpPrice > currentPrice && discountPercent > 0;
    final displayUnit = activeVariantName.isNotEmpty
        ? activeVariantName
        : (product.weightUnit.isNotEmpty ? product.weightUnit : '1 unit');

    final highlights = _extractHighlights(product);
    final keyInfoItems = <_DetailRowItem>[];
    final nutritionalItems = <_DetailRowItem>[];

    for (final spec in product.specifications) {
      final name = spec.name.trim();
      final val = spec.value.trim();
      if (name.isEmpty || val.isEmpty) continue;
      if (_isNutritionalSpec(name)) {
        nutritionalItems.add(_DetailRowItem(label: name, value: val));
      } else {
        keyInfoItems.add(_DetailRowItem(label: name, value: val));
      }
    }

    // Backend metadata rows (only if available)
    if (product.brandName.trim().isNotEmpty &&
        !keyInfoItems.any((i) => i.label.toLowerCase() == 'brand')) {
      keyInfoItems.add(
          _DetailRowItem(label: 'Brand', value: product.brandName.trim()));
    }
    if (product.categories.isNotEmpty &&
        !keyInfoItems.any((i) => i.label.toLowerCase() == 'category')) {
      keyInfoItems.add(_DetailRowItem(
          label: 'Category', value: product.categories.join(', ')));
    }
    if (product.subcategory.trim().isNotEmpty &&
        !keyInfoItems.any((i) => i.label.toLowerCase() == 'subcategory')) {
      keyInfoItems.add(_DetailRowItem(
          label: 'Subcategory', value: product.subcategory.trim()));
    }
    if (product.warranty.trim().isNotEmpty &&
        !keyInfoItems.any((i) =>
            i.label.toLowerCase().contains('warranty') ||
            i.label.toLowerCase().contains('replacement'))) {
      keyInfoItems.add(_DetailRowItem(
          label: 'Return / Replacement', value: product.warranty.trim()));
    }

    final hasDescription = product.description.trim().isNotEmpty;
    final hasFeatures = product.features.isNotEmpty;

    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Circular 'X' close button above modal (as shown in Image 3)
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              width: 36,
              height: 36,
              margin: const EdgeInsets.only(bottom: 12),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xCC000000),
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 20),
            ),
          ),

          // Modal Sheet Card
          Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.sizeOf(context).height * 0.82,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              children: [
                // Modal Header: Product Thumbnail + Title
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
                  child: Row(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFE5E7EB)),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: product.primaryImage != null
                            ? AppNetworkImage(
                                imageUrl: product.primaryImage!,
                                fit: BoxFit.contain,
                              )
                            : const Icon(Icons.image_outlined,
                                color: AppColors.textMuted),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          product.name,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: Color(0xFFE5E7EB)),

                // Scrollable Content: Highlights & All details
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Highlights Section
                      if (highlights.isNotEmpty) ...[
                        const Text(
                          'Highlights',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: highlights.map((h) {
                            return Container(
                              constraints: const BoxConstraints(minWidth: 110),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    h.label,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    h.value,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // All Details Section
                      if (keyInfoItems.isNotEmpty ||
                          nutritionalItems.isNotEmpty ||
                          hasDescription ||
                          hasFeatures) ...[
                        const Text(
                          'All details',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Key Information Card
                        if (keyInfoItems.isNotEmpty)
                          _ExpandableDetailCard(
                            title: 'Key Information',
                            initiallyExpanded: true,
                            child: _buildDetailRows(keyInfoItems),
                          ),

                        // Nutritional Information Card
                        if (nutritionalItems.isNotEmpty)
                          _ExpandableDetailCard(
                            title: 'Nutritional Information',
                            initiallyExpanded: true,
                            child: _buildDetailRows(nutritionalItems),
                          ),

                        // Description Card (Only if backend description exists)
                        if (hasDescription)
                          _ExpandableDetailCard(
                            title: 'Description',
                            initiallyExpanded: false,
                            child: Text(
                              product.description.trim(),
                              style: const TextStyle(
                                fontSize: 13,
                                height: 1.5,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),

                        // Features Card (Only if backend features exist)
                        if (hasFeatures)
                          _ExpandableDetailCard(
                            title: 'Features',
                            initiallyExpanded: false,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: product.features
                                  .where((f) => f.trim().isNotEmpty)
                                  .map(
                                    (feature) => Padding(
                                      padding:
                                          const EdgeInsets.only(bottom: 6),
                                      child: Row(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          const Text('• ',
                                              style: TextStyle(
                                                  fontWeight: FontWeight.bold)),
                                          Expanded(
                                            child: Text(
                                              feature.trim(),
                                              style: const TextStyle(
                                                fontSize: 13,
                                                height: 1.4,
                                                color: AppColors.textPrimary,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ),
                          ),
                      ],
                    ],
                  ),
                ),

                // Sticky Bottom Bar inside Bottom Sheet
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              displayUnit,
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Text(
                                  formatInr(currentPrice),
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                if (hasDiscount) ...[
                                  const SizedBox(width: 6),
                                  Text(
                                    'MRP ${formatInr(mrpPrice)}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textMuted,
                                      decoration: TextDecoration.lineThrough,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const Text(
                              'Inclusive of all taxes',
                              style: TextStyle(
                                fontSize: 10,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(
                        height: 44,
                        child: inCart
                            ? _CartActionQuantity(
                                quantity: cartLineQuantity,
                                min: minOrderQuantity,
                                max: maxQuantity,
                                disabled: !inStock,
                                onDecrease: () => onQuantityDecrease(
                                  product,
                                  activeVariantName,
                                  selectionColor,
                                ),
                                onIncrease: () => onQuantityIncrease(
                                  product,
                                  activeVariantName,
                                  selectionColor,
                                ),
                              )
                            : ElevatedButton(
                                onPressed: inStock
                                    ? () => onAddToCart(
                                          product,
                                          activeVariantName,
                                          selectionColor,
                                          context,
                                        )
                                    : null,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF1B7E34),
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 24),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: Text(
                                  inStock ? 'Add to cart' : 'Out of Stock',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Expandable Detail Card (Accordion)
// ---------------------------------------------------------------------------

class _ExpandableDetailCard extends StatefulWidget {
  const _ExpandableDetailCard({
    required this.title,
    required this.child,
    this.initiallyExpanded = true,
  });

  final String title;
  final Widget child;
  final bool initiallyExpanded;

  @override
  State<_ExpandableDetailCard> createState() => _ExpandableDetailCardState();
}

class _ExpandableDetailCardState extends State<_ExpandableDetailCard> {
  late bool _expanded;

  @override
  void initState() {
    super.initState();
    _expanded = widget.initiallyExpanded;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    widget.title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Icon(
                    _expanded
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    color: const Color(0xFF6B7280),
                  ),
                ],
              ),
            ),
          ),
          if (_expanded) ...[
            const Divider(height: 1, color: Color(0xFFE5E7EB)),
            Padding(
              padding: const EdgeInsets.all(14),
              child: widget.child,
            ),
          ],
        ],
      ),
    );
  }
}

class _DetailRowItem {
  const _DetailRowItem({required this.label, required this.value});
  final String label;
  final String value;
}

Widget _buildDetailRows(List<_DetailRowItem> items) {
  return Column(
    children: items.map((item) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 140,
              child: Text(
                item.label,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.3,
                ),
              ),
            ),
            Expanded(
              child: Text(
                item.value,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                  height: 1.3,
                ),
              ),
            ),
          ],
        ),
      );
    }).toList(),
  );
}

class _HighlightChipItem {
  const _HighlightChipItem({required this.label, required this.value});
  final String label;
  final String value;
}

bool _isNutritionalSpec(String name) {
  final lower = name.toLowerCase();
  return lower.contains('nutri') ||
      lower.contains('protein') ||
      lower.contains('carb') ||
      lower.contains('calorie') ||
      lower.contains('fat') ||
      lower.contains('sugar') ||
      lower.contains('energy') ||
      lower.contains('sodium') ||
      lower.contains('fiber') ||
      lower.contains('cholesterol');
}

bool _isHighlightSpec(String name) {
  final lower = name.toLowerCase();
  return lower.contains('shelf') ||
      lower.contains('life') ||
      lower.contains('type') ||
      lower.contains('form') ||
      lower.contains('diet') ||
      lower.contains('origin');
}

List<_HighlightChipItem> _extractHighlights(Product product) {
  final chips = <_HighlightChipItem>[];

  for (final spec in product.specifications) {
    final name = spec.name.trim();
    final val = spec.value.trim();
    if (name.isEmpty || val.isEmpty) continue;
    if (_isHighlightSpec(name)) {
      chips.add(_HighlightChipItem(label: name, value: val));
    }
  }

  if (chips.indexWhere((c) => c.label.toLowerCase().contains('type')) == -1 &&
      product.subcategory.trim().isNotEmpty) {
    chips.add(_HighlightChipItem(
      label: 'Type',
      value: product.subcategory.trim(),
    ));
  }

  if (chips.length < 2) {
    for (final spec in product.specifications) {
      final name = spec.name.trim();
      final val = spec.value.trim();
      if (name.isEmpty || val.isEmpty) continue;
      if (!_isNutritionalSpec(name) &&
          !chips.any((c) => c.label.toLowerCase() == name.toLowerCase())) {
        chips.add(_HighlightChipItem(label: name, value: val));
        if (chips.length >= 2) break;
      }
    }
  }

  if (chips.length < 2 && product.categories.isNotEmpty) {
    chips.add(_HighlightChipItem(
      label: 'Category',
      value: product.categories.first.trim(),
    ));
  }

  return chips;
}

String? _calculatePerUnitPrice(double price, String unit) {
  final match = RegExp(
          r'^(\d+(?:\.\d+)?)\s*(kg|g|l|ml|ltr|pc|piece)s?$',
          caseSensitive: false)
      .firstMatch(unit.trim());
  if (match == null) return null;
  final qty = double.tryParse(match.group(1) ?? '');
  final u = match.group(2)?.toLowerCase() ?? '';
  if (qty == null || qty <= 0) return null;

  if (u == 'kg' || u == 'l' || u == 'ltr') {
    final perUnit = price / qty;
    return '₹${perUnit.toStringAsFixed(perUnit.truncateToDouble() == perUnit ? 0 : 1)}/${u == 'ltr' ? 'l' : u}';
  } else if (u == 'g' && qty >= 50) {
    final perKg = (price / qty) * 1000;
    return '₹${perKg.toStringAsFixed(perKg.truncateToDouble() == perKg ? 0 : 1)}/kg';
  } else if (u == 'ml' && qty >= 50) {
    final perL = (price / qty) * 1000;
    return '₹${perL.toStringAsFixed(perL.truncateToDouble() == perL ? 0 : 1)}/l';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sticky Bottom Bar
// ---------------------------------------------------------------------------

class _ProductDetailBottomBar extends ConsumerWidget {
  const _ProductDetailBottomBar({
    required this.product,
    required this.cartKey,
    required this.activeVariantName,
    required this.selectionColor,
    required this.inStock,
    required this.minOrderQuantity,
    required this.maxQuantity,
    required this.currentPrice,
    required this.mrpPrice,
    required this.hasDiscount,
    required this.displayUnit,
    required this.onAddToCart,
    required this.onQuantityDecrease,
    required this.onQuantityIncrease,
  });

  final Product product;
  final ProductDetailCartKey cartKey;
  final String activeVariantName;
  final String selectionColor;
  final bool inStock;
  final int minOrderQuantity;
  final int maxQuantity;
  final double currentPrice;
  final double mrpPrice;
  final bool hasDiscount;
  final String displayUnit;
  final Future<void> Function(
    Product product,
    String activeVariantName,
    String selectionColor,
    BuildContext flySourceContext,
  ) onAddToCart;
  final Future<void> Function(
    Product product,
    String activeVariantName,
    String selectionColor,
  ) onQuantityDecrease;
  final Future<void> Function(
    Product product,
    String activeVariantName,
    String selectionColor,
  ) onQuantityIncrease;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartLineQuantity =
        ref.watch(productDetailCartQuantityProvider(cartKey));
    final inCart = cartLineQuantity != null;
    final bottomInset = MediaQuery.paddingOf(context).bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 14 + bottomInset),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  displayUnit,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      formatInr(currentPrice),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (hasDiscount) ...[
                      const SizedBox(width: 6),
                      Text(
                        'MRP ${formatInr(mrpPrice)}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                    ],
                  ],
                ),
                const Text(
                  'Inclusive of all taxes',
                  style: TextStyle(
                    fontSize: 10,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 44,
            child: inCart
                ? _CartActionQuantity(
                    quantity: cartLineQuantity,
                    min: minOrderQuantity,
                    max: maxQuantity,
                    disabled: !inStock,
                    onDecrease: () => onQuantityDecrease(
                      product,
                      activeVariantName,
                      selectionColor,
                    ),
                    onIncrease: () => onQuantityIncrease(
                      product,
                      activeVariantName,
                      selectionColor,
                    ),
                  )
                : ElevatedButton(
                    onPressed: inStock
                        ? () => onAddToCart(
                              product,
                              activeVariantName,
                              selectionColor,
                              context,
                            )
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1B7E34),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      inStock ? 'Add to cart' : 'Out of Stock',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Quick Commerce Stepper
// ---------------------------------------------------------------------------

class _CartActionQuantity extends StatelessWidget {
  const _CartActionQuantity({
    required this.quantity,
    required this.min,
    required this.max,
    required this.disabled,
    required this.onDecrease,
    required this.onIncrease,
  });

  final int quantity;
  final int min;
  final int max;
  final bool disabled;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: const Color(0xFF1B7E34),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          InkWell(
            onTap: disabled ? null : onDecrease,
            borderRadius:
                const BorderRadius.horizontal(left: Radius.circular(8)),
            child: const SizedBox(
              width: 34,
              height: 44,
              child: Center(
                child: Icon(Icons.remove, color: Colors.white, size: 20),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              '$quantity',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
          ),
          InkWell(
            onTap: disabled || quantity >= max ? null : onIncrease,
            borderRadius:
                const BorderRadius.horizontal(right: Radius.circular(8)),
            child: SizedBox(
              width: 34,
              height: 44,
              child: Center(
                child: Icon(
                  Icons.add,
                  color: disabled || quantity >= max
                      ? Colors.white54
                      : Colors.white,
                  size: 20,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Product Image Gallery with Dots
// ---------------------------------------------------------------------------

class _ProductImageGallery extends StatefulWidget {
  const _ProductImageGallery({
    required this.images,
    required this.product,
    required this.videoUrl,
  });

  final List<String> images;
  final Product product;
  final String videoUrl;

  @override
  State<_ProductImageGallery> createState() => _ProductImageGalleryState();
}

class _GalleryItem {
  const _GalleryItem({required this.type, required this.url});

  final String type;
  final String url;
}

class _ProductImageGalleryState extends State<_ProductImageGallery> {
  int _activeMedia = 0;
  late final PageController _pageController;

  List<_GalleryItem> get _items {
    final items = widget.images
        .map((url) => _GalleryItem(type: 'image', url: url))
        .toList();
    final video = widget.videoUrl.trim();
    if (video.isNotEmpty) {
      items.add(_GalleryItem(type: 'video', url: video));
    }
    return items;
  }

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;

    return Column(
      children: [
        Stack(
          children: [
            Container(
              height: 290,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              clipBehavior: Clip.antiAlias,
              child: items.isEmpty
                  ? const Icon(Icons.image_outlined,
                      size: 64, color: AppColors.textMuted)
                  : PageView.builder(
                      controller: _pageController,
                      itemCount: items.length,
                      onPageChanged: (index) =>
                          setState(() => _activeMedia = index),
                      itemBuilder: (context, index) {
                        final item = items[index];
                        if (item.type == 'video') {
                          return ProductVideoPlayer(
                              url: item.url, embedded: true);
                        }
                        return AppNetworkImage(
                          imageUrl: item.url,
                          fit: BoxFit.contain,
                          cacheWidth: 600,
                          cacheHeight: 600,
                          errorIcon: Icons.image_outlined,
                          errorIconSize: 64,
                        );
                      },
                    ),
            ),

            // Delivery Chip: "⏱ 10 MINS"
            Positioned(
              left: 10,
              bottom: 10,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 7, vertical: 3.5),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.65),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.timer_outlined, color: Colors.white, size: 12),
                    SizedBox(width: 4),
                    Text(
                      '10 MINS',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Download Image Button
            if (items.isNotEmpty && items[_activeMedia.clamp(0, items.length - 1)].type != 'video')
              Positioned(
                right: 8,
                bottom: 8,
                child: _GalleryDownloadButton(
                  imageUrl: items[_activeMedia.clamp(0, items.length - 1)].url,
                  productId: widget.product.id,
                ),
              ),
          ],
        ),

        // Carousel Dot Indicators
        if (items.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(items.length, (index) {
              final isSelected = index == _activeMedia;
              return Container(
                width: isSelected ? 16 : 6,
                height: 6,
                margin: const EdgeInsets.symmetric(horizontal: 2.5),
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF1B7E34)
                      : const Color(0xFFD1D5DB),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
        ],
      ],
    );
  }
}

class _GalleryDownloadButton extends StatefulWidget {
  const _GalleryDownloadButton({
    required this.imageUrl,
    required this.productId,
  });

  final String imageUrl;
  final String productId;

  @override
  State<_GalleryDownloadButton> createState() => _GalleryDownloadButtonState();
}

class _GalleryDownloadButtonState extends State<_GalleryDownloadButton> {
  bool _saving = false;

  Future<void> _download() async {
    if (_saving) return;
    setState(() => _saving = true);

    final result = await saveProductImageToGallery(
      imageUrl: widget.imageUrl,
      productId: widget.productId,
    );

    if (!mounted) return;
    setState(() => _saving = false);

    final messenger = ScaffoldMessenger.of(context);
    if (result.success) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Image saved to gallery')),
      );
      return;
    }

    messenger.showSnackBar(
      SnackBar(content: Text(result.message ?? 'Could not save image.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.92),
      shape: const CircleBorder(),
      elevation: 1,
      child: InkWell(
        onTap: _saving ? null : _download,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 32,
          height: 32,
          child: _saving
              ? const Padding(
                  padding: EdgeInsets.all(8),
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(
                  Icons.download_rounded,
                  size: 18,
                  color: AppColors.textPrimary,
                ),
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Product not found.'),
          const SizedBox(height: 12),
          TextButton(onPressed: onBack, child: const Text('Back to products')),
        ],
      ),
    );
  }
}
