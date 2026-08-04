class BulkPricingSlab {
  const BulkPricingSlab({
    required this.minQuantity,
    this.maxQuantity,
    required this.pricePerUnit,
    this.originalPricePerUnit,
  });

  final int minQuantity;
  final int? maxQuantity;
  final double pricePerUnit;
  final double? originalPricePerUnit;

  factory BulkPricingSlab.fromJson(Map<String, dynamic> json) {
    return BulkPricingSlab(
      minQuantity: _toInt(json['minQuantity'], fallback: 1),
      maxQuantity: json['maxQuantity'] == null
          ? null
          : _toInt(json['maxQuantity'], fallback: 1),
      pricePerUnit: _toDouble(json['pricePerUnit']),
      originalPricePerUnit: json['originalPricePerUnit'] == null
          ? null
          : _toDouble(json['originalPricePerUnit']),
    );
  }
}

class BulkPricing {
  const BulkPricing({this.slabs = const []});

  final List<BulkPricingSlab> slabs;

  factory BulkPricing.fromJson(dynamic json) {
    if (json is! Map<String, dynamic>) return const BulkPricing();
    return BulkPricing(
      slabs: (json['slabs'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(BulkPricingSlab.fromJson)
          .toList(),
    );
  }
}

class ProductColor {
  const ProductColor({required this.name, this.hex = '#cccccc'});

  final String name;
  final String hex;

  factory ProductColor.fromJson(Map<String, dynamic> json) {
    return ProductColor(
      name: json['name']?.toString() ?? '',
      hex: json['hex']?.toString() ?? '#cccccc',
    );
  }
}

class ProductSpecification {
  const ProductSpecification({required this.name, required this.value});

  final String name;
  final String value;

  factory ProductSpecification.fromJson(Map<String, dynamic> json) {
    return ProductSpecification(
      name: json['name']?.toString() ?? '',
      value: json['value']?.toString() ?? '',
    );
  }
}

class ProductVariant {
  const ProductVariant({
    required this.name,
    this.pricingType = 'single',
    this.bulkPricing = const BulkPricing(),
    this.price = 0,
    this.discountedPrice = 0,
    this.stock = 0,
    this.colors = const [],
    this.minOrderQuantity,
    this.stepByQuantity,
  });

  final String name;
  final String pricingType;
  final BulkPricing bulkPricing;
  final double price;
  final double discountedPrice;
  final int stock;
  final List<ProductColor> colors;
  final int? minOrderQuantity;
  final int? stepByQuantity;

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    final legacyBulk = json['bulkPricing'];
    return ProductVariant(
      name: json['name']?.toString() ?? '',
      pricingType: json['pricingType']?.toString() ?? 'single',
      bulkPricing: BulkPricing.fromJson(legacyBulk),
      price: _toDouble(json['price']),
      discountedPrice: _toDouble(json['discountedPrice']),
      stock: _toInt(json['stock']),
      colors: (json['colors'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ProductColor.fromJson)
          .toList(),
      minOrderQuantity: _parseOptionalQuantity(
        json['minOrderQuantity'],
        legacyBulk is Map<String, dynamic> ? legacyBulk['minOrderQuantity'] : null,
      ),
      stepByQuantity: _parseOptionalQuantity(
        json['stepByQuantity'],
        legacyBulk is Map<String, dynamic> ? legacyBulk['stepByQuantity'] : null,
      ),
    );
  }
}

double _toDouble(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

int _toInt(dynamic value, {int fallback = 0}) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

int? _parseOptionalQuantity(dynamic primary, dynamic legacy) {
  final value = primary ?? legacy;
  if (value == null) return null;
  final parsed = _toInt(value, fallback: 0);
  return parsed > 0 ? parsed : null;
}
