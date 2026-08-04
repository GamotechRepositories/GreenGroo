import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_decorations.dart';
import '../../config/theme.dart';
import '../../core/utils/product_pricing.dart';
import '../../features/cart/cart_controller.dart';
import '../../models/cart_item.dart';
import '../../models/product.dart';
import '../../models/product_pricing_models.dart';
import '../common/app_network_image.dart';
import 'product_price_display.dart';
import 'wishlist_button.dart';

/// Fixed dimensions so every product card is identical in grids and carousels.
class DealProductCardDimensions {
  const DealProductCardDimensions._();

  static const double width = 152;
  static const double height = 244;
  static const double titleHeight = 15;
  static const double priceHeight = 16;
  static const double buttonHeight = 34;
  static const double contentPaddingVertical = 8;
  static const double bottomSectionHeight =
      contentPaddingVertical + titleHeight + priceHeight + 2 + buttonHeight;

  /// Use for `SliverGridDelegateWithFixedCrossAxisCount.childAspectRatio`.
  static const double gridChildAspectRatio = 0.58;
  /// Taller ratio for 2-row home deal slides so price + button are not clipped.
  static const double homeDealsGridAspectRatio = 0.55;
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
              borderRadius: AppDecorations.radiusMd,
              clipTopImage: true,
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
        borderRadius: flat ? AppDecorations.radiusSm : AppDecorations.radiusMd,
        clipTopImage: !flat,
        outerPadding: flat
            ? const EdgeInsets.symmetric(horizontal: 4, vertical: 4)
            : EdgeInsets.zero,
      ),
    );
  }

  Widget _buildCardShell(
    BuildContext context,
    int discount, {
    required WidgetRef ref,
    required int effectiveCartQuantity,
    required double borderRadius,
    required bool clipTopImage,
    EdgeInsets outerPadding = EdgeInsets.zero,
  }) {
    final inStock = product.stock > 0;
    final card = DecoratedBox(
      decoration: BoxDecoration(
        color: AppDecorations.cardBackground,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: _buildImageSection(
              context,
              discount,
              clipTop: clipTopImage,
              borderRadius: borderRadius,
            ),
          ),
          SizedBox(
            height: DealProductCardDimensions.bottomSectionHeight,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 2, 10, 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(
                    height: DealProductCardDimensions.titleHeight,
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: _buildTitle(context),
                    ),
                  ),
                  SizedBox(
                    height: DealProductCardDimensions.priceHeight,
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: ProductPriceDisplay(
                        product: product,
                        size: ProductPriceSize.sm,
                      ),
                    ),
                  ),
                  const Spacer(),
                  _buildCartAction(
                    context,
                    ref,
                    inStock,
                    effectiveCartQuantity,
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

  Widget _buildTitle(BuildContext context) {
    return GestureDetector(
      onTap: product.id.length > 10
          ? () => context.push('/product/${product.id}')
          : null,
      child: Text(
        product.name,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 12,
          color: AppColors.textPrimary,
          height: 1.1,
        ),
      ),
    );
  }

  Widget _buildImageSection(
    BuildContext context,
    int discount, {
    required bool clipTop,
    required double borderRadius,
  }) {
    final image = Stack(
      fit: StackFit.expand,
      children: [
        GestureDetector(
          onTap: product.id.length > 10
              ? () => context.push('/product/${product.id}')
              : null,
          child: ColoredBox(
            // Match website: product images sit on a plain white background.
            color: Colors.white,
            child: product.primaryImage != null
                ? Padding(
                    padding: const EdgeInsets.all(10),
                    child: AppNetworkImage(
                      imageUrl: product.primaryImage!,
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.contain,
                      cacheWidth: 152,
                      cacheHeight: 152,
                      errorIcon: Icons.image_outlined,
                    ),
                  )
                : const Center(
                    child: Icon(
                      Icons.image_outlined,
                      color: AppColors.textMuted,
                      size: 36,
                    ),
                  ),
          ),
        ),
        if (discount > 0)
          Positioned(
            left: 8,
            top: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '-$discount%',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        Positioned(
          right: 6,
          top: 6,
          child: WishlistButton(product: product, size: 26),
        ),
      ],
    );

    if (!clipTop) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: image,
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(borderRadius),
      ),
      child: image,
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
        return SizedBox(
          height: DealProductCardDimensions.buttonHeight,
          child: DecoratedBox(
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.borderLight),
              borderRadius: BorderRadius.circular(AppDecorations.radiusSm),
              color: Colors.white,
            ),
            child: Row(
              children: [
                _qtyButton(openVariants, label: '−'),
                Expanded(
                  child: Center(
                    child: Text(
                      '$effectiveCartQuantity',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
                _qtyButton(inStock ? openVariants : null, label: '+'),
              ],
            ),
          ),
        );
      }
      return SizedBox(
        height: DealProductCardDimensions.buttonHeight,
        child: ElevatedButton(
          onPressed: inStock ? openVariants : null,
          style: ElevatedButton.styleFrom(
            elevation: 0,
            padding: EdgeInsets.zero,
            disabledBackgroundColor: AppColors.borderLight,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppDecorations.radiusSm),
            ),
            textStyle: const TextStyle(
              inherit: false,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
            ),
          ),
          child: Text(inStock ? 'ADD' : 'OUT OF STOCK'),
        ),
      );
    }

    if (effectiveCartQuantity > 0) {
      return SizedBox(
        height: DealProductCardDimensions.buttonHeight,
        child: DecoratedBox(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.borderLight),
            borderRadius: BorderRadius.circular(AppDecorations.radiusSm),
            color: Colors.white,
          ),
          child: Row(
            children: [
              _qtyButton(
                onDecrease,
                label: '−',
              ),
              Expanded(
                child: Center(
                  child: Text(
                    '$effectiveCartQuantity',
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
              _qtyButton(
                inStock ? onIncrease : null,
                label: '+',
              ),
            ],
          ),
        ),
      );
    }

    return SizedBox(
      height: DealProductCardDimensions.buttonHeight,
      child: Builder(
        builder: (buttonContext) => ElevatedButton(
          onPressed: inStock ? () => onAdd(buttonContext) : null,
          style: ElevatedButton.styleFrom(
            elevation: 0,
            padding: EdgeInsets.zero,
            disabledBackgroundColor: AppColors.borderLight,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppDecorations.radiusSm),
            ),
            textStyle: const TextStyle(
              inherit: false,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
            ),
          ),
          child: Text(inStock ? 'ADD' : 'OUT OF STOCK'),
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

  Widget _qtyButton(VoidCallback? onTap, {required String label}) {
    return SizedBox(
      width: 36,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppDecorations.radiusSm),
          child: Center(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ),
      ),
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
                                  ? () async {
                                      await notifier.addToCart(
                                        product,
                                        minQty,
                                        variantName: variantName,
                                        colorName: colorName,
                                      );
                                    }
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
