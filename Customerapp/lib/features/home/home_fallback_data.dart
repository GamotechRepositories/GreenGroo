import '../../models/product.dart';

Product _fallbackProduct({
  required String id,
  required String name,
  required String sub,
  required double price,
}) {
  return Product(
    id: id,
    name: name,
    categories: const [],
    subcategory: sub,
    brandName: '',
    price: price,
    discountedPrice: price,
    discountedPercent: 0,
    stock: 100,
    productImages: const [],
  );
}

/// Placeholder catalog when the home deals API is unavailable (matches web).
List<Product> fallbackHomeProducts() {
  return [
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c001', name: 'Fast Charger', sub: '20W', price: 165),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c002', name: 'Bass Edition', sub: 'Neckband', price: 299),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c003', name: 'Type-C Cable', sub: '1M', price: 89),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c004', name: 'Power Bank', sub: '10000mAh', price: 799),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c005', name: 'Earbuds Pro', sub: 'Wireless', price: 499),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c006', name: 'Car Charger', sub: 'Dual Port', price: 249),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c007', name: 'Data Cable', sub: '3A Fast', price: 129),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c008', name: 'Neckband Pro', sub: 'BT 5.0', price: 349),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c009', name: 'Wall Adapter', sub: '18W', price: 199),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c010', name: 'Tempered Glass', sub: '9H', price: 99),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c011', name: 'BT Speaker', sub: 'Mini', price: 599),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c012', name: 'Mobile Cover', sub: 'Silicone', price: 149),
  ];
}

bool isFallbackProductId(String id) => id.startsWith('65f1a2b3c4d5e6f7a8b9c0');
