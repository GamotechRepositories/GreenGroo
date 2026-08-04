import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/product_search.dart';
import '../../../models/category.dart';
import '../../../routes/route_paths.dart';
import '../../../widgets/category/category_grid_tile.dart';
import '../../../widgets/common/api_error_view.dart';
import '../../../widgets/common/section_header.dart';
import '../../../widgets/common/skeleton_loaders.dart';
import '../home_providers.dart';
import 'home_section_card.dart';

const _mobileItemsPerSlide = 6;
const _desktopItemsPerSlide = 12;
const _gridColumnsMobile = 3;
const _gridColumnsDesktop = 6;
const _gridRows = 2;
const _gridSpacing = 10.0;

List<Category> sortCategories(List<Category> categories, {required bool ascending}) {
  final sorted = [...categories];
  sorted.sort((a, b) {
    final result = a.categoryName.toLowerCase().compareTo(b.categoryName.toLowerCase());
    return ascending ? result : -result;
  });
  return sorted;
}

List<List<T>> chunkItems<T>(List<T> items, int size) {
  final batches = <List<T>>[];
  for (var index = 0; index < items.length; index += size) {
    final end = (index + size > items.length) ? items.length : index + size;
    batches.add(items.sublist(index, end));
  }
  return batches;
}

/// Home landing — two 2-row category sliders (A→Z and Z→A).
class CategoryNavSection extends ConsumerWidget {
  const CategoryNavSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return categoriesAsync.when(
      loading: () => const HomeSectionCard(
        margin: EdgeInsets.fromLTRB(0, 8, 0, 4),
        padding: EdgeInsets.fromLTRB(16, 0, 16, 0),
        child: SkeletonCategoryTwoRowSliders(),
      ),
      error: (_, _) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: ApiErrorView(
          message: 'Could not load categories',
          onRetry: () => ref.invalidate(categoriesProvider),
        ),
      ),
      data: (categories) {
        final filtered = filterShopCategories(categories);
        if (filtered.isEmpty) return const SizedBox.shrink();

        final categoriesAZ = sortCategories(filtered, ascending: true);
        final categoriesZA = sortCategories(filtered, ascending: false);

        return HomeSectionCard(
          margin: const EdgeInsets.fromLTRB(0, 8, 0, 4),
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
          showDivider: true,
          child: Column(
            children: [
              SectionHeader(
                title: 'Explore Our Categories',
                dense: true,
                onViewAll: () => context.go(RoutePaths.categories),
              ),
              CategoryTwoRowSlider(categories: categoriesAZ, sectionKey: 'az'),
              const SizedBox(height: 12),
              CategoryTwoRowSlider(categories: categoriesZA, sectionKey: 'za'),
            ],
          ),
        );
      },
    );
  }
}

class CategoryTwoRowSlider extends StatelessWidget {
  const CategoryTwoRowSlider({
    super.key,
    required this.categories,
    required this.sectionKey,
  });

  final List<Category> categories;
  final String sectionKey;

  int _itemsPerSlide(double width) {
    return width >= 1024 ? _desktopItemsPerSlide : _mobileItemsPerSlide;
  }

  int _columnsForWidth(double width) {
    return width >= 1024 ? _gridColumnsDesktop : _gridColumnsMobile;
  }

  double _gridHeight(double pageWidth, int columns) {
    final tileWidth = (pageWidth - _gridSpacing * (columns - 1)) / columns;
    final tileHeight = tileWidth / 0.78;
    return tileHeight * _gridRows + _gridSpacing * (_gridRows - 1);
  }

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    return LayoutBuilder(
      builder: (context, constraints) {
        final pageWidth = constraints.maxWidth;
        final itemsPerSlide = _itemsPerSlide(pageWidth);
        final columns = _columnsForWidth(pageWidth);
        final batches = chunkItems(categories, itemsPerSlide);
        final gridHeight = _gridHeight(pageWidth, columns);
        final iconByCategoryId = {
          for (var i = 0; i < categories.length; i++)
            categories[i].id: categoryIconTypes[i % categoryIconTypes.length],
        };

        return SizedBox(
          height: gridHeight,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const PageScrollPhysics(),
            itemCount: batches.length,
            itemBuilder: (context, pageIndex) {
              final batch = batches[pageIndex];
              return SizedBox(
                width: pageWidth,
                height: gridHeight,
                child: GridView.builder(
                  padding: EdgeInsets.zero,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: columns,
                    mainAxisSpacing: _gridSpacing,
                    crossAxisSpacing: _gridSpacing,
                    childAspectRatio: 0.78,
                  ),
                  itemCount: batch.length,
                  itemBuilder: (context, index) {
                    final category = batch[index];

                    return CategoryGridTile.fromCategory(
                      category: category,
                      icon: iconByCategoryId[category.id] ??
                          categoryIconTypes.first,
                      style: CategoryTileStyle.card,
                      onTap: () {
                        context.go(
                          ProductSearch.buildPath(
                            categoryName: category.categoryName,
                          ),
                        );
                      },
                    );
                  },
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class SkeletonCategoryTwoRowSliders extends StatelessWidget {
  const SkeletonCategoryTwoRowSliders({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        SkeletonBox(width: 200, height: 24, borderRadius: 6),
        SizedBox(height: 16),
        SkeletonCategoryTwoRowPage(),
        SizedBox(height: 12),
        SkeletonCategoryTwoRowPage(),
      ],
    );
  }
}

class SkeletonCategoryTwoRowPage extends StatelessWidget {
  const SkeletonCategoryTwoRowPage({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 6,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 0.78,
      ),
      itemBuilder: (_, _) => const SkeletonBox(borderRadius: 12),
    );
  }
}
