import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/providers/app_providers.dart';
import '../../../models/product.dart';
import '../../../routes/route_paths.dart';
import '../../../widgets/common/app_network_image.dart';
import '../../cart/cart_controller.dart';
import '../home_providers.dart';

class HomeAllCategoryProducts extends ConsumerWidget {
  const HomeAllCategoryProducts({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return categoriesAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: Color(0xFF0C831F),
          ),
        ),
      ),
      error: (err, stack) => const SizedBox.shrink(),
      data: (categories) {
        final activeCategories = categories
            .where((c) => c.isActive && c.categoryName.trim().isNotEmpty)
            .toList();

        if (activeCategories.isEmpty) return const SizedBox.shrink();

        // Select 5 to 8 categories total across departments
        final displayCategories = activeCategories.take(8).toList();

        return Container(
          width: double.infinity,
          color: const Color(0xFFF8FAFC),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: displayCategories
                .map(
                  (cat) => _CategoryProductSection(
                    categoryName: cat.categoryName,
                  ),
                )
                .toList(),
          ),
        );
      },
    );
  }
}

class _CategoryProductSection extends ConsumerStatefulWidget {
  const _CategoryProductSection({
    required this.categoryName,
  });

  final String categoryName;

  @override
  ConsumerState<_CategoryProductSection> createState() =>
      __CategoryProductSectionState();
}

class __CategoryProductSectionState
    extends ConsumerState<_CategoryProductSection> {
  List<Product> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    try {
      final products = await ref.read(apiServiceProvider).fetchProducts({
        'categoryName': widget.categoryName,
        'limit': 12,
      });
      if (mounted) {
        setState(() {
          _products = products.where((p) => p.isActive).take(6).toList();
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
            color: Color(0xFF0C831F),
          ),
        ),
      );
    }

    if (_products.isEmpty) return const SizedBox.shrink();

    final productImages = _products.map((p) => p.primaryImage ?? '').toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 6, 14, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category Title
          Text(
            widget.categoryName,
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
              childAspectRatio: 0.48,
            ),
            itemCount: _products.length,
            itemBuilder: (context, index) {
              final product = _products[index];
              return _Image2ProductTile(product: product);
            },
          ),
          const SizedBox(height: 14),

          // Full-width See All Button
          _SeeAllButton(
            title: 'See all ${widget.categoryName} products',
            categoryImages: productImages,
            onTap: () {
              context.push(
                '${RoutePaths.product}?categoryName=${Uri.encodeComponent(widget.categoryName)}',
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
    final cartQty = ref.watch(cartProductQuantityProvider(product.id));
    final sellingPrice = product.effectivePrice;
    final originalPrice = product.price;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => context.push('/product/${product.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(7),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top tag (e.g. Top Rated) & Heart Icon Stack
              Stack(
                children: [
                  Container(
                    height: 74,
                    width: double.infinity,
                    alignment: Alignment.center,
                    child: AppNetworkImage(
                      imageUrl: product.primaryImage ?? '',
                      fit: BoxFit.contain,
                    ),
                  ),
                  Positioned(
                    top: 0,
                    left: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Top Rated',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 8.5,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFFB45309),
                        ),
                      ),
                    ),
                  ),
                  const Positioned(
                    top: 0,
                    right: 0,
                    child: Icon(
                      Icons.favorite_border_rounded,
                      size: 15,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),

              // Weight / Unit
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Text(
                  product.weightUnit.isNotEmpty ? product.weightUnit : '1 unit',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF334155),
                  ),
                ),
              ),
              const SizedBox(height: 4),

              // Price
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    '₹${sellingPrice.toStringAsFixed(0)}',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  if (originalPrice > sellingPrice) ...[
                    const SizedBox(width: 3),
                    Text(
                      '₹${originalPrice.toStringAsFixed(0)}',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 9.5,
                        decoration: TextDecoration.lineThrough,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ],
              ),
              if (originalPrice > sellingPrice)
                Text(
                  '₹${(originalPrice - sellingPrice).toStringAsFixed(0)} OFF',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF2563EB),
                  ),
                ),
              const SizedBox(height: 2),

              // Title
              Text(
                product.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  height: 1.2,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),

              // Rating & ADD button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.star_rounded,
                        size: 11,
                        color: Color(0xFFEAB308),
                      ),
                      const SizedBox(width: 1),
                      Text(
                        '4.8',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                  if (cartQty == 0)
                    InkWell(
                      onTap: () {
                        ref
                            .read(cartControllerProvider.notifier)
                            .addToCart(product, 1);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFF16A34A)),
                        ),
                        child: Text(
                          'ADD',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF16A34A),
                          ),
                        ),
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF16A34A),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '$cartQty in cart',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
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
