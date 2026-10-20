import 'package:flutter/material.dart';

import '../../../core/l10n/locale_controller.dart';
import '../../../core/l10n/supported_locales.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/onboarding_nav.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../widgets/tiles/profile_tile.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([
        ThemeController.instance,
        LocaleController.instance,
      ]),
      builder: (context, _) {
        final l10n = AppLocalizations.of(context);
        final isDark = ThemeController.instance.isDark;
        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: CustomAppBar(
            title: l10n.settings,
            showBackButton: true,
          ),
          body: _SettingsBody(isDark: isDark),
        );
      },
    );
  }
}

class _SettingsBody extends StatefulWidget {
  const _SettingsBody({required this.isDark});

  final bool isDark;

  @override
  State<_SettingsBody> createState() => _SettingsBodyState();
}

class _SettingsBodyState extends State<_SettingsBody> {
  bool _pushNotifications = true;
  bool _orderAlerts = true;

  String _currentLanguageName(AppLocalizations l10n) {
    final code = LocaleController.instance.locale?.languageCode ?? 'en';
    return switch (code) {
      'hi' => l10n.languageHindi,
      'mr' => l10n.languageMarathi,
      'ta' => l10n.languageTamil,
      'te' => l10n.languageTelugu,
      'kn' => l10n.languageKannada,
      _ => l10n.languageEnglish,
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
      children: [
        DashboardCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              SwitchListTile(
                dense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                title: Text(
                  l10n.darkMode,
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14),
                ),
                subtitle: Text(
                  widget.isDark ? l10n.darkThemeOn : l10n.lightThemeOn,
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
                secondary: Icon(
                  widget.isDark
                      ? Icons.dark_mode_rounded
                      : Icons.light_mode_rounded,
                  color: AppColors.primary,
                  size: 22,
                ),
                value: widget.isDark,
                activeThumbColor: AppColors.primary,
                onChanged: (value) =>
                    ThemeController.instance.setDarkMode(value),
              ),
              Divider(
                height: 1,
                indent: 14,
                endIndent: 14,
                color: AppColors.cardBorder,
              ),
              ProfileTile(
                title: l10n.language,
                subtitle:
                    '${_currentLanguageName(l10n)} · ${SupportedLocales.nativeName(LocaleController.instance.locale?.languageCode ?? 'en')}',
                leadingIcon: Icons.language_outlined,
                onTap: () => Navigator.pushNamed(
                  context,
                  AppRoutes.selectLanguage,
                  arguments: true,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Text(
          l10n.notifications,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 6),
        DashboardCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              SwitchListTile(
                dense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                title: Text(
                  l10n.pushNotifications,
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14),
                ),
                value: _pushNotifications,
                activeThumbColor: AppColors.primary,
                onChanged: (value) =>
                    setState(() => _pushNotifications = value),
              ),
              Divider(
                height: 1,
                indent: 14,
                endIndent: 14,
                color: AppColors.cardBorder,
              ),
              SwitchListTile(
                dense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                title: Text(
                  l10n.orderAlerts,
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14),
                ),
                value: _orderAlerts,
                activeThumbColor: AppColors.primary,
                onChanged: (value) => setState(() => _orderAlerts = value),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        DashboardCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              ProfileTile(
                title: l10n.privacy,
                subtitle: l10n.privacyPolicyTerms,
                leadingIcon: Icons.privacy_tip_outlined,
                onTap: () {},
                showDivider: false,
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Container(
          decoration: BoxDecoration(
            color: AppColors.cardBackground,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: ListTile(
            dense: true,
            onTap: () => logoutAndGoLogin(context),
            leading: Icon(Icons.logout_rounded, color: AppColors.error, size: 20),
            title: Text(
              l10n.logout,
              style: TextStyle(
                color: AppColors.error,
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ],
    );
  }
}
