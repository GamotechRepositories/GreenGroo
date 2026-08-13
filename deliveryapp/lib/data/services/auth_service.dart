import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/config/api_config.dart';
import '../../core/l10n/locale_controller.dart';
import 'rider_live_service.dart';

class DeliveryBoy {
  const DeliveryBoy({
    required this.id,
    required this.phone,
    required this.onboardingComplete,
    required this.onboardingStep,
    this.name = '',
    this.language = 'en',
    this.city = '',
    this.cityId = '',
    this.area = '',
    this.vehicleType = '',
    this.status = 'offline',
    this.verificationStatus = 'pending',
  });

  final String id;
  final String phone;
  final String name;
  final String language;
  final String city;
  final String cityId;
  final String area;
  final String vehicleType;
  final String status;
  final bool onboardingComplete;
  final String onboardingStep;
  final String verificationStatus;

  bool get isOnline => status == 'online' || status == 'on_delivery';
  bool get isVerificationPending =>
      verificationStatus != 'approved' && verificationStatus != 'rejected';
  bool get isVerified => verificationStatus == 'approved';

  factory DeliveryBoy.fromJson(Map<String, dynamic> json) {
    return DeliveryBoy(
      id: json['id']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      language: json['language']?.toString() ?? 'en',
      city: json['city']?.toString() ?? '',
      cityId: json['cityId']?.toString() ?? '',
      area: json['area']?.toString() ?? '',
      vehicleType: json['vehicleType']?.toString() ?? '',
      status: json['status']?.toString() ?? 'offline',
      onboardingComplete: json['onboardingComplete'] == true,
      onboardingStep: json['onboardingStep']?.toString() ?? 'vehicle',
      verificationStatus: json['verificationStatus']?.toString() ?? 'pending',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'name': name,
        'language': language,
        'city': city,
        'cityId': cityId,
        'area': area,
        'vehicleType': vehicleType,
        'status': status,
        'onboardingComplete': onboardingComplete,
        'onboardingStep': onboardingStep,
        'verificationStatus': verificationStatus,
      };
}

class AreaManagerInfo {
  const AreaManagerInfo({
    required this.name,
    required this.phone,
    required this.storeName,
    required this.storeAddress,
    this.storeId = '',
    this.email = '',
    this.city = '',
    this.area = '',
  });

  final String name;
  final String phone;
  final String email;
  final String storeName;
  final String storeAddress;
  final String storeId;
  final String city;
  final String area;

  factory AreaManagerInfo.fromJson(Map<String, dynamic> json) {
    return AreaManagerInfo(
      name: json['name']?.toString() ?? 'Delivery Manager',
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      storeName: json['storeName']?.toString() ?? '',
      storeAddress: json['storeAddress']?.toString() ?? '',
      storeId: json['storeId']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      area: json['area']?.toString() ?? '',
    );
  }
}

class AuthResult {
  const AuthResult({required this.token, required this.deliveryBoy});

  final String token;
  final DeliveryBoy deliveryBoy;
}

class AuthApiException implements Exception {
  AuthApiException(this.message);
  final String message;

  @override
  String toString() => message;
}

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  static const _tokenKey = 'auth_token';
  static const _boyKey = 'delivery_boy';

  String? _token;
  DeliveryBoy? _deliveryBoy;

  String? get token => _token;
  DeliveryBoy? get deliveryBoy => _deliveryBoy;
  bool get isLoggedIn => _token != null && _token!.isNotEmpty;

  String get _currentLanguage =>
      LocaleController.instance.locale?.languageCode ?? 'en';

