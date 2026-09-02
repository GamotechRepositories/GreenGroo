import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Green motion streaks behind the scooter.
class SplashSpeedLines extends StatelessWidget {
  const SplashSpeedLines({
    super.key,
    required this.width,
    required this.height,
    required this.opacity,
  });

  final double width;
  final double height;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    if (opacity <= 0) return const SizedBox.shrink();

    return SizedBox(
      width: width,
      height: height,
      child: CustomPaint(
        painter: _SpeedLinesPainter(opacity: opacity.clamp(0.0, 1.0)),
      ),
    );
  }
}

class _SpeedLinesPainter extends CustomPainter {
  _SpeedLinesPainter({required this.opacity});

  final double opacity;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.22 * opacity)
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    final midY = size.height * 0.55;
    final offsets = [0.0, 0.08, -0.06, 0.14, -0.12];

    for (var i = 0; i < offsets.length; i++) {
      final y = midY + size.height * offsets[i];
      final lineLen = size.width * (0.18 + i * 0.04);
      final startX = size.width * 0.02;
      canvas.drawLine(
        Offset(startX, y),
        Offset(startX + lineLen, y),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _SpeedLinesPainter oldDelegate) =>
      oldDelegate.opacity != opacity;
}
