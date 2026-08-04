import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../models/product.dart';
import '../common/app_network_image.dart';
import 'product_price_display.dart';
import 'wishlist_button.dart';

class MobileProductCard extends StatelessWidget {
  const MobileProductCard({
    super.key,
    required this.product,
    required this.onAdd,
    this.cartQuantity = 0,
    this.onIncrease,
    this.onDecrease,
  });

  final Product product;
  final void Function(BuildContext context) onAdd;
  final int cartQuantity;
  final VoidCallback? onIncrease;
  final VoidCallback? onDecrease;

  @override
  Widget build(BuildContext context) {
    final inStock = product.stock > 0;

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Stack(
            children: [
              GestureDetector(
                onTap: () => context.push('/product/${product.id}'),
                child: Container(
                  width: 84,
                  height: 104,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: product.primaryImage != null
                      ? AppNetworkImage(
                          imageUrl: product.primaryImage!,
                          fit: BoxFit.contain,
                          width: 84,
                          height: 104,
                          cacheWidth: 168,
                          cacheHeight: 208,
                          errorIcon: Icons.image_outlined,
                        )
                      : const Icon(Icons.image_outlined, color: AppColors.textMuted),
                ),
              ),
              Positioned(
                right: 2,
                top: 2,
                child: WishlistButton(product: product, size: 28),
              ),
            ],
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => context.push('/product/${product.id}'),
                  child: Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                ProductPriceDisplay(product: product, size: ProductPriceSize.md),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      inStock ? 'In Stock' : 'Out of Stock',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: inStock ? Colors.green.shade700 : Colors.red,
                      ),
                    ),
                    const Spacer(),
                    _buildCartAction(context, inStock),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartAction(BuildContext context, bool inStock) {
    if (cartQuantity > 0) {
      return SizedBox(
        height: 34,
        width: 96,
        child: DecoratedBox(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.borderLight),
            borderRadius: BorderRadius.circular(8),
            color: Colors.white,
          ),
          child: Row(
            children: [
              _qtyButton(onDecrease, label: '−'),
              Expanded(
                child: Center(
                  child: Text(
                    '$cartQuantity',
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
              _qtyButton(inStock ? onIncrease : null, label: '+'),
            ],
          ),
        ),
      );
    }

    return Builder(
      builder: (btnContext) => ElevatedButton(
        onPressed: inStock ? () => onAdd(btnContext) : null,
        style: ElevatedButton.styleFrom(
          minimumSize: const Size(72, 34),
          padding: const EdgeInsets.symmetric(horizontal: 14),
          textStyle: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
        child: const Text('Add'),
      ),
    );
  }

  Widget _qtyButton(VoidCallback? onTap, {required String label}) {
    return SizedBox(
      width: 32,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
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
