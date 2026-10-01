import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/providers/app_providers.dart';
import '../../../core/utils/product_pricing.dart';
import '../../../features/auth/auth_controller.dart';
import '../../../features/cart/cart_controller.dart';
import '../../../models/category.dart';
import '../../../models/product.dart';
import '../../../routes/route_paths.dart';
import '../../../widgets/category/triangular_category_card.dart';
import '../../../widgets/common/app_network_image.dart';
import '../../../widgets/product/deal_product_card.dart';
import '../home_providers.dart';

class CategoryPillsSection extends ConsumerWidget {
  const CategoryPillsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final currentStore = ref.watch(selectedStoreTabProvider);

    final sectionTitle = currentStore == 'festive'
        ? 'READY TO COOK CATEGORIES'
        : currentStore == 'mall'
            ? 'INSTANT ORDER CATEGORIES'
            : 'Explore GG Category';

    final sectionIcon = currentStore == 'festive'
        ? Icons.restaurant_menu_rounded
        : currentStore == 'mall'
            ? Icons.bolt_rounded
            : Icons.eco_rounded;

    final iconColor = currentStore == 'festive'
        ? const Color(0xFFC2410C)
        : currentStore == 'mall'
            ? const Color(0xFF1E40AF)
            : const Color(0xFF16A34A);

    return Container(
      width: double.infinity,
      color: const Color(0xFFF8FAFC), // Greyish white background
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ----------------------------------------------------
          // SECTION 1: Department Category Grid (2 Rows)
          // ----------------------------------------------------
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      sectionTitle,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 20.5,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Icon(
                      sectionIcon,
                      color: iconColor,
                      size: 22,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                categoriesAsync.when(
                  loading: () => const SizedBox(
                    height: 140,
                    child: Center(
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Color(0xFF0284C7),
                      ),
                    ),
                  ),
                  error: (err, stack) => const SizedBox.shrink(),
                  data: (categories) {
                    if (categories.isEmpty) return const SizedBox.shrink();

                    // 2 rows x 3 columns = 6 categories
                    final displayCats = categories.take(6).toList();
                    final catImages = categories.map((c) => c.categoryImage).toList();

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        GridView.builder(
                          shrinkWrap: true,
                          padding: EdgeInsets.zero,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            mainAxisSpacing: 10,
                            crossAxisSpacing: 10,
                            childAspectRatio: 0.88,
                          ),
                          itemCount: displayCats.length,
                          itemBuilder: (context, index) {
                            final cat = displayCats[index];
                            return CategoryTriangularCard(
                              categoryName: cat.categoryName,
                              imageUrl: cat.categoryImage,
                              index: index,
                              onTap: () {
                                context.push(
                                  '${RoutePaths.product}?categoryName=${Uri.encodeComponent(cat.categoryName)}',
                                );
                              },
                            );
                          },
                        ),
                        const SizedBox(height: 14),
                        _SeeAllButton(
                          title: 'See all categories',
                          categoryImages: catImages,
                          onTap: () => context.go(RoutePaths.categories),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),

          // Featured sub-sections only on main / preorder tab
          if (currentStore == 'main') ...[
            const Padding(
              padding: EdgeInsets.fromLTRB(14, 6, 14, 18),
              child: _ReadyToCookCategoriesSection(),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(14, 6, 14, 18),
              child: _InstantOrderProductsSection(),
            ),
            const _BookYourOrderSection(),
          ],
        ],
      ),
    );
  }
}

// =========================================================
// Generic Reusable Full-Width "See All" Button
// =========================================================
class _SeeAllButton extends StatelessWidget {
  const _SeeAllButton({
    required this.title,
    required this.categoryImages,
    required this.onTap,
  });

