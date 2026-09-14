import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../config/app_decorations.dart';
import '../../../config/constants.dart';
import '../../../config/theme.dart';
import '../../../routes/route_paths.dart';
import '../../../widgets/common/app_network_image.dart';

enum HomePromoVariant { sale, wholesale }

/// Promotional hero slide for the home carousel.
class HomePromoBanner extends StatelessWidget {
  const HomePromoBanner({
    super.key,
    this.variant = HomePromoVariant.sale,
  });

  final HomePromoVariant variant;

  bool get _isSale => variant == HomePromoVariant.sale;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 176,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _isSale
              ? const [Color(0xFFFF8A2B), Color(0xFFFF6600)]
              : const [Color(0xFF1A1A1A), Color(0xFF333333)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          if (_isSale)
            Positioned(
              right: -16,
              bottom: -12,
              child: SizedBox(
                width: 170,
                height: 150,
                child: AppNetworkImage(
                  imageUrl: AppConstants.promoBannerImage,
                  fit: BoxFit.contain,
                  errorIcon: Icons.headphones_outlined,
                ),
              ),
            )
          else
            Positioned(
              right: 16,
              top: 20,
              child: Icon(
                Icons.storefront_rounded,
                size: 88,
                color: Colors.white.withValues(alpha: 0.12),
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 22, 16, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _isSale ? 'BIG SALE' : 'WHOLESALE',
                  style: TextStyle(
                    color: _isSale
                        ? Colors.white
                        : AppColors.primary.withValues(alpha: 0.95),
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.4,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _isSale ? 'Up to 50% Off' : 'Bulk Orders',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    height: 1.05,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _isSale
                      ? 'On Mobile Accessories'
                      : 'MOQ ${AppConstants.moq} · Extra savings',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.92),
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                FilledButton(
                  onPressed: () => context.go(RoutePaths.product),
                  style: FilledButton.styleFrom(
                    backgroundColor:
                        _isSale ? Colors.black : AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 22,
                      vertical: 10,
                    ),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(
                    _isSale ? 'Shop Now' : 'Browse Catalog',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
