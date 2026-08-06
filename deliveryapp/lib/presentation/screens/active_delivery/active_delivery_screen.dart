import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/buttons/primary_button.dart';
import '../../widgets/buttons/secondary_button.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/chips/status_chip.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../widgets/timeline/delivery_timeline.dart';

class ActiveDeliveryScreen extends StatelessWidget {
  const ActiveDeliveryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Active Delivery',
        subtitle: 'Order in progress',
        showBackButton: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(child: StatusChip(label: 'Heading to Pickup', type: StatusType.info)),
            const SizedBox(height: AppSpacing.xl),
            DashboardCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                        ),
                        child: Icon(Icons.storefront_outlined, color: AppColors.primary),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Pickup', style: Theme.of(context).textTheme.bodySmall),
                            Text('Store Name', style: Theme.of(context).textTheme.titleMedium),
                            Text('Store address', style: Theme.of(context).textTheme.bodyMedium),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            DashboardCard(
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDBEAFE),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                    ),
                    child: Icon(Icons.person_outline, color: AppColors.info),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Customer', style: Theme.of(context).textTheme.bodySmall),
                        Text('Customer Name', style: Theme.of(context).textTheme.titleMedium),
                        Text('Delivery address', style: Theme.of(context).textTheme.bodyMedium),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            DashboardCard(
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                    ),
                    child: Icon(Icons.pin_outlined, color: AppColors.warning),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Delivery OTP', style: Theme.of(context).textTheme.bodySmall),
                        Text('— — — —', style: Theme.of(context).textTheme.headlineMedium),
                        Text('Ask customer for OTP', style: Theme.of(context).textTheme.bodyMedium),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            const DeliveryTimeline(
              steps: [
                DeliveryTimelineStep(
                  title: 'Assigned',
                  subtitle: 'Order assigned to you',
                  isCompleted: true,
                ),
                DeliveryTimelineStep(
                  title: 'Pick Up',
                  subtitle: 'Collect from store',
                  isActive: true,
                ),
                DeliveryTimelineStep(
                  title: 'Delivered',
                  subtitle: 'Hand over to customer',
                ),
              ],
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              PrimaryButton(label: 'Navigate', icon: Icons.navigation_outlined, onPressed: () {}),
              const SizedBox(height: AppSpacing.md),
              SecondaryButton(label: 'Call Customer', icon: Icons.phone_outlined, onPressed: () {}),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(child: SecondaryButton(label: 'Picked Up', onPressed: () {})),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(child: PrimaryButton(label: 'Delivered', onPressed: () {})),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