  final String title;
  final List<String> categoryImages;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final avatars = categoryImages.where((img) => img.isNotEmpty).take(3).toList();

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
              SizedBox(
                width: 52,
                height: 28,
                child: Stack(
                  children: [
                    for (int i = 0; i < (avatars.isEmpty ? 3 : avatars.length); i++)
                      Positioned(
                        left: i * 12.0,
                        child: Container(
                          width: 26,
                          height: 26,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFFF1F5F9),
                            border: Border.all(color: Colors.white, width: 1.5),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 3,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: ClipOval(
                            child: i < avatars.length && avatars[i].isNotEmpty
                                ? AppNetworkImage(
                                    imageUrl: avatars[i],
                                    fit: BoxFit.cover,
                                  )
                                : const Icon(
                                    Icons.category_rounded,
                                    size: 13,
                                    color: Color(0xFF64748B),
                                  ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
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

// =========================================================
// SECTION 2: Ready to Cook Categories Widget (2 Rows)
// =========================================================
class _ReadyToCookCategoriesSection extends ConsumerStatefulWidget {
  const _ReadyToCookCategoriesSection();

  @override
  ConsumerState<_ReadyToCookCategoriesSection> createState() =>
      __ReadyToCookCategoriesSectionState();
}

class __ReadyToCookCategoriesSectionState
    extends ConsumerState<_ReadyToCookCategoriesSection> {
  List<Category> _categories = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchCategories();
  }

  Future<void> _fetchCategories() async {
    try {
      final api = ref.read(apiServiceProvider);
      final cats = await api.fetchCategories(section: 'ready2cook');
      if (mounted) {
        setState(() {
          _categories = cats.where((c) => c.isActive).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(
        height: 140,
        child: Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: Color(0xFFEA580C),
          ),
        ),
      );
    }

    if (_categories.isEmpty) return const SizedBox.shrink();

    // 2 rows x 3 columns = 6 categories
    final displayCats = _categories.take(6).toList();
    final catImages = _categories.map((c) => c.categoryImage).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Ready to cook',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 20.5,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          padding: EdgeInsets.zero,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 0.88,
          ),
          itemCount: displayCats.length,
          itemBuilder: (context, index) {
            final cat = displayCats[index];
            return CategoryTriangularCard(
              categoryName: cat.categoryName,
              imageUrl: cat.categoryImage,
              errorIcon: Icons.restaurant_rounded,
              index: index + 3,
              onTap: () {
                context.push(
                  '${RoutePaths.product}?categoryName=${Uri.encodeComponent(cat.categoryName)}',
                );
              },
            );
          },
        ),
        const SizedBox(height: 14),
        _SeeAllButton(
          title: 'See all Ready to Cook categories',
          categoryImages: catImages,
          onTap: () => context.go(RoutePaths.categories),
        ),
      ],
    );
  }
}

// =========================================================
// SECTION 3: Your Instant Order Products Widget
// =========================================================
class _InstantOrderProductsSection extends ConsumerStatefulWidget {
  const _InstantOrderProductsSection();

  @override
  ConsumerState<_InstantOrderProductsSection> createState() =>
      __InstantOrderProductsSectionState();
}

class __InstantOrderProductsSectionState
    extends ConsumerState<_InstantOrderProductsSection> {
  List<Product> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    try {
      final api = ref.read(apiServiceProvider);
      var prods = await api.fetchProducts({'section': 'instantorder', 'limit': 12});
      if (prods.isEmpty) {
        prods = await api.fetchProducts({'limit': 12});
      }
      if (mounted) {
        setState(() {
          _products = prods.where((p) => p.isActive).take(6).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(
        height: 180,
        child: Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: Color(0xFF2563EB),
          ),
        ),
      );
    }

    if (_products.isEmpty) return const SizedBox.shrink();

    final productImages = _products.map((p) => p.primaryImage ?? '').toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Your Instant Order',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 20.5,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 12),
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
          itemCount: _products.length,
          itemBuilder: (context, index) {
            final product = _products[index];
            return _Image1ProductTile(product: product);
          },
        ),
        const SizedBox(height: 14),
        _SeeAllButton(
          title: 'See all Instant Order products',
          categoryImages: productImages,
          onTap: () {
            context.push(
              '${RoutePaths.product}?section=instantorder',
            );
          },
        ),
      ],
    );
  }
}

