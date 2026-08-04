import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/utils/product_pricing.dart';
import '../../core/utils/product_search.dart';
import '../../core/utils/product_utils.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../features/home/home_providers.dart';
import '../../features/product/product_providers.dart';
import '../../models/cart_item.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../routes/route_paths.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
import '../../widgets/common/api_error_view.dart';
import '../../widgets/common/skeleton_loaders.dart';
import '../../widgets/product/deal_product_card.dart';
import '../../widgets/product/mobile_product_card.dart';
import '../../widgets/product/product_filter_sheet.dart';
import '../../widgets/product/product_filters_bar.dart';

class ProductListScreen extends ConsumerStatefulWidget {
  const ProductListScreen({
    super.key,
    this.searchQuery,
    this.categoryName,
    this.subcategory,
    this.brand,
    this.minPrice,
    this.maxPrice,
    this.sortId,
  });

  final String? searchQuery;
  final String? categoryName;
  final String? subcategory;
  final String? brand;
  final String? minPrice;
  final String? maxPrice;
  final String? sortId;

  @override
  ConsumerState<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends ConsumerState<ProductListScreen> {
  late ProductSortOption _sort;
  late final TabScrollRegistry _tabScrollRegistry;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabScrollRegistry = ref.read(tabScrollRegistryProvider);
    _sort =
        ProductSortOption.fromId(widget.sortId) ?? ProductSortOption.listingDefault;
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

  @override
  void didUpdateWidget(ProductListScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.sortId != widget.sortId) {
      _sort = ProductSortOption.fromId(widget.sortId) ??
          ProductSortOption.listingDefault;
    }
  }

  ProductQuery get _query => ProductQuery(
        categoryName: widget.categoryName,
        search: widget.searchQuery,
        brandName: widget.brand,
      );

  String get _title {
    if (widget.searchQuery != null && widget.searchQuery!.isNotEmpty) {
      return 'Results for "${widget.searchQuery}"';
    }
    if (widget.categoryName != null && widget.categoryName!.isNotEmpty) {
      return widget.categoryName!;
    }
    if (widget.brand != null && widget.brand!.isNotEmpty) {
      return widget.brand!;
    }
    return 'All Products';
  }

  void _updateSort(ProductSortOption option) {
    setState(() => _sort = option);
    final path = ProductSearch.buildPath(
      query: widget.searchQuery ?? '',
      categoryName: widget.categoryName ?? '',
      subcategory: widget.subcategory ?? '',
      brand: widget.brand ?? '',
      minPrice: widget.minPrice ?? '',
      maxPrice: widget.maxPrice ?? '',
      sort: option.id,
    );
    context.go(path);
  }

  void _updateBrand(String brand) {
    _applyFilters(
      brand: brand.trim().isEmpty ? null : brand.trim(),
      minPrice: widget.minPrice,
      maxPrice: widget.maxPrice,
    );
  }

