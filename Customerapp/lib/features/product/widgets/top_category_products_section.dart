import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../config/theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/product_pricing.dart';
import '../../../features/auth/auth_controller.dart';
import '../../../features/cart/cart_controller.dart';
import '../../../models/cart_item.dart';
import '../../../models/product.dart';
import '../../../routes/route_paths.dart';
import '../../../widgets/common/app_network_image.dart';
import '../../../widgets/common/skeleton_loaders.dart';
import '../../../widgets/product/wishlist_button.dart';
import '../product_providers.dart';

class TopCategoryProductsSection extends ConsumerWidget {
  const TopCategoryProductsSection({
    super.key,
    required this.product,
    this.sectionTitle,
  });

  final Product product;
  final String? sectionTitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catName = product.categories.isNotEmpty
        ? product.categories.first.trim()
        : product.subcategory.trim();

    final query = catName.isNotEmpty
        ? ProductQuery(categoryName: catName)
        : const ProductQuery(hotSelling: true);

    final categoryAsync = ref.watch(productListProvider(query));

    return categoryAsync.when(
      loading: () => const _TopCategorySkeleton(),
      error: (_, _) => _buildFallback(context, ref, catName),
      data: (products) {
        final filtered =
            products.where((p) => p.id != product.id && p.isActive).toList();
        if (filtered.isNotEmpty) {
          final displayTitle = sectionTitle ??
              (catName.isNotEmpty
                  ? 'Top $catName Products'
                  : 'Top Category Products');
          return _TopCategoryProductsList(
            title: displayTitle,
            categoryName: catName.isNotEmpty ? catName : 'All Products',
            products: filtered,
          );
        }
        return _buildFallback(context, ref, catName);
      },
    );
  }

  Widget _buildFallback(
    BuildContext context,
    WidgetRef ref,
    String primaryCategory,
  ) {
    // Fallback 1: query hot selling or general products
    final fallbackAsync = ref.watch(
      productListProvider(const ProductQuery()),
    );

    return fallbackAsync.when(
      loading: () => const _TopCategorySkeleton(),
      error: (_, _) => const SizedBox.shrink(),
      data: (products) {
        final filtered =
            products.where((p) => p.id != product.id && p.isActive).toList();
        if (filtered.isEmpty) return const SizedBox.shrink();

        final displayTitle = sectionTitle ??
            (primaryCategory.isNotEmpty
                ? 'More in $primaryCategory'
                : 'Top Category Products');

        return _TopCategoryProductsList(
          title: displayTitle,
          categoryName:
              primaryCategory.isNotEmpty ? primaryCategory : 'Products',
          products: filtered.take(10).toList(),
        );
      },
    );
  }
}

class _TopCategoryProductsList extends StatelessWidget {
  const _TopCategoryProductsList({
    required this.title,
    required this.categoryName,
    required this.products,
  });

  final String title;
  final String categoryName;
  final List<Product> products;

