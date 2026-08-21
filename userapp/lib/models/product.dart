import '../core/utils/json_parsers.dart';
import 'product_pricing_models.dart';

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.categories,
    required this.subcategory,
    required this.brandName,
    required this.price,
    required this.discountedPrice,
    required this.discountedPercent,
    required this.stock,
    required this.productImages,
    this.videoUrl = '',
    this.ratings = 0,
    this.description = '',
    this.features = const [],
    this.warranty = '',
    this.isActive = true,
    this.variantType = 'single',
    this.variants = const [],
    this.pricingType = 'single',
    this.bulkPricing = const BulkPricing(),
    this.colors = const [],
    this.specifications = const [],
    this.minOrderQuantity,
    this.maxOrderQuantity,
    this.stepByQuantity,
    this.cardGlowColor = '',
    this.badge = '',
    this.purchaseCount = 0,
    this.createdAt,
  });

  final String id;
  final String name;
  final List<String> categories;
  final String subcategory;
  final String brandName;
  final double price;
  final double discountedPrice;
  final double discountedPercent;
  final double ratings;
  final int stock;
  final List<String> productImages;
  final String videoUrl;
  final String description;
  final List<String> features;
  final String warranty;
  final bool isActive;
  final String variantType;
  final List<ProductVariant> variants;
  final String pricingType;
  final BulkPricing bulkPricing;
  final List<ProductColor> colors;
  final List<ProductSpecification> specifications;
  final int? minOrderQuantity;
  final int? maxOrderQuantity;
  final int? stepByQuantity;
  final String cardGlowColor;
  final String badge;
  final int purchaseCount;
  final DateTime? createdAt;

  String? get primaryImage =>
      productImages.isNotEmpty ? productImages.first : null;

  factory Product.fromJson(Map<String, dynamic> json) {
    final legacyBulk = json['bulkPricing'];
    return Product(
      id: parseJsonId(json),
      name: json['name']?.toString() ?? '',
      categories: (json['categories'] as List<dynamic>? ?? [])
          .map((item) => item.toString())
          .toList(),
      subcategory: json['subcategory']?.toString() ?? '',
      brandName: json['brandName']?.toString() ?? '',
      price: _toDouble(json['price']),
      discountedPrice: _toDouble(json['discountedPrice']),
      discountedPercent: _toDouble(json['discountedPercent']),
      ratings: _toDouble(json['ratings']),
      stock: _toInt(json['stock']),
      productImages: (json['productImages'] as List<dynamic>? ?? [])
          .map((item) => item.toString())
          .toList(),
      videoUrl: json['videoUrl']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      features: (json['features'] as List<dynamic>? ?? [])
          .map((item) => item.toString())
          .toList(),
      warranty: json['warranty']?.toString() ?? '',
      isActive: json['isActive'] as bool? ?? true,
      variantType: json['variantType']?.toString() ?? 'single',
      variants: (json['variants'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ProductVariant.fromJson)
          .toList(),
      pricingType: json['pricingType']?.toString() ?? 'single',
      bulkPricing: BulkPricing.fromJson(legacyBulk),
      colors: (json['colors'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ProductColor.fromJson)
          .toList(),
      specifications: (json['specifications'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ProductSpecification.fromJson)
          .toList(),
      minOrderQuantity: _parseOptionalQuantity(
        json['minOrderQuantity'],
        legacyBulk is Map<String, dynamic> ? legacyBulk['minOrderQuantity'] : null,
      ),
      maxOrderQuantity: _parseOptionalQuantity(
        json['maxOrderQuantity'],
        json['maxOrderQty'] ?? (legacyBulk is Map<String, dynamic> ? legacyBulk['maxOrderQuantity'] : null),
      ),
      stepByQuantity: _parseOptionalQuantity(
        json['stepByQuantity'],
        legacyBulk is Map<String, dynamic> ? legacyBulk['stepByQuantity'] : null,
      ),
      cardGlowColor: json['cardGlowColor']?.toString() ?? json['glowColor']?.toString() ?? '',
      badge: json['badge']?.toString() ?? '',
      purchaseCount: _toInt(json['purchaseCount']),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}

int? _parseOptionalQuantity(dynamic primary, dynamic legacy) {
  final value = primary ?? legacy;
  if (value == null) return null;
  final parsed = _toInt(value);
  return parsed > 0 ? parsed : null;
}

double _toDouble(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

int _toInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}
