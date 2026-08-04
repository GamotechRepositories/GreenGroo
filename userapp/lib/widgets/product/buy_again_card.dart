import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_decorations.dart';
import '../../config/theme.dart';
import '../../core/utils/currency_formatter.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../models/cart_item.dart';
import '../../models/order.dart';
import '../../models/product.dart';
import '../../widgets/common/app_network_image.dart';

class BuyAgainCard extends ConsumerWidget {
  const BuyAgainCard({super.key, required this.item});

  final OrderItem item;

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
          item.quantity > 0 ? item.quantity : 1,
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

    return SizedBox(
      width: 140,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            InkWell(
              onTap: () => context.push('/product/${item.productId}'),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
              child: AspectRatio(
                aspectRatio: 1,
                child: DecoratedBox(
                  decoration: const BoxDecoration(
                    border: Border(bottom: BorderSide(color: AppColors.borderLight)),
                  ),
                  child: AppNetworkImage(
                    imageUrl: item.image,
                    cacheWidth: 140,
                  ),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 4, 8, 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        InkWell(
                          onTap: () => context.push('/product/${item.productId}'),
                          child: Text(
                            item.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              height: 1.2,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          formatInr(item.price),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                    if (cartQuantity > 0)
                      DecoratedBox(
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.borderLight),
                          borderRadius: BorderRadius.circular(AppDecorations.radiusSm),
                          color: Colors.white,
                        ),
                        child: Row(
                          children: [
                            _QtyButton(
                              label: '−',
                              onTap: () => _handleDecrease(ref),
                            ),
                            Expanded(
                              child: Center(
                                child: Text(
                                  '$cartQuantity',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ),
                            _QtyButton(
                              label: '+',
                              onTap: () => _handleIncrease(ref, context),
                            ),
                          ],
                        ),
                      )
                    else
                      SizedBox(
                        height: 28,
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => _handleAdd(ref, context),
                          style: ElevatedButton.styleFrom(
                            elevation: 0,
                            padding: EdgeInsets.zero,
                            textStyle: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.4,
                            ),
                          ),
                          child: const Text('ADD'),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 32,
      height: 32,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
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
