import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/l10n/locale_controller.dart';
import '../../../core/l10n/supported_locales.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/onboarding_nav.dart';
import '../../../data/services/auth_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/buttons/primary_button.dart';

class LanguageSelectionScreen extends StatefulWidget {
  const LanguageSelectionScreen({
    super.key,
    this.fromSettings = false,
  });

  final bool fromSettings;

  @override
  State<LanguageSelectionScreen> createState() =>
      _LanguageSelectionScreenState();
}

class _LanguageSelectionScreenState extends State<LanguageSelectionScreen> {
  String? _selected;

  @override
  void initState() {
    super.initState();
    _selected = LocaleController.instance.locale?.languageCode ?? 'en';
  }

  Future<void> _continue() async {
    if (_selected == null) return;
    await LocaleController.instance.setLocale(Locale(_selected!));
    if (!mounted) return;

    // Only sync language to backend when already registered/logged in.
    // First-time users go to Login/Register — no API call needed here.
    if (AuthService.instance.isLoggedIn) {
      try {
        await AuthService.instance.updateOnboarding(
          data: {'language': _selected},
        );
      } catch (_) {}
    }

    if (!mounted) return;

    if (widget.fromSettings) {
      Navigator.pop(context);
      return;
    }

    Navigator.pushReplacementNamed(context, AppRoutes.login);
  }

  String _englishName(AppLocalizations l10n, String code) {
    return switch (code) {
      'en' => l10n.languageEnglish,
      'hi' => l10n.languageHindi,
      'mr' => l10n.languageMarathi,
      'ta' => l10n.languageTamil,
      'te' => l10n.languageTelugu,
      'kn' => l10n.languageKannada,
      _ => SupportedLocales.displayName(code),
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        automaticallyImplyLeading: false,
        // First-time (not from Settings): no back — splash already finished.
        leading: widget.fromSettings ? const AppBackButton() : null,
      ),
      body: SafeArea(
        top: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(Icons.translate_rounded, color: AppColors.primary),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    l10n.chooseLanguage,
                    style: GoogleFonts.inter(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.selectLanguageSubtitle,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.45,
                ),
                itemCount: SupportedLocales.codes.length,
                itemBuilder: (context, index) {
                  final code = SupportedLocales.codes[index];
                  final selected = _selected == code;
                  return _LanguageBox(
                    englishName: _englishName(l10n, code),
                    nativeName: SupportedLocales.nativeName(code),
                    selected: selected,
                    onTap: () => setState(() => _selected = code),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              child: PrimaryButton(
                label: widget.fromSettings
                    ? l10n.saveLanguage
                    : l10n.continueButton,
                onPressed: _selected == null ? null : _continue,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LanguageBox extends StatelessWidget {
  const _LanguageBox({
    required this.englishName,
    required this.nativeName,
    required this.selected,
    required this.onTap,
  });

  final String englishName;
  final String nativeName;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.primaryLight : Colors.white,
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                children: [
                  const Spacer(),
                  if (selected)
                    Icon(Icons.check_circle, color: AppColors.primary, size: 22),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                englishName,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                nativeName,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
