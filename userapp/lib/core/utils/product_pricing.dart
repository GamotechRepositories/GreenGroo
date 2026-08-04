import '../../models/product.dart';
import '../../models/product_pricing_models.dart';

const int defaultSingleMoq = 1;
const int inStockMaxQty = 9999;

class PricingSource {
  const PricingSource({
    required this.pricingType,
    required this.bulkPricing,
    required this.price,
    required this.discountedPrice,
    this.minOrderQuantity,
    this.stepByQuantity,
  });

  final String pricingType;
  final BulkPricing bulkPricing;
  final double price;
  final double discountedPrice;
  final int? minOrderQuantity;
  final int? stepByQuantity;
}

class BulkTierRow {
  const BulkTierRow({
    required this.key,
    required this.qtyLabel,
    required this.price,
    this.originalPrice,
    this.hasDiscount = false,
  });

  final String key;
  final String qtyLabel;
  final double price;
  final double? originalPrice;
  final bool hasDiscount;
}

class CartDefaults {
  const CartDefaults({
    required this.variantName,
    required this.colorName,
    required this.quantity,
  });

  final String variantName;
  final String colorName;
  final int quantity;
}

bool isMultiVariant(Product product) {
  return product.variantType == 'multi' &&
      product.variants.isNotEmpty;
}

ProductVariant? getVariant(Product product, String variantName) {
  if (!isMultiVariant(product) || variantName.trim().isEmpty) {
    return null;
  }
  final target = variantName.trim().toLowerCase();
  for (final variant in product.variants) {
    if (variant.name.trim().toLowerCase() == target) {
      return variant;
    }
  }
  return null;
}

bool isProductInStock(Product product, [String variantName = '']) {
  if (isMultiVariant(product)) {
    final variant = getVariant(product, variantName);
    if (variant == null) return false;
    return variant.stock > 0;
  }
  return product.stock > 0;
}

int getVariantStock(Product product, [String variantName = '']) {
  return isProductInStock(product, variantName) ? inStockMaxQty : 0;
}

List<ProductColor> getAvailableColors(Product product, [String variantName = '']) {
  if (isMultiVariant(product)) {
    return getVariant(product, variantName)?.colors ?? const [];
  }
  return product.colors;
}

PricingSource? getPricingSource(Product product, [String variantName = '']) {
  final productMoq = product.minOrderQuantity;
  final productStep = product.stepByQuantity;

  if (isMultiVariant(product)) {
    final variant = getVariant(product, variantName);
    if (variant == null) return null;
    return PricingSource(
      pricingType: variant.pricingType,
      bulkPricing: variant.bulkPricing,
      price: variant.price,
      discountedPrice: variant.discountedPrice,
      minOrderQuantity: productMoq ?? variant.minOrderQuantity,
      stepByQuantity: productStep ?? variant.stepByQuantity,
    );
  }

  return PricingSource(
    pricingType: product.pricingType,
    bulkPricing: product.bulkPricing,
    price: product.price,
    discountedPrice: product.discountedPrice,
    minOrderQuantity: productMoq,
    stepByQuantity: productStep,
  );
}

double getUnitPriceForQuantity(
  Product product,
  int quantity, [
  String variantName = '',
]) {
  if (quantity < 1) return 0;

  final source = getPricingSource(product, variantName);
  if (source == null) return 0;

  if (source.pricingType == 'bulk' && source.bulkPricing.slabs.isNotEmpty) {
    final slabs = [...source.bulkPricing.slabs]
      ..sort((a, b) => a.minQuantity.compareTo(b.minQuantity));

    for (var i = slabs.length - 1; i >= 0; i--) {
      final slab = slabs[i];
      final inRange = quantity >= slab.minQuantity &&
          (slab.maxQuantity == null || quantity <= slab.maxQuantity!);
      if (inRange) return slab.pricePerUnit;
    }

    return slabs.last.pricePerUnit;
  }

  return source.discountedPrice > 0 ? source.discountedPrice : source.price;
}

int getMinOrderQuantity(
  Product product, [
  String variantName = '',
  int fallback = defaultSingleMoq,
]) {
  final source = getPricingSource(product, variantName);
  if (source == null) return fallback;

  final moq = source.minOrderQuantity;
  if (moq != null && moq > 0) {
    return moq;
  }

  return fallback;
}

