import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';

enum DeliveryActionStyle { primary, outline, accent }

class DeliveryActionButton extends StatelessWidget {
  const DeliveryActionButton({
    super.key,
    required this.label,
    required this.icon,
    this.onPressed,
    this.style = DeliveryActionStyle.primary,
    this.loading = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final DeliveryActionStyle style;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(16);
    final child = Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (loading)
          const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
          )
        else
          Icon(icon, size: 20),
        const SizedBox(width: 10),
        Flexible(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.2,
            ),
          ),
        ),
      ],
    );

    switch (style) {
      case DeliveryActionStyle.outline:
        return SizedBox(
          width: double.infinity,
          height: 54,
          child: OutlinedButton(
            onPressed: loading ? null : onPressed,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              side: BorderSide(color: AppColors.primary.withValues(alpha: 0.45)),
              shape: RoundedRectangleBorder(borderRadius: radius),
              backgroundColor: AppColors.primaryLight.withValues(alpha: 0.35),
            ),
            child: child,
          ),
        );
      case DeliveryActionStyle.accent:
        return SizedBox(
          width: double.infinity,
          height: 54,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF065F46), Color(0xFF059669)],
              ),
              borderRadius: radius,
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.28),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: loading ? null : onPressed,
                borderRadius: radius,
                child: Center(
                  child: DefaultTextStyle(
                    style: GoogleFonts.inter(color: Colors.white),
                    child: child,
                  ),
                ),
              ),
            ),
          ),
        );
      case DeliveryActionStyle.primary:
        return SizedBox(
          width: double.infinity,
          height: 54,
          child: FilledButton(
            onPressed: loading ? null : onPressed,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: radius),
              elevation: 0,
            ),
            child: child,
          ),
        );
    }
  }
}
