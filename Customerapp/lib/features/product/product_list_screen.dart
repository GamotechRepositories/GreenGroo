import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

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
import '../../widgets/common/api_error_view.dart';
import '../../widgets/common/app_network_image.dart';
import '../../widgets/common/skeleton_loaders.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
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

  void _applySubcategory(String? subcategory) {
    final path = ProductSearch.buildPath(
      query: widget.searchQuery ?? '',
      categoryName: widget.categoryName ?? '',
      subcategory: subcategory ?? '',
      brand: widget.brand ?? '',
      minPrice: widget.minPrice ?? '',
      maxPrice: widget.maxPrice ?? '',
      sort: widget.sortId ?? _sort.id,
    );
    context.go(path);
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
    final showLeftSidebar =
        widget.categoryName != null && widget.categoryName!.isNotEmpty;

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
        Expanded(
          child: productsAsync.when(
            loading: () => const SkeletonProductGrid(useShellBottomInset: true),
            error: (_, _) => ApiErrorView(
              message: 'Could not load products',
              onRetry: _refreshProducts,
            ),
            data: (products) {
              return Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (showLeftSidebar)
                    _LeftSubcategorySidebar(
                      activeCategory: widget.categoryName!,
                      activeSubcategory: widget.subcategory,
                      products: products,
                      onSelectSubcategory: _applySubcategory,
                    ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        ProductFiltersBar(
                          brands: extractBrands(products),
                          selectedBrand: widget.brand ?? '',
                          sortBy: _sort,
                          onBrandChange: _updateBrand,
                          onSortChange: _updateSort,
                          hasActiveFilters: _hasActiveFilters,
                          onClear: _clearListingFilters,
                        ),
                        Expanded(
                          child: RefreshIndicator(
                            onRefresh: _refreshProducts,
                            child: _ProductResultsView(
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
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }
}

class _SubcategoryItem {
  final String name;
  final String? imageUrl;
  _SubcategoryItem({required this.name, this.imageUrl});
}

class _LeftSubcategorySidebar extends ConsumerWidget {
  const _LeftSubcategorySidebar({
    required this.activeCategory,
    required this.activeSubcategory,
    required this.products,
    required this.onSelectSubcategory,
  });

  final String activeCategory;
  final String? activeSubcategory;
  final List<Product> products;
  final ValueChanged<String?> onSelectSubcategory;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(categoriesProvider).value ?? const <Category>[];
    Category? activeCat;
    for (final c in categories) {
      if (c.categoryName.toLowerCase().trim() == activeCategory.toLowerCase().trim()) {
        activeCat = c;
        break;
      }
    }

    final subcategoryNames = <String>[];
    if (activeCat != null && activeCat.subcategories.isNotEmpty) {
      subcategoryNames.addAll(activeCat.subcategories);
    } else {
      for (final p in products) {
        if (p.subcategory.isNotEmpty && !subcategoryNames.contains(p.subcategory)) {
          subcategoryNames.add(p.subcategory);
        }
      }
    }

    final subItems = <_SubcategoryItem>[
      _SubcategoryItem(
        name: 'All',
        imageUrl: (activeCat != null && activeCat.categoryImage.trim().isNotEmpty)
            ? activeCat.categoryImage.trim()
            : null,
      ),
    ];

    for (final sub in subcategoryNames) {
      String? img;
      for (final p in products) {
        if (p.subcategory.toLowerCase().trim() == sub.toLowerCase().trim() &&
            p.productImages.isNotEmpty &&
            p.productImages.first.trim().isNotEmpty) {
          img = p.productImages.first.trim();
          break;
        }
      }
      subItems.add(_SubcategoryItem(name: sub, imageUrl: img));
    }

    return Container(
      width: 78,
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        border: Border(
          right: BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
      ),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 6),
        itemCount: subItems.length,
        itemBuilder: (context, index) {
          final item = subItems[index];
          final isAll = index == 0;
          final isSelected = isAll
              ? (activeSubcategory == null || activeSubcategory!.isEmpty)
              : (activeSubcategory?.toLowerCase().trim() ==
                  item.name.toLowerCase().trim());

          return InkWell(
            onTap: () => onSelectSubcategory(isAll ? null : item.name),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white : Colors.transparent,
                border: Border(
                  left: BorderSide(
                    color: isSelected ? const Color(0xFF047857) : Colors.transparent,
                    width: 3.5,
                  ),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFFECFDF5)
                          : const Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF047857)
                            : const Color(0xFFE2E8F0),
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    padding: const EdgeInsets.all(4),
                    child: ClipOval(
                      child: item.imageUrl != null
                          ? AppNetworkImage(
                              imageUrl: item.imageUrl!,
                              fit: BoxFit.cover,
                              errorIcon: Icons.category_rounded,
                              errorIconSize: 20,
                            )
                          : const Icon(
                              Icons.category_rounded,
                              size: 20,
                              color: Color(0xFF047857),
                            ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 10.5,
                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                      color: isSelected
                          ? const Color(0xFF047857)
                          : const Color(0xFF475569),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ProductToolbar extends ConsumerStatefulWidget {
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
  ConsumerState<_ProductToolbar> createState() => _ProductToolbarState();
}

class _ProductToolbarState extends ConsumerState<_ProductToolbar> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _submitSearch(String query) {
    final trimmed = query.trim();
    if (trimmed.isEmpty) return;
    context.push('${RoutePaths.product}?q=${Uri.encodeComponent(trimmed)}');
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
      ),
      padding: EdgeInsets.only(
        top: topInset + 6,
        left: 10,
        right: 10,
        bottom: 8,
      ),
      child: Row(
        children: [
          if (widget.onBack != null)
            IconButton(
              onPressed: widget.onBack,
              icon: const Icon(Icons.arrow_back_rounded,
                  size: 22, color: Color(0xFF0F172A)),
              visualDensity: VisualDensity.compact,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 130),
            child: Text(
              widget.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w800,
                fontSize: 14,
                color: const Color(0xFF0F172A),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              height: 38,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Row(
                children: [
                  const Icon(
                    Icons.search_rounded,
                    size: 18,
                    color: Color(0xFF64748B),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onSubmitted: _submitSearch,
                      textInputAction: TextInputAction.search,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF111827),
                      ),
                      decoration: InputDecoration(
                        hintText: 'Search in ${widget.title}...',
                        hintStyle: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          color: const Color(0xFF94A3B8),
                        ),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
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
  ConsumerState<_ProductResultsView> createState() =>
      _ProductResultsViewState();
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
          padding: ShellBottomInsets.listPadding(context, top: 12),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: DealProductCardDimensions.gridChildAspectRatio,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final product = _filtered[index];
                return DealProductCard(
                  product: product,
                  fillCell: true,
                  cartQuantity:
                      ref.watch(cartProductQuantityProvider(product.id)),
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
