import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/buttons/primary_button.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../widgets/tiles/profile_tile.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  Widget build(BuildContext context) {
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
                Text('Partner Name', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: AppSpacing.xs),
                Text('ID: — — —', style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: AppSpacing.lg),
                PrimaryButton(label: 'Edit Profile', icon: Icons.edit_outlined, onPressed: () {}),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          DashboardCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ProfileTile(
                  title: 'Driver Information',
                  subtitle: 'Personal details',
                  leadingIcon: Icons.badge_outlined,
                  onTap: () {},
                ),
                ProfileTile(
                  title: 'Vehicle Information',
                  subtitle: 'Bike details',
                  leadingIcon: Icons.two_wheeler_outlined,
                  onTap: () => Navigator.pushNamed(context, AppRoutes.vehicle),
                ),
                ProfileTile(
                  title: 'License',
                  subtitle: 'Driving license',
                  leadingIcon: Icons.credit_card_outlined,
                  onTap: () {},
                ),
                ProfileTile(
                  title: 'Documents',
                  subtitle: 'Verification documents',
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
      appBar: const CustomAppBar(
        title: 'Profile',
        showBackButton: true,
      ),
      body: body,
    );
  }
}