int getQuantityStep(
  Product product, [
  String variantName = '',
  int fallback = defaultSingleMoq,
]) {
  final source = getPricingSource(product, variantName);
  if (source == null) return fallback;

  final step = source.stepByQuantity;
  if (step != null && step > 0) {
    return step;
  }

  return fallback;
}

int getCartAdjustStep(
  Product product, [
  String variantName = '',
  int fallback = defaultSingleMoq,
]) {
  final source = getPricingSource(product, variantName);
  if (source == null) return fallback;

  final step = source.stepByQuantity;
  if (step != null && step > 0) {
    return step;
  }

  final moq = source.minOrderQuantity;
  if (moq != null && moq > 0) {
    return moq;
  }

  return fallback;
}

bool hasConfiguredMinOrderQuantity(Product product, [String variantName = '']) {
  final source = getPricingSource(product, variantName);
  if (source == null) return false;
  final moq = source.minOrderQuantity;
  return moq != null && moq > 1;
}

bool hasConfiguredQuantityStep(Product product, [String variantName = '']) {
  final source = getPricingSource(product, variantName);
  if (source == null) return false;
  final step = source.stepByQuantity;
  return step != null && step > 1;
}

int getCartStepForProduct(Product product, [String variantName = '']) {
  return getCartAdjustStep(product, variantName);
}

int getDecreasedCartQuantityForProduct(
  Product product,
  int currentQty, [
  String variantName = '',
]) {
  final step = getCartAdjustStep(product, variantName);
  final moq = getMinOrderQuantity(product, variantName);
  final safeStep = step < 1 ? 1 : step;
  final floor = moq > 0 ? moq : safeStep;
  if (currentQty <= floor) return 0;
  final next = currentQty - safeStep;
  return next < floor ? floor : next;
}

int getNextCartQuantityForProduct(
  Product product,
  int currentQty, [
  String variantName = '',
]) {
  final step = getCartAdjustStep(product, variantName);
  final min = getMinOrderQuantity(product, variantName);
  final max = getMaxOrderQuantity(product, variantName);
  if (currentQty >= max) return currentQty;
  return (currentQty + step).clamp(min, max);
}

double getDisplayPriceForSource(PricingSource source) {
  if (source.pricingType == 'bulk' && source.bulkPricing.slabs.isNotEmpty) {
    return source.bulkPricing.slabs
        .map((slab) => slab.pricePerUnit)
        .reduce((a, b) => a < b ? a : b);
  }

  return source.discountedPrice > 0 ? source.discountedPrice : source.price;
}

double getDisplayPrice(Product product, [String variantName = '']) {
  if (isMultiVariant(product) && variantName.trim().isEmpty) {
    final prices = product.variants
        .map(
          (variant) => getDisplayPriceForSource(
            PricingSource(
              pricingType: variant.pricingType,
              bulkPricing: variant.bulkPricing,
              price: variant.price,
              discountedPrice: variant.discountedPrice,
            ),
          ),
        )
        .where((price) => price > 0)
        .toList();
    if (prices.isEmpty) return 0;
    return prices.reduce((a, b) => a < b ? a : b);
  }

  final source = getPricingSource(product, variantName);
  if (source == null) return 0;
  return getDisplayPriceForSource(source);
}

BulkPricingSlab? getLastBulkSlab(Product product, [String variantName = '']) {
  final source = getPricingSource(product, variantName);
  if (source == null ||
      source.pricingType != 'bulk' ||
      source.bulkPricing.slabs.isEmpty) {
    return null;
  }

  final slabs = [...source.bulkPricing.slabs]
    ..sort((a, b) => a.minQuantity.compareTo(b.minQuantity));
  return slabs.last;
}

class ProductListPriceInfo {
  const ProductListPriceInfo({
    required this.originalPrice,
    required this.salePrice,
    required this.hasDiscount,
    required this.isBulk,
  });

  final double originalPrice;
  final double salePrice;
  final bool hasDiscount;
  final bool isBulk;
}

