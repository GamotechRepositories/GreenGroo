import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/chips/status_chip.dart';
import '../../widgets/layout/custom_app_bar.dart';

class VehicleDetailsScreen extends StatelessWidget {
  const VehicleDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: CustomAppBar(
        title: l10n.vehicleDetails,
        subtitle: l10n.yourDeliveryVehicle,
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          DashboardCard(
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  height: 140,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  ),
                  child: Icon(Icons.two_wheeler, size: 72, color: AppColors.primary),
                ),
                const SizedBox(height: AppSpacing.lg),
                StatusChip(label: l10n.active, type: StatusType.success),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          DashboardCard(
            child: Column(
              children: [
                _VehicleRow(label: l10n.bikeDetailsTitle, value: l10n.placeholderDash),
                const Divider(height: AppSpacing.xxl),
                _VehicleRow(label: l10n.registrationNumber, value: l10n.accountNumberMasked),
                const Divider(height: AppSpacing.xxl),
                _VehicleRow(label: l10n.insurance, value: l10n.placeholderDash),
                const Divider(height: AppSpacing.xxl),
                _VehicleRow(label: l10n.pollutionCertificate, value: l10n.placeholderDash),
                const Divider(height: AppSpacing.xxl),
                _VehicleRow(label: l10n.vehicleStatus, value: l10n.verified),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VehicleRow extends StatelessWidget {
  const _VehicleRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 14),
        ),
      ],
    );
  }
}
