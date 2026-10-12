import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../core/providers/location_provider.dart';
import '../../core/utils/department_utils.dart';
import '../../core/utils/recently_viewed.dart';
import '../../models/category.dart';
import '../../models/product.dart';

const homeProductLimit = 12;

class SelectedStoreTabNotifier extends Notifier<String> {
  @override
  String build() => 'main';

  void setStore(String key) => state = key;
}

final selectedStoreTabProvider =
    NotifierProvider<SelectedStoreTabNotifier, String>(SelectedStoreTabNotifier.new);

List<Category> _shopCategories(List<Category> categories) => categories
    .where(
      (category) =>
          category.isActive &&
          category.categoryName.toLowerCase() != 'most purchase',
    )
    .toList();

final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  ref.watch(deliveryLocationKeyProvider);
  final currentStore = ref.watch(selectedStoreTabProvider);
  String sectionParam;
  if (currentStore == 'festive' || currentStore == 'ready2cook') {
    sectionParam = 'ready2cook';
  } else if (currentStore == 'mall' || currentStore == 'instantorder') {
    sectionParam = 'instantorder';
  } else {
    sectionParam = 'preorder';
  }

  final categories = await ref.read(apiServiceProvider).fetchCategories(section: sectionParam);
  return _shopCategories(categories);
});

/// Categories for one department ('preorder' | 'ready2cook' | 'instantorder').
/// With a delivery location, the backend returns only what the nearest dark
/// store has products in.
final departmentCategoriesProvider =
    FutureProvider.family<List<Category>, String>((ref, section) async {
  ref.watch(deliveryLocationKeyProvider);
  final categories = await ref.read(apiServiceProvider).fetchCategories(section: section);
  return _shopCategories(categories);
});

class CategoryPreviewParam {
  const CategoryPreviewParam({
    required this.categoryName,
    required this.currentStore,
  });

  final String categoryName;
  final String currentStore;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CategoryPreviewParam &&
          runtimeType == other.runtimeType &&
          categoryName == other.categoryName &&
          currentStore == other.currentStore;

  @override
  int get hashCode => Object.hash(categoryName, currentStore);
}

/// Six-product preview for one category row on home. Cached per category and department.
final categoryPreviewProductsProvider =
    FutureProvider.family<List<Product>, CategoryPreviewParam>((ref, param) async {
  ref.watch(deliveryLocationKeyProvider);
  String sectionParam;
  if (param.currentStore == 'festive' || param.currentStore == 'ready2cook') {
    sectionParam = 'ready2cook';
  } else if (param.currentStore == 'mall' || param.currentStore == 'instantorder') {
    sectionParam = 'instantorder';
  } else {
    sectionParam = 'preorder';
  }

  final products = await ref.read(apiServiceProvider).fetchProducts({
    'categoryName': param.categoryName,
    'section': sectionParam,
    'limit': 12,
  });

  final activeDept = departmentForSection(sectionParam);
  return products
      .where((p) => p.isActive && p.department == activeDept)
      .take(6)
      .toList();
});

final homeDealsProvider = FutureProvider<List<Product>>((ref) async {
  ref.watch(deliveryLocationKeyProvider);
  final products = await ref.read(apiServiceProvider).fetchProducts({
    'section': 'preorder',
    'limit': 12,
  });
  return products
      .where((product) => product.isActive && product.department == Department.preorder)
      .toList();
});

final brandsProvider = FutureProvider((ref) async {
  final brands = await ref.read(apiServiceProvider).fetchBrands();
  return brands.where((brand) => brand.isActive).toList();
});

final testimonialsProvider = FutureProvider((ref) async {
  final items = await ref.read(apiServiceProvider).fetchTestimonials();
  return items.where((item) => item.isActive).toList();
});

final heroBannersProvider = FutureProvider((ref) async {
  final banners = await ref.read(apiServiceProvider).fetchHeroBanners(
        device: 'mobile',
      );
  return banners
      .where((banner) => banner.isActive && banner.imageUrl.trim().isNotEmpty)
      .toList()
    ..sort((a, b) => a.order.compareTo(b.order));
});

final offerBannersProvider = FutureProvider((ref) async {
  final banners = await ref.read(apiServiceProvider).fetchOfferBanners(
        device: 'mobile',
      );
  return banners
      .where((banner) => banner.isActive && banner.imageUrl.trim().isNotEmpty)
      .toList()
    ..sort((a, b) => a.order.compareTo(b.order));
});

final justArrivedProvider = FutureProvider<List<Product>>((ref) async {
  ref.watch(deliveryLocationKeyProvider);
  final products = await ref.read(apiServiceProvider).fetchProducts({
    'justArrived': true,
    'section': 'preorder',
    'limit': homeProductLimit,
  });
  return products
      .where((product) => product.isActive && product.department == Department.preorder)
      .take(homeProductLimit)
      .toList();
});

final hotSellingProvider = FutureProvider<List<Product>>((ref) async {
  ref.watch(deliveryLocationKeyProvider);
  final products = await ref.read(apiServiceProvider).fetchProducts({
    'hotSelling': true,
    'section': 'preorder',
    'limit': homeProductLimit,
  });
  return products
      .where((product) => product.isActive && product.department == Department.preorder)
      .take(homeProductLimit)
      .toList();
});

final recentlyViewedProductsProvider = FutureProvider<List<Product>>((ref) async {
  ref.watch(deliveryLocationKeyProvider);
  final ids = (await RecentlyViewedStore.getIds()).take(homeProductLimit).toList();
  if (ids.isEmpty) return const [];

  final products = await ref.read(apiServiceProvider).fetchProducts({
    'ids': ids.join(','),
    'limit': homeProductLimit,
  });
  final active = products.where((product) => product.isActive).toList();
  final byId = {for (final product in active) product.id: product};

  return ids.map((id) => byId[id]).whereType<Product>().toList();
});

enum FeaturedProductFilter { justArrived, hotSelling }
