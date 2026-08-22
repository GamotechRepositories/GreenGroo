import 'package:flutter/material.dart';

/// Brand green: #0C831F (same in light & dark)
class AppPalette {
  const AppPalette({
    required this.primary,
    required this.primaryDark,
    required this.primaryLight,
    required this.primarySoft,
    required this.background,
    required this.surface,
    required this.surfaceVariant,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.border,
    required this.error,
    required this.warning,
    required this.info,
    required this.success,
    required this.offline,
    required this.online,
    required this.shadow,
  });

  final Color primary;
  final Color primaryDark;
  final Color primaryLight;
  final Color primarySoft;
  final Color background;
  final Color surface;
  final Color surfaceVariant;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color border;
  final Color error;
  final Color warning;
  final Color info;
  final Color success;
  final Color offline;
  final Color online;
  final Color shadow;

  static const light = AppPalette(
    primary: Color(0xFF16A34A),
    primaryDark: Color(0xFF15803D),
    primaryLight: Color(0xFFDCFCE7),
    primarySoft: Color(0xFFF0FDF4),
    background: Color(0xFFFFFFFF),
    surface: Color(0xFFFFFFFF),
    surfaceVariant: Color(0xFFF8FAFC),
    textPrimary: Color(0xFF111827),
    textSecondary: Color(0xFF4B5563),
    textMuted: Color(0xFF9CA3AF),
    border: Color(0xFFE5E7EB),
    error: Color(0xFFEF4444),
    warning: Color(0xFFF59E0B),
    info: Color(0xFF3B82F6),
    success: Color(0xFF16A34A),
    offline: Color(0xFF6B7280),
    online: Color(0xFF16A34A),
    shadow: Color(0x0F000000),
  );

  static const dark = AppPalette(
    primary: Color(0xFF10B981),
    primaryDark: Color(0xFF34D399),
    primaryLight: Color(0xFF064E3B),
    primarySoft: Color(0xFF065F46),
    background: Color(0xFF0B0F17),
    surface: Color(0xFF1E293B),
    surfaceVariant: Color(0xFF111827),
    textPrimary: Color(0xFFF8FAFC),
    textSecondary: Color(0xFF94A3B8),
    textMuted: Color(0xFF64748B),
    border: Color(0xFF334155),
    error: Color(0xFFF87171),
    warning: Color(0xFFFBBF24),
    info: Color(0xFF60A5FA),
    success: Color(0xFF10B981),
    offline: Color(0xFF9CA3AF),
    online: Color(0xFF34D399),
    shadow: Color(0x40000000),
  );
}

/// Resolves to current light/dark palette via [ThemeController].
abstract final class AppColors {
  static AppPalette get _p => ThemeController.instance.palette;

  static Color get primary => _p.primary;
  static Color get primaryDark => _p.primaryDark;
  static Color get primaryLight => _p.primaryLight;
  static Color get primarySoft => _p.primarySoft;
  static Color get background => _p.background;
  static Color get surface => _p.surface;
  static Color get surfaceVariant => _p.surfaceVariant;
  static Color get textPrimary => _p.textPrimary;
  static Color get textSecondary => _p.textSecondary;
  static Color get textMuted => _p.textMuted;
  static Color get border => _p.border;
  static Color get error => _p.error;
  static Color get warning => _p.warning;
  static Color get info => _p.info;
  static Color get success => _p.success;
  static Color get offline => _p.offline;
  static Color get online => _p.online;
  static Color get shadow => _p.shadow;

  static Color get cardBackground => _p.surface;
  static Color get cardBorder => _p.border;
  static Color get cardSubBg => ThemeController.instance.isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
  static Color get cardSubBorder => ThemeController.instance.isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
}

class ThemeController extends ChangeNotifier {
  ThemeController._();
  static final ThemeController instance = ThemeController._();

  ThemeMode _mode = ThemeMode.light;

  ThemeMode get mode => _mode;
  bool get isDark => _mode == ThemeMode.dark;
  AppPalette get palette => isDark ? AppPalette.dark : AppPalette.light;

  void setDarkMode(bool enabled) {
    final next = enabled ? ThemeMode.dark : ThemeMode.light;
    if (_mode == next) return;
    _mode = next;
    notifyListeners();
  }

  void toggle() => setDarkMode(!isDark);
}
