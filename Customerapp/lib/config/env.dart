import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  Env._();

  static Future<void> load() async {
    await dotenv.load(fileName: '.env');
  }

  static const productionApiUrl = 'https://api.greengrocc.com';

  /// Release builds always use the live API. Debug builds use API_BASE_URL
  /// (this PC on the LAN) unless USE_LIVE_API=true.
  static String get apiUrl {
    final local = dotenv.env['API_BASE_URL']?.trim() ?? '';
    final live = dotenv.env['API_LIVE_URL']?.trim() ?? '';
    final useLive = dotenv.env['USE_LIVE_API']?.trim().toLowerCase() == 'true';
    final url = kReleaseMode || useLive || local.isEmpty
        ? (live.isNotEmpty ? live : productionApiUrl)
        : local;
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  static String get merchantUpiId => dotenv.env['MERCHANT_UPI_ID']?.trim() ?? '';

  static String get merchantUpiName =>
      dotenv.env['MERCHANT_UPI_NAME']?.trim() ?? 'GreenGrocc';

  /// Public storefront URL used in product share links (must match live website).
  static String get storeUrl {
    final raw = dotenv.env['STORE_URL']?.trim();
    final url = raw != null && raw.isNotEmpty
        ? raw
        : 'https://www.greengrocc.in';
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  /// Warnings for misconfigured `.env` (logged at startup in debug).
  static List<String> validate() {
    final issues = <String>[];

    if (merchantUpiId.isEmpty) {
      issues.add('MERCHANT_UPI_ID is empty — UPI QR checkout will not work.');
    }

    return issues;
  }
}
