class ProductSearch {
  ProductSearch._();

  static String buildPath({
    String query = '',
    String categoryName = '',
    String subcategory = '',
    String brand = '',
    String minPrice = '',
    String maxPrice = '',
    String sort = '',
    String minDiscount = '',
    String pincode = '',
    String weightSize = '',
    bool inStockOnly = false,
  }) {
    final params = <String, String>{};
    final q = query.trim();
    final category = categoryName.trim();
    final sub = subcategory.trim();

    if (q.isNotEmpty) params['q'] = q;
    if (category.isNotEmpty) params['categoryName'] = category;
    if (sub.isNotEmpty) params['subcategory'] = sub;
    if (brand.trim().isNotEmpty) params['brandName'] = brand.trim();
    if (minPrice.trim().isNotEmpty) params['minPrice'] = minPrice.trim();
    if (maxPrice.trim().isNotEmpty) params['maxPrice'] = maxPrice.trim();
    if (minDiscount.trim().isNotEmpty) params['minDiscount'] = minDiscount.trim();
    if (pincode.trim().isNotEmpty) params['pincode'] = pincode.trim();
    if (weightSize.trim().isNotEmpty) params['weightSize'] = weightSize.trim();
    if (inStockOnly) params['inStock'] = 'true';

    // Match website default: newest is implied when sort is absent.
    final sortValue = sort.trim();
    if (sortValue.isNotEmpty &&
        sortValue != 'default' &&
        sortValue != 'newest') {
      params['sort'] = sortValue;
    }

    if (params.isEmpty) return '/product';

    final queryString = params.entries
        .map((entry) => '${entry.key}=${Uri.encodeComponent(entry.value)}')
        .join('&');

    return '/product?$queryString';
  }
}
