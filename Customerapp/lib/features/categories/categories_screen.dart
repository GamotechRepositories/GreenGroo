import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/theme.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/utils/product_pricing.dart';
import '../../models/cart_item.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../widgets/category/category_grid_tile.dart';
import '../../widgets/category/category_header_section.dart';
import '../../widgets/category/category_horizontal_strip.dart';
import '../../widgets/common/app_loading.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
import '../../widgets/product/deal_product_card.dart';
import '../auth/auth_controller.dart';
import '../cart/cart_controller.dart';
import '../home/home_providers.dart';
import '../product/product_providers.dart';

class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  String? _selectedCategoryName;
  String? _selectedSubcategory;
  late final TabScrollRegistry _tabScrollRegistry;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabScrollRegistry = ref.read(tabScrollRegistryProvider);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _tabScrollRegistry.register(ShellTabIndex.categories, _scrollController);
    });
  }

  @override
  void dispose() {
    _tabScrollRegistry.unregister(ShellTabIndex.categories, _scrollController);
    _scrollController.dispose();
    super.dispose();
  }

  Category? _findCategory(List<Category> categories, String? name) {
    if (name == null || name.isEmpty) return null;
    final lower = name.toLowerCase();
    for (final category in categories) {
      if (category.categoryName.toLowerCase() == lower) return category;
    }
    return null;
  }

  List<Product> _filterBySubcategory(
    List<Product> products,
    String? subcategory,
  ) {
    if (subcategory == null || subcategory.isEmpty) return products;
    final lower = subcategory.toLowerCase();
    return products
        .where((p) => p.subcategory.toLowerCase() == lower)
        .toList();
  }

  Future<void> _handleAdd(Product product, BuildContext context) async {
    final defaults = resolveCartDefaults(product);
    final result =
        await ref.read(cartControllerProvider.notifier).addToCart(
              product,
              defaults.quantity,
              variantName: defaults.variantName,
              colorName: defaults.colorName,
              flySourceContext: context,
            );
    if (result == AddToCartResult.requiresLogin && mounted) {
      ref.read(authControllerProvider.notifier).openAuthModal();
    }
  }

  CartItem? _cartLineForProduct(List<CartItem> cartItems, Product product) {
    final defaults = resolveCartDefaults(product);
    for (final item in cartItems) {
      if (item.id != product.id) continue;
      if (item.variantName.trim() != defaults.variantName.trim()) continue;
      if (item.colorName.trim() != defaults.colorName.trim()) continue;
      return item;
    }
    return null;
  }

  Future<void> _handleIncrease(Product product) async {
    final cartItems = ref.read(cartControllerProvider).items;
    final line = _cartLineForProduct(cartItems, product);
    if (line == null) {
      final defaults = resolveCartDefaults(product);
      final result = await ref.read(cartControllerProvider.notifier).addToCart(
            product,
            defaults.quantity,
            variantName: defaults.variantName,
            colorName: defaults.colorName,
          );
      if (result == AddToCartResult.requiresLogin && mounted) {
        ref.read(authControllerProvider.notifier).openAuthModal();
      }
      return;
    }
    final step = getCartStepForProduct(product, line.variantName);
    await ref.read(cartControllerProvider.notifier).updateCartLineQuantity(
          productId: product.id,
          quantity: line.quantity + step,
          variantName: line.variantName,
          colorName: line.colorName,
        );
  }

  Future<void> _handleDecrease(Product product) async {
    final cartItems = ref.read(cartControllerProvider).items;
    final line = _cartLineForProduct(cartItems, product);
    if (line == null) return;

    final nextQty = getDecreasedCartQuantityForProduct(
      product,
      line.quantity,
      line.variantName,
    );
    if (nextQty <= 0) {
      await ref.read(cartControllerProvider.notifier).removeFromCartLine(
            productId: product.id,
            variantName: line.variantName,
            colorName: line.colorName,
          );
      return;
    }

    await ref.read(cartControllerProvider.notifier).updateCartLineQuantity(
          productId: product.id,
          quantity: nextQty,
          variantName: line.variantName,
          colorName: line.colorName,
        );
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final productQuery = ProductQuery(
      categoryName: _selectedCategoryName?.isNotEmpty == true
          ? _selectedCategoryName
          : null,
    );
    final productsAsync = ref.watch(productListProvider(productQuery));

    return ColoredBox(
      color: AppColors.mobileSurface,
      child: categoriesAsync.when(
        loading: () => const AppLoading(message: 'Loading categories...'),
        error: (error, _) {
          final fallback = resolveDisplayCategories(const []);
          return _CategoriesProductLayout(
            scrollController: _scrollController,
            categories: fallback,
            productsAsync: productsAsync,
            selectedCategoryName: _selectedCategoryName,
            selectedSubcategory: _selectedSubcategory,
            activeCategory: _findCategory(fallback, _selectedCategoryName),
            onCategorySelected: (name) {
              setState(() {
                _selectedCategoryName = name;
                _selectedSubcategory = null;
              });
            },
            onSubcategorySelected: (sub) {
              setState(() => _selectedSubcategory = sub);
            },
            onAdd: _handleAdd,
            onIncrease: _handleIncrease,
            onDecrease: _handleDecrease,
            onRefresh: () async {
              ref.invalidate(categoriesProvider);
              ref.invalidate(productListProvider(productQuery));
            },
            filterBySubcategory: _filterBySubcategory,
          );
        },
        data: (categories) {
          final displayCategories = resolveDisplayCategories(categories);
          return _CategoriesProductLayout(
            scrollController: _scrollController,
            categories: displayCategories,
            productsAsync: productsAsync,
            selectedCategoryName: _selectedCategoryName,
            selectedSubcategory: _selectedSubcategory,
            activeCategory:
                _findCategory(displayCategories, _selectedCategoryName),
            onCategorySelected: (name) {
              setState(() {
                _selectedCategoryName = name;
                _selectedSubcategory = null;
              });
            },
            onSubcategorySelected: (sub) {
              setState(() => _selectedSubcategory = sub);
            },
            onAdd: _handleAdd,
            onIncrease: _handleIncrease,
            onDecrease: _handleDecrease,
            onRefresh: () async {
              ref.invalidate(categoriesProvider);
              ref.invalidate(productListProvider(productQuery));
            },
            filterBySubcategory: _filterBySubcategory,
          );
        },
      ),
    );
  }
}

