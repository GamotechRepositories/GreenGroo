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
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c001', name: 'Fresh Farm Potatoes', sub: '1 kg', price: 35),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c002', name: 'Fresh Hybrid Tomatoes', sub: '1 kg', price: 40),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c003', name: 'Fresh Red Onions', sub: '1 kg', price: 45),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c004', name: 'Fresh Spinach (Palak)', sub: '250 g', price: 20),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c005', name: 'Fresh Farm Bananas', sub: '1 kg', price: 55),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c006', name: 'Crisp Shimla Apples', sub: '1 kg', price: 160),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c007', name: 'Toned Fresh Milk', sub: '500 ml', price: 32),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c008', name: 'Farm Fresh Eggs', sub: 'Pack of 6', price: 65),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c009', name: 'Chakki Fresh Atta', sub: '5 kg', price: 220),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c010', name: 'Pure Cow Ghee', sub: '500 ml', price: 320),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c011', name: 'Premium Basmati Rice', sub: '1 kg', price: 110),
    _fallbackProduct(id: '65f1a2b3c4d5e6f7a8b9c012', name: 'Organic Green Peas', sub: '500 g', price: 45),
  ];
}

bool isFallbackProductId(String id) => id.startsWith('65f1a2b3c4d5e6f7a8b9c0');
