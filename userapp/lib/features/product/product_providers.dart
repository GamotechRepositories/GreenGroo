import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../models/product.dart';

final productListProvider =
    FutureProvider.family<List<Product>, ProductQuery>((ref, query) async {
  final params = <String, dynamic>{'limit': 50};
  if (query.categoryName != null && query.categoryName!.isNotEmpty) {
    params['categoryName'] = query.categoryName;
  }
  if (query.search != null && query.search!.isNotEmpty) {
    params['q'] = query.search;
  }
  if (query.brandName != null && query.brandName!.isNotEmpty) {
    params['brandName'] = query.brandName;
  }
  if (query.justArrived) {
    params['justArrived'] = true;
  }
  if (query.hotSelling) {
    params['hotSelling'] = true;
  }

  final products = await ref.read(apiServiceProvider).fetchProducts(params);
  return products.where((product) => product.isActive).toList();
});

final productDetailProvider =
    FutureProvider.family<Product, String>((ref, id) async {
  return ref.read(apiServiceProvider).fetchProductById(id);
});

final similarProductsProvider =
    FutureProvider.family<List<Product>, String>((ref, productId) async {
  if (productId.trim().isEmpty) return [];
  return ref.read(apiServiceProvider).fetchSimilarProducts(productId);
});

class ProductQuery {
  const ProductQuery({
    this.categoryName,
    this.search,
    this.brandName,
    this.justArrived = false,
    this.hotSelling = false,
  });

  final String? categoryName;
  final String? search;
  final String? brandName;
  final bool justArrived;
  final bool hotSelling;

  @override
  bool operator ==(Object other) {
    return other is ProductQuery &&
        other.categoryName == categoryName &&
        other.search == search &&
        other.brandName == brandName &&
        other.justArrived == justArrived &&
        other.hotSelling == hotSelling;
  }

  @override
  int get hashCode => Object.hash(
        categoryName,
        search,
        brandName,
        justArrived,
        hotSelling,
      );
}
