import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/chips/status_chip.dart';
import '../../widgets/layout/custom_app_bar.dart';

class VehicleDetailsScreen extends StatelessWidget {
  const VehicleDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Vehicle Details',
        subtitle: 'Your delivery vehicle',
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
                const StatusChip(label: 'Active', type: StatusType.success),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          DashboardCard(
            child: Column(
              children: [
                _VehicleRow(label: 'Bike Details', value: '—'),
                const Divider(height: AppSpacing.xxl),
                _VehicleRow(label: 'Registration Number', value: '— — — —'),
                const Divider(height: AppSpacing.xxl),
                _VehicleRow(label: 'Insurance', value: '—'),
                const Divider(height: AppSpacing.xxl),
                _VehicleRow(label: 'Pollution Certificate', value: '—'),
                const Divider(height: AppSpacing.xxl),
                _VehicleRow(label: 'Vehicle Status', value: 'Verified'),
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
