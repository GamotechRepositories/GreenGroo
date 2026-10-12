import '../core/utils/department_utils.dart';
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
    this.section = '',
    this.storeType = '',
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
  final String section;
  final String storeType;

  String? get primaryImage =>
      productImages.isNotEmpty ? productImages.first : null;

  String get title => name;
  bool get isAvailable => isActive && stock > 0;
  double get effectivePrice => discountedPrice > 0 ? discountedPrice : price;
  String get weightUnit => subcategory.isNotEmpty ? subcategory : '';

  /// preorder | ready2cook | instant
  String get department => departmentForSection(section, storeType);

  Product copyWith({
    String? id,
    String? name,
    List<String>? categories,
    String? subcategory,
    String? brandName,
    double? price,
    double? discountedPrice,
    double? discountedPercent,
    double? ratings,
    int? stock,
    List<String>? productImages,
    String? videoUrl,
    String? description,
    List<String>? features,
    String? warranty,
    bool? isActive,
    String? variantType,
    List<ProductVariant>? variants,
    String? pricingType,
    BulkPricing? bulkPricing,
    List<ProductColor>? colors,
    List<ProductSpecification>? specifications,
    int? minOrderQuantity,
    int? maxOrderQuantity,
    int? stepByQuantity,
    String? cardGlowColor,
    String? badge,
    int? purchaseCount,
    DateTime? createdAt,
    String? section,
    String? storeType,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      categories: categories ?? this.categories,
      subcategory: subcategory ?? this.subcategory,
      brandName: brandName ?? this.brandName,
      price: price ?? this.price,
      discountedPrice: discountedPrice ?? this.discountedPrice,
      discountedPercent: discountedPercent ?? this.discountedPercent,
      ratings: ratings ?? this.ratings,
      stock: stock ?? this.stock,
      productImages: productImages ?? this.productImages,
      videoUrl: videoUrl ?? this.videoUrl,
      description: description ?? this.description,
      features: features ?? this.features,
      warranty: warranty ?? this.warranty,
      isActive: isActive ?? this.isActive,
      variantType: variantType ?? this.variantType,
      variants: variants ?? this.variants,
      pricingType: pricingType ?? this.pricingType,
      bulkPricing: bulkPricing ?? this.bulkPricing,
      colors: colors ?? this.colors,
      specifications: specifications ?? this.specifications,
      minOrderQuantity: minOrderQuantity ?? this.minOrderQuantity,
      maxOrderQuantity: maxOrderQuantity ?? this.maxOrderQuantity,
      stepByQuantity: stepByQuantity ?? this.stepByQuantity,
      cardGlowColor: cardGlowColor ?? this.cardGlowColor,
      badge: badge ?? this.badge,
      purchaseCount: purchaseCount ?? this.purchaseCount,
      createdAt: createdAt ?? this.createdAt,
      section: section ?? this.section,
      storeType: storeType ?? this.storeType,
    );
  }

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
      section: json['section']?.toString() ?? '',
      storeType: json['storeType']?.toString() ?? '',
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
