import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';
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
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: CustomAppBar(
        title: l10n.activeDelivery,
        subtitle: l10n.orderInProgress,
        showBackButton: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: StatusChip(label: l10n.headingToPickup, type: StatusType.info)),
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
                            Text(l10n.pickup, style: Theme.of(context).textTheme.bodySmall),
                            Text(l10n.placeholderStoreName, style: Theme.of(context).textTheme.titleMedium),
                            Text(l10n.storeAddress, style: Theme.of(context).textTheme.bodyMedium),
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
                        Text(l10n.customer, style: Theme.of(context).textTheme.bodySmall),
                        Text(l10n.placeholderCustomerName, style: Theme.of(context).textTheme.titleMedium),
                        Text(l10n.deliveryAddress, style: Theme.of(context).textTheme.bodyMedium),
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
                        Text(l10n.deliveryOtp, style: Theme.of(context).textTheme.bodySmall),
                        Text(l10n.otpPlaceholder, style: Theme.of(context).textTheme.headlineMedium),
                        Text(l10n.askCustomerForOtp, style: Theme.of(context).textTheme.bodyMedium),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            DeliveryTimeline(
              steps: [
                DeliveryTimelineStep(
                  title: l10n.timelineAssigned,
                  subtitle: l10n.timelineAssignedSubtitle,
                  isCompleted: true,
                ),
                DeliveryTimelineStep(
                  title: l10n.timelinePickUp,
                  subtitle: l10n.timelinePickUpSubtitle,
                  isActive: true,
                ),
                DeliveryTimelineStep(
                  title: l10n.timelineDelivered,
                  subtitle: l10n.timelineDeliveredSubtitle,
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
              PrimaryButton(label: l10n.navigate, icon: Icons.navigation_outlined, onPressed: () {}),
              const SizedBox(height: AppSpacing.md),
              SecondaryButton(label: l10n.callCustomer, icon: Icons.phone_outlined, onPressed: () {}),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(child: SecondaryButton(label: l10n.pickedUp, onPressed: () {})),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(child: PrimaryButton(label: l10n.delivered, onPressed: () {})),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