  Future<void> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    final raw = prefs.getString(_boyKey);
    if (raw != null) {
      try {
        _deliveryBoy = DeliveryBoy.fromJson(
          jsonDecode(raw) as Map<String, dynamic>,
        );
      } catch (_) {
        _deliveryBoy = null;
      }
    }
  }

  Future<void> _persist(String token, DeliveryBoy boy) async {
    _token = token;
    _deliveryBoy = boy;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_boyKey, jsonEncode(boy.toJson()));
  }

  Future<void> clearSession() async {
    _token = null;
    _deliveryBoy = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_boyKey);
  }

  Future<AuthResult> register({
    required String phone,
    required String password,
    String name = '',
  }) async {
    try {
      final res = await apiPost(
        ApiConfig.register,
        body: jsonEncode({
          'phone': phone,
          'password': password,
          'language': _currentLanguage,
          if (name.isNotEmpty) 'name': name,
        }),
      );
      return _parseAuthResponse(res);
    } on AuthApiException {
      rethrow;
    } catch (e) {
      // Surface the friendly message from api_config (includes URL + fix hint)
      throw AuthApiException(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<AuthResult> login({
    required String phone,
    required String password,
  }) async {
    try {
      final res = await apiPost(
        ApiConfig.login,
        body: jsonEncode({
          'phone': phone,
          'password': password,
          'language': _currentLanguage,
        }),
      );
      return _parseAuthResponse(res);
    } on AuthApiException {
      rethrow;
    } catch (e) {
      // Surface the friendly message from api_config (includes URL + fix hint)
      throw AuthApiException(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<DeliveryBoy?> fetchMe() async {
    if (!isLoggedIn) return null;
    try {
      final res = await apiGet(ApiConfig.me, headers: _authHeaders);
      if (res.statusCode != 200) {
        if (res.statusCode == 401) await clearSession();
        return null;
      }
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final boy = DeliveryBoy.fromJson(
        body['deliveryBoy'] as Map<String, dynamic>,
      );
      await _persist(_token!, boy);
      return boy;
    } catch (_) {
      return null;
    }
  }

  /// Saves onboarding fields into the same DeliveryBoy document.
  Future<void> updateOnboarding({
    String? step,
    bool? complete,
    Map<String, dynamic>? data,
  }) async {
    if (!isLoggedIn) return;
    try {
      final res = await apiPatch(
        ApiConfig.onboarding,
        headers: _authHeaders,
        body: jsonEncode({
          if (step != null) 'onboardingStep': step,
          if (complete != null) 'onboardingComplete': complete,
          ...?data,
        }),
      );
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        final boy = DeliveryBoy.fromJson(
          body['deliveryBoy'] as Map<String, dynamic>,
        );
        await _persist(_token!, boy);
      }
    } catch (_) {
      // Offline / unreachable — keep local progress; sync later.
    }
  }

  /// Immediate online/offline update in DB.
  Future<DeliveryBoy?> updateStatus(String status) async {
    if (!isLoggedIn) return null;
    try {
      final res = await apiPatch(
        ApiConfig.status,
        headers: _authHeaders,
        body: jsonEncode({'status': status}),
      );
      if (res.statusCode != 200) {
        try {
          final body = jsonDecode(res.body) as Map<String, dynamic>;
          throw AuthApiException(
            body['message']?.toString() ?? 'Could not update status',
          );
        } on AuthApiException {
          rethrow;
        } catch (_) {
          return null;
        }
      }
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final boy = DeliveryBoy.fromJson(
        body['deliveryBoy'] as Map<String, dynamic>,
      );
      RiderLiveService.instance.applyStatusResponse(body);
      await _persist(_token!, boy);
      return boy;
    } on AuthApiException {
      rethrow;
    } catch (e) {
      throw AuthApiException(
        'Cannot reach ${ApiConfig.baseUrl}\n$e',
      );
    }
  }

  Future<AreaManagerInfo?> fetchAreaManager() async {
    if (!isLoggedIn) return null;
    try {
      final res = await apiGet(ApiConfig.areaManager, headers: _authHeaders);
      if (res.statusCode != 200) return null;
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final manager = body['manager'];
      if (manager is! Map<String, dynamic>) return null;
      return AreaManagerInfo.fromJson(manager);
    } catch (_) {
      return null;
    }
  }

  Future<AreaManagerInfo?> fetchAreaManagerByLocation(String cityId, String area) async {
    try {
      final path = '${ApiConfig.areaManager}?cityId=${Uri.encodeComponent(cityId)}&area=${Uri.encodeComponent(area)}';
      final res = await apiGet(path, headers: isLoggedIn ? _authHeaders : null);
      if (res.statusCode != 200) return null;
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final manager = body['manager'];
      if (manager is! Map<String, dynamic>) return null;
      return AreaManagerInfo.fromJson(manager);
    } catch (_) {
      return null;
    }
  }

  /// Keep online status live while the partner is working.
  Future<void> sendHeartbeat() async {
    if (!isLoggedIn) return;
    try {
      final res = await apiPost(
        ApiConfig.heartbeat,
        headers: _authHeaders,
        body: jsonEncode({}),
      );
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        final boy = DeliveryBoy.fromJson(
          body['deliveryBoy'] as Map<String, dynamic>,
        );
        await _persist(_token!, boy);
      }
    } catch (_) {
      // Offline / reverse tunnel dropped — ignore.
    }
  }

  Map<String, String> get authHeaders => _authHeaders;

  Map<String, String> get _authHeaders => {
        'Authorization': 'Bearer $_token',
      };

  Future<AuthResult> _parseAuthResponse(http.Response res) async {
    Map<String, dynamic> body;
    try {
      body = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw AuthApiException('Unable to reach server');
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw AuthApiException(
        body['message']?.toString() ?? 'Authentication failed',
      );
    }

    final token = body['token']?.toString() ?? '';
    final boyJson = body['deliveryBoy'] as Map<String, dynamic>?;
    if (token.isEmpty || boyJson == null) {
      throw AuthApiException('Invalid server response');
    }

    final boy = DeliveryBoy.fromJson(boyJson);
    await _persist(token, boy);
    return AuthResult(token: token, deliveryBoy: boy);
  }

  static String routeForStep(String step, {required bool complete}) {
    if (complete) return '/home';
    return switch (step) {
      'city' => '/select-city',
      'area' => '/select-area',
      'documents' => '/upload-documents',
      'selfie' => '/take-selfie',
      'liveness' => '/liveness-check',
      'home' => '/home',
      _ => '/select-vehicle',
    };
  }

  static Object? argumentsForStep(DeliveryBoy? boy) {
    if (boy == null) return null;
    if (boy.onboardingStep == 'area') {
      return boy.cityId.isNotEmpty ? boy.cityId : null;
    }
    return null;
  }
}
