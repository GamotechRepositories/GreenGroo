import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/buttons/primary_button.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../widgets/tiles/profile_tile.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final body = ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          DashboardCard(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 48,
                  backgroundColor: AppColors.primaryLight,
                  child: Icon(Icons.person, size: 48, color: AppColors.primary),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(l10n.partnerName, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: AppSpacing.xs),
                Text(l10n.partnerId, style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: AppSpacing.lg),
                PrimaryButton(label: l10n.editProfile, icon: Icons.edit_outlined, onPressed: () {}),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          DashboardCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ProfileTile(
                  title: l10n.driverInformation,
                  subtitle: l10n.personalDetails,
                  leadingIcon: Icons.badge_outlined,
                  onTap: () {},
                ),
                ProfileTile(
                  title: l10n.vehicleInformation,
                  subtitle: l10n.bikeDetails,
                  leadingIcon: Icons.two_wheeler_outlined,
                  onTap: () => Navigator.pushNamed(context, AppRoutes.vehicle),
                ),
                ProfileTile(
                  title: l10n.license,
                  subtitle: l10n.drivingLicense,
                  leadingIcon: Icons.credit_card_outlined,
                  onTap: () {},
                ),
                ProfileTile(
                  title: l10n.documents,
                  subtitle: l10n.verificationDocuments,
                  leadingIcon: Icons.folder_outlined,
                  onTap: () => Navigator.pushNamed(context, AppRoutes.documents),
                  showDivider: false,
                ),
              ],
            ),
          ),
        ],
      );

    if (embedded) return body;

    return Scaffold(
      appBar: CustomAppBar(
        title: l10n.profile,
        showBackButton: true,
      ),
      body: body,
    );
  }
}
