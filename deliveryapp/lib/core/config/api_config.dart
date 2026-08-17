import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

import 'platform_api_host.dart';

/// Backend API config — base URL comes from `.env` (`API_BASE_URL`) or local Wi-Fi LAN IP.
abstract final class ApiConfig {
  static String get baseUrl {
    final fromEnv = dotenv.env['API_BASE_URL']?.trim() ?? '';
    String url = fromEnv.isNotEmpty ? fromEnv : 'http://127.0.0.1:5001';

    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }

    return getPlatformApiHost(url);
  }

  static Map<String, String> get defaultHeaders => {
        'Content-Type': 'application/json',
        'User-Agent': 'GreenRowDelivery/1.0',
      };

  static const register = '/api/delivery-boys/register';
  static const login = '/api/delivery-boys/login';
  static const me = '/api/delivery-boys/me';
  static const onboarding = '/api/delivery-boys/onboarding';
  static const status = '/api/delivery-boys/status';
  static const heartbeat = '/api/delivery-boys/heartbeat';
  static const areaManager = '/api/delivery-boys/area-manager';
  static const shifts = '/api/shifts';
  static const shiftBooking = '/api/delivery-boys/shift-booking';
  static const availableSlots = '/api/delivery-boys/available-slots';
  static const shiftBookings = '/api/delivery-boys/shift-bookings';
  static const goOnline = '/api/delivery-boys/go-online';
  static const goOffline = '/api/delivery-boys/go-offline';
  static const loginHours = '/api/delivery-boys/login-hours';
  static const peakHours = '/api/peak-hours';
  static const gigs = '/api/delivery-boys/gigs';

  // Rider Order Workflow Endpoints
  static const offer = '/api/delivery-boys/offer';
  static const activeDelivery = '/api/delivery-boys/active-delivery';
  static String acceptOffer(String id) => '/api/delivery-boys/orders/$id/accept';
  static String declineOffer(String id) => '/api/delivery-boys/orders/$id/decline';
  static String scanStoreQr(String id) => '/api/delivery-boys/orders/$id/scan-store-qr';
  static String completeDelivery(String id) => '/api/delivery-boys/orders/$id/complete';
}

/// Friendly error message that tells the developer exactly what URL timed out.
String _timeoutMessage(String url) =>
    'Could not connect to server.\n\nURL tried: $url\n\n'
    'Fix: Make sure your phone and PC are on the same WiFi, '
    'then update API_BASE_URL in deliveryapp/.env to your PC\'s LAN IP '
    '(e.g. http://192.168.x.x:5001).\n'
    'For emulators use: http://10.0.2.2:5001';

Future<http.Response> apiPost(
  String path, {
  Object? body,
  Map<String, String>? headers,
}) async {
  final url = '${ApiConfig.baseUrl}$path';
  try {
    return await http
        .post(
          Uri.parse(url),
          headers: {...ApiConfig.defaultHeaders, ...?headers},
          body: body,
        )
        .timeout(const Duration(seconds: 15));
  } on Exception catch (e) {
    final msg = e.toString();
    if (msg.contains('TimeoutException') || msg.contains('SocketException')) {
      throw Exception(_timeoutMessage(url));
    }
    rethrow;
  }
}

Future<http.Response> apiGet(
  String path, {
  Map<String, String>? headers,
}) async {
  final url = '${ApiConfig.baseUrl}$path';
  try {
    return await http
        .get(
          Uri.parse(url),
          headers: {...ApiConfig.defaultHeaders, ...?headers},
        )
        .timeout(const Duration(seconds: 15));
  } on Exception catch (e) {
    final msg = e.toString();
    if (msg.contains('TimeoutException') || msg.contains('SocketException')) {
      throw Exception(_timeoutMessage(url));
    }
    rethrow;
  }
}

Future<http.Response> apiPatch(
  String path, {
  Object? body,
  Map<String, String>? headers,
}) async {
  final url = '${ApiConfig.baseUrl}$path';
  try {
    return await http
        .patch(
          Uri.parse(url),
          headers: {...ApiConfig.defaultHeaders, ...?headers},
          body: body,
        )
        .timeout(const Duration(seconds: 15));
  } on Exception catch (e) {
    final msg = e.toString();
    if (msg.contains('TimeoutException') || msg.contains('SocketException')) {
      throw Exception(_timeoutMessage(url));
    }
    rethrow;
  }
}
