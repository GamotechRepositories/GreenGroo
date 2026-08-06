import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/buttons/primary_button.dart';

class LanguageSelectionScreen extends StatefulWidget {
  const LanguageSelectionScreen({super.key});

  @override
  State<LanguageSelectionScreen> createState() => _LanguageSelectionScreenState();
}

class _LanguageSelectionScreenState extends State<LanguageSelectionScreen> {
  String? _selected;

  static const _languages = [
    _Language(code: 'en', name: 'English', native: 'English', flag: '🇬🇧'),
    _Language(code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳'),
    _Language(code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳'),
    _Language(code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳'),
    _Language(code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳'),
    _Language(code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳'),
    _Language(code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳'),
    _Language(code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
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
                    'Choose Language',
                    style: GoogleFonts.inter(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Select your preferred language to continue',
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
                itemCount: _languages.length,
                itemBuilder: (context, index) {
                  final lang = _languages[index];
                  final selected = _selected == lang.code;
                  return _LanguageBox(
                    language: lang,
                    selected: selected,
                    onTap: () => setState(() => _selected = lang.code),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              child: PrimaryButton(
                label: 'Continue',
                onPressed: _selected == null
                    ? null
                    : () => Navigator.pushReplacementNamed(context, AppRoutes.login),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Language {
  const _Language({
    required this.code,
    required this.name,
    required this.native,
    required this.flag,
  });

  final String code;
  final String name;
  final String native;
  final String flag;
}

class _LanguageBox extends StatelessWidget {
  const _LanguageBox({
    required this.language,
    required this.selected,
    required this.onTap,
  });

  final _Language language;
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
                  Text(language.flag, style: const TextStyle(fontSize: 22)),
                  const Spacer(),
                  if (selected)
                    Icon(Icons.check_circle, color: AppColors.primary, size: 22),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                language.name,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                language.native,
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
