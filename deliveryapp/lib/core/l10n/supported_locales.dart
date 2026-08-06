import 'package:flutter/material.dart';

/// Central registry of supported app locales.
/// Adding a new language only requires a new ARB file and an entry here.
abstract final class SupportedLocales {
  static const locales = [
    Locale('en'),
    Locale('hi'),
    Locale('mr'),
    Locale('ta'),
    Locale('te'),
    Locale('kn'),
  ];

  static const codes = ['en', 'hi', 'mr', 'ta', 'te', 'kn'];

  static bool isSupported(String code) => codes.contains(code);

  /// English fallback names — used on the language picker before locale is set.
  static const displayNames = {
    'en': 'English',
    'hi': 'Hindi',
    'mr': 'Marathi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'kn': 'Kannada',
  };

  static const nativeNames = {
    'en': 'English',
    'hi': 'हिन्दी',
    'mr': 'मराठी',
    'ta': 'தமிழ்',
    'te': 'తెలుగు',
    'kn': 'ಕನ್ನಡ',
  };

  static String displayName(String code) => displayNames[code] ?? code;

  static String nativeName(String code) => nativeNames[code] ?? code;
}
