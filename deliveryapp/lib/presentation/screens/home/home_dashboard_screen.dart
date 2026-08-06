import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/cards/order_card.dart';
import '../../widgets/cards/statistic_card.dart';
import '../../widgets/chips/status_chip.dart';
import '../../widgets/common/empty_state.dart';

class HomeDashboardScreen extends StatefulWidget {
  const HomeDashboardScreen({super.key});

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  bool _isOnline = true;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Good Morning 👋',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 22),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Be safe and deliver happiness',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              Switch(
                value: _isOnline,
                onChanged: (value) => setState(() => _isOnline = value),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          StatusChip(
            label: _isOnline ? 'Online' : 'Offline',
            type: _isOnline ? StatusType.online : StatusType.offline,
          ),
          const SizedBox(height: AppSpacing.xl),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: AppSpacing.md,
            crossAxisSpacing: AppSpacing.md,
            childAspectRatio: 1.35,
            children: [
              StatisticCard(
                title: "Today's Earnings",
                value: '₹ —',
                subtitle: 'Tap to view details',
                icon: Icons.payments_outlined,
              ),
              StatisticCard(
                title: "Today's Deliveries",
                value: '—',
                subtitle: 'Completed today',
                icon: Icons.local_shipping_outlined,
                iconColor: AppColors.info,
                iconBackground: Color(0xFFDBEAFE),
              ),
              StatisticCard(
                title: 'Performance Score',
                value: '—%',
                subtitle: 'This week',
                icon: Icons.insights_outlined,
                iconColor: AppColors.warning,
                iconBackground: Color(0xFFFEF3C7),
              ),
              StatisticCard(
                title: 'Customer Rating',
                value: '—',
                subtitle: 'Average rating',
                icon: Icons.star_outline,
                iconColor: Color(0xFF8B5CF6),
                iconBackground: Color(0xFFEDE9FE),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          const SectionHeader(title: 'Active Delivery'),
          const SizedBox(height: AppSpacing.md),
          DashboardCard(
            onTap: () => Navigator.pushNamed(context, AppRoutes.activeDelivery),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const StatusChip(label: 'In Progress', type: StatusType.info),
                    const Spacer(),
                    Text(
                      'View details',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                const DeliveryTimelinePreview(),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          SectionHeader(
            title: 'Quick Actions',
            actionLabel: 'See all',
            onAction: () => Navigator.pushNamed(context, AppRoutes.newOrders),
          ),
          const SizedBox(height: AppSpacing.md),
          SizedBox(
            height: 110,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _QuickAction(
                  icon: Icons.add_shopping_cart_outlined,
                  label: 'New Orders',
                  onTap: () => Navigator.pushNamed(context, AppRoutes.newOrders),
                ),
                _QuickAction(
                  icon: Icons.map_outlined,
                  label: 'Navigate',
                  onTap: () => Navigator.pushNamed(context, AppRoutes.liveNavigation),
                ),
                _QuickAction(
                  icon: Icons.history_outlined,
                  label: 'History',
                  onTap: () => Navigator.pushNamed(context, AppRoutes.deliveryHistory),
                ),
                _QuickAction(
                  icon: Icons.account_balance_wallet_outlined,
                  label: 'Wallet',
                  onTap: () => Navigator.pushNamed(context, AppRoutes.wallet),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const SectionHeader(title: 'Recent Orders'),
          const SizedBox(height: AppSpacing.md),
          const OrderCard(
            storeName: 'Store Name',
            customerName: 'Customer Name',
            pickupAddress: 'Pickup address',
            dropAddress: 'Drop address',
            distance: '— km',
            estimatedEarnings: '₹ —',
            estimatedTime: '— min',
            showActions: false,
          ),
          const SizedBox(height: AppSpacing.lg),
          StatisticCard(
            title: 'Acceptance Rate',
            value: '—%',
            subtitle: 'Last 7 days',
            icon: Icons.check_circle_outline,
            onTap: () => Navigator.pushNamed(context, AppRoutes.performance),
          ),
        ],
      ),
    );
  }
}

class DeliveryTimelinePreview extends StatelessWidget {
  const DeliveryTimelinePreview({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Column(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
            ),
            Container(width: 2, height: 32, color: AppColors.border),
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primary, width: 2),
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Pick Up', style: Theme.of(context).textTheme.bodySmall),
              Text('Store location', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 14)),
              const SizedBox(height: AppSpacing.md),
              Text('Drop Off', style: Theme.of(context).textTheme.bodySmall),
              Text('Customer location', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 14)),
            ],
          ),
        ),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.md),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: Container(
          width: 100,
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: AppColors.primary),
              const SizedBox(height: AppSpacing.sm),
              Text(
                label,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
