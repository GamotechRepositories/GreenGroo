import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../models/category.dart';
import '../../../routes/route_paths.dart';
import '../../../widgets/common/app_network_image.dart';
import '../home_providers.dart';

/// Website `SHOP_BY_CATEGORY_ITEMS` (PreOrder home).
const shopByCategoryItems = <({String name, String image, String filter})>[
  (name: 'Vegetables', image: 'category_vegetables.jpg', filter: 'Vegetables'),
  (name: 'Spices & Dry Fruits', image: 'category_spices_dry_fruits.jpg', filter: 'Spices'),
  (name: 'Pulses & Grains', image: 'category_pulses_grains.jpg', filter: 'Pulses'),
  (name: 'Exotic Vegetables', image: 'category_exotic_vegetables.jpg', filter: 'Vegetables'),
  (name: 'Fruits', image: 'category_fruits.jpg', filter: 'Fruits'),
  (name: 'Organic Range', image: 'category_organic_range.jpg', filter: 'Organic'),
  (name: 'Dairy & Eggs', image: 'category_dairy_eggs.png', filter: 'Dairy'),
  (name: 'Beverages & More', image: 'category_beverages.jpg', filter: 'Beverages'),
  (name: 'Combo Packs', image: 'category_combo_packs.jpg', filter: 'Organic'),
  (name: 'Oils & Ghee', image: 'category_oils_ghee.jpg', filter: 'Oils'),
];

String _categoryUrl(String name) =>
    '${RoutePaths.product}?categoryName=${Uri.encodeComponent(name)}';

class CategoryPillsSection extends ConsumerWidget {
  const CategoryPillsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentStore = ref.watch(selectedStoreTabProvider);
    if (currentStore == 'main') return const _ShopByCategory();
    return _DepartmentCategories(isInstant: currentStore == 'mall');
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.title, this.subtitle, required this.linkColor});

  final String title;
  final String? subtitle;
  final Color linkColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF111827),
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle!,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF6B7280),
                  ),
                ),
            ],
          ),
        ),
        GestureDetector(
          onTap: () => context.go(RoutePaths.categories),
          child: Row(
            children: [
              Text(
                'View All',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: linkColor,
                ),
              ),
              const SizedBox(width: 3),
              Icon(Icons.arrow_forward_rounded, size: 14, color: linkColor),
            ],
          ),
        ),
      ],
    );
  }
}

/// Website ShopByCategory (mobile): two swipeable rows of bordered 135px cards.
class _ShopByCategory extends StatelessWidget {
  const _ShopByCategory();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 0, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(right: 12),
            child: _Header(title: 'Shop by Category', linkColor: Color(0xFF14532D)),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 2 * 129 + 10,
            child: GridView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(right: 12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                mainAxisExtent: 135,
              ),
              itemCount: shopByCategoryItems.length,
              itemBuilder: (context, i) {
                final item = shopByCategoryItems[i];
                return BorderedCategoryCard(
                  name: item.name,
                  image: Image.asset('assets/website/${item.image}', fit: BoxFit.contain),
                  onTap: () => context.push(_categoryUrl(item.filter)),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class BorderedCategoryCard extends StatelessWidget {
  const BorderedCategoryCard({
    super.key,
    required this.name,
    required this.image,
    required this.onTap,
  });

  final String name;
  final Widget image;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xE6E5E7EB)),
          boxShadow: const [
            BoxShadow(color: Color(0x08000000), blurRadius: 4, offset: Offset(0, 1)),
          ],
        ),
        child: Column(
          children: [
            AspectRatio(
              aspectRatio: 4 / 3,
              child: ClipRRect(borderRadius: BorderRadius.circular(12), child: image),
            ),
            const Spacer(),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1F2937),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Website FestiveStoreSection categories: tinted cards, name top-left, image bottom-right.
class _DepartmentCategories extends ConsumerWidget {
  const _DepartmentCategories({required this.isInstant});

  final bool isInstant;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Header(
            title: 'Shop by Category',
            subtitle: isInstant
                ? 'Top groceries, essentials & packaged foods'
                : 'Fresh picks for every kitchen need',
            linkColor: isInstant ? const Color(0xFF1D4ED8) : const Color(0xFF92400E),
          ),
          const SizedBox(height: 14),
          categoriesAsync.when(
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            ),
            error: (_, _) => const SizedBox.shrink(),
            data: (categories) {
              if (categories.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'No categories yet.',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ),
                );
              }
              return GridView.builder(
                shrinkWrap: true,
                padding: EdgeInsets.zero,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: isInstant ? 3 : 4,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  mainAxisExtent: 100,
                ),
                itemCount: categories.length,
                itemBuilder: (context, i) => _DepartmentCategoryCard(category: categories[i]),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _DepartmentCategoryCard extends StatelessWidget {
  const _DepartmentCategoryCard({required this.category});

  final Category category;

  @override
  Widget build(BuildContext context) {
    final count = category.productCount;
    return GestureDetector(
      onTap: () => context.push(_categoryUrl(category.categoryName)),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFE8F8EE),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFF3F4F6)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 10, 4, 0),
              child: FractionallySizedBox(
                widthFactor: 0.62,
                alignment: Alignment.topLeft,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      category.categoryName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        height: 1.15,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      count > 0 ? '$count+ items' : 'Shop now',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              right: 6,
              bottom: 6,
              width: 44,
              height: 44,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: category.categoryImage.isEmpty
                    ? const SizedBox.shrink()
                    : AppNetworkImage(imageUrl: category.categoryImage, fit: BoxFit.cover),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
