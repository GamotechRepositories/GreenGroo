import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../config/app_decorations.dart';
import '../../../config/theme.dart';
import '../../../core/utils/product_search.dart';
import '../../../routes/route_paths.dart';
import '../../../widgets/common/app_network_image.dart';
import '../../../widgets/common/auto_horizontal_scroll.dart';
import '../../../widgets/common/section_header.dart';
import '../home_providers.dart';
import 'home_section_card.dart';

class TopBrandsSection extends ConsumerWidget {
  const TopBrandsSection({super.key});

  static const _tileWidth = 120.0;
  static const _tileHeight = 100.0;
  static const _rowHeight = 100.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final brandsAsync = ref.watch(brandsProvider);

    return brandsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (brands) {
        if (brands.isEmpty) return const SizedBox.shrink();

        return HomeSectionCard(
          margin: const EdgeInsets.fromLTRB(0, 4, 0, 8),
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
          showDivider: false,
          child: Column(
            children: [
              SectionHeader(
                title: 'Top Brands',
                dense: true,
                onViewAll: () => context.go(RoutePaths.product),
              ),
              const SizedBox(height: 12),
              AutoHorizontalScroll(
                height: _rowHeight,
                child: Row(
                  children: [
                    for (var i = 0; i < brands.length; i++) ...[
                      if (i > 0) const SizedBox(width: 12),
                      _BrandTile(
                        width: _tileWidth,
                        height: _tileHeight,
                        imageUrl: brands[i].brandImage,
                        onTap: () {
                          context.go(
                            ProductSearch.buildPath(brand: brands[i].brandName),
                          );
                        },
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _BrandTile extends StatelessWidget {
  const _BrandTile({
    required this.width,
    required this.height,
    required this.imageUrl,
    required this.onTap,
  });

  final double width;
  final double height;
  final String imageUrl;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: Material(
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDecorations.radiusMd),
          side: const BorderSide(color: AppColors.borderLight),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: imageUrl.trim().isNotEmpty
                ? AppNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.contain,
                    cacheWidth: 112,
                    cacheHeight: 72,
                    errorIcon: Icons.storefront_outlined,
                    errorIconSize: 28,
                  )
                : Icon(
                    Icons.storefront_outlined,
                    size: 32,
                    color: AppColors.textMuted.withValues(alpha: 0.8),
                  ),
          ),
        ),
      ),
    );
  }
}