class _CategoriesProductLayout extends StatelessWidget {
  const _CategoriesProductLayout({
    required this.scrollController,
    required this.categories,
    required this.productsAsync,
    required this.selectedCategoryName,
    required this.selectedSubcategory,
    required this.activeCategory,
    required this.onCategorySelected,
    required this.onSubcategorySelected,
    required this.onAdd,
    required this.onIncrease,
    required this.onDecrease,
    required this.onRefresh,
    required this.filterBySubcategory,
  });

  final ScrollController scrollController;
  final List<Category> categories;
  final AsyncValue<List<Product>> productsAsync;
  final String? selectedCategoryName;
  final String? selectedSubcategory;
  final Category? activeCategory;
  final ValueChanged<String?> onCategorySelected;
  final ValueChanged<String?> onSubcategorySelected;
  final Future<void> Function(Product, BuildContext) onAdd;
  final Future<void> Function(Product) onIncrease;
  final Future<void> Function(Product) onDecrease;
  final Future<void> Function() onRefresh;
  final List<Product> Function(List<Product>, String?) filterBySubcategory;

  @override
  Widget build(BuildContext context) {
    final hasCategory = selectedCategoryName != null &&
        selectedCategoryName!.isNotEmpty;
    final subcategories = activeCategory?.subcategories ?? const <String>[];

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppColors.primary,
      child: CustomScrollView(
        controller: scrollController,
        physics: AppScrollConfig.listPhysics,
        cacheExtent: AppScrollConfig.cacheExtent,
        slivers: [
          SliverPersistentHeader(
            pinned: true,
            delegate: _StickyCategoryStripDelegate(
              categories: categories,
              selectedCategoryName: selectedCategoryName,
              onSelect: onCategorySelected,
            ),
          ),
          if (hasCategory)
            SliverToBoxAdapter(
              child: CategoryHeaderSection(
                category: activeCategory,
                categoryName: selectedCategoryName!,
                subcategories: subcategories,
                selectedSubcategory: selectedSubcategory,
                onSubcategorySelected: onSubcategorySelected,
              ),
            ),
          productsAsync.when(
            loading: () => const SliverFillRemaining(
              hasScrollBody: false,
              child: AppLoading(message: 'Loading products...'),
            ),
            error: (error, _) => SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      error.toString(),
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: onRefresh,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
            data: (products) {
              final filtered =
                  filterBySubcategory(products, selectedSubcategory);

              if (filtered.isEmpty) {
                return SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Text(
                      hasCategory
                          ? 'No products in this category.'
                          : 'No products available yet.',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 8,
                    childAspectRatio: DealProductCardDimensions.gridChildAspectRatio,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final product = filtered[index];
                      return _CategoryDealCard(
                        product: product,
                        onAdd: (context) => onAdd(product, context),
                        onIncrease: () => onIncrease(product),
                        onDecrease: () => onDecrease(product),
                      );
                    },
                    childCount: filtered.length,
                  ),
                ),
              );
            },
          ),
          SliverToBoxAdapter(
            child: SizedBox(height: ShellBottomInsets.of(context)),
          ),
        ],
      ),
    );
  }
}

class _StickyCategoryStripDelegate extends SliverPersistentHeaderDelegate {
  _StickyCategoryStripDelegate({
    required this.categories,
    required this.selectedCategoryName,
    required this.onSelect,
  });

  /// Matches [CategoryHorizontalStrip] padding (10+10) + list height (84).
  static const double stripHeight = 104;

  final List<Category> categories;
  final String? selectedCategoryName;
  final ValueChanged<String?> onSelect;

  @override
  double get minExtent => stripHeight;

  @override
  double get maxExtent => stripHeight;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Material(
      color: Colors.white,
      elevation: overlapsContent || shrinkOffset > 0 ? 1.5 : 0,
      shadowColor: const Color(0x1A000000),
      child: CategoryHorizontalStrip(
        categories: categories,
        selectedCategoryName: selectedCategoryName,
        onSelect: onSelect,
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _StickyCategoryStripDelegate oldDelegate) {
    return oldDelegate.selectedCategoryName != selectedCategoryName ||
        oldDelegate.categories != categories ||
        oldDelegate.onSelect != onSelect;
  }
}

class _CategoryDealCard extends ConsumerWidget {
  const _CategoryDealCard({
    required this.product,
    required this.onAdd,
    required this.onIncrease,
    required this.onDecrease,
  });

  final Product product;
  final void Function(BuildContext context) onAdd;
  final VoidCallback onIncrease;
  final VoidCallback onDecrease;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final qty = ref.watch(cartProductQuantityProvider(product.id));

    return DealProductCard(
      product: product,
      fillCell: true,
      cartQuantity: qty,
      onAdd: onAdd,
      onIncrease: onIncrease,
      onDecrease: onDecrease,
    );
  }
}
