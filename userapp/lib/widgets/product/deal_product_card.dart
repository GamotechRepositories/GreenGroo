import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../core/utils/product_pricing.dart';
import '../../features/cart/cart_controller.dart';
import '../../models/cart_item.dart';
import '../../models/product.dart';
import '../../models/product_pricing_models.dart';
import '../common/app_network_image.dart';
import 'product_price_display.dart';
import 'wishlist_button.dart';

/// Dimensions so every product card is identical in grids and carousels.
class DealProductCardDimensions {
  const DealProductCardDimensions._();

  static const double width = 138;
  static const double height = 203;
  static const double gridChildAspectRatio = 0.62;
  static const double twoColumnChildAspectRatio = 0.66;
  static const double homeDealsGridAspectRatio = 0.62;
}

class DealProductCard extends ConsumerWidget {
  const DealProductCard({
    super.key,
    required this.product,
    required this.onAdd,
    this.flat = false,
    this.fillCell = false,
    this.cartQuantity = 0,
    this.onIncrease,
    this.onDecrease,
  });

  final Product product;
  final void Function(BuildContext context) onAdd;
  final bool flat;
  final bool fillCell;
  final int cartQuantity;
  final VoidCallback? onIncrease;
  final VoidCallback? onDecrease;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final discount = product.discountedPercent > 0
        ? product.discountedPercent.round()
        : (product.price > 0
            ? (((product.price - product.discountedPrice) / product.price) * 100)
                .round()
            : 0);
    final hasVariants = isMultiVariant(product);
    final effectiveCartQuantity = hasVariants
        ? ref.watch(
            cartControllerProvider.select(
              (state) => state.items
                  .where((item) => item.id == product.id)
                  .fold<int>(0, (sum, item) => sum + item.quantity),
            ),
          )
        : cartQuantity;

