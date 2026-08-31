import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Gray track that fills green as the scooter rides left → right.
class SplashProgressLine extends StatelessWidget {
  const SplashProgressLine({
    super.key,
    required this.progress,
    this.width,
    this.height = 6,
  });

  final double progress;
  final double? width;
  final double height;

  @override
  Widget build(BuildContext context) {
    final barWidth = width ?? MediaQuery.sizeOf(context).width * 0.78;

    return SizedBox(
      width: barWidth,
      height: height,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(height),
        child: Stack(
          fit: StackFit.expand,
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                color: const Color(0xFFD1D5DB),
                borderRadius: BorderRadius.circular(height),
                border: Border.all(color: const Color(0xFF9CA3AF), width: 0.6),
              ),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: FractionallySizedBox(
                widthFactor: progress.clamp(0.0, 1.0),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(height),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0C831F), Color(0xFF059669)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.35),
                        blurRadius: 6,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: const SizedBox.expand(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