ProductListPriceInfo getProductListPriceInfo(
  Product product, [
  String variantName = '',
  int? quantity,
]) {
  final source = getPricingSource(product, variantName);
  if (source == null) {
    return const ProductListPriceInfo(
      originalPrice: 0,
      salePrice: 0,
      hasDiscount: false,
      isBulk: false,
    );
  }

  final isBulk = source.pricingType == 'bulk' && source.bulkPricing.slabs.isNotEmpty;

  if (isBulk) {
    final lastSlab = getLastBulkSlab(product, variantName);
    final salePrice = lastSlab?.pricePerUnit ?? 0.0;
    final original = lastSlab?.originalPricePerUnit;
    final originalPrice =
        original != null && original > 0 ? original.toDouble() : 0.0;
    final hasDiscount = originalPrice > salePrice && salePrice > 0;

    return ProductListPriceInfo(
      originalPrice: originalPrice,
      salePrice: salePrice,
      hasDiscount: hasDiscount,
      isBulk: true,
    );
  }

  final salePrice = getDisplayPriceForSource(source);
  final originalPrice = source.price > 0 ? source.price : salePrice;
  final hasDiscount = originalPrice > salePrice && salePrice > 0;

  return ProductListPriceInfo(
    originalPrice: originalPrice,
    salePrice: salePrice,
    hasDiscount: hasDiscount,
    isBulk: false,
  );
}

double getOriginalPriceForQuantity(
  Product product,
  int quantity, [
  String variantName = '',
]) {
  if (quantity < 1) return 0;

  final source = getPricingSource(product, variantName);
  if (source == null) return 0;

  if (source.pricingType == 'bulk' && source.bulkPricing.slabs.isNotEmpty) {
    final slabs = [...source.bulkPricing.slabs]
      ..sort((a, b) => a.minQuantity.compareTo(b.minQuantity));

    for (var i = slabs.length - 1; i >= 0; i--) {
      final slab = slabs[i];
      final inRange = quantity >= slab.minQuantity &&
          (slab.maxQuantity == null || quantity <= slab.maxQuantity!);
      if (inRange) {
        final original = slab.originalPricePerUnit;
        return original != null && original > 0 ? original : 0;
      }
    }

    return 0;
  }

  return source.price;
}

bool isBulkPricing(Product product, [String variantName = '']) {
  final source = getPricingSource(product, variantName);
  return source?.pricingType == 'bulk' && source!.bulkPricing.slabs.isNotEmpty;
}

List<BulkTierRow> getBulkTierRows(Product product, [String variantName = '']) {
  final source = getPricingSource(product, variantName);
  if (source == null ||
      source.pricingType != 'bulk' ||
      source.bulkPricing.slabs.isEmpty) {
    return const [];
  }

  final slabs = [...source.bulkPricing.slabs]
    ..sort((a, b) => a.minQuantity.compareTo(b.minQuantity));

  return slabs.map((slab) {
    final qtyLabel = slab.maxQuantity != null
        ? '${slab.minQuantity} - ${slab.maxQuantity}'
        : '${slab.minQuantity}+';
    final originalPrice = slab.originalPricePerUnit ?? slab.pricePerUnit;
    final hasDiscount =
        (slab.originalPricePerUnit ?? 0) > slab.pricePerUnit && slab.pricePerUnit > 0;
    return BulkTierRow(
      key: '${slab.minQuantity}-${slab.maxQuantity ?? 'plus'}',
      qtyLabel: qtyLabel,
      price: slab.pricePerUnit,
      originalPrice: originalPrice,
      hasDiscount: hasDiscount,
    );
  }).toList();
}

String formatProductPriceLabel(
  Product product,
  String Function(double) formatPrice, [
  String variantName = '',
]) {
  final amount = getDisplayPrice(product, variantName);
  return formatPrice(amount);
}

String resolveActiveVariantName(Product product, String selectedVariant) {
  if (!isMultiVariant(product)) return '';
  if (selectedVariant.trim().isNotEmpty) return selectedVariant;
  return product.variants.first.name;
}

int getMaxOrderQuantity(Product product, String variantName) {
  final minOrderQuantity = getMinOrderQuantity(product, variantName);
  final variantStock = getVariantStock(product, variantName);
  if (variantStock > 0) {
    return variantStock < minOrderQuantity ? minOrderQuantity : variantStock;
  }
  return minOrderQuantity;
}

CartDefaults resolveCartDefaults(Product product) {
  var variantName = '';
  if (isMultiVariant(product)) {
    final inStockVariant = product.variants.firstWhere(
      (variant) => getVariantStock(product, variant.name) > 0,
      orElse: () => product.variants.first,
    );
    variantName = inStockVariant.name;
  }

  final colors = getAvailableColors(product, variantName);
  final colorName = colors.isNotEmpty ? colors.first.name : '';
  final quantity = getMinOrderQuantity(product, variantName);
  return CartDefaults(
    variantName: variantName,
    colorName: colorName,
    quantity: quantity,
  );
}
