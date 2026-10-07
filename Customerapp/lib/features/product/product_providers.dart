import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../core/providers/location_provider.dart';
import '../../models/product.dart';

Map<String, dynamic> _queryParams(ProductQuery query) {
  final params = <String, dynamic>{};
  if (query.categoryName != null && query.categoryName!.isNotEmpty) {
    params['categoryName'] = query.categoryName;
  }
  if (query.search != null && query.search!.isNotEmpty) {
    params['q'] = query.search;
  }
  if (query.brandName != null && query.brandName!.isNotEmpty) {
    params['brandName'] = query.brandName;
  }
  if (query.subcategory != null && query.subcategory!.isNotEmpty) {
    params['subcategory'] = query.subcategory;
  }
  if (query.minPrice != null && query.minPrice!.isNotEmpty) {
    params['minPrice'] = query.minPrice;
  }
  if (query.maxPrice != null && query.maxPrice!.isNotEmpty) {
    params['maxPrice'] = query.maxPrice;
  }
  if (query.sort != null && query.sort!.isNotEmpty) {
    params['sort'] = query.sort;
  }
  if (query.justArrived) {
    params['justArrived'] = true;
  }
  if (query.hotSelling) {
    params['hotSelling'] = true;
  }
  return params;
}

final productListProvider =
    FutureProvider.family<List<Product>, ProductQuery>((ref, query) async {
  ref.watch(deliveryLocationKeyProvider);
  final params = {..._queryParams(query), 'limit': 50};
  final products = await ref.read(apiServiceProvider).fetchProducts(params);
  return products.where((product) => product.isActive).toList();
});

class PagedProducts {
  const PagedProducts({
    this.items = const [],
    this.loadingFirst = true,
    this.loadingMore = false,
    this.hasMore = true,
    this.error,
  });

  final List<Product> items;
  final bool loadingFirst;
  final bool loadingMore;
  final bool hasMore;
  final Object? error;

  PagedProducts copyWith({
    List<Product>? items,
    bool? loadingFirst,
    bool? loadingMore,
    bool? hasMore,
    Object? error,
    bool clearError = false,
  }) {
    return PagedProducts(
      items: items ?? this.items,
      loadingFirst: loadingFirst ?? this.loadingFirst,
      loadingMore: loadingMore ?? this.loadingMore,
      hasMore: hasMore ?? this.hasMore,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

/// Product listing that fetches one page at a time; screens call [loadMore]
/// as the user nears the end of the list.
class PagedProductsNotifier extends Notifier<PagedProducts> {
  PagedProductsNotifier(this.query);

  static const pageSize = 20;

  final ProductQuery query;
  int _page = 0;
  int _generation = 0;
  bool _busy = false;

  @override
  PagedProducts build() {
    ref.watch(deliveryLocationKeyProvider);
    _page = 0;
    _busy = false;
    _generation++;
    Future.microtask(loadMore);
    return const PagedProducts();
  }

  Future<void> loadMore() async {
    if (_busy || !state.hasMore) return;
    _busy = true;
    final generation = _generation;
    final nextPage = _page + 1;
    if (nextPage > 1) state = state.copyWith(loadingMore: true, clearError: true);
    var pageWasEmpty = false;
    try {
      final result = await ref.read(apiServiceProvider).fetchProductsPage(
            _queryParams(query),
            page: nextPage,
            limit: pageSize,
          );
      if (generation != _generation) return;
      final seen = {for (final p in state.items) p.id};
      final fresh = result.items.where((p) => p.isActive && seen.add(p.id)).toList();
      pageWasEmpty = fresh.isEmpty && result.hasMore;
      _page = nextPage;
      state = state.copyWith(
        items: [...state.items, ...fresh],
        loadingFirst: false,
        loadingMore: false,
        hasMore: result.hasMore,
        clearError: true,
      );
    } catch (e) {
      if (generation != _generation) return;
      state = state.copyWith(loadingFirst: false, loadingMore: false, error: e);
    } finally {
      if (generation == _generation) _busy = false;
    }
    // A page of only inactive/duplicate items adds nothing to scroll into; fetch on.
    if (pageWasEmpty && generation == _generation) await loadMore();
  }

  Future<void> refresh() async {
    _generation++;
    _page = 0;
    _busy = false;
    state = const PagedProducts();
    await loadMore();
  }
}

final pagedProductsProvider = NotifierProvider.autoDispose
    .family<PagedProductsNotifier, PagedProducts, ProductQuery>(PagedProductsNotifier.new);

final productDetailProvider =
    FutureProvider.family<Product, String>((ref, id) async {
  ref.watch(deliveryLocationKeyProvider);
  return ref.read(apiServiceProvider).fetchProductById(id);
});

final similarProductsProvider =
    FutureProvider.family<List<Product>, String>((ref, productId) async {
  ref.watch(deliveryLocationKeyProvider);
  if (productId.trim().isEmpty) return [];
  return ref.read(apiServiceProvider).fetchSimilarProducts(productId);
});

class ProductQuery {
  const ProductQuery({
    this.categoryName,
    this.search,
    this.brandName,
    this.subcategory,
    this.minPrice,
    this.maxPrice,
    this.sort,
    this.justArrived = false,
    this.hotSelling = false,
  });

  final String? categoryName;
  final String? search;
  final String? brandName;
  final String? subcategory;
  final String? minPrice;
  final String? maxPrice;
  final String? sort;
  final bool justArrived;
  final bool hotSelling;

  @override
  bool operator ==(Object other) {
    return other is ProductQuery &&
        other.categoryName == categoryName &&
        other.search == search &&
        other.brandName == brandName &&
        other.subcategory == subcategory &&
        other.minPrice == minPrice &&
        other.maxPrice == maxPrice &&
        other.sort == sort &&
        other.justArrived == justArrived &&
        other.hotSelling == hotSelling;
  }

  @override
  int get hashCode => Object.hash(
        categoryName,
        search,
        brandName,
        subcategory,
        minPrice,
        maxPrice,
        sort,
        justArrived,
        hotSelling,
      );
}
