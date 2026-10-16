import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../models/farmer_models.dart';
import 'farmer_onboarding_flow_screen.dart';

import '../../services/app_language.dart';
class RegistrationSuccessScreen extends StatelessWidget {
  final FarmerProfile farmer;

  const RegistrationSuccessScreen({
    super.key,
    required this.farmer,
  });

  @override
  Widget build(BuildContext context) {
    final farmerId = farmer.id;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 480),
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 26),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Success Badge & Icon
                Container(
                  width: 56,
                  height: 56,
                  decoration: const BoxDecoration(
                    color: AppColors.successLight,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle, size: 38, color: AppColors.success),
                ),
                const SizedBox(height: 12),

                Text(
                  AppLanguage().tr(mr: 'टप्पा १ पूर्ण ✓ नोंदणी यशस्वी', en: 'STEP 1 COMPLETE ✓ REGISTRATION SUCCESS'),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: 4),

                Text(
                  AppLanguage().tr(mr: 'शेतकरी खाते तयार झाले', en: 'Farmer account created'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryDark,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  AppLanguage().tr(mr: 'नोंदणी फॉर्म यशस्वीरित्या सबमिट झाला!', en: 'Registration form submitted successfully!'),
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Colors.green.shade800),
                ),
                const SizedBox(height: 8),

                Text(
                  AppLanguage().tr(
                    mr: 'स्वागत आहे, ${farmer.fullName}. ॲपमध्ये प्रवेश करण्यासाठी पुढील ५ आवश्यक टप्पे (बँक, कागदपत्रे, थेट व्हिडिओ, शेती व स्थान) पूर्ण करा.',
                    en: 'Welcome, ${farmer.fullName}. To enter the app, complete the remaining 5 mandatory steps (Bank, Documents, Live Video, Farm Profile & Location).',
                  ),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: AppColors.muted, height: 1.4),
                ),
                const SizedBox(height: 16),

                // Info Box
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _summaryRow(AppLanguage().tr(mr: 'शेतकरी आयडी:', en: 'Farmer ID:'), farmerId),
                      const SizedBox(height: 6),
                      _summaryRow(AppLanguage().tr(mr: 'मोबाईल:', en: 'Mobile:'), '+91 ${farmer.mobile}'),
                      const SizedBox(height: 6),
                      _summaryBadgeRow(AppLanguage().tr(mr: 'नोंदणी (टप्पा १):', en: 'Registration (Step 1):'), AppLanguage().tr(mr: 'पूर्ण ✓', en: 'COMPLETED ✓'), isGreen: true),
                      const SizedBox(height: 6),
                      _summaryBadgeRow(AppLanguage().tr(mr: 'पुढील टप्पा:', en: 'Next Step:'), AppLanguage().tr(mr: '२. बँक व ओळख तपशील', en: '2. Bank & Identity'), isGreen: false),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Primary Button to Continue to Step 2
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                    icon: const Icon(Icons.arrow_forward, size: 16),
                    label: Text(
                      AppLanguage().tr(mr: 'बँक व ओळख तपशील भरा (टप्पा २/६) →', en: 'Start Bank & Identity (Step 2/6) →'),
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold),
                    ),
                    onPressed: () {
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const FarmerOnboardingFlowScreen(initialStep: 2),
                        ),
                        (route) => false,
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value) {
    return Row(
      children: [
        SizedBox(
          width: 95,
          child: Text(label, style: const TextStyle(fontSize: 11.5, color: Color(0xFF6B7280))),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
          ),
        ),
      ],
    );
  }

  Widget _summaryBadgeRow(String label, String badgeText, {required bool isGreen}) {
    return Row(
      children: [
        SizedBox(
          width: 95,
          child: Text(label, style: const TextStyle(fontSize: 11.5, color: Color(0xFF6B7280))),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: isGreen ? AppColors.successLight : const Color(0xFFFEF3C7),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: isGreen ? const Color(0xFF86EFAC) : const Color(0xFFFDE68A)),
          ),
          child: Text(
            badgeText,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.bold,
              color: isGreen ? AppColors.success : const Color(0xFF92400E),
            ),
          ),
        ),
      ],
    );
  }
}
