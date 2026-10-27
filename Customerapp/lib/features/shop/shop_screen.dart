import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/providers/app_providers.dart';
import '../../core/providers/location_provider.dart';
import '../../core/utils/department_utils.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../widgets/common/app_network_image.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
import '../../widgets/product/deal_product_card.dart';
import '../home/home_providers.dart';
import '../home/widgets/site_banner_widgets.dart';
import '../product/catalog_flow_screen.dart';

typedef ShopKey = ({String category, String section});

final shopProductsProvider =
    FutureProvider.autoDispose.family<List<Product>, ShopKey>((ref, key) async {
  ref.watch(deliveryLocationKeyProvider);
  final products = await ref.read(apiServiceProvider).fetchProducts({
    if (key.category.isNotEmpty) 'categoryName': key.category,
    'section': key.section,
    'limit': 200,
  });
  final dept = departmentForSection(key.section);
  return products.where((p) => p.isActive && p.department == dept).toList();
});

const _green = Color(0xFF0C831F);
const _slate800 = Color(0xFF1E293B);
const _gray500 = Color(0xFF6B7280);
const _fallbackCategoryImage = 'assets/website/category_vegetables.jpg';

enum _Sort { relevance, priceLow, priceHigh, discount, newest }

const _sortLabels = {
  _Sort.relevance: 'Relevance',
  _Sort.priceLow: 'Price: Low to High',
  _Sort.priceHigh: 'Price: High to Low',
  _Sort.discount: 'Biggest Discount',
  _Sort.newest: 'Newest First',
};

class _Filters {
  const _Filters({
    this.sort = _Sort.relevance,
    this.brand = '',
    this.maxPrice,
    this.onSale = false,
    this.inStock = false,
  });

  final _Sort sort;
  final String brand;
  final double? maxPrice;
  final bool onSale;
  final bool inStock;

  bool get active =>
      sort != _Sort.relevance || brand.isNotEmpty || maxPrice != null || onSale || inStock;
}

String _sectionForStore(String store) {
  if (store == 'festive' || store == 'ready2cook') return 'ready2cook';
  if (store == 'mall' || store == 'instantorder') return 'instantorder';
  return 'preorder';
}

/// Website mobile `/product` (`AllProductsLayout`): category picker header,
/// left category rail, shop banner, 2-column product grid and a filter FAB.
class ShopScreen extends ConsumerStatefulWidget {
  const ShopScreen({super.key});

  @override
  ConsumerState<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends ConsumerState<ShopScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  bool _searchOpen = false;
  String _category = '';
  _Filters _filters = const _Filters();

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _selectCategory(String name) {
    if (name == _category) return;
    setState(() {
      _category = name;
      _filters = const _Filters();
    });
    if (_scrollController.hasClients) _scrollController.jumpTo(0);
  }

