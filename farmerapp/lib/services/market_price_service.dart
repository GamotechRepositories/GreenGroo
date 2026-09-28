import 'package:flutter/foundation.dart';
import '../models/market_price_item.dart';
import 'api_service.dart';

class MarketPriceService extends ChangeNotifier {
  static final MarketPriceService _instance = MarketPriceService._internal();
  factory MarketPriceService() => _instance;
  MarketPriceService._internal() {
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
        final loaded = list
            .map((item) => MarketPriceItem.fromJson(Map<String, dynamic>.from(item)))
            .toList();

        if (date != null && date.isNotEmpty && date != 'all') {
          // Replace or merge items for this date
          final dateStr = date.substring(0, 10);
          final retained = _items.where((i) => !i.priceDate.startsWith(dateStr)).toList();
          _items = [...retained, ...loaded];
        } else {
          _items = loaded;
        }
      }
    } catch (_) {
      // Keep existing data gracefully
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void handleSocketPriceUpdate(Map<String, dynamic> raw) {
    try {
      final item = MarketPriceItem.fromJson(raw);
      final idx = _items.indexWhere((i) => i.id == item.id);
      if (idx >= 0) {
        _items[idx] = item;
      } else {
        _items.insert(0, item);
      }
      notifyListeners();
    } catch (_) {
      fetchMarketPrices();
    }
  }

  void handleSocketPriceDelete(String id) {
    _items.removeWhere((i) => i.id == id);
    notifyListeners();
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
    if (lower.contains('wheat') || lower.contains('गहू')) return 'Wheat (गहू)';
    if (lower.contains('coriander') || lower.contains('कोथिंबीर')) return 'Coriander (कोथिंबीर)';
    if (lower.contains('fenugreek') || lower.contains('मेथी')) return 'Fenugreek (मेथी)';
    if (lower.contains('cauliflower') || lower.contains('फ्लॉवर')) return 'Cauliflower (फ्लॉवर)';
    if (lower.contains('cabbage') || lower.contains('कोबी')) return 'Cabbage (कोबी)';
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
    if (lower.contains('wheat') || lower.contains('गहू')) return '🌾';
    if (lower.contains('coriander') || lower.contains('कोथिंबीर')) return '🌿';
    if (lower.contains('fenugreek') || lower.contains('मेथी')) return '🌱';
    if (lower.contains('cauliflower') || lower.contains('फ्लॉवर')) return '🥦';
    if (lower.contains('cabbage') || lower.contains('कोबी')) return '🥬';
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