// =========================================================
// Image 1 Style Product Tile (Uses Blinkit DealProductCard)
// =========================================================
class _Image1ProductTile extends ConsumerWidget {
  const _Image1ProductTile({required this.product});

  final Product product;

  Future<void> _handleAdd(WidgetRef ref, BuildContext context) async {
    if (product.id.length < 10) return;
    final defaults = resolveCartDefaults(product);
    final result = await ref.read(cartControllerProvider.notifier).addToCart(
          product,
          defaults.quantity,
          variantName: defaults.variantName,
          colorName: defaults.colorName,
          flySourceContext: context,
        );
    if (result == AddToCartResult.requiresLogin) {
      ref.read(authControllerProvider.notifier).openAuthModal();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final qty = ref.watch(cartProductQuantityProvider(product.id));

    return DealProductCard(
      product: product,
      fillCell: true,
      cartQuantity: qty,
      onAdd: (ctx) => _handleAdd(ref, ctx),
    );
  }
}

// =========================================================
// SECTION 4: Book Your Order Products Widget
// =========================================================
class _BookYourOrderSection extends ConsumerStatefulWidget {
  const _BookYourOrderSection();

  @override
  ConsumerState<_BookYourOrderSection> createState() =>
      __BookYourOrderSectionState();
}

class __BookYourOrderSectionState extends ConsumerState<_BookYourOrderSection> {
  List<Product> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    try {
      final api = ref.read(apiServiceProvider);
      var prods = await api.fetchProducts({'section': 'preorder', 'limit': 12});
      if (prods.isEmpty) {
        prods = await api.fetchProducts({'limit': 12});
      }
      if (mounted) {
        setState(() {
          _products = prods.where((p) => p.isActive).take(6).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(
        height: 180,
        child: Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: Color(0xFF047857),
          ),
        ),
      );
    }

    if (_products.isEmpty) return const SizedBox.shrink();

    final productImages = _products.map((p) => p.primaryImage ?? '').toList();

    return Container(
      width: double.infinity,
      color: const Color(0xFFF0FDF4), // Soft mint background
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Book your order',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 21,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF064E3B),
                ),
              ),
              const SizedBox(width: 6),
              const Text(
                '🔥',
                style: TextStyle(fontSize: 22),
              ),
            ],
          ),
          const SizedBox(height: 12),
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
            itemCount: _products.length,
            itemBuilder: (context, index) {
              final product = _products[index];
              return _Image2ProductTile(product: product);
            },
          ),
          const SizedBox(height: 14),
          _SeeAllButton(
            title: 'See all Preorder products',
            categoryImages: productImages,
            onTap: () {
              context.push(
                '${RoutePaths.product}?section=preorder',
              );
            },
          ),
        ],
      ),
    );
  }
}

// =========================================================
// Image 2 Style Product Tile (Uses Blinkit DealProductCard)
// =========================================================
class _Image2ProductTile extends ConsumerWidget {
  const _Image2ProductTile({required this.product});

  final Product product;

  Future<void> _handleAdd(WidgetRef ref, BuildContext context) async {
    if (product.id.length < 10) return;
    final defaults = resolveCartDefaults(product);
    final result = await ref.read(cartControllerProvider.notifier).addToCart(
          product,
          defaults.quantity,
          variantName: defaults.variantName,
          colorName: defaults.colorName,
          flySourceContext: context,
        );
    if (result == AddToCartResult.requiresLogin) {
      ref.read(authControllerProvider.notifier).openAuthModal();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final qty = ref.watch(cartProductQuantityProvider(product.id));

    return DealProductCard(
      product: product,
      fillCell: true,
      cartQuantity: qty,
      onAdd: (ctx) => _handleAdd(ref, ctx),
    );
  }
}
