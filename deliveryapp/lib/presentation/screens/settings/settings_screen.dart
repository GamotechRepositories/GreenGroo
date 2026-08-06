import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
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
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: CustomAppBar(
        title: l10n.settings,
        showBackButton: true,
      ),
      body: ListenableBuilder(
        listenable: Listenable.merge([
          ThemeController.instance,
          LocaleController.instance,
        ]),
        builder: (context, _) {
          return _SettingsBody(
            isDark: ThemeController.instance.isDark,
          );
        },
      ),
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
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        DashboardCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              SwitchListTile(
                title: Text(
                  l10n.darkMode,
                  style: TextStyle(color: AppColors.textPrimary),
                ),
                subtitle: Text(
                  widget.isDark ? l10n.darkThemeOn : l10n.lightThemeOn,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                secondary: Icon(
                  widget.isDark
                      ? Icons.dark_mode_rounded
                      : Icons.light_mode_rounded,
                  color: AppColors.primary,
                ),
                value: widget.isDark,
                activeThumbColor: AppColors.primary,
                onChanged: (value) =>
                    ThemeController.instance.setDarkMode(value),
              ),
              Divider(
                height: 1,
                indent: AppSpacing.lg,
                endIndent: AppSpacing.lg,
                color: AppColors.border,
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
        const SizedBox(height: AppSpacing.lg),
        Text(
          l10n.notifications,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.textPrimary,
              ),
        ),
        const SizedBox(height: AppSpacing.md),
        DashboardCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              SwitchListTile(
                title: Text(
                  l10n.pushNotifications,
                  style: TextStyle(color: AppColors.textPrimary),
                ),
                value: _pushNotifications,
                activeThumbColor: AppColors.primary,
                onChanged: (value) =>
                    setState(() => _pushNotifications = value),
              ),
              Divider(
                height: 1,
                indent: AppSpacing.lg,
                endIndent: AppSpacing.lg,
                color: AppColors.border,
              ),
              SwitchListTile(
                title: Text(
                  l10n.orderAlerts,
                  style: TextStyle(color: AppColors.textPrimary),
                ),
                value: _orderAlerts,
                activeThumbColor: AppColors.primary,
                onChanged: (value) => setState(() => _orderAlerts = value),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
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
        const SizedBox(height: AppSpacing.lg),
        ListTile(
          onTap: () => logoutAndGoLogin(context),
          leading: Icon(Icons.logout, color: AppColors.error),
          title: Text(
            l10n.logout,
            style: TextStyle(
              color: AppColors.error,
              fontWeight: FontWeight.w600,
            ),
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
          tileColor: AppColors.background,
        ),
      ],
    );
  }
}
