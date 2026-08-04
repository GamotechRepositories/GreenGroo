import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/theme.dart';
import '../../features/cart/cart_controller.dart';
import '../common/app_network_image.dart';

class AddedToCartToast extends ConsumerWidget {
  const AddedToCartToast({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final toastImage = ref.watch(
      cartControllerProvider.select((s) => s.toastImage),
    );
    if (toastImage == null || toastImage.isEmpty) {
      return const SizedBox.shrink();
    }

    return Positioned(
      top: MediaQuery.paddingOf(context).top + 72,
      left: 16,
      right: 16,
      child: Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(12),
        color: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: AppNetworkImage(
                  imageUrl: toastImage,
                  width: 48,
                  height: 48,
                  fit: BoxFit.cover,
                  cacheWidth: 96,
                  cacheHeight: 96,
                  errorIcon: Icons.image_outlined,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Added to cart',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              const Icon(Icons.check_circle, color: AppColors.primary),
            ],
          ),
        ),
      ),
    );
  }
}
