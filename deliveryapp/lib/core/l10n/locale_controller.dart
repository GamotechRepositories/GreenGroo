import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'supported_locales.dart';

/// Persists and applies the user's selected app locale.
class LocaleController extends ChangeNotifier {
  LocaleController._();

  static final LocaleController instance = LocaleController._();

  static const _localeKey = 'selected_locale';
  static const _hasSelectedKey = 'has_selected_language';

  Locale? _locale;
  bool _hasSelectedLanguage = false;
  bool _isLoaded = false;

  Locale? get locale => _locale;
  bool get hasSelectedLanguage => _hasSelectedLanguage;
  bool get isLoaded => _isLoaded;

  Future<void> loadSavedLocale() async {
    final prefs = await SharedPreferences.getInstance();
    _hasSelectedLanguage = prefs.getBool(_hasSelectedKey) ?? false;
    final code = prefs.getString(_localeKey);

    if (code != null && SupportedLocales.isSupported(code)) {
      _locale = Locale(code);
    } else {
      _locale = null;
    }

    _isLoaded = true;
    notifyListeners();
  }

  Future<void> setLocale(Locale locale) async {
    if (!SupportedLocales.isSupported(locale.languageCode)) return;

    _locale = locale;
    _hasSelectedLanguage = true;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localeKey, locale.languageCode);
    await prefs.setBool(_hasSelectedKey, true);

    notifyListeners();
  }

  String displayNameFor(String languageCode) {
    return SupportedLocales.displayName(languageCode);
  }
}
