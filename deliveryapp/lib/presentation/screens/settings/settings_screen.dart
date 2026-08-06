import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../widgets/tiles/profile_tile.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: const CustomAppBar(
        title: 'Settings',
        showBackButton: true,
      ),
      body: ListenableBuilder(
        listenable: ThemeController.instance,
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

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        DashboardCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              SwitchListTile(
                title: Text(
                  'Dark Mode',
                  style: TextStyle(color: AppColors.textPrimary),
                ),
                subtitle: Text(
                  widget.isDark ? 'Dark theme is on' : 'Light theme is on',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                secondary: Icon(
                  widget.isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
                  color: AppColors.primary,
                ),
                value: widget.isDark,
                activeThumbColor: AppColors.primary,
                onChanged: (value) => ThemeController.instance.setDarkMode(value),
              ),
              Divider(height: 1, indent: AppSpacing.lg, endIndent: AppSpacing.lg, color: AppColors.border),
              ProfileTile(
                title: 'Language',
                subtitle: 'English',
                leadingIcon: Icons.language_outlined,
                onTap: () {},
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(
          'Notifications',
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
                  'Push Notifications',
                  style: TextStyle(color: AppColors.textPrimary),
                ),
                value: _pushNotifications,
                activeThumbColor: AppColors.primary,
                onChanged: (value) => setState(() => _pushNotifications = value),
              ),
              Divider(height: 1, indent: AppSpacing.lg, endIndent: AppSpacing.lg, color: AppColors.border),
              SwitchListTile(
                title: Text(
                  'Order Alerts',
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
                title: 'Privacy',
                subtitle: 'Privacy policy & terms',
                leadingIcon: Icons.privacy_tip_outlined,
                onTap: () {},
                showDivider: false,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        ListTile(
          onTap: () => Navigator.pushNamedAndRemoveUntil(
            context,
            AppRoutes.login,
            (route) => false,
          ),
          leading: Icon(Icons.logout, color: AppColors.error),
          title: Text(
            'Logout',
            style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w600),
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
