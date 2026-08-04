import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

const _storageKey = 'bmm_recently_viewed';
const maxRecentlyViewedItems = 20;

class RecentlyViewedStore {
  RecentlyViewedStore._();

  static Future<List<String>> getIds() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw == null || raw.isEmpty) return const [];

      final decoded = jsonDecode(raw);
      if (decoded is! List) return const [];

      return decoded
          .map((item) => item?.toString() ?? '')
          .where((id) => id.isNotEmpty)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  static Future<void> add(String productId) async {
    if (productId.isEmpty) return;

    final id = productId.trim();
    final current = (await getIds()).where((item) => item != id).toList();
    final next = [id, ...current].take(maxRecentlyViewedItems).toList();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_storageKey, jsonEncode(next));
    } catch (_) {
      // Ignore storage quota or privacy mode errors.
    }
  }
}
