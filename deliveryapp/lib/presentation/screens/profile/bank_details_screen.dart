import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CustomAppBar(
        title: 'Bank details',
        subtitle: 'View only · contact Delivery Manager to update',
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
        children: [
          // Digital Debit Card Aesthetic
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [const Color(0xFF064E3B), const Color(0xFF0F291E)]
                    : [const Color(0xFF0F5A32), const Color(0xFF084826)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: isDark ? Colors.black45 : const Color(0x330F5A32),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.credit_card_rounded, color: Color(0xFFFDE68A), size: 20),
                        const SizedBox(width: 8),
                        Text(
                          bankName.isNotEmpty ? bankName.toUpperCase() : 'SALARY ACCOUNT',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: Colors.white.withValues(alpha: 0.9),
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'PRIMARY',
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  _maskAccount(account),
                  style: GoogleFonts.sourceCodePro(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ACCOUNT HOLDER',
                          style: GoogleFonts.inter(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: Colors.white.withValues(alpha: 0.7),
                          ),
                        ),
                        const SizedBox(height: 1),
                        Text(
                          holder.isNotEmpty ? holder.toUpperCase() : 'DELIVERY PARTNER',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    if (ifsc.isNotEmpty)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'IFSC CODE',
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                          ),
                          const SizedBox(height: 1),
                          Text(
                            ifsc,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Detail rows
          DashboardCard(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Column(
              children: [
                _Row(label: 'Account holder', value: holder.isEmpty ? '—' : holder),
                Divider(height: 16, color: AppColors.cardBorder),
                _Row(label: 'Bank name', value: bankName.isEmpty ? '—' : bankName),
                Divider(height: 16, color: AppColors.cardBorder),
                _Row(label: 'Account number', value: _maskAccount(account)),
                Divider(height: 16, color: AppColors.cardBorder),
                _Row(label: 'IFSC Code', value: ifsc.isEmpty ? '—' : ifsc),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Bank details can only be updated by your Delivery Manager.',
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
  const _Row({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 12.5, color: AppColors.textSecondary),
        ),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}
