import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/layout/custom_app_bar.dart';

class VehicleDetailsScreen extends StatefulWidget {
  const VehicleDetailsScreen({super.key});

  @override
  State<VehicleDetailsScreen> createState() => _VehicleDetailsScreenState();
}

class _VehicleDetailsScreenState extends State<VehicleDetailsScreen> {
  @override
  void initState() {
    super.initState();
    AuthService.instance.fetchMe().then((_) {
      if (mounted) setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final boy = AuthService.instance.deliveryBoy;
    final type = boy?.vehicleType.isNotEmpty == true ? boy!.vehicleType : '—';
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final emoji = type.toLowerCase().contains('cycle') || type.toLowerCase().contains('bicycle')
        ? '🚲'
        : type.toLowerCase().contains('car') || type.toLowerCase().contains('van')
            ? '🚗'
            : '🛵';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CustomAppBar(
        title: l10n.vehicleDetails,
        subtitle: 'View only · contact Delivery Manager to update',
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
        children: [
          DashboardCard(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  height: 68,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF064E3B) : const Color(0xFF0F5A32).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark ? const Color(0xFF10B981) : const Color(0xFF0F5A32),
                    ),
                  ),
                  child: Center(
                    child: Text(emoji, style: const TextStyle(fontSize: 34)),
                  ),
                ),
                const SizedBox(height: 12),
                _Row(label: 'Vehicle type', value: type),
                const SizedBox(height: 8),
                Divider(height: 1, color: AppColors.cardBorder),
                const SizedBox(height: 8),
                _Row(
                  label: 'Registration',
                  value: boy?.documents['rc']?['status'] == 'approved' ? 'Verified' : 'Active Partner',
                  valueColor: isDark ? const Color(0xFF34D399) : const Color(0xFF0F5A32),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Vehicle details can only be updated by your Delivery Manager.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 11.5,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value, this.valueColor});
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            color: AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: valueColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
