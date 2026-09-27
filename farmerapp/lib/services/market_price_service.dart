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

  List<String> get availableDates {
    final set = <String>{};
    for (final item in _items) {
      if (item.priceDate.isNotEmpty) {
        set.add(item.priceDate.substring(0, 10));
      }
    }
    final list = set.toList();
    list.sort((a, b) => b.compareTo(a)); // newest first
    return list;
  }

  static String _getDateOffset(int days) {
    final d = DateTime.now().add(Duration(days: days));
    return d.toIso8601String().substring(0, 10);
  }

  void _initFallbackData() {
    final baseSeeds = [
      (id: 'MP-GG-1', m: 'GreenGroo Direct (ग्रीनग्रू खरेदी केंद्र)', p: 'Tomato (टोमॅटो)', v: 'Hybrid Super Grade', pr: 2850.0, min: 2500.0, max: 3100.0, dist: 'Pune Hub', t: 'up', arr: 3200.0, gg: true),
      (id: 'MP-GG-2', m: 'GreenGroo Direct (ग्रीनग्रू खरेदी केंद्र)', p: 'Onion (कांदा)', v: 'Garwa / Export', pr: 2250.0, min: 1950.0, max: 2500.0, dist: 'Nashik Hub', t: 'up', arr: 5400.0, gg: true),
      (id: 'MP-GG-3', m: 'GreenGroo Direct (ग्रीनग्रू खरेदी केंद्र)', p: 'Potato (बटाटा)', v: 'Jyoti Premium', pr: 2300.0, min: 2000.0, max: 2500.0, dist: 'Pune Hub', t: 'up', arr: 2800.0, gg: true),
      (id: 'MP-1', m: 'Mumbai Vashi APMC', p: 'Tomato (टोमॅटो)', v: 'Desi Special', pr: 2600.0, min: 2200.0, max: 3000.0, dist: 'Mumbai', t: 'up', arr: 2100.0, gg: false),
      (id: 'MP-2', m: 'Pune APMC (गुलटेकडी)', p: 'Tomato (टोमॅटो)', v: 'Hybrid No.1', pr: 2400.0, min: 2000.0, max: 2800.0, dist: 'Pune', t: 'up', arr: 1850.0, gg: false),
      (id: 'MP-3', m: 'Nashik APMC (पिंपळगाव)', p: 'Tomato (टोमॅटो)', v: 'Hybrid 1057', pr: 2350.0, min: 1950.0, max: 2700.0, dist: 'Nashik', t: 'stable', arr: 3200.0, gg: false),
      (id: 'MP-4', m: 'Nashik APMC (पिंपळगाव)', p: 'Onion (कांदा)', v: 'Lal Kaanda', pr: 2100.0, min: 1700.0, max: 2450.0, dist: 'Nashik', t: 'up', arr: 8600.0, gg: false),
      (id: 'MP-5', m: 'Pune APMC (गुलटेकडी)', p: 'Onion (कांदा)', v: 'Garwa / Unhali', pr: 1850.0, min: 1500.0, max: 2200.0, dist: 'Pune', t: 'stable', arr: 4200.0, gg: false),
      (id: 'MP-6', m: 'Solapur APMC', p: 'Onion (कांदा)', v: 'Regular Lal', pr: 1750.0, min: 1400.0, max: 2050.0, dist: 'Solapur', t: 'down', arr: 5100.0, gg: false),
      (id: 'MP-7', m: 'Mumbai Vashi APMC', p: 'Potato (बटाटा)', v: 'Jyoti Grade-A', pr: 2150.0, min: 1850.0, max: 2400.0, dist: 'Mumbai', t: 'up', arr: 2800.0, gg: false),
      (id: 'MP-8', m: 'Pune APMC (गुलटेकडी)', p: 'Potato (बटाटा)', v: 'Jyoti / Local', pr: 1900.0, min: 1600.0, max: 2200.0, dist: 'Pune', t: 'stable', arr: 3100.0, gg: false),
      (id: 'MP-9', m: 'Kolhapur APMC', p: 'Green Chilli (हिरवी मिरची)', v: 'G4 Green', pr: 4500.0, min: 3800.0, max: 5200.0, dist: 'Kolhapur', t: 'up', arr: 920.0, gg: false),
      (id: 'MP-10', m: 'Pune APMC (गुलटेकडी)', p: 'Green Chilli (हिरवी मिरची)', v: 'Lavangi / Local', pr: 4000.0, min: 3500.0, max: 4600.0, dist: 'Pune', t: 'stable', arr: 1100.0, gg: false),
      (id: 'MP-11', m: 'Solapur APMC', p: 'Pomegranate (डाळिंब)', v: 'Bhagwa Super', pr: 9500.0, min: 8000.0, max: 11500.0, dist: 'Solapur', t: 'up', arr: 650.0, gg: false),
      (id: 'MP-12', m: 'Pune APMC (गुलटेकडी)', p: 'Pomegranate (डाळिंब)', v: 'Bhagwa Standard', pr: 8500.0, min: 7200.0, max: 9800.0, dist: 'Pune', t: 'stable', arr: 820.0, gg: false),
      (id: 'MP-13', m: 'Sangli APMC', p: 'Turmeric (हळद)', v: 'Rajapore Salem', pr: 13800.0, min: 12500.0, max: 15200.0, dist: 'Sangli', t: 'up', arr: 1200.0, gg: false),
      (id: 'MP-14', m: 'Kolhapur APMC', p: 'Turmeric (हळद)', v: 'Local Salem', pr: 12500.0, min: 11200.0, max: 13900.0, dist: 'Kolhapur', t: 'stable', arr: 880.0, gg: false),
    ];

    final List<MarketPriceItem> generated = [];
    final offsets = [0, -1, -2, -3, -4, -5, -6];

    for (final off in offsets) {
      final dateStr = _getDateOffset(off);
      for (final s in baseSeeds) {
        final delta = off * 25.0 * (s.t == 'up' ? -1 : s.t == 'down' ? 1 : (off % 2 == 0 ? 1 : -1));
        final finalPrice = (s.pr + delta).clamp(s.min, s.max);
        generated.add(
          MarketPriceItem(
            id: '${s.id}_$off',
            marketName: s.m,
            productName: s.p,
            variety: s.v,
            price: finalPrice,
            minPrice: s.min,
            maxPrice: s.max,
            unit: 'Quintal',
            priceDate: dateStr,
            district: s.dist,
            state: 'Maharashtra',
            trend: s.t,
            arrivalQuantity: s.arr,
            isGreenGroo: s.gg,
          ),
        );
      }
    }
    _items = generated;
  }

  Future<void> fetchMarketPrices({String? date}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final uri = (date != null && date.isNotEmpty && date != 'all')
          ? '/api/admin-ops/market-prices/live?date=$date'
          : '/api/admin-ops/market-prices/live';

      final res = await ApiService().get(
        uri,
        timeout: const Duration(seconds: 4),
      );

      if (res != null && res is Map && res['data'] is List) {
        final List list = res['data'];
        if (list.isNotEmpty) {
          final loaded = list
              .map((item) => MarketPriceItem.fromJson(Map<String, dynamic>.from(item)))
              .toList();

          // Merge loaded with fallback
          final Map<String, MarketPriceItem> map = {};
          for (final item in _items) {
            map['${item.marketName}_${_normalizeProductName(item.productName)}_${item.priceDate.isNotEmpty ? item.priceDate.substring(0, 10) : ""}'] = item;
          }
          for (final item in loaded) {
            map['${item.marketName}_${_normalizeProductName(item.productName)}_${item.priceDate.isNotEmpty ? item.priceDate.substring(0, 10) : ""}'] = item;
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

  /// Compares all prices for the same product across different markets for a given date
  List<ProductMarketComparison> getComparisons({String? date}) {
    final Map<String, List<MarketPriceItem>> grouped = {};

    final sourceItems = (date != null && date.isNotEmpty && date != 'all')
        ? _items.where((i) => i.priceDate.startsWith(date)).toList()
        : _items;

    for (final item in sourceItems) {
      if (!item.isActive) continue;
      final key = _normalizeProductName(item.productName);
      grouped.putIfAbsent(key, () => []).add(item);
    }

    final List<ProductMarketComparison> comparisons = [];

    grouped.forEach((productKey, productItems) {
      if (productItems.isEmpty) return;

      // Deduplicate by marketName (keep latest or highest quote)
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
