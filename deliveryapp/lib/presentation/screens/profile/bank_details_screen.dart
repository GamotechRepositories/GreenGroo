import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/layout/custom_app_bar.dart';

class BankDetailsScreen extends StatefulWidget {
  const BankDetailsScreen({super.key});

  @override
  State<BankDetailsScreen> createState() => _BankDetailsScreenState();
}

class _BankDetailsScreenState extends State<BankDetailsScreen> {
  @override
  void initState() {
    super.initState();
    AuthService.instance.fetchMe().then((_) {
      if (mounted) setState(() {});
    });
  }

  String _maskAccount(String raw) {
    final digits = raw.replaceAll(RegExp(r'\s'), '');
    if (digits.length <= 4) return digits.isEmpty ? '—' : digits;
    return 'XXXX XXXX ${digits.substring(digits.length - 4)}';
  }

  @override
  Widget build(BuildContext context) {
    final bank = AuthService.instance.deliveryBoy?.bankDetails ?? {};
    final holder = bank['accountHolderName']?.toString() ?? '';
    final bankName = bank['bankName']?.toString() ?? '';
    final account = bank['accountNumber']?.toString() ?? '';
    final ifsc = bank['ifscCode']?.toString() ?? '';

    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Bank details',
        subtitle: 'View only · contact Delivery Manager to update',
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          DashboardCard(
            child: Column(
              children: [
                _Row(label: 'Account holder', value: holder.isEmpty ? '—' : holder),
                const Divider(height: AppSpacing.xxl),
                _Row(label: 'Bank name', value: bankName.isEmpty ? '—' : bankName),
                const Divider(height: AppSpacing.xxl),
                _Row(label: 'Account number', value: _maskAccount(account)),
                const Divider(height: AppSpacing.xxl),
                _Row(label: 'IFSC', value: ifsc.isEmpty ? '—' : ifsc),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Bank details can only be updated by your Delivery Manager.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
        ),
      ],
    );
  }
}
