import '../../models/cart_item.dart';
import '../../models/product.dart';
import '../../models/product_pricing_models.dart';
import 'product_pricing.dart';

class BulkTier {
  const BulkTier({required this.qtyLabel, required this.price});

  final String qtyLabel;
  final double price;
}

List<BulkTier> getBulkTiers(double basePrice) {
  return [
    BulkTier(qtyLabel: '10 - 49', price: basePrice),
    BulkTier(
      qtyLabel: '50 - 99',
      price: (basePrice * 0.94 * 100).round() / 100,
    ),
    BulkTier(
      qtyLabel: '100+',
      price: (basePrice * 0.88 * 100).round() / 100,
    ),
  ];
}

const int defaultReviewCount = 128;

int getDecreasedCartQuantity(
  int currentQty,
  int step, {
  int? minOrderQuantity,
}) {
  final safeStep = step < 1 ? 1 : step;
  final floor = minOrderQuantity != null && minOrderQuantity > 0
      ? minOrderQuantity
      : safeStep;
  if (currentQty <= floor) return 0;
  final next = currentQty - safeStep;
  return next < floor ? floor : next;
}

CartItem? findCartLine(
  List<CartItem> items,
  String productId,
  String variantName,
  String colorName,
) {
  for (final item in items) {
    if (cartLineMatches(item, productId, variantName, colorName)) {
      return item;
    }
  }
  return null;
}

bool cartLineMatches(
  CartItem item,
  String productId,
  String variantName,
  String colorName,
) {
  if (item.id != productId) return false;
  if (item.variantName.trim().toLowerCase() !=
      variantName.trim().toLowerCase()) {
    return false;
  }
  if (item.colorName.trim().toLowerCase() != colorName.trim().toLowerCase()) {
    return false;
  }
  return true;
}

/// Product detail — exact match first, then best single-line fallback.
CartItem? findCartLineForProductDetail(
  List<CartItem> items,
  Product product,
  String variantName,
  String colorName,
) {
  final exact = findCartLine(items, product.id, variantName, colorName);
  if (exact != null) return exact;

  final productLines =
      items.where((item) => item.id == product.id).toList(growable: false);
  if (productLines.isEmpty) return null;
  if (productLines.length == 1) return productLines.first;

  final variant = variantName.trim().toLowerCase();
  if (variant.isNotEmpty) {
    final byVariant = productLines
        .where((item) => item.variantName.trim().toLowerCase() == variant)
        .toList(growable: false);
    if (byVariant.length == 1) return byVariant.first;
  }

  final color = colorName.trim().toLowerCase();
  if (color.isNotEmpty) {
    final byColor = productLines
        .where((item) => item.colorName.trim().toLowerCase() == color)
        .toList(growable: false);
    if (byColor.length == 1) return byColor.first;
  }

  return null;
}

CartItem cartItemFromProduct(
  Product product,
  int quantity, {
  String variantName = '',
  String colorName = '',
}) {
  final base = CartItem.fromProduct(product, quantity: quantity);
  return CartItem(
    id: base.id,
    name: base.name,
    brandName: base.brandName,
    price: base.price,
    discountedPrice: base.discountedPrice,
    productImages: base.productImages,
    stock: base.stock,
    quantity: quantity,
    variantName: variantName.trim(),
    colorName: colorName.trim(),
    pricingType: base.pricingType,
    bulkPricing: base.bulkPricing,
    variantType: base.variantType,
    variants: base.variants,
    minOrderQuantity: base.minOrderQuantity,
    stepByQuantity: base.stepByQuantity,
  );
}

/// Resolves the color used for cart line matching and API calls.
String resolveSelectionColor(
  Product product,
  String activeVariantName,
  String selectedColor,
) {
  final trimmed = selectedColor.trim();
  if (trimmed.isNotEmpty) return trimmed;
  final colors = getAvailableColors(product, activeVariantName);
  return colors.isNotEmpty ? colors.first.name : '';
}

