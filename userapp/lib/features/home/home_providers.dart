import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../core/utils/recently_viewed.dart';
import '../../models/category.dart';
import '../../models/product.dart';

const homeProductLimit = 12;

final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  final categories = await ref.read(apiServiceProvider).fetchCategories();
  return categories
      .where(
        (category) =>
            category.isActive &&
            category.categoryName.toLowerCase() != 'most purchase',
      )
      .toList();
});

final homeDealsProvider = FutureProvider<List<Product>>((ref) async {
  final products = await ref.read(apiServiceProvider).fetchProducts({
    'limit': 12,
  });
  return products.where((product) => product.isActive).toList();
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
  final products = await ref.read(apiServiceProvider).fetchProducts({
    'justArrived': true,
    'limit': homeProductLimit,
  });
  return products.where((product) => product.isActive).take(homeProductLimit).toList();
});

final hotSellingProvider = FutureProvider<List<Product>>((ref) async {
  final products = await ref.read(apiServiceProvider).fetchProducts({
    'hotSelling': true,
    'limit': homeProductLimit,
  });
  return products.where((product) => product.isActive).take(homeProductLimit).toList();
});

final recentlyViewedProductsProvider = FutureProvider<List<Product>>((ref) async {
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

final featuredProductsProvider =
    FutureProvider.family<List<Product>, FeaturedProductFilter>((ref, filter) async {
  final params = filter == FeaturedProductFilter.justArrived
      ? {'justArrived': true}
      : {'hotSelling': true};

  final products = await ref.read(apiServiceProvider).fetchProducts(params);
  return products.where((product) => product.isActive).toList();
});
