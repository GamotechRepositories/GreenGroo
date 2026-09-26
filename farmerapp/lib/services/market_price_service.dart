import 'package:flutter/foundation.dart';
import '../models/market_price_item.dart';
import 'api_service.dart';

class MarketPriceService extends ChangeNotifier {
  static final MarketPriceService _instance = MarketPriceService._internal();
  factory MarketPriceService() => _instance;
  MarketPriceService._internal() {
    _initFallbackData();
    fetchMarketPrices();
  }

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  List<MarketPriceItem> _items = [];
  List<MarketPriceItem> get items => _items;

  void _initFallbackData() {
    final today = DateTime.now().toIso8601String().substring(0, 10);
    _items = [
      MarketPriceItem(
        id: 'MP-GG-1',
        marketName: 'GreenGroo Direct (ग्रीनग्रू खरेदी केंद्र)',
        productName: 'Tomato (टोमॅटो)',
        variety: 'Hybrid Super Grade',
        price: 2850,
        minPrice: 2500,
        maxPrice: 3100,
        unit: 'Quintal',
        priceDate: today,
        district: 'Pune Hub',
        state: 'Maharashtra',
        trend: 'up',
        arrivalQuantity: 3200,
        isGreenGroo: true,
      ),
      MarketPriceItem(
        id: 'MP-GG-2',
        marketName: 'GreenGroo Direct (ग्रीनग्रू खरेदी केंद्र)',
        productName: 'Onion (कांदा)',
        variety: 'Garwa / Export',
        price: 2250,
        minPrice: 1950,
        maxPrice: 2500,
        unit: 'Quintal',
        priceDate: today,
        district: 'Nashik Hub',
        state: 'Maharashtra',
        trend: 'up',
        arrivalQuantity: 5400,
        isGreenGroo: true,
      ),
      MarketPriceItem(
        id: 'MP-GG-3',
        marketName: 'GreenGroo Direct (ग्रीनग्रू खरेदी केंद्र)',
        productName: 'Potato (बटाटा)',
        variety: 'Jyoti Premium',
        price: 2300,
        minPrice: 2000,
        maxPrice: 2500,
        unit: 'Quintal',
        priceDate: today,
        district: 'Pune Hub',
        state: 'Maharashtra',
        trend: 'up',
        arrivalQuantity: 2800,
        isGreenGroo: true,
      ),
      MarketPriceItem(
        id: 'MP-1',
        marketName: 'Mumbai Vashi APMC',
        productName: 'Tomato (टोमॅटो)',
        variety: 'Desi Special',
        price: 2600,
        minPrice: 2200,
        maxPrice: 3000,
        unit: 'Quintal',
        priceDate: today,
        district: 'Mumbai',
        state: 'Maharashtra',
        trend: 'up',
        arrivalQuantity: 2100,
      ),
      MarketPriceItem(
        id: 'MP-2',
        marketName: 'Pune APMC (गुलटेकडी)',
        productName: 'Tomato (टोमॅटो)',
        variety: 'Hybrid No.1',
        price: 2400,
        minPrice: 2000,
        maxPrice: 2800,
        unit: 'Quintal',
        priceDate: today,
        district: 'Pune',
        state: 'Maharashtra',
        trend: 'up',
        arrivalQuantity: 1850,
      ),
      MarketPriceItem(
        id: 'MP-3',
        marketName: 'Nashik APMC (पिंपळगाव)',
        productName: 'Tomato (टोमॅटो)',
        variety: 'Hybrid 1057',
        price: 2350,
        minPrice: 1950,
        maxPrice: 2700,
        unit: 'Quintal',
        priceDate: today,
        district: 'Nashik',
        state: 'Maharashtra',
        trend: 'stable',
        arrivalQuantity: 3200,
      ),
      MarketPriceItem(
        id: 'MP-4',
        marketName: 'Nashik APMC (पिंपळगाव)',
        productName: 'Onion (कांदा)',
        variety: 'Lal Kaanda',
        price: 2100,
        minPrice: 1700,
        maxPrice: 2450,
        unit: 'Quintal',
        priceDate: today,
        district: 'Nashik',
        state: 'Maharashtra',
        trend: 'up',
        arrivalQuantity: 8600,
      ),
      MarketPriceItem(
        id: 'MP-5',
        marketName: 'Pune APMC (गुलटेकडी)',
        productName: 'Onion (कांदा)',
        variety: 'Garwa / Unhali',
        price: 1850,
        minPrice: 1500,
        maxPrice: 2200,
        unit: 'Quintal',
        priceDate: today,
        district: 'Pune',
        state: 'Maharashtra',
        trend: 'stable',
        arrivalQuantity: 4200,
      ),
      MarketPriceItem(
        id: 'MP-6',
        marketName: 'Solapur APMC',
        productName: 'Onion (कांदा)',
        variety: 'Regular Lal',
        price: 1750,
        minPrice: 1400,
        maxPrice: 2050,
        unit: 'Quintal',
        priceDate: today,
        district: 'Solapur',
        state: 'Maharashtra',
        trend: 'down',
        arrivalQuantity: 5100,
      ),
      MarketPriceItem(
        id: 'MP-7',
        marketName: 'Mumbai Vashi APMC',
        productName: 'Potato (बटाटा)',
        variety: 'Jyoti Grade-A',
        price: 2150,
        minPrice: 1850,
        maxPrice: 2400,
        unit: 'Quintal',
        priceDate: today,
        district: 'Mumbai',
        state: 'Maharashtra',
        trend: 'up',
        arrivalQuantity: 2800,
      ),
      MarketPriceItem(
        id: 'MP-8',
        marketName: 'Pune APMC (गुलटेकडी)',
        productName: 'Potato (बटाटा)',
        variety: 'Jyoti / Local',
        price: 1900,
        minPrice: 1600,
        maxPrice: 2200,
        unit: 'Quintal',
        priceDate: today,
        district: 'Pune',
        state: 'Maharashtra',
        trend: 'stable',
        arrivalQuantity: 3100,
      ),
      MarketPriceItem(
        id: 'MP-9',
        marketName: 'Kolhapur APMC',
        productName: 'Green Chilli (हिरवी मिरची)',
        variety: 'G4 Green',
        price: 4500,
        minPrice: 3800,
        maxPrice: 5200,
        unit: 'Quintal',
        priceDate: today,
        district: 'Kolhapur',
        state: 'Maharashtra',
        trend: 'up',
        arrivalQuantity: 920,
      ),
      MarketPriceItem(
        id: 'MP-10',
        marketName: 'Pune APMC (गुलटेकडी)',
        productName: 'Green Chilli (हिरवी मिरची)',
        variety: 'Lavangi / Local',
        price: 4000,
        minPrice: 3500,
        maxPrice: 4600,
        unit: 'Quintal',
        priceDate: today,
        district: 'Pune',
        state: 'Maharashtra',
        trend: 'stable',
        arrivalQuantity: 1100,
      ),
      MarketPriceItem(
        id: 'MP-11',
        marketName: 'Solapur APMC',
        productName: 'Pomegranate (डाळिंब)',
        variety: 'Bhagwa Super',
        price: 9500,
        minPrice: 8000,
        maxPrice: 11500,
        unit: 'Quintal',
        priceDate: today,
        district: 'Solapur',
        state: 'Maharashtra',
        trend: 'up',
        arrivalQuantity: 650,
      ),
      MarketPriceItem(
        id: 'MP-12',
        marketName: 'Pune APMC (गुलटेकडी)',
        productName: 'Pomegranate (डाळिंब)',
        variety: 'Bhagwa Standard',
        price: 8500,
        minPrice: 7200,
        maxPrice: 9800,
        unit: 'Quintal',
        priceDate: today,
        district: 'Pune',
        state: 'Maharashtra',
        trend: 'stable',
        arrivalQuantity: 820,
      ),
      MarketPriceItem(
        id: 'MP-13',
        marketName: 'Sangli APMC',
        productName: 'Turmeric (हळद)',
        variety: 'Rajapore Salem',
        price: 13800,
        minPrice: 12500,
        maxPrice: 15200,
        unit: 'Quintal',
        priceDate: today,
        district: 'Sangli',
        state: 'Maharashtra',
        trend: 'up',
        arrivalQuantity: 1200,
      ),
      MarketPriceItem(
        id: 'MP-14',
        marketName: 'Kolhapur APMC',
        productName: 'Turmeric (हळद)',
        variety: 'Local Salem',
        price: 12500,
        minPrice: 11200,
        maxPrice: 13900,
        unit: 'Quintal',
        priceDate: today,
        district: 'Kolhapur',
        state: 'Maharashtra',
        trend: 'stable',
        arrivalQuantity: 880,
      ),
    ];
  }

