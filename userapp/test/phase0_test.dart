import 'package:bulk_mobile_mart/config/app_info.dart';
import 'package:bulk_mobile_mart/core/utils/deep_link_utils.dart';
import 'package:bulk_mobile_mart/features/home/home_fallback_data.dart';
import 'package:bulk_mobile_mart/models/user.dart';
import 'package:bulk_mobile_mart/models/product.dart';
import 'package:bulk_mobile_mart/core/utils/cart_utils.dart';
import 'package:bulk_mobile_mart/core/utils/currency_formatter.dart';
import 'package:bulk_mobile_mart/models/cart_item.dart';
import 'package:bulk_mobile_mart/core/utils/product_search.dart';
import 'package:bulk_mobile_mart/core/utils/upi_payment.dart';
import 'package:bulk_mobile_mart/core/utils/validators.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Validators', () {
    test('accepts valid customer name', () {
      expect(Validators.isValidName('Rahul'), isTrue);
      expect(Validators.isValidName('John Smith'), isTrue);
    });

    test('accepts valid Indian phone number', () {
      expect(Validators.isValidPhone('9876543210'), isTrue);
    });
  });

  group('ProductSearch', () {
    test('builds product list path with query params', () {
      expect(
        ProductSearch.buildPath(query: 'charger', categoryName: 'Cables'),
        '/product?q=charger&categoryName=Cables',
      );
    });
  });

  group('UpiPayment', () {
    test('calculates COD advance as 10 percent', () {
      expect(UpiPayment.getPayableAmount(1000, 'cod'), 100);
      expect(UpiPayment.getPayableAmount(1000, 'online'), 1000);
    });
  });

  group('Currency formatter', () {
    test('formats INR values', () {
      expect(formatInr(999), contains('999'));
    });
  });

  group('Cart summary', () {
    test('calculates savings from original vs discounted price', () {
      const items = [
        CartItem(
          id: '1',
          name: 'Cable',
          brandName: 'Brand',
          price: 100,
          discountedPrice: 80,
          productImages: [],
          stock: 50,
          quantity: 10,
        ),
      ];
      expect(calculateCartSavings(items), 200);
      final summary = calculateCartSummary(items);
      expect(summary.savings, 200);
      expect(summary.subtotal, 800);
    });
  });

  group('AppInfo', () {
    test('has production package id', () {
      expect(AppInfo.androidPackageId, 'com.bulkmobilemart.app');
      expect(AppInfo.iosBundleId, 'com.bulkmobilemart.app');
    });
  });

  group('User', () {
    test('parses backend auth response id field', () {
      final user = User.fromJson({
        'id': 'abc123',
        'name': 'Rahul',
        'email': 'rahul@test.com',
        'phone': '9876543210',
        'role': 'user',
      });
      expect(user.id, 'abc123');
      expect(user.isAdmin, isFalse);
    });

    test('parses product id from backend response', () {
      final product = Product.fromJson({
        'id': 'prod123',
        'name': 'Cable',
        'categories': ['Accessories'],
        'subcategory': 'Cables',
        'brandName': 'Brand',
        'price': 100,
        'discountedPrice': 90,
        'discountedPercent': 10,
        'stock': 5,
        'productImages': [],
      });
      expect(product.id, 'prod123');
    });
  });

  group('Deep links', () {
    test('maps product share URLs to in-app routes', () {
      expect(
        mapDeepLinkToRoute(Uri.parse('https://bulkmobilemart.com/product/abc123def456')),
        '/product/abc123def456',
      );
      expect(
        mapDeepLinkToRoute(Uri.parse('https://www.bulkmobilemart.in/product/abc123def456')),
        '/product/abc123def456',
      );
    });

    test('maps static routes', () {
      expect(mapDeepLinkToRoute(Uri.parse('https://bulkmobilemart.com/cart')), '/cart');
    });

    test('ignores unknown paths', () {
      expect(mapDeepLinkToRoute(Uri.parse('https://bulkmobilemart.com/admin')), isNull);
    });

    test('maps custom scheme product links', () {
      expect(
        mapDeepLinkToRoute(Uri.parse('bulkmobilemart://product/abc123def456')),
        '/product/abc123def456',
      );
    });
  });

  group('Home fallbacks', () {
    test('provides placeholder products when API fails', () {
      expect(fallbackHomeProducts().length, 12);
      expect(isFallbackProductId('1'), isTrue);
      expect(isFallbackProductId('abc123def456'), isFalse);
    });
  });
}
