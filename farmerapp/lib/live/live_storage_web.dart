import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'live_storage.dart' show LiveSaved, liveCacheMaxAge, liveKeyHash;

const _prefix = 'live_cache:';

/// Browser builds keep cached responses in local storage (best-effort; size-limited).
class LiveStorage {
  static Future<LiveSaved?> read(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('$_prefix${liveKeyHash(key)}');
      if (raw == null) return null;
      final row = jsonDecode(raw);
      if (row is! Map || row['k'] != key) return null;
      final savedAt = DateTime.fromMillisecondsSinceEpoch((row['t'] as num?)?.toInt() ?? 0);
      if (DateTime.now().difference(savedAt) > liveCacheMaxAge) return null;
      return LiveSaved(row['d'], row['h']?.toString() ?? '');
    } catch (_) {
      return null;
    }
  }

  static Future<void> write(String key, dynamic data, String hash) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        '$_prefix${liveKeyHash(key)}',
        jsonEncode({'k': key, 'h': hash, 't': DateTime.now().millisecondsSinceEpoch, 'd': data}),
      );
    } catch (_) {}
  }

  static Future<void> remove(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_prefix${liveKeyHash(key)}');
    } catch (_) {}
  }

  static Future<void> clear() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      for (final key in prefs.getKeys().where((k) => k.startsWith(_prefix)).toList()) {
        await prefs.remove(key);
      }
    } catch (_) {}
  }
}