  void _clearListingFilters() {
    setState(() => _sort = ProductSortOption.listingDefault);
    final path = ProductSearch.buildPath(
      query: widget.searchQuery ?? '',
      categoryName: widget.categoryName ?? '',
      subcategory: widget.subcategory ?? '',
      sort: ProductSortOption.listingDefault.id,
    );
    context.go(path);
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

  void _applyFilters({
    String? brand,
    String? minPrice,
    String? maxPrice,
  }) {
    final path = ProductSearch.buildPath(
      query: widget.searchQuery ?? '',
      categoryName: widget.categoryName ?? '',
      subcategory: widget.subcategory ?? '',
      brand: brand ?? '',
      minPrice: minPrice ?? '',
      maxPrice: maxPrice ?? '',
      sort: widget.sortId ?? _sort.id,
    );
    context.go(path);
  }

  void _openFilters(List<Product> products) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => ProductFilterSheet(
        brands: extractBrands(products),
        currentBrand: widget.brand,
        currentMinPrice: widget.minPrice,
        currentMaxPrice: widget.maxPrice,
        onApply: ({brand, minPrice, maxPrice}) => _applyFilters(
          brand: brand,
          minPrice: minPrice,
          maxPrice: maxPrice,
        ),
        onClear: () => _applyFilters(),
      ),
    );
  }

  bool get _hasActiveFilters =>
      (widget.brand?.isNotEmpty ?? false) ||
      (widget.minPrice?.isNotEmpty ?? false) ||
      (widget.maxPrice?.isNotEmpty ?? false) ||
      (_sort != ProductSortOption.listingDefault &&
          _sort.id != ProductSortOption.listingDefault.id);

  Future<void> _refreshProducts() async {
    ref.invalidate(productListProvider(_query));
    await ref.read(productListProvider(_query).future);
  }

  void _goBack() {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.go(RoutePaths.home);
  }

  bool get _showBack {
    if (widget.searchQuery != null && widget.searchQuery!.isNotEmpty) {
      return true;
    }
    if (widget.categoryName != null && widget.categoryName!.isNotEmpty) {
      return true;
    }
    if (widget.brand != null && widget.brand!.isNotEmpty) {
      return true;
    }
    if (widget.subcategory != null && widget.subcategory!.isNotEmpty) {
      return true;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productListProvider(_query));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _ProductToolbar(
          title: _title,
          onBack: _showBack ? _goBack : null,
          onFilter: productsAsync.hasValue
              ? () => _openFilters(productsAsync.requireValue)
              : null,
          filtersActive: _hasActiveFilters,
        ),
        if (widget.categoryName != null && widget.categoryName!.isNotEmpty)
          _CategoryPillsSection(
            activeCategory: widget.categoryName!,
            subcategory: widget.subcategory,
          ),
        productsAsync.when(
          loading: () => ProductFiltersBar(
            brands: const [],
            selectedBrand: widget.brand ?? '',
            sortBy: _sort,
            onBrandChange: _updateBrand,
            onSortChange: _updateSort,
            hasActiveFilters: _hasActiveFilters,
            onClear: _clearListingFilters,
          ),
          error: (_, _) => const SizedBox.shrink(),
          data: (products) => ProductFiltersBar(
            brands: extractBrands(products),
            selectedBrand: widget.brand ?? '',
            sortBy: _sort,
            onBrandChange: _updateBrand,
            onSortChange: _updateSort,
            hasActiveFilters: _hasActiveFilters,
            onClear: _clearListingFilters,
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _refreshProducts,
            child: productsAsync.when(
              loading: () => const SkeletonProductGrid(useShellBottomInset: true),
              error: (_, _) => ApiErrorView(
                message: 'Could not load products',
                onRetry: _refreshProducts,
              ),
              data: (products) => _ProductResultsView(
                scrollController: _scrollController,
                products: products,
                searchQuery: widget.searchQuery,
                categoryName: widget.categoryName,
                subcategory: widget.subcategory,
                brand: widget.brand,
                minPrice: widget.minPrice,
                maxPrice: widget.maxPrice,
                sort: _sort,
                onAdd: _handleAdd,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ProductResultsView extends ConsumerStatefulWidget {
  const _ProductResultsView({
    required this.scrollController,
    required this.products,
    required this.searchQuery,
    required this.categoryName,
    required this.subcategory,
    required this.brand,
    required this.minPrice,
    required this.maxPrice,
    required this.sort,
    required this.onAdd,
  });

  final ScrollController scrollController;
  final List<Product> products;
  final String? searchQuery;
  final String? categoryName;
  final String? subcategory;
  final String? brand;
  final String? minPrice;
  final String? maxPrice;
  final ProductSortOption sort;
  final Future<void> Function(Product, BuildContext) onAdd;

  @override
  ConsumerState<_ProductResultsView> createState() => _ProductResultsViewState();
}

class _ProductResultsViewState extends ConsumerState<_ProductResultsView> {
  late List<Product> _filtered;

  @override
  void initState() {
    super.initState();
    _filtered = _computeFiltered();
  }

  @override
  void didUpdateWidget(_ProductResultsView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.products != widget.products ||
        oldWidget.subcategory != widget.subcategory ||
        oldWidget.brand != widget.brand ||
        oldWidget.minPrice != widget.minPrice ||
        oldWidget.maxPrice != widget.maxPrice ||
        oldWidget.sort != widget.sort) {
      _filtered = _computeFiltered();
    }
  }

  List<Product> _computeFiltered() {
    return filterAndSortProducts(
      products: widget.products,
      subcategory: widget.subcategory,
      brand: widget.brand,
      minPrice: widget.minPrice,
      maxPrice: widget.maxPrice,
      sort: widget.sort,
    );
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
    if (_filtered.isEmpty) {
      return Center(
        child: Text(
          widget.brand != null && widget.brand!.isNotEmpty
              ? 'No products found for brand "${widget.brand}".'
              : widget.searchQuery != null
                  ? 'No products found for "${widget.searchQuery}".'
                  : 'No products available yet.',
          style: const TextStyle(color: AppColors.textSecondary),
        ),
      );
    }

    final isSearchOnly = widget.searchQuery != null &&
        widget.searchQuery!.isNotEmpty &&
        (widget.categoryName == null || widget.categoryName!.isEmpty);

    if (isSearchOnly) {
      return ListView.separated(
        controller: widget.scrollController,
        physics: AppScrollConfig.listPhysics,
        cacheExtent: AppScrollConfig.cacheExtent,
        padding: ShellBottomInsets.listPadding(context, top: 16),
        itemCount: _filtered.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final product = _filtered[index];
          return MobileProductCard(
            product: product,
            cartQuantity: ref.watch(cartProductQuantityProvider(product.id)),
            onAdd: (context) => widget.onAdd(product, context),
            onIncrease: () => _handleIncrease(product),
            onDecrease: () => _handleDecrease(product),
          );
        },
      );
    }

    return CustomScrollView(
      controller: widget.scrollController,
      physics: AppScrollConfig.listPhysics,
      cacheExtent: AppScrollConfig.cacheExtent,
      slivers: [
        SliverPadding(
          padding: ShellBottomInsets.listPadding(context, top: 16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: DealProductCardDimensions.gridChildAspectRatio,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final product = _filtered[index];
                return DealProductCard(
                  product: product,
                  fillCell: true,
                  cartQuantity: ref.watch(cartProductQuantityProvider(product.id)),
                  onAdd: (context) => widget.onAdd(product, context),
                  onIncrease: () => _handleIncrease(product),
                  onDecrease: () => _handleDecrease(product),
                );
              },
              childCount: _filtered.length,
            ),
          ),
        ),
      ],
    );
  }
}

class _CategoryPillsSection extends ConsumerWidget {
  const _CategoryPillsSection({
    required this.activeCategory,
    this.subcategory,
  });

  final String activeCategory;
  final String? subcategory;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(categoriesProvider).value ?? const <Category>[];
    Category? active;
    for (final category in categories) {
      if (category.categoryName == activeCategory) {
        active = category;
        break;
      }
    }
    final subcategories = active?.subcategories ?? const <String>[];

    return _CategoryPills(
      categories: categories,
      activeCategory: activeCategory,
      subcategories: subcategories,
      activeSubcategory: subcategory,
    );
  }
}

