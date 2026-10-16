import 'package:flutter/material.dart';
import '../../../../config/theme.dart';

/// Circular delivery courier avatar matching Card 2 of the UI mockup.
class CourierAvatarBadge extends StatelessWidget {
  const CourierAvatarBadge({super.key, this.size = 44});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.headerFadeBg,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.primaryLight, width: 2.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipOval(
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Shoulders & green polo shirt
            Positioned(
              bottom: -4,
              child: Container(
                width: size * 0.72,
                height: size * 0.42,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                ),
              ),
            ),
            // White shirt collar
            Positioned(
              bottom: size * 0.28,
              child: Container(
                width: size * 0.22,
                height: size * 0.12,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.all(Radius.circular(2)),
                ),
              ),
            ),
            // Head / face
            Positioned(
              top: size * 0.26,
              child: Container(
                width: size * 0.42,
                height: size * 0.44,
                decoration: const BoxDecoration(
                  color: Color(0xFFFFD1A4),
                  shape: BoxShape.circle,
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Eyes
                    Positioned(
                      top: size * 0.16,
                      left: size * 0.08,
                      child: Container(
                        width: 2.5,
                        height: 2.5,
                        decoration: const BoxDecoration(
                          color: Color(0xFF1E293B),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    Positioned(
                      top: size * 0.16,
                      right: size * 0.08,
                      child: Container(
                        width: 2.5,
                        height: 2.5,
                        decoration: const BoxDecoration(
                          color: Color(0xFF1E293B),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    // Smile
                    Positioned(
                      bottom: size * 0.08,
                      child: Container(
                        width: 8,
                        height: 4,
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: const Color(0xFFC0392B),
                              width: 1.5,
                            ),
                          ),
                          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(4)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Green courier cap / helmet
            Positioned(
              top: size * 0.12,
              child: Container(
                width: size * 0.48,
                height: size * 0.26,
                decoration: const BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.vertical(
                    top: Radius.circular(16),
                    bottom: Radius.circular(4),
                  ),
                ),
              ),
            ),
            // Cap visor
            Positioned(
              top: size * 0.28,
              child: Container(
                width: size * 0.54,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.primaryDark,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