    if (fillCell) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return SizedBox(
            width: constraints.maxWidth,
            height: constraints.maxHeight,
            child: _buildCardShell(
              context,
              discount,
              ref: ref,
              effectiveCartQuantity: effectiveCartQuantity,
            ),
          );
        },
      );
    }

    return SizedBox(
      width: DealProductCardDimensions.width,
      height: DealProductCardDimensions.height,
      child: _buildCardShell(
        context,
        discount,
        ref: ref,
        effectiveCartQuantity: effectiveCartQuantity,
      ),
    );
  }

  Widget _buildCardShell(
    BuildContext context,
    int discount, {
    required WidgetRef ref,
    required int effectiveCartQuantity,
    EdgeInsets outerPadding = EdgeInsets.zero,
  }) {
    final inStock = product.stock > 0;
    final salePrice = product.discountedPrice > 0 ? product.discountedPrice : product.price;
    final originalPrice = product.price;
    final hasDiscount = discount > 0 && originalPrice > salePrice;

    String unitText = '1 pc';
    if (product.variants.isNotEmpty && product.variants.first.name.isNotEmpty) {
      unitText = product.variants.first.name;
    } else if (product.subcategory.isNotEmpty) {
      unitText = product.subcategory;
    }

    final card = Container(
      color: Colors.transparent, // No outer border box
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. IMAGE BOX ONLY has the border and rounded corners
          AspectRatio(
            aspectRatio: 1.0,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E7EB), width: 1.0),
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  GestureDetector(
                    onTap: product.id.length > 10
                        ? () => context.push('/product/${product.id}')
                        : null,
                    child: Padding(
                      padding: const EdgeInsets.all(6.0),
                      child: product.primaryImage != null
                          ? AppNetworkImage(
                              imageUrl: product.primaryImage!,
                              fit: BoxFit.contain,
                              errorIcon: Icons.image_outlined,
                            )
                          : const Center(
                              child: Icon(
                                Icons.image_outlined,
                                color: AppColors.textMuted,
                                size: 32,
                              ),
                            ),
                    ),
                  ),

                  // Out of stock overlay
                  if (!inStock)
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.8),
                        borderRadius: BorderRadius.circular(11),
                      ),
                      alignment: Alignment.center,
                      child: const Text(
                        'OUT OF STOCK',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: Colors.black54,
                        ),
                      ),
                    ),

                  // Blue Discount Ribbon Badge (Top Left of Image Box)
                  if (hasDiscount)
                    Positioned(
                      left: 0,
                      top: 0,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 3),
                        decoration: const BoxDecoration(
                          color: Color(0xFF2874F0),
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(11),
                            bottomRight: Radius.circular(8),
                          ),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '$discount%',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                height: 1.0,
                              ),
                            ),
                            const Text(
                              'OFF',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                                height: 1.0,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                  Positioned(
                    right: 4,
                    top: 4,
                    child: WishlistButton(product: product, size: 24),
                  ),
                ],
              ),
            ),
          ),

          // 2. DETAILS SECTION BELOW IMAGE CONTAINER (Flexible Column preventing overflow)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 2.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Delivery Time Badge (e.g. ⏱ 14 MINS)
                      Row(
                        children: const [
                          Icon(Icons.timer_outlined, size: 9.5, color: Color(0xFF4A4A4A)),
                          SizedBox(width: 2),
                          Text(
                            '14 MINS',
                            style: TextStyle(
                              fontSize: 8.5,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF4A4A4A),
                              letterSpacing: -0.2,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      // Product Title
                      GestureDetector(
                        onTap: product.id.length > 10
                            ? () => context.push('/product/${product.id}')
                            : null,
                        child: Text(
                          product.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 11.0,
                            color: Color(0xFF1C1C1C),
                            height: 1.15,
                          ),
                        ),
                      ),
                      const SizedBox(height: 1),
                      // Quantity / Unit
                      Text(
                        unitText,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w400,
                          fontSize: 10.0,
                          color: Color(0xFF757575),
                        ),
                      ),
                    ],
                  ),

                  // Bottom Row: Price & ADD Button
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Left: Price Column
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '₹${salePrice.toInt()}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 12.5,
                                color: Color(0xFF1C1C1C),
                                height: 1.0,
                              ),
                            ),
                            if (hasDiscount) ...[
                              const SizedBox(height: 1),
                              Text(
                                '₹${originalPrice.toInt()}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                                  fontSize: 9.5,
                                  color: Color(0xFF9CA3AF),
                                  decoration: TextDecoration.lineThrough,
                                  height: 1.0,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),

                      // Right: ADD Button / Stepper
                      _buildCartAction(
                        context,
                        ref,
                        inStock,
                        effectiveCartQuantity,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );

    if (outerPadding == EdgeInsets.zero) {
      return card;
    }

    return Padding(
      padding: outerPadding,
      child: card,
    );
  }

  Widget _buildCartAction(
    BuildContext context,
    WidgetRef ref,
    bool inStock,
    int effectiveCartQuantity,
  ) {
    final hasVariants = isMultiVariant(product);
    if (hasVariants) {
      void openVariants() => _openVariantPicker(context);
      if (effectiveCartQuantity > 0) {
        return Container(
          height: 28,
          decoration: BoxDecoration(
            color: const Color(0xFF0C831F),
            borderRadius: BorderRadius.circular(7),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              InkWell(
                onTap: openVariants,
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6),
                  child: Text(
                    '−',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              Text(
                '$effectiveCartQuantity',
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                  color: Colors.white,
                ),
              ),
              InkWell(
                onTap: inStock ? openVariants : null,
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6),
                  child: Text(
                    '+',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      }
      return SizedBox(
        height: 28,
        child: OutlinedButton(
          onPressed: inStock ? openVariants : null,
          style: OutlinedButton.styleFrom(
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            side: BorderSide(
              color: inStock ? const Color(0xFF0C831F) : const Color(0xFFD1D5DB),
              width: 1,
            ),
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(7),
            ),
          ),
          child: Text(
            inStock ? 'ADD' : 'OUT',
            style: TextStyle(
              color: inStock ? const Color(0xFF0C831F) : const Color(0xFF9CA3AF),
              fontSize: 10.5,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.4,
            ),
          ),
        ),
      );
    }

    final VoidCallback handleDecrease = onDecrease ??
        () {
          final items = ref.read(cartControllerProvider).items;
          CartItem? match;
          for (final i in items) {
            if (i.id == product.id) {
              match = i;
              break;
            }
          }
          if (match != null) {
            if (match.quantity > 1) {
              ref.read(cartControllerProvider.notifier).updateCartLineQuantity(
                    productId: product.id,
                    quantity: match.quantity - 1,
                    variantName: match.variantName,
                    colorName: match.colorName,
                  );
            } else {
              ref.read(cartControllerProvider.notifier).removeFromCartLine(
                    productId: product.id,
                    variantName: match.variantName,
                    colorName: match.colorName,
                  );
            }
          }
        };

    final VoidCallback handleIncrease = onIncrease ??
        () {
          final items = ref.read(cartControllerProvider).items;
          CartItem? match;
          for (final i in items) {
            if (i.id == product.id) {
              match = i;
              break;
            }
          }
          if (match != null) {
            ref.read(cartControllerProvider.notifier).updateCartLineQuantity(
                  productId: product.id,
                  quantity: match.quantity + 1,
                  variantName: match.variantName,
                  colorName: match.colorName,
                );
          } else {
            onAdd(context);
          }
        };

    if (effectiveCartQuantity > 0) {
      return Container(
        height: 28,
        decoration: BoxDecoration(
          color: const Color(0xFF0C831F),
          borderRadius: BorderRadius.circular(7),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            InkWell(
              onTap: handleDecrease,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(7),
                bottomLeft: Radius.circular(7),
              ),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Text(
                  '−',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: Text(
                '$effectiveCartQuantity',
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                  color: Colors.white,
                ),
              ),
            ),
            InkWell(
              onTap: inStock ? handleIncrease : null,
              borderRadius: const BorderRadius.only(
                topRight: Radius.circular(7),
                bottomRight: Radius.circular(7),
              ),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Text(
                  '+',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return SizedBox(
      height: 28,
      child: Builder(
        builder: (buttonContext) => OutlinedButton(
          onPressed: inStock ? () => onAdd(buttonContext) : null,
          style: OutlinedButton.styleFrom(
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            side: BorderSide(
              color: inStock ? const Color(0xFF0C831F) : const Color(0xFFD1D5DB),
              width: 1,
            ),
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(7),
            ),
          ),
          child: Text(
            inStock ? 'ADD' : 'OUT',
            style: TextStyle(
              color: inStock ? const Color(0xFF0C831F) : const Color(0xFF9CA3AF),
              fontSize: 10.5,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.4,
            ),
          ),
        ),
      ),
    );
  }

  void _openVariantPicker(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheetContext) => _VariantPickerSheet(product: product),
    );
  }
}

class _VariantPickerSheet extends ConsumerWidget {
  const _VariantPickerSheet({required this.product});

  final Product product;

  CartItem? _lineForVariant(List<CartItem> items, String variantName) {
    for (final item in items) {
      if (item.id != product.id) continue;
      if (item.variantName.trim() != variantName.trim()) continue;
      return item;
    }
    return null;
  }

  String _resolveColorName(ProductVariant variant, String variantName) {
    final variantColor = variant.colors.isNotEmpty ? variant.colors.first.name.trim() : '';
    if (variantColor.isNotEmpty) return variantColor;
    final colors = getAvailableColors(product, variantName);
    return colors.isNotEmpty ? colors.first.name : '';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartItems = ref.watch(cartControllerProvider.select((state) => state.items));
    final notifier = ref.read(cartControllerProvider.notifier);
    final variants = product.variants;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 4, 14, 14),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              product.name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            const Text(
              'Choose a variant',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 10),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: variants.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final variant = variants[index];
                  final variantName = variant.name.trim();
                  final cartLine = _lineForVariant(cartItems, variantName);
                  final quantity = cartLine?.quantity ?? 0;
                  final inStock = isProductInStock(product, variantName);
                  final colorName = _resolveColorName(variant, variantName);
                  final minQty = getMinOrderQuantity(product, variantName);
                  final nextQty = quantity + getCartStepForProduct(product, variantName);

                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                variantName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 2),
                              ProductPriceDisplay(
                                product: product,
                                variantName: variantName,
                                size: ProductPriceSize.sm,
                              ),
                              if (!inStock)
                                const Padding(
                                  padding: EdgeInsets.only(top: 2),
                                  child: Text(
                                    'Out of stock',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.red,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        if (quantity > 0)
                          Container(
                            height: 32,
                            decoration: BoxDecoration(
                              border: Border.all(color: AppColors.borderLight),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                IconButton(
                                  onPressed: () async {
                                    final decreased = getDecreasedCartQuantityForProduct(
                                      product,
                                      quantity,
                                      variantName,
                                    );
                                    if (decreased <= 0) {
                                      await notifier.removeFromCartLine(
                                        productId: product.id,
                                        variantName: variantName,
                                        colorName: cartLine?.colorName ?? colorName,
                                      );
                                      return;
                                    }
                                    await notifier.updateCartLineQuantity(
                                      productId: product.id,
                                      quantity: decreased,
                                      variantName: variantName,
                                      colorName: cartLine?.colorName ?? colorName,
                                    );
                                  },
                                  icon: const Text(
                                    '−',
                                    style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
                                  ),
                                  splashRadius: 16,
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints.tightFor(width: 32),
                                ),
                                Container(
                                  width: 28,
                                  alignment: Alignment.center,
                                  child: Text(
                                    '$quantity',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  onPressed: inStock
                                      ? () async {
                                          await notifier.updateCartLineQuantity(
                                            productId: product.id,
                                            quantity: nextQty,
                                            variantName: variantName,
                                            colorName: cartLine?.colorName ?? colorName,
                                          );
                                        }
                                      : null,
                                  icon: const Text(
                                    '+',
                                    style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
                                  ),
                                  splashRadius: 16,
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints.tightFor(width: 32),
                                ),
                              ],
                            ),
                          )
                        else
                          SizedBox(
                            height: 32,
                            child: OutlinedButton(
                              onPressed: inStock
                                  ? () => notifier.addToCart(
                                        product,
                                        minQty,
                                        variantName: variantName,
                                        colorName: colorName,
                                      )
                                  : null,
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                minimumSize: const Size(64, 32),
                                side: const BorderSide(color: AppColors.borderLight),
                              ),
                              child: const Text(
                                'ADD',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
