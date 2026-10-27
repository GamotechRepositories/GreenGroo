import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../config/constants.dart';

class AuthStorage {
  AuthStorage(SharedPreferences? prefs) : _prefs = prefs {
    _instance = this;
  }

  SharedPreferences? _prefs;
  static AuthStorage? _instance;
  static final Map<String, dynamic> _fallbackMemory = {};

  static AuthStorage get instance => _instance ??= AuthStorage(null);

  static Future<AuthStorage> create() async {
    final prefs = await SharedPreferences.getInstance();
    try {
      await prefs.reload();
    } catch (_) {}
    final storage = AuthStorage(prefs);
    _instance = storage;
    return storage;
  }

  String? get token {
    final raw = _prefs?.getString(AppConstants.authStorageKey) ??
        _fallbackMemory[AppConstants.authStorageKey]?.toString();
    if (raw != null && raw.isNotEmpty) {
      try {
        final decoded = jsonDecode(raw);
        if (decoded is Map && decoded['token'] != null) {
          final t = decoded['token'].toString();
          if (t.isNotEmpty) return t;
        }
      } catch (_) {}
    }
    final direct = _prefs?.getString('token') ?? _prefs?.getString('user_token');
    if (direct != null && direct.isNotEmpty) return direct;
    return null;
  }

  Map<String, dynamic>? get session {
    final raw = _prefs?.getString(AppConstants.authStorageKey) ??
        _fallbackMemory[AppConstants.authStorageKey]?.toString();
    if (raw == null || raw.isEmpty) return null;

    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map) {
        return Map<String, dynamic>.from(decoded);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<void> saveSession({
    required Map<String, dynamic> user,
    required String token,
  }) async {
    final encoded = jsonEncode({'user': user, 'token': token});
    _fallbackMemory[AppConstants.authStorageKey] = encoded;
    if (_prefs != null) {
      await _prefs!.setString(AppConstants.authStorageKey, encoded);
      await _prefs!.setString('token', token);
      await _prefs!.setString('user_token', token);
    } else {
      try {
        final prefs = await SharedPreferences.getInstance();
        _prefs = prefs;
        await prefs.setString(AppConstants.authStorageKey, encoded);
        await prefs.setString('token', token);
        await prefs.setString('user_token', token);
      } catch (_) {}
    }
  }

  Future<void> clear() async {
    _fallbackMemory.remove(AppConstants.authStorageKey);
    if (_prefs != null) {
      await _prefs!.remove(AppConstants.authStorageKey);
      await _prefs!.remove('token');
      await _prefs!.remove('user_token');
    } else {
      try {
        final prefs = await SharedPreferences.getInstance();
        _prefs = prefs;
        await prefs.remove(AppConstants.authStorageKey);
        await prefs.remove('token');
        await prefs.remove('user_token');
      } catch (_) {}
    }
  }
}
