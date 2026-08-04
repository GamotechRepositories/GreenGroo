import 'package:flutter/material.dart';

import '../../config/app_decorations.dart';
import '../../config/theme.dart';
import '../../models/category.dart';
import '../common/app_network_image.dart';

const categoryIconTypes = [
  Icons.power_outlined,
  Icons.cable_outlined,
  Icons.speaker_outlined,
  Icons.battery_charging_full_outlined,
  Icons.headphones_outlined,
  Icons.battery_std_outlined,
  Icons.smartphone_outlined,
  Icons.watch_outlined,
  Icons.usb_outlined,
  Icons.layers_outlined,
  Icons.shield_outlined,
  Icons.apps_rounded,
];

bool isUsableCategoryImage(String? url) {
  if (url == null || url.trim().isEmpty) return false;
  return !url.contains('res.cloudinary.com/demo');
}

/// Returns a usable remote URL, or null to show the category icon instead.
String? resolveCategoryImageUrl(Category category) {
  if (isUsableCategoryImage(category.categoryImage)) {
    return category.categoryImage.trim();
  }
  return null;
}

List<Category> filterShopCategories(List<Category> categories) {
  return categories
      .where((c) => c.categoryName.trim().toLowerCase() != 'most purchase')
      .toList();
}

/// Fallback labels when API categories are unavailable (frontend CategoryNav).
const defaultShopCategoryNames = [
  'Chargers',
  'Earphones',
  'Cables',
  'Neckbands',
  'Power Banks',
  'Smart Watches',
  'Bluetooth Speakers',
  'Mobile Covers',
  'Tempered Glass',
  'Adapters',
];

List<Category> defaultShopCategories() {
  return defaultShopCategoryNames
      .map(
        (name) => Category(
          id: name.toLowerCase().replaceAll(' ', '-'),
          categoryName: name,
          categoryImage: '',
        ),
      )
      .toList();
}

/// API categories when available; otherwise frontend-style defaults.
List<Category> resolveDisplayCategories(List<Category> categories) {
  final filtered = filterShopCategories(categories);
  if (filtered.isNotEmpty) return filtered;
  return defaultShopCategories();
}

/// Visual style for category tiles.
enum CategoryTileStyle { card, flat, storefront }

/// Large storefront category tile (3-column grid).
class CategoryGridTile extends StatelessWidget {
  const CategoryGridTile({
    super.key,
    required this.label,
    required this.onTap,
    this.category,
    this.icon,
    this.isMore = false,
    this.imageUrl,
    this.showSubcategoryHint = false,
    this.style = CategoryTileStyle.card,
  });

  final Category? category;
  final String label;
  final IconData? icon;
  final VoidCallback onTap;
  final bool isMore;
  final String? imageUrl;
  final bool showSubcategoryHint;
  final CategoryTileStyle style;

  factory CategoryGridTile.fromCategory({
    required Category category,
    required IconData icon,
    required VoidCallback onTap,
    bool showSubcategoryHint = false,
    CategoryTileStyle style = CategoryTileStyle.card,
  }) {
    return CategoryGridTile(
      category: category,
      label: category.categoryName,
      icon: icon,
      imageUrl: category.categoryImage,
      onTap: onTap,
      showSubcategoryHint: showSubcategoryHint,
      style: style,
    );
  }

  factory CategoryGridTile.more({
    required VoidCallback onTap,
    CategoryTileStyle style = CategoryTileStyle.card,
  }) {
    return CategoryGridTile(
      label: 'View All',
      icon: Icons.arrow_forward_rounded,
      onTap: onTap,
      isMore: true,
      style: style,
    );
  }

  @override
  Widget build(BuildContext context) {
    switch (style) {
      case CategoryTileStyle.flat:
        return _buildFlatTile(context);
      case CategoryTileStyle.storefront:
        return _buildStorefrontTile(context);
      case CategoryTileStyle.card:
        return _buildCardTile(context);
    }
  }

