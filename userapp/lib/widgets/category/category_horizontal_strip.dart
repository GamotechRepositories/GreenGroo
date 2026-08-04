import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../models/category.dart';
import '../common/app_network_image.dart';
import 'category_grid_tile.dart';

/// Horizontal category row — frontend `CategoryListBox` mobile variant.
class CategoryHorizontalStrip extends StatelessWidget {
  const CategoryHorizontalStrip({
    super.key,
    required this.categories,
    required this.selectedCategoryName,
    required this.onSelect,
  });

  final List<Category> categories;
  final String? selectedCategoryName;
  final ValueChanged<String?> onSelect;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      child: SizedBox(
        height: 84,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: categories.length + 1,
          separatorBuilder: (_, _) => const SizedBox(width: 10),
          itemBuilder: (context, index) {
            if (index == 0) {
              return _CategoryStripItem(
                label: 'All',
                isActive: selectedCategoryName == null ||
                    selectedCategoryName!.isEmpty,
                showGridIcon: true,
                onTap: () => onSelect(null),
              );
            }

            final category = categories[index - 1];
            final isActive = selectedCategoryName != null &&
                selectedCategoryName!.toLowerCase() ==
                    category.categoryName.toLowerCase();

            return _CategoryStripItem(
              label: category.categoryName,
              imageUrl: resolveCategoryImageUrl(category),
              isActive: isActive,
              onTap: () => onSelect(category.categoryName),
            );
          },
        ),
      ),
    );
  }
}

class _CategoryStripItem extends StatelessWidget {
  const _CategoryStripItem({
    required this.label,
    required this.isActive,
    required this.onTap,
    this.imageUrl,
    this.showGridIcon = false,
  });

  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final String? imageUrl;
  final bool showGridIcon;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: SizedBox(
          width: 68,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: isActive
                      ? AppColors.primary.withValues(alpha: 0.1)
                      : AppColors.mobileSurface,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: showGridIcon
                    ? const Icon(
                        Icons.grid_view_rounded,
                        size: 22,
                        color: AppColors.textSecondary,
                      )
                    : imageUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: AppNetworkImage(
                              imageUrl: imageUrl!,
                              fit: BoxFit.contain,
                              cacheWidth: 96,
                              cacheHeight: 96,
                              errorIcon: Icons.category_outlined,
                            ),
                          )
                        : Center(
                            child: Text(
                              label.isNotEmpty
                                  ? label.characters.first.toUpperCase()
                                  : '?',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: isActive ? AppColors.primary : AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