List<ProductSpecification> getResolvedSpecifications(Product product) {
  final specs = product.specifications
      .where((spec) => spec.name.isNotEmpty && spec.value.isNotEmpty)
      .toList();
  if (specs.isNotEmpty) return specs;

  final fallback = <ProductSpecification>[];
  if (product.brandName.isNotEmpty) {
    fallback.add(ProductSpecification(name: 'Brand', value: product.brandName));
  }
  if (product.categories.isNotEmpty) {
    fallback.add(
      ProductSpecification(name: 'Category', value: product.categories.first),
    );
  }
  if (product.subcategory.isNotEmpty) {
    fallback.add(
      ProductSpecification(name: 'Subcategory', value: product.subcategory),
    );
  }
  if (product.warranty.isNotEmpty) {
    fallback.add(ProductSpecification(name: 'Warranty', value: product.warranty));
  }
  for (var i = 0; i < product.features.length; i++) {
    final feature = product.features[i].trim();
    if (feature.isNotEmpty) {
      fallback.add(ProductSpecification(name: 'Feature ${i + 1}', value: feature));
    }
  }
  return fallback;
}

String productSku(Product product) {
  final code = (product.subcategory.isNotEmpty
          ? product.subcategory
          : product.brandName)
      .replaceAll(RegExp(r'\s+'), '-')
      .toUpperCase();
  return 'BMM-$code';
}

enum ProductSortOption {
  newest('newest', 'Newest'),
  oldest('oldest', 'Oldest'),
  priceAsc('price-asc', 'Price: Low to High'),
  priceDesc('price-desc', 'Price: High to Low'),
  defaultOrder('default', 'Default'),
  name('name', 'Name A-Z'),
  brand('brand', 'Brand');

  const ProductSortOption(this.id, this.label);

  final String id;
  final String label;

  /// Website product listing defaults to newest when no sort is set.
  static const ProductSortOption listingDefault = newest;

  static ProductSortOption? fromId(String? id) {
    if (id == null || id.isEmpty) return listingDefault;
    for (final option in ProductSortOption.values) {
      if (option.id == id) return option;
    }
    return listingDefault;
  }

  /// Compact filter-bar options that match the website ProductFiltersBar.
  static const List<ProductSortOption> listingOptions = [
    newest,
    oldest,
    priceAsc,
    priceDesc,
  ];
}

List<Product> filterAndSortProducts({
  required List<Product> products,
  String? subcategory,
  String? brand,
  String? minPrice,
  String? maxPrice,
  ProductSortOption sort = ProductSortOption.listingDefault,
}) {
  var list = products.where((product) {
    if (subcategory != null &&
        subcategory.isNotEmpty &&
        product.subcategory.toLowerCase() != subcategory.toLowerCase()) {
      return false;
    }
    if (brand != null &&
        brand.isNotEmpty &&
        product.brandName.toLowerCase() != brand.toLowerCase()) {
      return false;
    }
    final price = product.discountedPrice;
    final min = double.tryParse(minPrice ?? '');
    final max = double.tryParse(maxPrice ?? '');
    if (min != null && price < min) return false;
    if (max != null && price > max) return false;
    return true;
  }).toList();

  list = [...list];
  switch (sort) {
    case ProductSortOption.priceAsc:
      list.sort((a, b) => a.discountedPrice.compareTo(b.discountedPrice));
    case ProductSortOption.priceDesc:
      list.sort((a, b) => b.discountedPrice.compareTo(a.discountedPrice));
    case ProductSortOption.newest:
      list.sort((a, b) => _compareCreatedAt(b, a));
    case ProductSortOption.oldest:
      list.sort((a, b) => _compareCreatedAt(a, b));
    case ProductSortOption.name:
      list.sort((a, b) => a.name.compareTo(b.name));
    case ProductSortOption.brand:
      list.sort((a, b) => a.brandName.compareTo(b.brandName));
    case ProductSortOption.defaultOrder:
      break;
  }
  return list;
}

int _compareCreatedAt(Product a, Product b) {
  final aDate = a.createdAt;
  final bDate = b.createdAt;
  if (aDate == null && bDate == null) return a.id.compareTo(b.id);
  if (aDate == null) return 1;
  if (bDate == null) return -1;
  final byDate = aDate.compareTo(bDate);
  if (byDate != 0) return byDate;
  return a.id.compareTo(b.id);
}

List<String> extractBrands(List<Product> products) {
  final brands = products.map((p) => p.brandName).where((b) => b.isNotEmpty).toSet().toList();
  brands.sort();
  return brands;
}
