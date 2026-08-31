import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../l10n/app_localizations.dart';

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
    final l10n = AppLocalizations.of(context);
    final width = MediaQuery.sizeOf(context).width;
    final titleSize = (width * 0.11).clamp(34.0, 48.0);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Opacity(
            opacity: titleOpacity.clamp(0.0, 1.0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.72),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.eco_rounded, color: AppColors.primary, size: titleSize * 0.55),
                  const SizedBox(width: 8),
                  Text(
                    l10n.brandName,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: titleSize * 0.72,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                      letterSpacing: 0.5,
                      height: 1,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Opacity(
            opacity: taglineOpacity.clamp(0.0, 1.0),
            child: Text(
              l10n.deliveryPartner,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: (width * 0.042).clamp(15.0, 18.0),
                fontWeight: FontWeight.w600,
                color: AppColors.primaryDark,
                letterSpacing: 0.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
