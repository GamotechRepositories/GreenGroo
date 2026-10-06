import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../core/utils/currency_formatter.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../models/cart_item.dart';
import '../../models/order.dart';
import '../../models/product.dart';
import '../../widgets/common/app_network_image.dart';

class BuyAgainCard extends ConsumerWidget {
  const BuyAgainCard({
    super.key,
    required this.item,
    this.width = 136,
  });

  final OrderItem item;
  final double width;

  CartItem? _findCartLine(List<CartItem> items) {
    for (final cartItem in items) {
      if (cartItem.id != item.productId) continue;
      if (cartItem.variantName.trim() != item.variantName.trim()) continue;
      if (cartItem.colorName.trim() != item.colorName.trim()) continue;
      return cartItem;
    }
    return null;
  }

  Product _toProduct() {
    return Product(
      id: item.productId,
      name: item.name,
      categories: const [],
      subcategory: '',
      brandName: item.brandName,
      price: item.price,
      discountedPrice: item.price,
      discountedPercent: 0,
      stock: 100,
      productImages: item.image.isNotEmpty ? [item.image] : const [],
    );
  }

  Future<void> _handleAdd(WidgetRef ref, BuildContext context) async {
    final product = _toProduct();
    final result = await ref.read(cartControllerProvider.notifier).addToCart(
          product,
          1,
          variantName: item.variantName,
          colorName: item.colorName,
          flySourceContext: context,
        );
    if (result == AddToCartResult.requiresLogin) {
      ref.read(authControllerProvider.notifier).openAuthModal();
    }
  }

  Future<void> _handleIncrease(WidgetRef ref, BuildContext context) async {
    final cartLine = _findCartLine(ref.read(cartControllerProvider).items);
    if (cartLine != null) {
      await ref.read(cartControllerProvider.notifier).updateCartLineQuantity(
            productId: cartLine.id,
            quantity: cartLine.quantity + 1,
            variantName: cartLine.variantName,
            colorName: cartLine.colorName,
          );
      return;
    }
    await _handleAdd(ref, context);
  }

  Future<void> _handleDecrease(WidgetRef ref) async {
    final cartLine = _findCartLine(ref.read(cartControllerProvider).items);
    if (cartLine == null) return;

    if (cartLine.quantity <= 1) {
      await ref.read(cartControllerProvider.notifier).removeFromCartLine(
            productId: cartLine.id,
            variantName: cartLine.variantName,
            colorName: cartLine.colorName,
          );
      return;
    }

    await ref.read(cartControllerProvider.notifier).updateCartLineQuantity(
          productId: cartLine.id,
          quantity: cartLine.quantity - 1,
          variantName: cartLine.variantName,
          colorName: cartLine.colorName,
        );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartQuantity = ref.watch(
      cartControllerProvider.select((s) {
        for (final cartItem in s.items) {
          if (cartItem.id != item.productId) continue;
          if (cartItem.variantName.trim() != item.variantName.trim()) continue;
          if (cartItem.colorName.trim() != item.colorName.trim()) continue;
          return cartItem.quantity;
        }
        return 0;
      }),
    );

    final variantText = item.variantName.trim().isNotEmpty
        ? item.variantName.trim()
        : (item.brandName.trim().isNotEmpty ? item.brandName.trim() : '1 unit');

    return SizedBox(
      width: width,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Image box
          AspectRatio(
            aspectRatio: 1.0,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE5E7EB), width: 1.0),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(13),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: item.productId.isNotEmpty
                        ? () => context.push('/product/${item.productId}')
                        : null,
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: item.image.isNotEmpty
                                ? AppNetworkImage(
                                    imageUrl: item.image,
                                    fit: BoxFit.contain,
                                    cacheWidth: 200,
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
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          // Product Name
          GestureDetector(
            onTap: item.productId.isNotEmpty
                ? () => context.push('/product/${item.productId}')
                : null,
            child: Text(
              item.name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
                height: 1.25,
              ),
            ),
          ),
          const SizedBox(height: 2),
          // Variant / Brand
          Text(
            variantText,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 6),
          // Price & Add Button Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Text(
                  formatInr(item.price),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              if (cartQuantity > 0)
                Container(
                  height: 30,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.25),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _CompactQtyButton(
                        icon: Icons.remove,
                        onTap: () => _handleDecrease(ref),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Text(
                          '$cartQuantity',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      _CompactQtyButton(
                        icon: Icons.add,
                        onTap: () => _handleIncrease(ref, context),
                      ),
                    ],
                  ),
                )
              else
                SizedBox(
                  height: 30,
                  child: OutlinedButton(
                    onPressed: () => _handleAdd(ref, context),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: AppColors.primary, width: 1.2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'ADD',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CompactQtyButton extends StatelessWidget {
  const _CompactQtyButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
          child: Icon(icon, size: 14, color: Colors.white),
        ),
      ),
    );
  }
}
