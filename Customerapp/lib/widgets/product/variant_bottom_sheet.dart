import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/theme.dart';
import '../../core/utils/product_pricing.dart';
import '../../features/cart/cart_controller.dart';
import '../../models/cart_item.dart';
import '../../models/product.dart';
import '../../models/product_pricing_models.dart';
import '../../routes/route_paths.dart';
import '../common/app_network_image.dart';

/// Shows a Blinkit/Zepto-style variant bottom sheet for products with multiple variants.
Future<void> showVariantBottomSheet(BuildContext context, Product product) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) => VariantBottomSheet(product: product),
  );
}

class VariantBottomSheet extends ConsumerWidget {
  const VariantBottomSheet({super.key, required this.product});

  final Product product;

  CartItem? _lineForVariant(List<CartItem> items, String variantName) {
    for (final item in items) {
      if (item.id != product.id) continue;
      if (item.variantName.trim().toLowerCase() != variantName.trim().toLowerCase()) continue;
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
    final cartState = ref.watch(cartControllerProvider);
    final cartItems = cartState.items;
    final notifier = ref.read(cartControllerProvider.notifier);
    final variants = product.variants;
    final mediaQuery = MediaQuery.of(context);
    final maxSheetHeight = mediaQuery.size.height * 0.78;

    final totalCartCount = cartState.cartCount;
    final totalCartPrice =
        cartItems.fold<double>(0.0, (sum, i) => sum + i.lineTotal);

    return Container(
      constraints: BoxConstraints(maxHeight: maxSheetHeight),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Top Drag Handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 6),
                width: 38,
                height: 4.5,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),

            // Product Header Row
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Product Thumbnail
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: product.primaryImage != null
                        ? AppNetworkImage(
                            imageUrl: product.primaryImage!,
                            fit: BoxFit.contain,
                            cacheWidth: 120,
                            cacheHeight: 120,
                          )
                        : const Icon(Icons.image_outlined, color: AppColors.textMuted, size: 28),
                  ),
                  const SizedBox(width: 12),

                  // Product Name & Options Subtitle
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF1C1C1C),
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '${variants.length} options available',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF0C831F),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Close Button
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, size: 22, color: Color(0xFF6B7280)),
                    splashRadius: 18,
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
            ),

            const Divider(height: 1, thickness: 1, color: Color(0xFFF3F4F6)),

            // Variant List
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                itemCount: variants.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (itemCtx, index) {
                  final variant = variants[index];
                  final variantName = variant.name.trim();
                  final cartLine = _lineForVariant(cartItems, variantName);
                  final quantity = cartLine?.quantity ?? 0;
                  final inStock = isProductInStock(product, variantName);
                  final colorName = _resolveColorName(variant, variantName);
                  final minQty = getMinOrderQuantity(product, variantName);
                  final step = getCartStepForProduct(product, variantName);

                  final salePrice = variant.discountedPrice > 0 ? variant.discountedPrice : variant.price;
                  final originalPrice = variant.price;
                  final hasDiscount = originalPrice > salePrice && salePrice > 0;
                  final discountPercent = hasDiscount
                      ? (((originalPrice - salePrice) / originalPrice) * 100).round()
                      : 0;

                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: quantity > 0 ? const Color(0xFFF0FDF4) : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: quantity > 0 ? const Color(0xFF86EFAC) : const Color(0xFFE5E7EB),
                        width: 1.2,
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Left: Variant Info (Name, Price, Discount)
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                variantName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF1F2937),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Text(
                                    '₹${salePrice.toInt()}',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF111827),
                                    ),
                                  ),
                                  if (hasDiscount) ...[
                                    const SizedBox(width: 6),
                                    Text(
                                      '₹${originalPrice.toInt()}',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                        color: const Color(0xFF9CA3AF),
                                        decoration: TextDecoration.lineThrough,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFDCFCE7),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        '$discountPercent% OFF',
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w800,
                                          color: const Color(0xFF15803D),
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              if (!inStock)
                                Padding(
                                  padding: const EdgeInsets.only(top: 3),
                                  child: Text(
                                    'Out of stock',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 10.5,
                                      color: Colors.red.shade600,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),

                        const SizedBox(width: 12),

                        // Right: ADD Button or Stepper
                        if (quantity > 0)
                          Container(
                            height: 32,
                            decoration: BoxDecoration(
                              color: const Color(0xFF0C831F),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                InkWell(
                                  onTap: () async {
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
                                    } else {
                                      await notifier.updateCartLineQuantity(
                                        productId: product.id,
                                        quantity: decreased,
                                        variantName: variantName,
                                        colorName: cartLine?.colorName ?? colorName,
                                      );
                                    }
                                  },
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(8),
                                    bottomLeft: Radius.circular(8),
                                  ),
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    child: Text(
                                      '−',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 6),
                                  child: Text(
                                    '$quantity',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 12,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                Builder(
                                  builder: (plusBtnContext) => InkWell(
                                    onTap: inStock
                                        ? () async {
                                            await notifier.addToCart(
                                              product,
                                              step,
                                              variantName: variantName,
                                              colorName: cartLine?.colorName ?? colorName,
                                              flySourceContext: plusBtnContext,
                                            );
                                          }
                                        : null,
                                    borderRadius: const BorderRadius.only(
                                      topRight: Radius.circular(8),
                                      bottomRight: Radius.circular(8),
                                    ),
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      child: Text(
                                        '+',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          )
                        else
                          Builder(
                            builder: (addBtnContext) => SizedBox(
                              height: 32,
                              child: OutlinedButton(
                                onPressed: inStock
                                    ? () => notifier.addToCart(
                                          product,
                                          minQty,
                                          variantName: variantName,
                                          colorName: colorName,
                                          flySourceContext: addBtnContext,
                                        )
                                    : null,
                                style: OutlinedButton.styleFrom(
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(horizontal: 14),
                                  side: BorderSide(
                                    color: inStock ? const Color(0xFF0C831F) : const Color(0xFFD1D5DB),
                                    width: 1.2,
                                  ),
                                  backgroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      inStock ? 'ADD' : 'OUT',
                                      style: GoogleFonts.plusJakartaSans(
                                        color: inStock ? const Color(0xFF0C831F) : const Color(0xFF9CA3AF),
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 0.3,
                                      ),
                                    ),
                                    if (inStock) ...[
                                      const SizedBox(width: 3),
                                      const Icon(
                                        Icons.add,
                                        size: 13,
                                        color: Color(0xFF0C831F),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Bottom Sticky Cart Peek Bar (if user has items in cart)
            if (totalCartCount > 0)
              Container(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x0F000000),
                      blurRadius: 8,
                      offset: Offset(0, -3),
                    ),
                  ],
                ),
                child: InkWell(
                  onTap: () {
                    Navigator.of(context).pop();
                    context.go(RoutePaths.cart);
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    height: 44,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0C831F),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          '$totalCartCount item${totalCartCount > 1 ? 's' : ''} added',
                          style: GoogleFonts.plusJakartaSans(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '₹${totalCartPrice.toInt()}',
                          style: GoogleFonts.plusJakartaSans(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 13),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
