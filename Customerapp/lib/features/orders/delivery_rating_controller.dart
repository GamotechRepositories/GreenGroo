import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _storageKey = 'order_delivery_ratings';

final deliveryRatingsProvider =
    NotifierProvider<DeliveryRatingsController, Map<String, int>>(
  DeliveryRatingsController.new,
);

/// Rebuilds only when this order's rating changes.
final deliveryRatingProvider = Provider.family<int?, String>((ref, orderId) {
  return ref.watch(deliveryRatingsProvider.select((m) => m[orderId]));
});

class DeliveryRatingsController extends Notifier<Map<String, int>> {
  @override
  Map<String, int> build() {
    _load();
    return {};
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) return;

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) return;
      final ratings = <String, int>{};
      decoded.forEach((key, value) {
        final rating = value is int ? value : int.tryParse(value.toString());
        if (rating != null && rating > 0) {
          ratings[key.toString()] = rating.clamp(1, 5);
        }
      });
      state = ratings;
    } catch (_) {
      // Ignore corrupt local cache.
    }
  }

  Future<void> setRating(String orderId, int rating) async {
    if (orderId.isEmpty) return;
    final next = {...state, orderId: rating.clamp(1, 5)};
    state = next;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, jsonEncode(next));
  }
}