  List<Product> _apply(List<Product> source) {
    final needle = _searchController.text.trim().toLowerCase();
    final f = _filters;
    final list = source.where((p) {
      if (needle.isNotEmpty &&
          !'${p.name} ${p.brandName} ${p.categories.join(' ')}'.toLowerCase().contains(needle)) {
        return false;
      }
      if (f.brand.isNotEmpty && p.brandName.trim() != f.brand) return false;
      if (f.maxPrice != null && p.effectivePrice > f.maxPrice!) return false;
      if (f.onSale && !(p.discountedPrice > 0 && p.discountedPrice < p.price)) return false;
      if (f.inStock && p.stock <= 0) return false;
      return true;
    }).toList();
    double discount(Product p) =>
        p.price > 0 && p.discountedPrice > 0 ? (p.price - p.discountedPrice) / p.price : 0;
    switch (f.sort) {
      case _Sort.priceLow:
        list.sort((a, b) => a.effectivePrice.compareTo(b.effectivePrice));
      case _Sort.priceHigh:
        list.sort((a, b) => b.effectivePrice.compareTo(a.effectivePrice));
      case _Sort.discount:
        list.sort((a, b) => discount(b).compareTo(discount(a)));
      case _Sort.newest:
        list.sort((a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));
      case _Sort.relevance:
        break;
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final store = ref.watch(selectedStoreTabProvider);
    final section = _sectionForStore(store);
    final categories = (ref.watch(categoriesProvider).value ?? const <Category>[])
        .where((c) => c.categoryName.trim().isNotEmpty)
        .toList();
    final key = (category: _category, section: section);
    final async = ref.watch(shopProductsProvider(key));
    final source = async.value ?? const <Product>[];
    final products = _apply(source);
    final activeImage = _category.isEmpty
        ? _fallbackCategoryImage
        : categories
                .where((c) => c.categoryName == _category)
                .map((c) => c.categoryImage)
                .firstWhere((s) => s.isNotEmpty, orElse: () => _fallbackCategoryImage);

    return ColoredBox(
      color: Colors.white,
      child: Stack(
        children: [
          Column(
            children: [
              _ShopHeader(
                image: activeImage,
                categoryLabel: _category.isEmpty ? 'All Categories' : _category,
                searchOpen: _searchOpen,
                searchController: _searchController,
                onSearchToggle: () => setState(() {
                  _searchOpen = !_searchOpen;
                  if (!_searchOpen) _searchController.clear();
                }),
                onSearchChanged: () => setState(() {}),
                onPickCategory: () => _showCategorySheet(categories),
              ),
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _CategoryRail(
                      categories: categories,
                      active: _category,
                      onSelect: _selectCategory,
                    ),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: () async {
                          ref.invalidate(shopProductsProvider(key));
                          await ref.read(shopProductsProvider(key).future);
                        },
                        child: CustomScrollView(
                          controller: _scrollController,
                          physics: const AlwaysScrollableScrollPhysics(),
                          slivers: [
                            SliverToBoxAdapter(
                              child: SiteBannerCarousel(
                                slot: (section: bannerSectionForStore(store), placement: 'shop'),
                                padding: const EdgeInsets.fromLTRB(8, 8, 12, 4),
                                radius: 16,
                                interval: const Duration(seconds: 4),
                                fallbackAspect: 1024 / 342,
                              ),
                            ),
                            ..._results(async, products, () => ref.invalidate(shopProductsProvider(key))),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          Positioned(
            right: 16,
            bottom: ShellBottomInsets.of(context) + 16,
            child: _FilterFab(
              active: _filters.active,
              onTap: () => _showFilterSheet(source),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _results(AsyncValue<List<Product>> async, List<Product> products, VoidCallback retry) {
    if (async.isLoading && !async.hasValue) {
      return [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(8, 8, 12, 0),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: DealProductCardDimensions.gridChildAspectRatio,
            ),
            delegate: SliverChildBuilderDelegate(
              (_, _) => DecoratedBox(
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              childCount: 6,
            ),
          ),
        ),
      ];
    }
    if (async.hasError && products.isEmpty) {
      return [
        SliverToBoxAdapter(
          child: Column(
            children: [
              _message('Could not load products'),
              TextButton(onPressed: retry, child: const Text('Retry')),
            ],
          ),
        ),
      ];
    }
    if (products.isEmpty) {
      return [SliverToBoxAdapter(child: _message('No products found'))];
    }
    return [
      SliverPadding(
        padding: EdgeInsets.fromLTRB(8, 8, 12, ShellBottomInsets.of(context) + 72),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: DealProductCardDimensions.gridChildAspectRatio,
          ),
          delegate: SliverChildBuilderDelegate(
            (context, i) => CatalogProductCard(product: products[i]),
            childCount: products.length,
          ),
        ),
      ),
    ];
  }

  Widget _message(String text) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 48),
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: GoogleFonts.plusJakartaSans(fontSize: 14, color: const Color(0xFF94A3B8)),
        ),
      );

  void _showCategorySheet(List<Category> categories) {
    showModalBottomSheet<void>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final tiles = [
          (name: '', label: 'All Categories', image: _fallbackCategoryImage),
          for (final c in categories)
            (name: c.categoryName, label: c.categoryName, image: c.categoryImage),
        ];
        return ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(ctx).height * 0.75),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 8, 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Categories',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: _slate800,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                ),
                Flexible(
                  child: GridView.builder(
                    shrinkWrap: true,
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 14,
                      mainAxisExtent: 128,
                    ),
                    itemCount: tiles.length,
                    itemBuilder: (_, i) {
                      final t = tiles[i];
                      final active = t.name == _category;
                      return GestureDetector(
                        onTap: () {
                          Navigator.of(ctx).pop();
                          _selectCategory(t.name);
                        },
                        child: Column(
                          children: [
                            AspectRatio(
                              aspectRatio: 1,
                              child: Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: active ? _green : const Color(0xFFE5E7EB),
                                    width: active ? 2 : 1,
                                  ),
                                ),
                                clipBehavior: Clip.antiAlias,
                                child: _CategoryImage(src: t.image),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              t.label,
                              maxLines: 2,
                              textAlign: TextAlign.center,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 11.5,
                                height: 1.2,
                                fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                                color: active ? _green : _slate800,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showFilterSheet(List<Product> source) {
    final brands = source
        .map((p) => p.brandName.trim())
        .where((b) => b.isNotEmpty)
        .toSet()
        .toList()
      ..sort();
    final prices = source.map((p) => p.effectivePrice).where((p) => p > 0);
    final ceiling = prices.isEmpty ? 0.0 : prices.reduce((a, b) => a > b ? a : b).ceilToDouble();

    showModalBottomSheet<void>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => _FilterSheet(
        initial: _filters,
        brands: brands,
        ceiling: ceiling,
        onApply: (f) => setState(() => _filters = f),
      ),
    );
  }
}

class _CategoryImage extends StatelessWidget {
  const _CategoryImage({required this.src});

  final String src;

  @override
  Widget build(BuildContext context) {
    if (src.isEmpty) return const ColoredBox(color: Color(0xFFF1F5F9));
    if (src.startsWith('assets/')) return Image.asset(src, fit: BoxFit.cover);
    return AppNetworkImage(imageUrl: src);
  }
}

class _ShopHeader extends StatelessWidget {
  const _ShopHeader({
    required this.image,
    required this.categoryLabel,
    required this.searchOpen,
    required this.searchController,
    required this.onSearchToggle,
    required this.onSearchChanged,
    required this.onPickCategory,
  });

  final String image;
  final String categoryLabel;
  final bool searchOpen;
  final TextEditingController searchController;
  final VoidCallback onSearchToggle;
  final VoidCallback onSearchChanged;
  final VoidCallback onPickCategory;

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;
    return Container(
      padding: EdgeInsets.fromLTRB(12, topInset + 8, 12, 10),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: searchOpen
          ? Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: searchController,
                    autofocus: true,
                    onChanged: (_) => onSearchChanged(),
                    style: GoogleFonts.plusJakartaSans(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Search for Product',
                      isDense: true,
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      prefixIcon: const Icon(Icons.search_rounded, size: 20),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: _green),
                      ),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: onSearchToggle,
                  icon: const Icon(Icons.close_rounded, color: _slate800),
                ),
              ],
            )
          : Row(
              children: [
                GestureDetector(
                  onTap: onPickCategory,
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: _CategoryImage(src: image),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GestureDetector(
                        onTap: onSearchToggle,
                        behavior: HitTestBehavior.opaque,
                        child: Text(
                          'Search for Product',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFF9CA3AF),
                          ),
                        ),
                      ),
                      const SizedBox(height: 2),
                      GestureDetector(
                        onTap: onPickCategory,
                        behavior: HitTestBehavior.opaque,
                        child: Row(
                          children: [
                            Flexible(
                              child: Text(
                                categoryLabel,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  color: _green,
                                ),
                              ),
                            ),
                            const Icon(Icons.keyboard_arrow_down_rounded, color: _green, size: 20),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: onSearchToggle,
                  icon: const Icon(Icons.search_rounded, color: _slate800),
                ),
              ],
            ),
    );
  }
}

class _CategoryRail extends StatelessWidget {
  const _CategoryRail({required this.categories, required this.active, required this.onSelect});

  final List<Category> categories;
  final String active;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 78,
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(right: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: ListView.builder(
        padding: EdgeInsets.only(top: 6, bottom: ShellBottomInsets.of(context)),
        itemCount: categories.length + 1,
        itemBuilder: (context, i) {
          final name = i == 0 ? '' : categories[i - 1].categoryName;
          final selected = name == active;
          return GestureDetector(
            onTap: () => onSelect(name),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
              decoration: BoxDecoration(
                color: selected ? _green.withValues(alpha: 0.1) : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: i == 0
                        ? Icon(Icons.grid_view_rounded, size: 22, color: selected ? _green : _gray500)
                        : _CategoryImage(src: categories[i - 1].categoryImage),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    i == 0 ? 'All' : name,
                    maxLines: 2,
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 10,
                      height: 1.2,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                      color: selected ? _green : _gray500,
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

class _FilterFab extends StatelessWidget {
  const _FilterFab({required this.active, required this.onTap});

  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: _slate800,
      shape: const CircleBorder(),
      elevation: 6,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 52,
          height: 52,
          child: Stack(
            alignment: Alignment.center,
            children: [
              const Icon(Icons.tune_rounded, color: Colors.white, size: 22),
              if (active)
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    width: 9,
                    height: 9,
                    decoration: BoxDecoration(
                      color: const Color(0xFF22C55E),
                      shape: BoxShape.circle,
                      border: Border.all(color: _slate800, width: 1.5),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FilterSheet extends StatefulWidget {
  const _FilterSheet({
    required this.initial,
    required this.brands,
    required this.ceiling,
    required this.onApply,
  });

  final _Filters initial;
  final List<String> brands;
  final double ceiling;
  final ValueChanged<_Filters> onApply;

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late _Sort _sort = widget.initial.sort;
  late String _brand = widget.initial.brand;
  late double? _maxPrice = widget.initial.maxPrice;
  late bool _onSale = widget.initial.onSale;
  late bool _inStock = widget.initial.inStock;

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(top: 16, bottom: 8),
        child: Text(
          text,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: _slate800,
          ),
        ),
      );

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? _green : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: selected ? _green : const Color(0xFFE2E8F0)),
        ),
        child: Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : _slate800,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ceiling = widget.ceiling;
    final price = (_maxPrice ?? ceiling).clamp(0.0, ceiling > 0 ? ceiling : 1.0);

    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.8),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 8, 0),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Filters & Sorting',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: _slate800,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
            ),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _label('Sort by'),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final s in _Sort.values)
                        _chip(_sortLabels[s]!, _sort == s, () => setState(() => _sort = s)),
                    ],
                  ),
                  if (widget.brands.isNotEmpty) ...[
                    _label('Brand'),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _chip('All', _brand.isEmpty, () => setState(() => _brand = '')),
                        for (final b in widget.brands)
                          _chip(b, _brand == b, () => setState(() => _brand = b)),
                      ],
                    ),
                  ],
                  if (ceiling > 0) ...[
                    _label('Max price: ₹${price.round()}'),
                    Slider(
                      value: price,
                      min: 0,
                      max: ceiling,
                      activeColor: _green,
                      onChanged: (v) => setState(() => _maxPrice = v >= ceiling ? null : v),
                    ),
                  ],
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    activeThumbColor: _green,
                    title: Text('On sale', style: GoogleFonts.plusJakartaSans(fontSize: 14)),
                    value: _onSale,
                    onChanged: (v) => setState(() => _onSale = v),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    activeThumbColor: _green,
                    title: Text('In stock only', style: GoogleFonts.plusJakartaSans(fontSize: 14)),
                    value: _inStock,
                    onChanged: (v) => setState(() => _inStock = v),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        widget.onApply(const _Filters());
                        Navigator.of(context).pop();
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _slate800,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Clear'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () {
                        widget.onApply(_Filters(
                          sort: _sort,
                          brand: _brand,
                          maxPrice: _maxPrice,
                          onSale: _onSale,
                          inStock: _inStock,
                        ));
                        Navigator.of(context).pop();
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: _green,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Apply'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
