import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/foundation.dart';

class Env {
  Env._();

  static Future<void> load() async {
    await dotenv.load(fileName: '.env');
  }

  /// Same backend as web frontend (`VITE_API_URL` in frontend/.env).
  static const productionApiUrl = 'https://api.bulkmobilemart.in';

  static String get apiUrl {
    // Production/release builds must always use live backend.
    if (kReleaseMode) {
      return productionApiUrl;
    }

    final raw = dotenv.env['API_URL']?.trim();
    final url =
        raw != null && raw.isNotEmpty ? raw : productionApiUrl;
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  static String get merchantUpiId => dotenv.env['MERCHANT_UPI_ID']?.trim() ?? '';

  static String get merchantUpiName =>
      dotenv.env['MERCHANT_UPI_NAME']?.trim() ?? 'BulkMobileMart';

  /// Public storefront URL used in product share links (must match live website).
  static String get storeUrl {
    final raw = dotenv.env['STORE_URL']?.trim();
    final url = raw != null && raw.isNotEmpty
        ? raw
        : 'https://www.bulkmobilemart.in';
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  /// Warnings for misconfigured `.env` (logged at startup in debug).
  static List<String> validate() {
    final issues = <String>[];
    final url = apiUrl.toLowerCase();

    if (url.contains('localhost') || url.contains('127.0.0.1')) {
      issues.add(
        'API_URL uses localhost — on a physical device use your PC LAN IP '
        '(e.g. http://192.168.1.35:5001).',
      );
    }

    if (merchantUpiId.isEmpty) {
      issues.add('MERCHANT_UPI_ID is empty — UPI QR checkout will not work.');
    }

    return issues;
  }
}