  Future<void> fetchMarketPrices() async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiService().get(
        '/api/admin-ops/market-prices/live',
        timeout: const Duration(seconds: 4),
      );

      if (res != null && res is Map && res['data'] is List) {
        final List list = res['data'];
        if (list.isNotEmpty) {
          final loaded = list
              .map((item) => MarketPriceItem.fromJson(Map<String, dynamic>.from(item)))
              .toList();

          // Merge loaded with fallback if needed so all crops have multi-market comparisons
          final Map<String, MarketPriceItem> map = {};
          for (final item in _items) {
            map['${item.marketName}_${_normalizeProductName(item.productName)}'] = item;
          }
          for (final item in loaded) {
            map['${item.marketName}_${_normalizeProductName(item.productName)}'] = item;
          }
          _items = map.values.toList();
        }
      }
    } catch (_) {
      // Keep existing data gracefully
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  static String _normalizeProductName(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('tomato') || lower.contains('टोमॅटो')) return 'Tomato (टोमॅटो)';
    if (lower.contains('onion') || lower.contains('कांदा')) return 'Onion (कांदा)';
    if (lower.contains('potato') || lower.contains('बटाटा')) return 'Potato (बटाटा)';
    if (lower.contains('chilli') || lower.contains('मिरची')) return 'Green Chilli (हिरवी मिरची)';
    if (lower.contains('pomegranate') || lower.contains('डाळिंब')) return 'Pomegranate (डाळिंब)';
    if (lower.contains('turmeric') || lower.contains('हळद')) return 'Turmeric (हळद)';
    if (lower.contains('soybean') || lower.contains('सोयाबीन')) return 'Soybean (सोयाबीन)';
    if (lower.contains('ginger') || lower.contains('आले')) return 'Ginger (आले)';
    if (lower.contains('garlic') || lower.contains('लसूण')) return 'Garlic (लसूण)';
    return name;
  }

  static String _getEmojiForProduct(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('tomato') || lower.contains('टोमॅटो')) return '🍅';
    if (lower.contains('onion') || lower.contains('कांदा')) return '🧅';
    if (lower.contains('potato') || lower.contains('बटाटा')) return '🥔';
    if (lower.contains('chilli') || lower.contains('मिरची')) return '🌶️';
    if (lower.contains('pomegranate') || lower.contains('डाळिंब')) return '🍇';
    if (lower.contains('turmeric') || lower.contains('हळद')) return '🟡';
    if (lower.contains('soybean') || lower.contains('सोयाबीन')) return '🌱';
    if (lower.contains('ginger') || lower.contains('आले')) return '🫚';
    if (lower.contains('garlic') || lower.contains('लसूण')) return '🧄';
    return '🌾';
  }

  /// Compares all prices for the same product across different markets
  /// and calculates for each market how many percent (%) higher the market rate is!
  List<ProductMarketComparison> getComparisons() {
    final Map<String, List<MarketPriceItem>> grouped = {};

    for (final item in _items) {
      if (!item.isActive) continue;
      final key = _normalizeProductName(item.productName);
      grouped.putIfAbsent(key, () => []).add(item);
    }

    final List<ProductMarketComparison> comparisons = [];

    grouped.forEach((productKey, productItems) {
      if (productItems.isEmpty) return;

      // Deduplicate by marketName (keep highest price quote if multiple)
      final Map<String, MarketPriceItem> marketMap = {};
      for (final p in productItems) {
        final existing = marketMap[p.marketName];
        if (existing == null || p.price > existing.price) {
          marketMap[p.marketName] = p;
        }
      }

      final uniqueItems = marketMap.values.toList();
      uniqueItems.sort((a, b) => b.price.compareTo(a.price)); // highest first

      final minPrice = uniqueItems.map((e) => e.price).reduce((a, b) => a < b ? a : b);
      final maxPrice = uniqueItems.first.price;
      final bestMarket = uniqueItems.first.marketName;
      final avgPrice = uniqueItems.fold<double>(0.0, (acc, e) => acc + e.price) / uniqueItems.length;
      final bestAdvantage = minPrice > 0 ? ((maxPrice - minPrice) / minPrice * 100) : 0.0;

      MarketRateComparison? ggComp;
      final List<MarketRateComparison> rates = uniqueItems.map((m) {
        final pctHigher = minPrice > 0 ? ((m.price - minPrice) / minPrice * 100) : 0.0;
        final c = MarketRateComparison(
          marketName: m.marketName,
          district: m.district,
          price: m.price,
          minPrice: m.minPrice > 0 ? m.minPrice : m.price,
          maxPrice: m.maxPrice > 0 ? m.maxPrice : m.price,
          unit: m.unit,
          trend: m.trend,
          percentHigher: pctHigher,
          isBest: m.price >= maxPrice && maxPrice > minPrice,
          arrivalQuantity: m.arrivalQuantity,
          isGreenGroo: m.isGreenGroo,
        );
        if (m.isGreenGroo) {
          ggComp = c;
        }
        return c;
      }).toList();

      final nonGgMarkets = uniqueItems.where((x) => !x.isGreenGroo).toList();
      double ggVsAvgPercent = 0.0;
      double ggDiffAmount = 0.0;
      if (ggComp != null && nonGgMarkets.isNotEmpty) {
        final nonGgAvg = nonGgMarkets.fold<double>(0.0, (acc, e) => acc + e.price) / nonGgMarkets.length;
        if (nonGgAvg > 0) {
          ggDiffAmount = ggComp!.price - nonGgAvg;
          ggVsAvgPercent = (ggDiffAmount / nonGgAvg) * 100;
        }
      }

      comparisons.add(
        ProductMarketComparison(
          productName: productKey,
          cleanProductName: productKey.replaceAll(RegExp(r'\s*\([^)]*\)'), '').trim(),
          emoji: _getEmojiForProduct(productKey),
          unit: uniqueItems.first.unit,
          minPrice: minPrice,
          maxPrice: maxPrice,
          avgPrice: avgPrice,
          bestMarketName: bestMarket,
          bestAdvantagePercent: bestAdvantage,
          markets: rates,
          greenGrooRate: ggComp,
          greenGrooVsAvgPercent: ggVsAvgPercent,
          greenGrooDiffAmount: ggDiffAmount,
        ),
      );
    });

    // Sort by best advantage percent desc
    comparisons.sort((a, b) => b.bestAdvantagePercent.compareTo(a.bestAdvantagePercent));
    return comparisons;
  }
}
