import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/theme.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/theme/store_chrome.dart';
import '../../core/utils/product_pricing.dart';
import '../../core/utils/product_search.dart';
import '../../core/utils/product_utils.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../features/home/home_providers.dart';
import '../../features/home/widgets/home_delivery_bar.dart';
import '../../features/home/widgets/home_header_category_strip.dart';
import '../../features/home/widgets/home_search_bar.dart';
import '../../features/product/product_providers.dart';
import '../../models/cart_item.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../widgets/common/api_error_view.dart';
import '../../widgets/common/app_network_image.dart';
import '../../widgets/common/skeleton_loaders.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
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

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productListProvider(_query));
    final showLeftSidebar =
        widget.categoryName != null && widget.categoryName!.isNotEmpty;
    final topInset = MediaQuery.paddingOf(context).top;
    final activeCategoryName = widget.categoryName ?? 'All';

    // Keep selected category header tab synchronized
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (ref.read(selectedCategoryHeaderTabProvider) != activeCategoryName) {
        ref
            .read(selectedCategoryHeaderTabProvider.notifier)
            .setCategory(activeCategoryName);
      }
    });

    final currentStore = ref.watch(selectedStoreTabProvider);

    return NestedScrollView(
      headerSliverBuilder: (context, innerBoxIsScrolled) => [
        SliverPersistentHeader(
          pinned: true,
          delegate: _StickyHeaderDelegate(
            topInset: topInset,
            currentStore: currentStore,
          ),
        ),
      ],
      body: productsAsync.when(
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
    );
  }
}

class _StickyHeaderDelegate extends SliverPersistentHeaderDelegate {
  final double topInset;
  final String currentStore;

  _StickyHeaderDelegate({
    required this.topInset,
    required this.currentStore,
  });

  @override
  double get minExtent => topInset + 104.0;

  @override
  double get maxExtent => topInset + 172.0;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    final currentExtent =
        (maxExtent - shrinkOffset).clamp(minExtent, maxExtent);
    final maxShrink = maxExtent - minExtent;
    final progress =
        maxShrink > 0 ? (shrinkOffset / maxShrink).clamp(0.0, 1.0) : 1.0;
    final deliveryBarHeight = (68.0 * (1.0 - progress)).clamp(0.0, 68.0);

    final headerBgColor = StoreChrome.forStore(currentStore).header;

