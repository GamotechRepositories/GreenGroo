import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

/// App name — brand green #0C831F
class SplashBranding extends StatelessWidget {
  const SplashBranding({
    super.key,
    required this.titleOpacity,
    required this.taglineOpacity,
  });

  final double titleOpacity;
  final double taglineOpacity;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final titleSize = (width * 0.095).clamp(32.0, 44.0);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Opacity(
          opacity: titleOpacity.clamp(0.0, 1.0),
          child: Text(
            'GreenRow',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: titleSize,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
              letterSpacing: 1.6,
              height: 1.1,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Opacity(
          opacity: taglineOpacity.clamp(0.0, 1.0),
          child: Text(
            'Delivery Partner',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: (width * 0.04).clamp(14.0, 17.0),
              fontWeight: FontWeight.w600,
              color: AppColors.primaryDark,
              letterSpacing: 0.6,
            ),
          ),
        ),
      ],
    );
  }
}
