import 'package:flutter/foundation.dart' show compute, kIsWeb;

import 'api_response_parser.dart';
import '../../models/address.dart';
import '../../models/brand.dart';
import '../../models/cart_item.dart';
import '../../models/category.dart';
import '../../models/hero_banner.dart';
import '../../models/offer_banner.dart';
import '../../models/order.dart';
import '../../models/product.dart';
import '../../models/store_settings.dart';
import '../../models/testimonial.dart';
import '../../models/user.dart';

/// Top-level parsers for [compute] — keep JSON off the UI isolate.

List<Product> parseProductsResponse(dynamic responseBody) {
  return ApiResponseParser.parseList(responseBody, Product.fromJson);
}

List<Category> parseCategoriesResponse(dynamic responseBody) {
  return ApiResponseParser.parseList(responseBody, Category.fromJson);
}

List<Brand> parseBrandsResponse(dynamic responseBody) {
  return ApiResponseParser.parseList(responseBody, Brand.fromJson);
}

List<Order> parseOrdersResponse(dynamic responseBody) {
  return ApiResponseParser.parseList(responseBody, Order.fromJson);
}

List<HeroBanner> parseHeroBannersResponse(dynamic responseBody) {
  return ApiResponseParser.parseList(responseBody, HeroBanner.fromJson);
}

List<OfferBanner> parseOfferBannersResponse(dynamic responseBody) {
  return ApiResponseParser.parseList(responseBody, OfferBanner.fromJson);
}

List<Testimonial> parseTestimonialsResponse(dynamic responseBody) {
  return ApiResponseParser.parseList(responseBody, Testimonial.fromJson);
}

List<Address> parseAddressesResponse(dynamic responseBody) {
  return ApiResponseParser.parseList(responseBody, Address.fromJson);
}

Product parseProductResponse(dynamic responseBody) {
  return ApiResponseParser.parseObject(responseBody, Product.fromJson);
}

User parseUserResponse(dynamic responseBody) {
  return ApiResponseParser.parseObject(responseBody, User.fromJson);
}

StoreSettings parseStoreSettingsResponse(dynamic responseBody) {
  return ApiResponseParser.parseObject(responseBody, StoreSettings.fromJson);
}

Order parseOrderResponse(dynamic responseBody) {
  return ApiResponseParser.parseObject(responseBody, Order.fromJson);
}

List<CartItem> parseCartItemsResponse(dynamic responseBody) {
  final data = ApiResponseParser.getData(responseBody);
  if (data is! Map<String, dynamic>) return [];

  final items = data['items'];
  if (items is! List) return [];

  return items
      .whereType<Map<String, dynamic>>()
      .where((item) => item['product'] != null)
      .where((item) {
        final product = item['product'];
        if (product is! Map<String, dynamic>) return false;
        return product['isActive'] as bool? ?? true;
      })
      .map(CartItem.fromApiItem)
      .toList();
}

List<Product> parseWishlistProductsResponse(dynamic responseBody) {
  final data = ApiResponseParser.getData(responseBody);
  if (data is! Map<String, dynamic>) return [];

  final items = data['items'];
  if (items is! List) return [];

  return items
      .whereType<Map<String, dynamic>>()
      .where((item) => item['product'] != null)
      .map((item) => Product.fromJson(item['product'] as Map<String, dynamic>))
      .where((product) => product.isActive)
      .toList();
}

Future<T> parseOnBackground<T>(T Function(dynamic) parser, dynamic body) {
  if (kIsWeb) return Future.value(parser(body));
  return compute(parser, body);
}