class _ProductToolbar extends StatelessWidget {
  const _ProductToolbar({
    required this.title,
    this.onBack,
    this.onFilter,
    this.filtersActive = false,
  });

  final String title;
  final VoidCallback? onBack;
  final VoidCallback? onFilter;
  final bool filtersActive;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          if (onBack != null)
            IconButton(
              onPressed: onBack,
              icon: const Icon(Icons.arrow_back_ios_new, size: 18),
              visualDensity: VisualDensity.compact,
            ),
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
            ),
          ),
          if (onFilter != null)
            OutlinedButton.icon(
              onPressed: onFilter,
              icon: Icon(
                Icons.filter_list,
                size: 16,
                color: filtersActive ? AppColors.primary : AppColors.textSecondary,
              ),
              label: const Text('Filter'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                foregroundColor:
                    filtersActive ? AppColors.primary : AppColors.textPrimary,
                textStyle: const TextStyle(
                  inherit: false,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
                side: BorderSide(
                  color: filtersActive
                      ? AppColors.primary
                      : AppColors.borderLight,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _CategoryPills extends StatelessWidget {
  const _CategoryPills({
    required this.categories,
    required this.activeCategory,
    required this.subcategories,
    this.activeSubcategory,
  });

  final List<Category> categories;
  final String activeCategory;
  final List<String> subcategories;
  final String? activeSubcategory;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 40,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: categories.length + 1,
            itemBuilder: (context, index) {
              if (index == 0) {
                return _pill(context, 'All', false, () => context.go(RoutePaths.product));
              }
              final cat = categories[index - 1];
              return _pill(
                context,
                cat.categoryName,
                cat.categoryName == activeCategory,
                () => context.go(
                  ProductSearch.buildPath(categoryName: cat.categoryName),
                ),
              );
            },
          ),
        ),
        if (subcategories.isNotEmpty)
          SizedBox(
            height: 36,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
              itemCount: subcategories.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  return _pill(
                    context,
                    'All',
                    activeSubcategory == null || activeSubcategory!.isEmpty,
                    () => context.go(
                      ProductSearch.buildPath(categoryName: activeCategory),
                    ),
                    compact: true,
                  );
                }
                final sub = subcategories[index - 1];
                return _pill(
                  context,
                  sub,
                  activeSubcategory == sub,
                  () => context.go(
                    ProductSearch.buildPath(
                      categoryName: activeCategory,
                      subcategory: sub,
                    ),
                  ),
                  compact: true,
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _pill(
    BuildContext context,
    String label,
    bool active,
    VoidCallback onTap, {
    bool compact = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ActionChip(
        label: Text(label, style: TextStyle(fontSize: compact ? 11 : 12)),
        backgroundColor: active ? AppColors.primary : Colors.white,
        labelStyle: TextStyle(color: active ? Colors.white : AppColors.textPrimary),
        side: BorderSide(
          color: active ? AppColors.primary : AppColors.borderLight,
        ),
        onPressed: onTap,
      ),
    );
  }
}
