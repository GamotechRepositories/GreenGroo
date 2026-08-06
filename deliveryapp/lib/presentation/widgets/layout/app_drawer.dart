import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    ),
                    child: Icon(
                      Icons.local_shipping_rounded,
                      color: AppColors.primary,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'GreenRow',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text(
                          'Delivery Partner',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                children: [
                  _DrawerItem(
                    icon: Icons.dashboard_outlined,
                    label: 'Dashboard',
                    onTap: () => _nav(context, AppRoutes.home),
                  ),
                  _DrawerItem(
                    icon: Icons.add_shopping_cart_outlined,
                    label: 'New Orders',
                    onTap: () => _nav(context, AppRoutes.newOrders),
                  ),
                  _DrawerItem(
                    icon: Icons.delivery_dining_outlined,
                    label: 'Active Orders',
                    onTap: () => _nav(context, AppRoutes.activeDelivery),
                  ),
                  _DrawerItem(
                    icon: Icons.history_outlined,
                    label: 'History',
                    onTap: () => _nav(context, AppRoutes.deliveryHistory),
                  ),
                  _DrawerItem(
                    icon: Icons.calendar_month_outlined,
                    label: 'Attendance',
                    onTap: () => _nav(context, AppRoutes.attendance),
                  ),
                  _DrawerItem(
                    icon: Icons.insights_outlined,
                    label: 'Performance',
                    onTap: () => _nav(context, AppRoutes.performance),
                  ),
                  _DrawerItem(
                    icon: Icons.account_balance_wallet_outlined,
                    label: 'Wallet',
                    onTap: () => _nav(context, AppRoutes.wallet),
                  ),
                  _DrawerItem(
                    icon: Icons.notifications_outlined,
                    label: 'Notifications',
                    onTap: () => _nav(context, AppRoutes.notifications),
                  ),
                  _DrawerItem(
                    icon: Icons.description_outlined,
                    label: 'Documents',
                    onTap: () => _nav(context, AppRoutes.documents),
                  ),
                  _DrawerItem(
                    icon: Icons.two_wheeler_outlined,
                    label: 'Vehicle',
                    onTap: () => _nav(context, AppRoutes.vehicle),
                  ),
                  _DrawerItem(
                    icon: Icons.support_agent_outlined,
                    label: 'Support',
                    onTap: () => _nav(context, AppRoutes.support),
                  ),
                  _DrawerItem(
                    icon: Icons.settings_outlined,
                    label: 'Settings',
                    onTap: () => _nav(context, AppRoutes.settings),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: Icon(Icons.logout, color: AppColors.error),
              title: Text(
                'Logout',
                style: TextStyle(
                  color: AppColors.error,
                  fontWeight: FontWeight.w600,
                ),
              ),
              onTap: () {
                Navigator.of(context).pushNamedAndRemoveUntil(
                  AppRoutes.login,
                  (route) => false,
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _nav(BuildContext context, String route) {
    Navigator.pop(context);
    Navigator.pushNamed(context, route);
  }
}

class _DrawerItem extends StatelessWidget {
  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textSecondary),
      title: Text(
        label,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 15),
      ),
      onTap: onTap,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.xs,
      ),
    );
  }
}