  Widget _buildStorefrontTile(BuildContext context) {
    final tileIcon = icon ?? Icons.category_outlined;
    final resolvedImage = category != null
        ? resolveCategoryImageUrl(category!)
        : (isUsableCategoryImage(imageUrl) ? imageUrl!.trim() : null);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(8, 12, 8, 4),
                  child: Center(
                    child: SizedBox(
                      width: 56,
                      height: 56,
                      child: isMore
                          ? Icon(
                              Icons.grid_view_rounded,
                              size: 32,
                              color: AppColors.primary,
                            )
                          : resolvedImage != null
                              ? AppNetworkImage(
                                  imageUrl: resolvedImage,
                                  fit: BoxFit.contain,
                                  cacheWidth: 112,
                                  cacheHeight: 112,
                                  errorIcon: tileIcon,
                                  errorIconSize: 32,
                                )
                              : Icon(
                                  tileIcon,
                                  size: 32,
                                  color: AppColors.textPrimary,
                                ),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: isMore ? AppColors.primary : AppColors.textPrimary,
                    height: 1.2,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFlatTile(BuildContext context) {
    final tileIcon = icon ?? Icons.category_outlined;
    final resolvedImage = category != null
        ? resolveCategoryImageUrl(category!)
        : (isUsableCategoryImage(imageUrl) ? imageUrl!.trim() : null);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Expanded(
              child: Center(
                child: AspectRatio(
                  aspectRatio: 1,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: isMore
                          ? AppColors.primary.withValues(alpha: 0.08)
                          : Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: isMore
                          ? Icon(
                              Icons.apps_rounded,
                              size: 28,
                              color: AppColors.primary.withValues(alpha: 0.9),
                            )
                          : resolvedImage != null
                              ? ClipOval(
                                  child: Padding(
                                    padding: const EdgeInsets.all(10),
                                    child: AppNetworkImage(
                                      imageUrl: resolvedImage,
                                      fit: BoxFit.contain,
                                      cacheWidth: 96,
                                      cacheHeight: 96,
                                      errorIcon: tileIcon,
                                      errorIconSize: 28,
                                    ),
                                  ),
                                )
                              : Icon(
                                  tileIcon,
                                  size: 28,
                                  color: AppColors.textPrimary,
                                ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isMore ? AppColors.primary : AppColors.textPrimary,
                  height: 1.15,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardTile(BuildContext context) {
    final tileIcon = icon ?? Icons.category_outlined;
    final resolvedImage = category != null
        ? resolveCategoryImageUrl(category!)
        : (isUsableCategoryImage(imageUrl) ? imageUrl!.trim() : null);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
        child: Ink(
          decoration: BoxDecoration(
            color: isMore
                ? AppColors.primary.withValues(alpha: 0.06)
                : Colors.white,
            borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
            border: Border.all(
              color: isMore
                  ? AppColors.primary.withValues(alpha: 0.25)
                  : AppColors.borderLight,
            ),
            boxShadow: isMore ? null : AppDecorations.softShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(8, 10, 8, 4),
                  child: ClipRRect(
                    borderRadius:
                        BorderRadius.circular(AppDecorations.radiusMd),
                    child: ColoredBox(
                      color: isMore
                          ? AppColors.primary.withValues(alpha: 0.1)
                          : Colors.white,
                      child: isMore
                          ? const Center(
                              child: Icon(
                                Icons.grid_view_rounded,
                                size: 38,
                                color: AppColors.primary,
                              ),
                            )
                          : resolvedImage != null
                              ? AppNetworkImage(
                                  imageUrl: resolvedImage,
                                  fit: BoxFit.contain,
                                  cacheWidth: 120,
                                  cacheHeight: 120,
                                  errorIcon: tileIcon,
                                  errorIconSize: 38,
                                )
                              : Center(
                                  child: Icon(
                                    tileIcon,
                                    size: 38,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(6, 0, 6, 4),
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: isMore ? AppColors.primary : AppColors.textPrimary,
                    height: 1.15,
                  ),
                ),
              ),
              if (!isMore && category != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(6, 0, 6, 8),
                  child: Text(
                    '${category!.productCount} products',
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textMuted,
                      height: 1.1,
                    ),
                  ),
                )
              else
                const SizedBox(height: 6),
              if (showSubcategoryHint &&
                  category != null &&
                  category!.subcategories.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(
                    '${category!.subcategories.length} subcategories',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppColors.textMuted,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Horizontal slider tile for home "Shop by Category".
class CategorySliderTile extends StatelessWidget {
  const CategorySliderTile({
    super.key,
    required this.label,
    required this.onTap,
    this.icon,
    this.imageUrl,
    this.isMore = false,
  });

  static const double tileWidth = 124;
  static const double tileHeight = 152;

  final String label;
  final IconData? icon;
  final String? imageUrl;
  final VoidCallback onTap;
  final bool isMore;

  factory CategorySliderTile.fromCategory({
    required Category category,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return CategorySliderTile(
      label: category.categoryName,
      icon: icon,
      imageUrl: resolveCategoryImageUrl(category),
      onTap: onTap,
    );
  }

  factory CategorySliderTile.more({required VoidCallback onTap}) {
    return CategorySliderTile(
      label: 'View All',
      onTap: onTap,
      isMore: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    final tileIcon = icon ?? Icons.category_outlined;

    return SizedBox(
      width: tileWidth,
      height: tileHeight,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
          child: Ink(
            decoration: BoxDecoration(
              color: isMore
                  ? AppColors.primary.withValues(alpha: 0.06)
                  : Colors.white,
              borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
              border: Border.all(
                color: isMore
                    ? AppColors.primary.withValues(alpha: 0.25)
                    : AppColors.borderLight,
              ),
              boxShadow: isMore ? null : AppDecorations.softShadow,
            ),
            child: Column(
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(10, 12, 10, 6),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: isMore
                            ? AppColors.primary.withValues(alpha: 0.1)
                            : Colors.white,
                        borderRadius:
                            BorderRadius.circular(AppDecorations.radiusMd),
                      ),
                      child: Center(
                        child: isMore
                            ? const Icon(
                                Icons.grid_view_rounded,
                                size: 40,
                                color: AppColors.primary,
                              )
                            : imageUrl != null
                                ? AppNetworkImage(
                                    imageUrl: imageUrl!,
                                    fit: BoxFit.contain,
                                    cacheWidth: 96,
                                    cacheHeight: 96,
                                    errorIcon: tileIcon,
                                    errorIconSize: 36,
                                  )
                                : Icon(
                                    tileIcon,
                                    size: 36,
                                    color: AppColors.textPrimary,
                                  ),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 0, 8, 12),
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color:
                          isMore ? AppColors.primary : AppColors.textPrimary,
                      height: 1.15,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Shared grid layout for category sections.
class CategoryGrid extends StatelessWidget {
  const CategoryGrid({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.crossAxisCount = 3,
    this.mainAxisSpacing = 14,
    this.crossAxisSpacing = 12,
    this.childAspectRatio = 0.82,
  });

  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final int crossAxisCount;
  final double mainAxisSpacing;
  final double crossAxisSpacing;
  final double childAspectRatio;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: itemCount,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: mainAxisSpacing,
        crossAxisSpacing: crossAxisSpacing,
        childAspectRatio: childAspectRatio,
      ),
      itemBuilder: itemBuilder,
    );
  }
}
