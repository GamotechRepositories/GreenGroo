import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../models/product.dart';
import '../../../routes/route_paths.dart';
import '../../../widgets/common/app_network_image.dart';
import '../../../widgets/common/skeleton_loaders.dart';
import '../../../widgets/product/deal_product_card.dart';
import '../../../features/cart/cart_controller.dart';
import '../home_providers.dart';

/// Category rows on home, as a sliver: each row is built — and its products
/// fetched — only when it scrolls near the screen, instead of all at once.
class HomeAllCategoryProducts extends ConsumerWidget {
  const HomeAllCategoryProducts({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return categoriesAsync.when(
      loading: () => const SliverToBoxAdapter(child: _CategorySectionSkeleton()),
      error: (err, stack) => const SliverToBoxAdapter(child: SizedBox.shrink()),
      data: (categories) {
        final names = categories
            .where((c) => c.isActive && c.categoryName.trim().isNotEmpty)
            .map((c) => c.categoryName)
            .toList();
        if (names.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());

        return SliverList.builder(
          itemCount: names.length,
          itemBuilder: (context, index) => _CategoryProductSection(
            key: ValueKey('home-cat-${names[index]}'),
            categoryName: names[index],
          ),
        );
      },
    );
  }
}

class _CategoryProductSection extends ConsumerWidget {
  const _CategoryProductSection({super.key, required this.categoryName});

  final String categoryName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(categoryPreviewProductsProvider(categoryName));
    return productsAsync.when(
      loading: () => const _CategorySectionSkeleton(),
      error: (_, _) => const SizedBox.shrink(),
      data: (products) => products.isEmpty
          ? const SizedBox.shrink()
          : _CategoryProductGrid(categoryName: categoryName, products: products),
    );
  }
}

class _CategorySectionSkeleton extends StatelessWidget {
  const _CategorySectionSkeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 6, 14, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SkeletonBox(width: 150, height: 22, borderRadius: 6),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: DealProductCardDimensions.gridChildAspectRatio,
            children: List.generate(3, (_) => const SkeletonBox(borderRadius: 12)),
          ),
        ],
      ),
    );
  }
}

class _CategoryProductGrid extends StatelessWidget {
  const _CategoryProductGrid({required this.categoryName, required this.products});

  final String categoryName;
  final List<Product> products;

  @override
  Widget build(BuildContext context) {
    final productImages = products.map((p) => p.primaryImage ?? '').toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 6, 14, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category Title
          Text(
            categoryName,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 20.5,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 12),

          // 2 Rows of 3 Columns Product Grid (6 Products) using Book Your Order card format
          GridView.builder(
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: DealProductCardDimensions.gridChildAspectRatio,
            ),
            itemCount: products.length,
            itemBuilder: (context, index) {
              final product = products[index];
              return _Image2ProductTile(product: product);
            },
          ),
          const SizedBox(height: 14),

          // Full-width See All Button
          _SeeAllButton(
            title: 'See all ${categoryName} products',
            categoryImages: productImages,
            onTap: () {
              context.push(
                '${RoutePaths.product}?categoryName=${Uri.encodeComponent(categoryName)}',
              );
            },
          ),
        ],
      ),
    );
  }
}

// =========================================================
// Image 2 Style Product Tile (Same format as Book Your Order)
// =========================================================
class _Image2ProductTile extends ConsumerWidget {
  const _Image2ProductTile({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DealProductCard(
      product: product,
      fillCell: true,
      cartQuantity: ref.watch(cartProductQuantityProvider(product.id)),
      onAdd: (ctx) {
        ref.read(cartControllerProvider.notifier).addToCart(product, 1);
      },
    );
  }
}

class _SeeAllButton extends StatelessWidget {
  const _SeeAllButton({
    required this.title,
    required this.onTap,
    this.categoryImages = const [],
  });

  final String title;
  final VoidCallback onTap;
  final List<String> categoryImages;

  @override
  Widget build(BuildContext context) {
    final avatars =
        categoryImages.where((img) => img.isNotEmpty).take(3).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          height: 40,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (avatars.isNotEmpty) ...[
                SizedBox(
                  width: 44,
                  height: 26,
                  child: Stack(
                    children: [
                      for (int i = 0; i < avatars.length; i++)
                        Positioned(
                          left: i * 11.0,
                          child: Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFFF1F5F9),
                              border:
                                  Border.all(color: Colors.white, width: 1.5),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 3,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                            child: ClipOval(
                              child: AppNetworkImage(
                                imageUrl: avatars[i],
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF475569),
                  ),
                ),
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.play_arrow_rounded,
                color: Color(0xFF64748B),
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
