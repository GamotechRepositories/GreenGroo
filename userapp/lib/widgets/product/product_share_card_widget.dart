import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../common/app_network_image.dart';

/// Visual product card baked into the shared PNG (matches web share card).
class ProductShareCardWidget extends StatelessWidget {
  const ProductShareCardWidget({
    super.key,
    required this.imageUrl,
    required this.productName,
    required this.priceLabel,
    required this.brandName,
    required this.shareUrl,
  });

  static const cardWidth = 400.0;
  static const imageHeight = 300.0;

  final String imageUrl;
  final String productName;
  final String priceLabel;
  final String brandName;
  final String shareUrl;

  @override
  Widget build(BuildContext context) {
    final displayBrand =
        brandName.trim().isNotEmpty ? brandName.trim() : 'Bulk Mobile Mart';

    return ColoredBox(
      color: Colors.white,
      child: SizedBox(
        width: cardWidth,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(
                    height: imageHeight,
                    width: cardWidth - 32,
                    child: imageUrl.trim().isNotEmpty
                        ? AppNetworkImage(
                            imageUrl: imageUrl,
                            width: cardWidth - 32,
                            height: imageHeight,
                            fit: BoxFit.cover,
                            cacheWidth: 900,
                            cacheHeight: 700,
                            errorIcon: Icons.image_outlined,
                            errorIconSize: 48,
                          )
                        : const ColoredBox(
                            color: AppColors.mobileSurface,
                            child: Center(
                              child: Icon(
                                Icons.image_outlined,
                                size: 48,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayBrand.toUpperCase(),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.4,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          productName.trim(),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            height: 1.35,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          priceLabel,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'bulkmobilemart.in',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textMuted,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          shareUrl,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
