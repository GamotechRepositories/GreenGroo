import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/image_gallery_save.dart';
import '../../core/utils/product_description_display.dart';
import '../../core/utils/product_pricing.dart';
import '../../core/utils/product_utils.dart';
import '../../core/utils/recently_viewed.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../models/cart_item.dart';
import '../../features/home/home_providers.dart';
import '../../features/product/product_providers.dart';
import 'widgets/similar_products_section.dart';
import '../../models/product.dart';
import '../../models/brand.dart';
import '../../models/product_pricing_models.dart';
import '../../routes/route_paths.dart';
import '../../widgets/common/app_network_image.dart';
import '../../widgets/common/skeleton_loaders.dart';
import '../../widgets/product/product_price_display.dart';
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

/// Rebuilds only when this product variant's cart quantity changes.
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
  String _activeTab = 'description';
  String _selectedVariant = '';
  String _selectedColor = '';
  String? _quantitySyncedKey;
  Timer? _recentlyViewedDebounce;

  static const _tabs = [
    _DetailTab(id: 'description', label: 'Description'),
    _DetailTab(id: 'specifications', label: 'Specifications'),
    _DetailTab(id: 'reviews', label: 'Reviews'),
    _DetailTab(id: 'shipping', label: 'Shipping'),
  ];

  @override
  void didUpdateWidget(covariant ProductDetailScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.productId != widget.productId) {
      _quantitySyncedKey = null;
      _selectedVariant = '';
      _selectedColor = '';
      _quantity = defaultSingleMoq;
      _activeTab = 'description';
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

    final activeVariant =
        resolveActiveVariantName(product, _selectedVariant);
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

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.canPop() ? context.pop() : context.go(RoutePaths.home),
        ),
        title: const Text('Product Details'),
      ),
      body: productAsync.when(
        loading: () => const SkeletonProductDetail(),
        error: (_, _) => _ErrorView(onBack: () => context.go(RoutePaths.product)),
        data: (product) => _buildContent(context, product),
      ),
    );
  }

  Widget _buildContent(BuildContext context, Product product) {
    final activeVariantName = resolveActiveVariantName(product, _selectedVariant);
    final selectionColor =
        resolveSelectionColor(product, activeVariantName, _selectedColor);
    final cartKey = ProductDetailCartKey(
      productId: product.id,
      variantName: activeVariantName,
      colorName: selectionColor,
    );

    ref.listen<int?>(productDetailCartQuantityProvider(cartKey), (previous, next) {
      _syncQuantityForProduct(product, activeVariantName, next);
    });

    final variantStock = getVariantStock(product, activeVariantName);
    final inStock = variantStock > 0;
    final minOrderQuantity = getMinOrderQuantity(product, activeVariantName);
    final quantityStep = getCartAdjustStep(product, activeVariantName);
    final showMoq = hasConfiguredMinOrderQuantity(product, activeVariantName);
    final showStepByQty = hasConfiguredQuantityStep(product, activeVariantName);
    final maxQuantity = getMaxOrderQuantity(product, activeVariantName);
    final currentUnitPrice =
        getUnitPriceForQuantity(product, _quantity, activeVariantName);
    final bulkTiers = getBulkTierRows(product, activeVariantName);
    final showBulkSection = isBulkPricing(product, activeVariantName);
    final isLoggedIn = ref.watch(authControllerProvider.select((s) => s.isLoggedIn));
    final brands = ref.watch(brandsProvider).valueOrNull ?? const <Brand>[];
    final canViewPrice =
        isLoggedIn || !brandRequiresLoginForPrice(brands, product.brandName);
    final images = product.productImages
        .where((image) => image.trim().isNotEmpty)
        .toList();
    final rating = product.ratings > 0 ? product.ratings : 4.5;
    final availableColors = getAvailableColors(product, activeVariantName);
    final specifications = getResolvedSpecifications(product);

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            cacheExtent: AppScrollConfig.cacheExtent,
            children: [
              _ProductImageGallery(
                images: images,
                product: product,
                videoUrl: product.videoUrl,
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product.name,
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          productSku(product),
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => showProductShareSheet(
                      context,
                      product,
                      variantName: activeVariantName,
                    ),
                    icon: const Icon(Icons.share_outlined),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  ...List.generate(5, (index) => Icon(
                        index < rating.floor() ? Icons.star : Icons.star_border,
                        color: AppColors.primary,
                        size: 18,
                      )),
                  const SizedBox(width: 8),
                  Text(
                    '${rating.toStringAsFixed(1)} ($defaultReviewCount)',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ProductPriceDisplay(
                product: product,
                variantName: activeVariantName,
                quantity: _quantity,
                size: ProductPriceSize.lg,
              ),
              if (isMultiVariant(product)) ...[
                const SizedBox(height: 16),
                const Text(
                  'Select variant',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: product.variants.map((variant) {
                    final isActive = activeVariantName == variant.name;
                    return ChoiceChip(
                      label: Text(variant.name),
                      selected: isActive,
                      onSelected: (_) => _handleVariantChange(product, variant.name),
                      selectedColor: AppColors.primary,
                      labelStyle: TextStyle(
                        color: isActive ? Colors.white : AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    );
                  }).toList(),
                ),
              ],
              if (availableColors.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text(
                  'Select color',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: availableColors
                      .map(
                        (color) => ChoiceChip(
                          label: Text(color.name),
                          selected: _selectedColor == color.name,
                          onSelected: (_) => setState(() {
                            _selectedColor = color.name;
                            _quantitySyncedKey = null;
                          }),
                          selectedColor: AppColors.primary.withValues(alpha: 0.12),
                          backgroundColor: AppColors.mobileSurface,
                          labelStyle: TextStyle(
                            color: _selectedColor == color.name
                                ? AppColors.primary
                                : AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
              if (canViewPrice && showBulkSection)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(
                    'Current selection: ${formatInr(currentUnitPrice, withDecimals: true)} / piece',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              if (showMoq || showStepByQty || isMultiVariant(product))
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          [
                            if (showMoq) 'MOQ: $minOrderQuantity Pieces',
                            if (showStepByQty) 'Step by QTY: $quantityStep Pieces',
                            if (isMultiVariant(product))
                              isProductInStock(product, activeVariantName)
                                  ? 'In Stock'
                                  : 'Out of Stock',
                          ].join(' · '),
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Purchased ${product.purchaseCount} times',
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              Consumer(
                builder: (context, ref, _) {
                  final inCart =
                      ref.watch(productDetailCartQuantityProvider(cartKey)) != null;
                  if (inCart) return const SizedBox.shrink();
                  return Column(
                    children: [
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Quantity (Pieces)',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          _QuantitySelector(
                            quantity: _quantity,
                            min: minOrderQuantity,
                            max: maxQuantity,
                            disabled: !inStock,
                            onDecrease: () => _handleQuantityDecrease(
                              product,
                              activeVariantName,
                              selectionColor,
                            ),
                            onIncrease: () => _handleQuantityIncrease(
                              product,
                              activeVariantName,
                              selectionColor,
                            ),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              ),
              if (canViewPrice && bulkTiers.isNotEmpty) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.borderLight),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Bulk Price (Per Piece)',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      ...bulkTiers.map(
                        (tier) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(child: Text(tier.qtyLabel)),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (tier.hasDiscount && tier.originalPrice != null) ...[
                                    Text(
                                      formatInr(tier.originalPrice!, withDecimals: true),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textMuted,
                                        decoration: TextDecoration.lineThrough,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                  ],
                                  Text(
                                    formatInr(tier.price, withDecimals: true),
                                    style: const TextStyle(fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              const Divider(height: 1, color: AppColors.borderLight),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _tabs.map((tab) {
                    final selected = _activeTab == tab.id;
                    final label = tab.id == 'reviews'
                        ? 'Reviews ($defaultReviewCount)'
                        : tab.label;
                    return Padding(
                      padding: const EdgeInsets.only(right: 20),
                      child: InkWell(
                        onTap: () => setState(() => _activeTab = tab.id),
                        child: Container(
                          padding: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(
                                color: selected ? AppColors.primary : Colors.transparent,
                                width: 2,
                              ),
                            ),
                          ),
                          child: Text(
                            label,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              color: selected
                                  ? AppColors.primary
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 16),
              _buildTabContent(product, rating, specifications),
              const SizedBox(height: 24),
              SimilarProductsSection(
                productId: product.id,
                categoryName: product.categories.isNotEmpty
                    ? product.categories.first
                    : product.subcategory,
              ),
              const SizedBox(height: 100),
            ],
          ),
        ),
        _ProductDetailBottomBar(
          product: product,
          cartKey: cartKey,
          activeVariantName: activeVariantName,
          selectionColor: selectionColor,
          inStock: inStock,
          minOrderQuantity: minOrderQuantity,
          maxQuantity: maxQuantity,
          onAddToCart: _addToCart,
          onQuantityDecrease: _handleQuantityDecrease,
          onQuantityIncrease: _handleQuantityIncrease,
        ),
      ],
    );
  }

  Widget _buildTabContent(
    Product product,
    double rating,
    List<ProductSpecification> specifications,
  ) {
    switch (_activeTab) {
      case 'specifications':
        if (specifications.isEmpty) {
          return const Text(
            'No specifications added.',
            style: TextStyle(color: AppColors.textSecondary, height: 1.5),
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: specifications
              .map(
                (spec) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        height: 1.5,
                        fontSize: 14,
                      ),
                      children: [
                        TextSpan(
                          text: '${spec.name}: ',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        TextSpan(text: spec.value),
                      ],
                    ),
                  ),
                ),
              )
              .toList(),
        );
      case 'reviews':
        return Text(
          'Rated ${rating.toStringAsFixed(1)} out of 5 based on $defaultReviewCount dealer reviews.',
          style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
        );
      case 'shipping':
        return const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Pan-India delivery available for bulk orders.',
              style: TextStyle(color: AppColors.textPrimary, height: 1.5),
            ),
            SizedBox(height: 8),
            Text(
              'GST invoice provided with every order.',
              style: TextStyle(color: AppColors.textPrimary, height: 1.5),
            ),
            SizedBox(height: 8),
            Text(
              'Standard delivery: 3–7 business days across major cities.',
              style: TextStyle(color: AppColors.textPrimary, height: 1.5),
            ),
          ],
        );
      case 'description':
      default:
        final fallback =
            '${product.name} supports fast charging for all devices. Safe, reliable & high performance with premium build quality.';
        final parsed = parseProductDescription(
          product.description.trim().isNotEmpty ? product.description : fallback,
        );
        final extraFeatures = product.features
            .map((feature) => feature.trim())
            .where((feature) => feature.isNotEmpty)
            .toList();
        final descriptionBullets = parsed?.bullets ?? const <String>[];
        final bullets = [...descriptionBullets, ...extraFeatures];
        final paragraphs = parsed?.paragraphs.isNotEmpty == true
            ? parsed!.paragraphs
            : <String>[fallback];
        final showKeyFeaturesHeading = parsed?.hasKeyFeaturesHeading == true ||
            (descriptionBullets.isNotEmpty && bullets.isNotEmpty);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ...paragraphs.map(
              (paragraph) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  paragraph,
                  style: const TextStyle(color: AppColors.textPrimary, height: 1.5),
                ),
              ),
            ),
            if (bullets.isNotEmpty) ...[
              if (showKeyFeaturesHeading)
                const Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: Text(
                    'Key Features',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                      height: 1.5,
                    ),
                  ),
                ),
              ...bullets.map(
                (feature) => Padding(
                  padding: const EdgeInsets.only(bottom: 6, left: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• ', style: TextStyle(fontWeight: FontWeight.w700)),
                      Expanded(child: Text(feature)),
                    ],
                  ),
                ),
              ),
            ],
          ],
        );
    }
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

    // Cart may be stale — refresh once then retry.
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
      _quantity = (_quantity + quantityStep).clamp(minOrderQuantity, maxQuantity);
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

class _ProductDetailBottomBar extends ConsumerWidget {
  const _ProductDetailBottomBar({
    required this.product,
    required this.cartKey,
    required this.activeVariantName,
    required this.selectionColor,
    required this.inStock,
    required this.minOrderQuantity,
    required this.maxQuantity,
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
    final cartLineQuantity = ref.watch(productDetailCartQuantityProvider(cartKey));
    final inCart = cartLineQuantity != null;
    final bottomInset = MediaQuery.paddingOf(context).bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 16 + bottomInset),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.borderLight)),
      ),
      child: Row(
        children: [
          Expanded(
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
                : Builder(
                    builder: (btnContext) => ElevatedButton(
                      onPressed: inStock
                          ? () => onAddToCart(
                                product,
                                activeVariantName,
                                selectionColor,
                                btnContext,
                              )
                          : null,
                      child: const Text('Add to Cart'),
                    ),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: OutlinedButton(
              onPressed: () => showProductShareSheet(
                context,
                product,
                variantName: activeVariantName,
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary, width: 2),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text(
                'Share Product',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailTab {
  const _DetailTab({required this.id, required this.label});

  final String id;
  final String label;
}

class _QuantitySelector extends StatelessWidget {
  const _QuantitySelector({
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
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.borderLight),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _qtyButton(onDecrease, disabled || quantity <= min, '−'),
          Container(
            width: 40,
            alignment: Alignment.center,
            child: Text('$quantity', style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
          _qtyButton(onIncrease, disabled || quantity >= max, '+'),
        ],
      ),
    );
  }

  Widget _qtyButton(VoidCallback onTap, bool disabled, String label) {
    return InkWell(
      onTap: disabled ? null : onTap,
      child: SizedBox(
        width: 36,
        height: 36,
        child: Center(child: Text(label, style: const TextStyle(fontSize: 18))),
      ),
    );
  }
}

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
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.primary, width: 2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _actionButton(onDecrease, disabled, '−'),
          Text(
            '$quantity',
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: AppColors.textPrimary,
            ),
          ),
          _actionButton(onIncrease, disabled || quantity >= max, '+'),
        ],
      ),
    );
  }

  Widget _actionButton(VoidCallback onTap, bool isDisabled, String label) {
    return InkWell(
      onTap: isDisabled ? null : onTap,
      borderRadius: BorderRadius.circular(6),
      child: SizedBox(
        width: 36,
        height: 36,
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: isDisabled ? AppColors.textSecondary.withValues(alpha: 0.4) : AppColors.primary,
            ),
          ),
        ),
      ),
    );
  }
}

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
  void didUpdateWidget(covariant _ProductImageGallery oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_activeMedia >= _items.length) {
      _activeMedia = 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;
    final activeItem = items.isEmpty ? null : items[_activeMedia.clamp(0, items.length - 1)];
    final isVideoActive = activeItem?.type == 'video';

    return RepaintBoundary(
      child: Column(
        children: [
          Stack(
            children: [
              Container(
                height: 280,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: isVideoActive ? Colors.black : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderLight),
                ),
                clipBehavior: Clip.antiAlias,
                child: activeItem == null
                    ? const Icon(Icons.image_outlined, size: 64, color: AppColors.textMuted)
                    : isVideoActive
                        ? ProductVideoPlayer(url: activeItem.url, embedded: true)
                        : AppNetworkImage(
                            imageUrl: activeItem.url,
                            fit: BoxFit.contain,
                            cacheWidth: 560,
                            cacheHeight: 560,
                            errorIcon: Icons.image_outlined,
                            errorIconSize: 64,
                          ),
              ),
              Positioned(
                left: 8,
                top: 8,
                child: WishlistButton(product: widget.product, size: 40),
              ),
              if (activeItem != null && !isVideoActive)
                Positioned(
                  right: 8,
                  top: 8,
                  child: _GalleryDownloadButton(
                    imageUrl: activeItem.url,
                    productId: widget.product.id,
                  ),
                ),
            ],
          ),
          if (items.length > 1) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 64,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final item = items[index];
                  final selected = index == _activeMedia;
                  return GestureDetector(
                    onTap: () => setState(() => _activeMedia = index),
                    child: Container(
                      width: 64,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: selected ? AppColors.primary : AppColors.borderLight,
                          width: selected ? 2 : 1,
                        ),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: item.type == 'video'
                          ? ColoredBox(
                              color: Colors.black,
                              child: Icon(
                                Icons.play_arrow_rounded,
                                color: selected ? AppColors.primary : Colors.white,
                                size: 28,
                              ),
                            )
                          : AppNetworkImage(
                              imageUrl: item.url,
                              fit: BoxFit.contain,
                              width: 64,
                              height: 64,
                              cacheWidth: 128,
                              cacheHeight: 128,
                              errorIcon: Icons.image_outlined,
                            ),
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
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
          width: 40,
          height: 40,
          child: _saving
              ? const Padding(
                  padding: EdgeInsets.all(10),
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(
                  Icons.download_rounded,
                  size: 22,
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
