import 'package:flutter/material.dart';

import '../../config/app_decorations.dart';
import '../../config/theme.dart';
import 'app_network_image.dart';

/// GPU-friendly product thumbnail — gradient depth + flat ground tint (no blur shadow).
class Product3DImage extends StatelessWidget {
  const Product3DImage({
    super.key,
    required this.imageUrl,
    this.size = 56,
    this.borderRadius = AppDecorations.radiusSm,
    this.padding = 4,
  });

  final String imageUrl;
  final double size;
  final double borderRadius;
  final double padding;

  @override
  Widget build(BuildContext context) {
    final cache = (size * 2).toInt();
    final imageSize = size - padding * 2;

    return SizedBox(
      width: size,
      height: size + 5,
      child: Stack(
        alignment: Alignment.topCenter,
        clipBehavior: Clip.none,
        children: [
          Positioned(
            bottom: 0,
            left: size * 0.14,
            right: size * 0.14,
            child: Container(
              height: 4,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          Container(
            width: size,
            height: size,
            decoration: AppDecorations.productImage3d(radius: borderRadius),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(borderRadius),
              child: Padding(
                padding: EdgeInsets.all(padding),
                child: imageUrl.trim().isNotEmpty
                    ? AppNetworkImage(
                        imageUrl: imageUrl,
                        fit: BoxFit.contain,
                        width: imageSize,
                        height: imageSize,
                        cacheWidth: cache,
                        cacheHeight: cache,
                        errorIcon: Icons.image_outlined,
                      )
                    : const Center(
                        child: Icon(
                          Icons.image_outlined,
                          color: AppColors.textMuted,
                          size: 22,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
