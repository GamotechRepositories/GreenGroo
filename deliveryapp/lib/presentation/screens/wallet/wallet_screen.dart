import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/buttons/primary_button.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/layout/custom_app_bar.dart';

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  Widget build(BuildContext context) {
    final body = ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.xxl),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.primaryDark],
              ),
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Wallet Balance',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.85),
                      ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  '₹ —',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        color: Colors.white,
                        fontSize: 36,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          PrimaryButton(label: 'Withdraw', icon: Icons.account_balance_outlined, onPressed: () {}),
          const SizedBox(height: AppSpacing.xl),
          const SectionHeader(title: 'Bank Details'),
          const SizedBox(height: AppSpacing.md),
          DashboardCard(
            child: Column(
              children: [
                _BankRow(label: 'Account Holder', value: '—'),
                const Divider(height: AppSpacing.xl),
                _BankRow(label: 'Bank Name', value: '—'),
                const Divider(height: AppSpacing.xl),
                _BankRow(label: 'Account Number', value: '— — — —'),
                const Divider(height: AppSpacing.xl),
                _BankRow(label: 'IFSC Code', value: '—'),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const SectionHeader(title: 'Recent Transactions'),
          const SizedBox(height: AppSpacing.md),
          ...List.generate(3, (_) {
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: DashboardCard(
                child: Row(
                  children: [
                    Icon(Icons.swap_horiz, color: AppColors.primary),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Transaction', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 15)),
                          Text('—', style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    ),
                    Text('₹ —', style: Theme.of(context).textTheme.titleMedium),
                  ],
                ),
              ),
            );
          }),
        ],
      );

    if (embedded) return body;

    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Wallet',
        subtitle: 'Manage your earnings',
        showBackButton: true,
      ),
      body: body,
    );
  }
}

class _BankRow extends StatelessWidget {
  const _BankRow({required this.label, required this.value});

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