  void _navigateToCategory(BuildContext context) {
    if (categoryName.isNotEmpty &&
        categoryName != 'Products' &&
        categoryName != 'All Products') {
      context.push(
        '${RoutePaths.product}?categoryName=${Uri.encodeComponent(categoryName)}',
      );
    } else {
      context.push(RoutePaths.product);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header Row
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    'Explore popular products in $categoryName',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            InkWell(
              onTap: () => _navigateToCategory(context),
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'See all',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF047857),
                      ),
                    ),
                    const SizedBox(width: 2),
                    const Icon(
                      Icons.chevron_right_rounded,
                      size: 18,
                      color: Color(0xFF047857),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // Horizontal Product List with "Show More" Card at the end
        SizedBox(
          height: 245,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.zero,
            itemCount: products.length + 1,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              if (index < products.length) {
                return _TopCategoryProductCard(product: products[index]);
              }
              // Last Item: "Show More" Card
              return _ShowMoreCategoryCard(
                categoryName: categoryName,
                onTap: () => _navigateToCategory(context),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _ShowMoreCategoryCard extends StatelessWidget {
  const _ShowMoreCategoryCard({
    required this.categoryName,
    required this.onTap,
  });

  final String categoryName;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 124,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFBBF7D0)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF047857),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF047857).withValues(alpha: 0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: const Icon(
                Icons.arrow_forward_rounded,
                color: Colors.white,
                size: 22,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Show More',
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF065F46),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'See all in $categoryName',
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF047857),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopCategoryProductCard extends ConsumerWidget {
  const _TopCategoryProductCard({required this.product});

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

  Future<void> _handleIncrease(WidgetRef ref, BuildContext context) async {
    final cartItems = ref.read(cartControllerProvider).items;
    final line = _cartLine(cartItems);
    if (line == null) {
      return _handleAdd(ref, context);
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
    final defaults = resolveCartDefaults(product);
    final inStock = isProductInStock(product, defaults.variantName);

    double currentPrice = product.effectivePrice;
    double mrpPrice = product.price;
    int discountPercent = product.discountedPercent.round();

    if (isMultiVariant(product)) {
      final v = getVariant(product, defaults.variantName);
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
    final displayUnit = defaults.variantName.isNotEmpty
        ? defaults.variantName
        : (product.weightUnit.isNotEmpty ? product.weightUnit : '1 unit');
    final perUnitPrice = _calculatePerUnitPrice(currentPrice, displayUnit);

    final cartQty = ref.watch(cartProductQuantityProvider(product.id));
    final rating = product.ratings > 0 ? product.ratings : 4.5;
    final reviewsCount =
        product.purchaseCount > 0 ? product.purchaseCount : 155;

    final badgeText = product.badge.trim().isNotEmpty
        ? product.badge.trim()
        : (product.subcategory.trim().isNotEmpty
            ? product.subcategory.trim()
            : null);

    return InkWell(
      onTap: () {
        context.push('${RoutePaths.product}/${product.id}');
      },
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        width: 124,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Image Box
            Container(
              height: 114,
              width: 124,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                children: [
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(6),
                      child: product.primaryImage != null
                          ? AppNetworkImage(
                              imageUrl: product.primaryImage!,
                              fit: BoxFit.contain,
                              cacheWidth: 260,
                              cacheHeight: 260,
                            )
                          : const Icon(
                              Icons.image_outlined,
                              color: AppColors.textMuted,
                              size: 40,
                            ),
                    ),
                  ),

                  // Top-Right Wishlist Heart
                  Positioned(
                    top: 4,
                    right: 4,
                    child: WishlistButton(product: product, size: 26),
                  ),

                  // Bottom-Right Green Veg Mark
                  Positioned(
                    bottom: 6,
                    right: 6,
                    child: Container(
                      width: 13,
                      height: 13,
                      decoration: BoxDecoration(
                        border: Border.all(
                            color: const Color(0xFF16A34A), width: 1.2),
                        borderRadius: BorderRadius.circular(3),
                        color: Colors.white,
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.circle,
                        color: Color(0xFF16A34A),
                        size: 6,
                      ),
                    ),
                  ),

                  // Bottom-Left Image Dots
                  if (product.productImages.length > 1)
                    Positioned(
                      bottom: 6,
                      left: 6,
                      child: Row(
                        children: List.generate(
                          product.productImages.length.clamp(1, 3),
                          (i) => Container(
                            width: 4,
                            height: 4,
                            margin: const EdgeInsets.only(right: 2),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: i == 0 ? Colors.black54 : Colors.black26,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 6),

            // Weight & ADD Button Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Text(
                    displayUnit,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                if (!inStock)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'Out',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  )
                else if (cartQty > 0)
                  Container(
                    height: 28,
                    decoration: BoxDecoration(
                      color: const Color(0xFF16A34A),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InkWell(
                          onTap: () => _handleDecrease(ref),
                          child: const Padding(
                            padding: EdgeInsets.symmetric(
                                horizontal: 5, vertical: 4),
                            child: Icon(Icons.remove,
                                size: 14, color: Colors.white),
                          ),
                        ),
                        Text(
                          '$cartQty',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                        InkWell(
                          onTap: () => _handleIncrease(ref, context),
                          child: const Padding(
                            padding: EdgeInsets.symmetric(
                                horizontal: 5, vertical: 4),
                            child:
                                Icon(Icons.add, size: 14, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  InkWell(
                    onTap: () => _handleAdd(ref, context),
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      height: 28,
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                            color: const Color(0xFF16A34A), width: 1.2),
                      ),
                      alignment: Alignment.center,
                      child: product.variants.length > 1
                          ? Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text(
                                  'ADD',
                                  style: TextStyle(
                                    color: Color(0xFF16A34A),
                                    fontWeight: FontWeight.w800,
                                    fontSize: 10,
                                    height: 1.0,
                                  ),
                                ),
                                Text(
                                  '${product.variants.length} options',
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 7.5,
                                    fontWeight: FontWeight.w500,
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            )
                          : const Text(
                              'ADD',
                              style: TextStyle(
                                color: Color(0xFF16A34A),
                                fontWeight: FontWeight.w800,
                                fontSize: 11,
                              ),
                            ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 2),

            // Per-unit price (e.g. ₹43.6/kg)
            if (perUnitPrice != null)
              Text(
                perUnitPrice,
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),

            // Price & MRP
            Row(
              children: [
                Text(
                  formatInr(currentPrice),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (hasDiscount) ...[
                  const SizedBox(width: 4),
                  Text(
                    formatInr(mrpPrice),
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppColors.textMuted,
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
                ],
              ],
            ),

            // Discount Badge (% OFF on MRP)
            if (hasDiscount)
              Text(
                '$discountPercent% OFF on MRP',
                style: const TextStyle(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E5BF8),
                ),
              ),
            const SizedBox(height: 2),

            // Product Name (2 lines)
            Text(
              product.name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 3),

            // Tag / Badge
            if (badgeText != null)
              Container(
                margin: const EdgeInsets.only(bottom: 2),
                padding:
                    const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: const Color(0xFFFEF3C7)),
                ),
                child: Text(
                  badgeText,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 8.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF92400E),
                  ),
                ),
              ),

            // Rating Stars
            Row(
              children: [
                ...List.generate(
                  5,
                  (index) => Icon(
                    index < rating.floor() ? Icons.star : Icons.star_border,
                    size: 10,
                    color: const Color(0xFFF59E0B),
                  ),
                ),
                const SizedBox(width: 3),
                Text(
                  '$reviewsCount',
                  style: const TextStyle(
                    fontSize: 9,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),

            // Stock Indicator (if low stock)
            if (inStock && product.stock > 0 && product.stock <= 5) ...[
              const SizedBox(height: 2),
              Row(
                children: [
                  const Icon(
                    Icons.battery_3_bar_rounded,
                    size: 10,
                    color: Color(0xFFD97706),
                  ),
                  const SizedBox(width: 2),
                  Text(
                    '${product.stock} left',
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFB45309),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _TopCategorySkeleton extends StatelessWidget {
  const _TopCategorySkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const SkeletonBox(width: 160, height: 20, borderRadius: 6),
            const SkeletonBox(width: 60, height: 16, borderRadius: 4),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 245,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.zero,
            itemCount: 4,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (_, _) => const SizedBox(
              width: 124,
              child: SkeletonBox(borderRadius: 12),
            ),
          ),
        ),
      ],
    );
  }
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
