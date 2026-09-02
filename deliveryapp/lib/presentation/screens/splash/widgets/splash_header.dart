import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../l10n/app_localizations.dart';

/// Top logo + GreenGroc + DELIVERY PARTNER.
class SplashHeader extends StatelessWidget {
  const SplashHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final width = MediaQuery.sizeOf(context).width;
    final titleSize = (width * 0.088).clamp(30.0, 40.0);
    final brand = l10n.brandName;

    return Padding(
      padding: EdgeInsets.fromLTRB(24, MediaQuery.sizeOf(context).height * 0.075, 24, 0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.9),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(
                  Icons.shopping_bag_rounded,
                  size: 30,
                  color: AppColors.primary,
                ),
                Positioned(
                  right: 14,
                  top: 16,
                  child: Icon(
                    Icons.eco_rounded,
                    size: 13,
                    color: AppColors.primary.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: brand.length >= 5 ? brand.substring(0, 5) : brand,
                  style: GoogleFonts.inter(
                    fontSize: titleSize,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                    letterSpacing: 0.2,
                    height: 1,
                  ),
                ),
                if (brand.length > 5)
                  TextSpan(
                    text: brand.substring(5),
                    style: GoogleFonts.inter(
                      fontSize: titleSize,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF3D4A42),
                      letterSpacing: 0.2,
                      height: 1,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          Text(
            l10n.deliveryPartner.toUpperCase(),
            style: GoogleFonts.inter(
              fontSize: (width * 0.027).clamp(10.5, 12.5),
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary.withValues(alpha: 0.8),
              letterSpacing: 2.4,
              height: 1,
            ),
          ),
        ],
      ),
    );
  }
}
