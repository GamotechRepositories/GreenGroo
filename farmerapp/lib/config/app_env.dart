import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Values from the bundled `.env` asset. Call [load] once before reading.
class AppEnv {
  AppEnv._();

  static final Map<String, String> _values = {};
  static bool _loaded = false;

  static Future<void> load() async {
    if (_loaded) return;
    try {
      final raw = await rootBundle.loadString('.env');
      for (final line in raw.split('\n')) {
        final trimmed = line.trim();
        if (trimmed.isEmpty || trimmed.startsWith('#')) continue;
        final idx = trimmed.indexOf('=');
        if (idx <= 0) continue;
        final key = trimmed.substring(0, idx).trim();
        var value = trimmed.substring(idx + 1).trim();
        if (value.length >= 2 &&
            ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'")))) {
          value = value.substring(1, value.length - 1);
        }
        _values[key] = value;
      }
    } catch (_) {}
    _loaded = true;
  }

  static String get(String key, [String fallback = '']) {
    final v = _values[key];
    return (v == null || v.isEmpty) ? fallback : v;
  }

  static String _trimSlash(String url) => url.replaceAll(RegExp(r'/+$'), '');

  static String get localApiUrl =>
      _trimSlash(get('API_BASE_URL', get('VITE_API_URL', get('API_URL'))));

  static String get liveApiUrl => _trimSlash(get('API_LIVE_URL'));

  /// Release builds always use the live API; debug builds only when USE_LIVE_API=true.
  static bool get useLiveApi =>
      liveApiUrl.isNotEmpty && (kReleaseMode || get('USE_LIVE_API').toLowerCase() == 'true');
}
