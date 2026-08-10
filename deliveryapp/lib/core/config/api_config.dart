import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

/// Backend API config — base URL comes from `.env` (`API_BASE_URL`).
abstract final class ApiConfig {
  static String get baseUrl {
    final fromEnv = dotenv.env['API_BASE_URL']?.trim() ?? '';
    if (fromEnv.isEmpty) {
      throw StateError(
        'API_BASE_URL is missing. Add it to deliveryapp/.env '
        '(see .env.example).',
      );
    }
    return fromEnv.endsWith('/')
        ? fromEnv.substring(0, fromEnv.length - 1)
        : fromEnv;
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
  static const loginHours = '/api/delivery-boys/login-hours';
  static const peakHours = '/api/peak-hours';
}

Future<http.Response> apiPost(
  String path, {
  Object? body,
  Map<String, String>? headers,
}) {
  return http
      .post(
        Uri.parse('${ApiConfig.baseUrl}$path'),
        headers: {...ApiConfig.defaultHeaders, ...?headers},
        body: body,
      )
      .timeout(const Duration(seconds: 20));
}

Future<http.Response> apiGet(
  String path, {
  Map<String, String>? headers,
}) {
  return http
      .get(
        Uri.parse('${ApiConfig.baseUrl}$path'),
        headers: {...ApiConfig.defaultHeaders, ...?headers},
      )
      .timeout(const Duration(seconds: 20));
}

Future<http.Response> apiPatch(
  String path, {
  Object? body,
  Map<String, String>? headers,
}) {
  return http
      .patch(
        Uri.parse('${ApiConfig.baseUrl}$path'),
        headers: {...ApiConfig.defaultHeaders, ...?headers},
        body: body,
      )
      .timeout(const Duration(seconds: 20));
}
