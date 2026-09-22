import 'package:flutter/material.dart';

class AppColors {
  // Brand Green Theme matching web FARMER_COLORS
  static const Color primary = Color(0xFF2E7D32);       // #2E7D32
  static const Color primaryDark = Color(0xFF1B5E20);   // Dark Emerald
  static const Color secondary = Color(0xFF4CAF50);     // #4CAF50
  static const Color primaryLight = Color(0xFFE8F5E9);  // #E8F5E9
  static const Color background = Color(0xFFF7F2E8);    // #F7F2E8 earthy light
  static const Color card = Color(0xFFFFFFFF);          // #FFFFFF
  static const Color text = Color(0xFF1F2937);          // #1F2937
  static const Color muted = Color(0xFF6B7280);         // #6B7280
  static const Color border = Color(0xFFE5E7EB);        // #E5E7EB
  static const Color borderLight = Color(0xFFF3F4F6);
  static const Color warning = Color(0xFFF59E0B);       // #F59E0B
  static const Color error = Color(0xFFDC2626);         // #DC2626
  static const Color success = Color(0xFF059669);

  // Aliases for compatibility
  static const Color surface = Colors.white;
  static const Color textPrimary = text;
  static const Color textSecondary = muted;
  static const Color textMuted = Color(0xFF9CA3AF);
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color errorLight = Color(0xFFFEE2E2);
  static const Color info = Color(0xFF2563EB);
  static const Color infoLight = Color(0xFFDBEAFE);

  // Grade badge tones matching web GRADE_COLORS
  static const Color gradeAHead = Color(0xFFD1FAE5);
  static const Color gradeAText = Color(0xFF065F46);
  static const Color gradeBHead = Color(0xFFDBEAFE);
  static const Color gradeBText = Color(0xFF1E40AF);
  static const Color gradeCHead = Color(0xFFFEF3C7);
  static const Color gradeCText = Color(0xFF92400E);
}
