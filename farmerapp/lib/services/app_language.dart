import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_colors.dart';

class AppLanguage extends ChangeNotifier {
  static final AppLanguage _instance = AppLanguage._internal();
  factory AppLanguage() => _instance;
  AppLanguage._internal();

  static const String _prefLangKey = 'app_language_code';
  static const String _prefSelectedOnceKey = 'language_selected_once';

  String _currentLanguage = 'mr'; // 'mr' for Marathi, 'en' for English
  bool _hasSelectedOnce = false;
  bool _isInitialized = false;

  String get currentLanguage => _currentLanguage;
  bool get isMarathi => _currentLanguage == 'mr';
  bool get isEnglish => _currentLanguage == 'en';
  bool get hasSelectedOnce => _hasSelectedOnce;
  bool get isInitialized => _isInitialized;

  Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _currentLanguage = prefs.getString(_prefLangKey) ?? 'mr';
      _hasSelectedOnce = prefs.getBool(_prefSelectedOnceKey) ?? false;
      _isInitialized = true;
      notifyListeners();
    } catch (_) {
      _currentLanguage = 'mr';
      _isInitialized = true;
    }
  }

  Future<void> setLanguage(String langCode) async {
    if (langCode != 'mr' && langCode != 'en') return;
    _currentLanguage = langCode;
    _hasSelectedOnce = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefLangKey, langCode);
      await prefs.setBool(_prefSelectedOnceKey, true);
    } catch (_) {}
  }

  /// Returns translated string based on active language
  String tr({required String mr, required String en}) {
    return isMarathi ? mr : en;
  }

  /// Show language selection popup dialog
  static Future<void> showSelectionDialog(
    BuildContext context, {
    bool dismissible = true,
    VoidCallback? onSelected,
  }) async {
    String tempLang = AppLanguage().currentLanguage;

    await showDialog(
      context: context,
      barrierDismissible: dismissible,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 8,
              backgroundColor: Colors.white,
              insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: Padding(
                padding: const EdgeInsets.all(22),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Header Icon
                    Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.language_rounded, color: AppColors.primary, size: 30),
                    ),
                    const SizedBox(height: 14),

                    // Title
                    const Text(
                      'भाषा निवडा / Select Language',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'तुम्हाला ॲप कोणत्या भाषेत वापरायचे आहे?\nWhich language would you like to use?',
                      style: TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.3),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),

                    // Marathi Option Card
                    _buildLanguageCard(
                      title: 'मराठी (Marathi)',
                      subtitle: 'पिके, बाजारभाव, योजना आणि सर्व हिशोब मराठीत',
                      flagEmoji: '🇮🇳',
                      isSelected: tempLang == 'mr',
                      onTap: () => setModalState(() => tempLang = 'mr'),
                    ),
                    const SizedBox(height: 12),

                    // English Option Card
                    _buildLanguageCard(
                      title: 'English',
                      subtitle: 'Crops, market prices, schemes and statements in English',
                      flagEmoji: '🌐',
                      isSelected: tempLang == 'en',
                      onTap: () => setModalState(() => tempLang = 'en'),
                    ),
                    const SizedBox(height: 22),

                    // Confirm / Continue Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () async {
                          await AppLanguage().setLanguage(tempLang);
                          if (dialogCtx.mounted) {
                            Navigator.pop(dialogCtx);
                          }
                          onSelected?.call();
                        },
                        child: Text(
                          tempLang == 'mr' ? 'पुढे चालू ठेवा (Continue)' : 'Continue',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  static Widget _buildLanguageCard({
    required String title,
    required String subtitle,
    required String flagEmoji,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF0FDF4) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0),
            width: isSelected ? 2.0 : 1.2,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : [],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isSelected ? Colors.white : const Color(0xFFF8FAFC),
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? AppColors.primary.withValues(alpha: 0.3) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Text(flagEmoji, style: const TextStyle(fontSize: 20)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? AppColors.primaryDark : const Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11,
                      color: isSelected ? const Color(0xFF15803D) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.primary : Colors.transparent,
                border: Border.all(
                  color: isSelected ? AppColors.primary : const Color(0xFFCBD5E1),
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
