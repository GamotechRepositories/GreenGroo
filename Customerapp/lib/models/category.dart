class Category {
  const Category({
    required this.id,
    required this.categoryName,
    required this.categoryImage,
    this.subcategories = const [],
    this.isActive = true,
    int productCount = 0,
  }) : _productCount = productCount;

  final String id;
  final String categoryName;
  final String categoryImage;
  final List<String> subcategories;
  final bool isActive;

  /// Stored as nullable so hot-reload of older in-memory instances stays safe.
  final int? _productCount;

  int get productCount => _productCount ?? 0;

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['_id']?.toString() ?? '',
      categoryName: json['categoryName']?.toString() ?? '',
      categoryImage: json['categoryImage']?.toString() ?? '',
      subcategories: (json['subcategories'] as List<dynamic>? ?? [])
          .map((item) => item.toString())
          .toList(),
      isActive: json['isActive'] as bool? ?? true,
      productCount: _toNonNegativeInt(json['productCount']),
    );
  }
}

int _toNonNegativeInt(dynamic value) {
  if (value is int) return value < 0 ? 0 : value;
  if (value is num) {
    final parsed = value.toInt();
    return parsed < 0 ? 0 : parsed;
  }
  final parsed = int.tryParse(value?.toString() ?? '') ?? 0;
  return parsed < 0 ? 0 : parsed;
}