    return SizedBox(
      height: currentExtent,
      child: ColoredBox(
        color: headerBgColor,
        child: Padding(
          padding: EdgeInsets.only(top: topInset),
          child: ClipRect(
            child: OverflowBox(
              minHeight: 0,
              maxHeight: 300,
              alignment: Alignment.topCenter,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (progress < 1.0)
                    SizedBox(
                      height: deliveryBarHeight,
                      child: OverflowBox(
                        minHeight: 68.0,
                        maxHeight: 68.0,
                        alignment: Alignment.bottomCenter,
                        child: Opacity(
                          opacity: (1.0 - progress * 1.5).clamp(0.0, 1.0),
                          child: const HomeDeliveryBar(),
                        ),
                      ),
                    ),
                  const HomeSearchBar(isLightBg: true),
                  const HomeHeaderCategoryStrip(isLightBg: true),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _StickyHeaderDelegate oldDelegate) {
    return oldDelegate.topInset != topInset || oldDelegate.currentStore != currentStore;
  }
}

class _SubcategoryItem {
  final String name;
  final String? imageUrl;
  _SubcategoryItem({required this.name, this.imageUrl});
}

class _LeftSubcategorySidebar extends ConsumerStatefulWidget {
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
  ConsumerState<_LeftSubcategorySidebar> createState() =>
      _LeftSubcategorySidebarState();
}

class _LeftSubcategorySidebarState
    extends ConsumerState<_LeftSubcategorySidebar> {
  final _sidebarScrollController = ScrollController();

  @override
  void dispose() {
    _sidebarScrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categories =
        ref.watch(categoriesProvider).value ?? const <Category>[];
    Category? activeCat;
    for (final c in categories) {
      if (c.categoryName.toLowerCase().trim() ==
          widget.activeCategory.toLowerCase().trim()) {
        activeCat = c;
        break;
      }
    }

    final subcategoryNames = <String>[];
    if (activeCat != null && activeCat.subcategories.isNotEmpty) {
      subcategoryNames.addAll(activeCat.subcategories);
    } else {
      for (final p in widget.products) {
        if (p.subcategory.isNotEmpty &&
            !subcategoryNames.contains(p.subcategory)) {
          subcategoryNames.add(p.subcategory);
        }
      }
    }

    final subItems = <_SubcategoryItem>[
      _SubcategoryItem(
        name: 'All',
        imageUrl:
            (activeCat != null && activeCat.categoryImage.trim().isNotEmpty)
                ? activeCat.categoryImage.trim()
                : null,
      ),
    ];

    for (final sub in subcategoryNames) {
      String? img;
      for (final p in widget.products) {
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
      child: NotificationListener<ScrollNotification>(
        onNotification: (ScrollNotification notification) {
          return true; // Isolate sidebar scroll from ancestor NestedScrollView
        },
        child: ListView.builder(
          controller: _sidebarScrollController,
          physics: const ClampingScrollPhysics(),
          padding: const EdgeInsets.symmetric(vertical: 4),
          itemCount: subItems.length,
          itemBuilder: (context, index) {
          final item = subItems[index];
          final isAll = index == 0;
          final isSelected = isAll
              ? (widget.activeSubcategory == null ||
                  widget.activeSubcategory!.isEmpty)
              : (widget.activeSubcategory?.toLowerCase().trim() ==
                  item.name.toLowerCase().trim());

          return InkWell(
            onTap: () => widget.onSelectSubcategory(isAll ? null : item.name),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white : Colors.transparent,
                border: Border(
                  left: BorderSide(
                    color: isSelected
                        ? const Color(0xFF047857)
                        : Colors.transparent,
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
                      fontWeight:
                          isSelected ? FontWeight.w800 : FontWeight.w600,
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
    ),
  );
  }
}

class _ProductResultsView extends ConsumerStatefulWidget {
  const _ProductResultsView({
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
        oldWidget.searchQuery != widget.searchQuery ||
        oldWidget.categoryName != widget.categoryName ||
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
      searchQuery: widget.searchQuery,
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
            flySourceContext: context,
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

    return CustomScrollView(
      physics: AppScrollConfig.listPhysics,
      cacheExtent: AppScrollConfig.cacheExtent,
      slivers: [
        SliverPadding(
          padding: ShellBottomInsets.listPadding(context, top: 12),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 8,
              mainAxisSpacing: 10,
              childAspectRatio: 0.48,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final product = _filtered[index];
                return _ThreeColumnProductCard(
                  product: product,
                  cartQuantity:
                      ref.watch(cartProductQuantityProvider(product.id)),
                  onAdd: (ctx) => widget.onAdd(product, ctx),
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

class _ThreeColumnProductCard extends ConsumerWidget {
  const _ThreeColumnProductCard({
    required this.product,
    required this.cartQuantity,
    required this.onAdd,
    required this.onIncrease,
    required this.onDecrease,
  });

  final Product product;
  final int cartQuantity;
  final void Function(BuildContext context) onAdd;
  final VoidCallback onIncrease;
  final VoidCallback onDecrease;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sellingPrice = product.effectivePrice;
    final originalPrice = product.price;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
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
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Image with Feature Badge
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
                  if (product.badge.isNotEmpty || product.discountedPercent > 0)
                    Positioned(
                      top: 0,
                      left: 0,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          product.badge.isNotEmpty
                              ? product.badge
                              : '${product.discountedPercent.round()}% OFF',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 8.0,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFFB45309),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 4),

              // Weight / Subcategory Tag
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Text(
                  product.weightUnit.isNotEmpty ? product.weightUnit : '1 unit',
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 9.0,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF334155),
                  ),
                ),
              ),
              const SizedBox(height: 4),

              // Price Row
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    '₹${sellingPrice.toStringAsFixed(0)}',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12.0,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  if (originalPrice > sellingPrice) ...[
                    const SizedBox(width: 3),
                    Text(
                      '₹${originalPrice.toStringAsFixed(0)}',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 9.0,
                        decoration: TextDecoration.lineThrough,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 2),

              // Title
              Text(
                product.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10.0,
                  fontWeight: FontWeight.w700,
                  height: 1.2,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const Spacer(),

              // Rating Star & ADD Button / Stepper
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
                        product.ratings > 0
                            ? product.ratings.toStringAsFixed(1)
                            : '4.8',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                  if (cartQuantity == 0)
                    InkWell(
                      onTap: () => onAdd(context),
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
                        horizontal: 4,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF16A34A),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          GestureDetector(
                            onTap: onDecrease,
                            child: const Icon(
                              Icons.remove,
                              size: 12,
                              color: Colors.white,
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Text(
                              '$cartQuantity',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: onIncrease,
                            child: const Icon(
                              Icons.add,
                              size: 12,
                              color: Colors.white,
                            ),
                          ),
                        ],
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
