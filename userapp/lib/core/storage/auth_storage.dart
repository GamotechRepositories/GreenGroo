import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../config/constants.dart';

class AuthStorage {
  AuthStorage(this._prefs);

  final SharedPreferences _prefs;

  static Future<AuthStorage> create() async {
    final prefs = await SharedPreferences.getInstance();
    return AuthStorage(prefs);
  }

  String? get token {
    final raw = _prefs.getString(AppConstants.authStorageKey);
    if (raw == null || raw.isEmpty) return null;

    try {
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      return decoded['token'] as String?;
    } catch (_) {
      return null;
    }
  }

  Map<String, dynamic>? get session {
    final raw = _prefs.getString(AppConstants.authStorageKey);
    if (raw == null || raw.isEmpty) return null;

    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> saveSession({
    required Map<String, dynamic> user,
    required String token,
  }) async {
    await _prefs.setString(
      AppConstants.authStorageKey,
      jsonEncode({'user': user, 'token': token}),
    );
  }

  Future<void> clear() async {
    await _prefs.remove(AppConstants.authStorageKey);
  }
}
